// app/api/notifications/stream/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/db/prisma';
import {
  addConnection,
  removeConnection,
} from '@/lib/notifications/stream';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const stream = new ReadableStream({
    async start(controller) {
      addConnection(userId, controller);

      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(': connected\n\n'));

      try {
        const unreadCount = await prisma.notification.count({
          where: { receiverId: userId, read: false },
        });
        const unreadPayload = `data: ${JSON.stringify({
          type: 'unread_count',
          count: unreadCount,
        })}\n\n`;
        controller.enqueue(encoder.encode(unreadPayload));
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
          removeConnection(userId);
        }
      }, 30_000);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        removeConnection(userId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
