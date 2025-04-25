import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';

// GET /api/notifications - Get current user's notifications
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    
    // Build query
    const where = {
      receiverId: session.user.id,
      ...(unreadOnly ? { read: false } : {}),
    };
    
    // Get total count
    const totalCount = await prisma.notification.count({ where });
    
    // Get notifications with pagination
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });
    
    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        receiverId: session.user.id,
        read: false,
      },
    });
    
    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { ids, all = false } = body;
    
    if (!ids && !all) {
      return NextResponse.json(
        { error: 'Either notification ids or all flag must be provided' },
        { status: 400 }
      );
    }
    
    if (all) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: {
          receiverId: session.user.id,
          read: false,
        },
        data: {
          read: true,
        },
      });
    } else if (Array.isArray(ids) && ids.length > 0) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: ids },
          receiverId: session.user.id,
        },
        data: {
          read: true,
        },
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}