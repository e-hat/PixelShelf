// app/api/notifications/mark-all-read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/db/prisma';
import { updateUnreadCount } from '../stream/route';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await prisma.notification.updateMany({
      where: {
        receiverId: session.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });
    
    // Update unread count via SSE
    updateUnreadCount(session.user.id, 0);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}