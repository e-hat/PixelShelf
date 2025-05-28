import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/db/prisma';
import { updateUnreadCount } from '@/lib/notifications/stream';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { ids } = body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Notification ids must be provided' },
        { status: 400 }
      );
    }
    
    // Delete notifications
    await prisma.notification.deleteMany({
      where: {
        id: { in: ids },
        receiverId: session.user.id,
      },
    });
    
    // Update unread count via SSE
    const unreadCount = await prisma.notification.count({
      where: {
        receiverId: session.user.id,
        read: false,
      },
    });
    updateUnreadCount(session.user.id, unreadCount);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
} 