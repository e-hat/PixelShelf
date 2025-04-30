import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';

type RouteParams = { id: string };
type Props = { params: RouteParams };

// POST /api/chats/[id]/read - Mark chat as read
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is part of this chat
    const userChat = await prisma.userChat.findUnique({
      where: {
        userId_chatId: {
          userId: session.user.id,
          chatId: id,
        },
      },
    });
    
    if (!userChat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }
    
    // Mark the chat as read for the current user
    await prisma.userChat.update({
      where: {
        userId_chatId: {
          userId: session.user.id,
          chatId: id,
        },
      },
      data: {
        hasUnread: false,
      },
    });
    
    // Mark all messages as read for the current user
    await prisma.message.updateMany({
      where: {
        chatId: id,
        receiverId: session.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking chat as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark chat as read' },
      { status: 500 }
    );
  }
}