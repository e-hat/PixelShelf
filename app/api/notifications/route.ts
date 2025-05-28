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
    
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const archivedOnly = searchParams.get('archivedOnly') === 'true';
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where = {
      receiverId: session.user.id,
      ...(unreadOnly ? { read: false } : {}),
      ...(archivedOnly ? { read: true } : {}),
    };
    
    // Get notifications
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
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
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);
    
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
        total,
        totalPages: Math.ceil(total / limit),
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