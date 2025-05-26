
// app/api/notifications/stream/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/db/prisma';
import { Notification } from '@prisma/client';

// Store active connections
const connections = new Map<string, ReadableStreamDefaultController>();

// SSE endpoint for real-time notifications
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const userId = session.user.id;
  
  // Create a new SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      // Store the connection
      connections.set(userId, controller);
      
      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(': connected\n\n'));
      
      // Send initial unread count
      try {
        const unreadCount = await prisma.notification.count({
          where: {
            receiverId: userId,
            read: false,
          },
        });
        
        const unreadData = `data: ${JSON.stringify({ type: 'unread_count', count: unreadCount })}\n\n`;
        controller.enqueue(encoder.encode(unreadData));
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
      
      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch (error) {
          clearInterval(heartbeat);
          connections.delete(userId);
        }
      }, 30000);
      
      // Cleanup on close
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        connections.delete(userId);
        controller.close();
      });
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    },
  });
}

// Helper function to send notification to a specific user
export function sendNotificationToUser(userId: string, notification: any) {
  const controller = connections.get(userId);
  if (controller) {
    try {
      const encoder = new TextEncoder();
      const data = `data: ${JSON.stringify({ type: 'notification', data: notification })}\n\n`;
      controller.enqueue(encoder.encode(data));
    } catch (error) {
      // Connection might be closed, remove it
      connections.delete(userId);
    }
  }
}

// Helper function to broadcast notification to multiple users
export function broadcastNotification(userIds: string[], notification: any) {
  userIds.forEach(userId => sendNotificationToUser(userId, notification));
}

// Helper function to update unread count for a user
export function updateUnreadCount(userId: string, count: number) {
  const controller = connections.get(userId);
  if (controller) {
    try {
      const encoder = new TextEncoder();
      const data = `data: ${JSON.stringify({ type: 'unread_count', count })}\n\n`;
      controller.enqueue(encoder.encode(data));
    } catch (error) {
      connections.delete(userId);
    }
  }
}