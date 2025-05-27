// app/api/notifications/stream/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/db/prisma';
import {
  addConnection,
  removeConnection
} from '@/lib/notifications/stream';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  // Create an SSE stream of raw Uint8Array chunks
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Register this writer
  addConnection(userId, writer);

  // Cleanup helper
  const cleanup = () => {
    removeConnection(userId);
    clearInterval(heartbeatInterval);
    writer.close().catch(() => {});
  };

  // Initial “connected” comment
  writer.write(encoder.encode(': connected\n\n')).catch(() => cleanup());

  // Send initial unread-count
  prisma.notification
    .count({ where: { receiverId: userId, read: false } })
    .then((count) => {
      const payload = `data: ${JSON.stringify({
        type: 'unread_count',
        count,
      })}\n\n`;
      writer.write(encoder.encode(payload)).catch(() => cleanup());
    })
    .catch((err) => console.error('Error fetching initial unread count:', err));

  // Heartbeat every 30s
  const heartbeatInterval = setInterval(() => {
    writer.write(encoder.encode(': heartbeat\n\n')).catch(() => cleanup());
  }, 30_000);

  // Handle client disconnect
  req.signal.addEventListener('abort', cleanup);

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
