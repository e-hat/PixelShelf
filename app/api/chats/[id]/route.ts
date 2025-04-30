import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';

type RouteParams = { id: string };
type Props = { params: RouteParams };

// GET /api/chats/[id] - Fetch a chat with messages
export async function GET(
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
    
    // Fetch the chat with participants and messages
    const chat = await prisma.chat.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
          where: {
            userId: { not: session.user.id }, // Only include other participants
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            senderId: true,
            receiverId: true,
            read: true,
            createdAt: true,
          },
        },
      },
    });
    
    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }
    
    // Format chat for client
    const formattedChat = {
      id: chat.id,
      participants: chat.participants.map(p => p.user),
      messages: chat.messages,
    };
    
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
    
    return NextResponse.json(formattedChat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat' },
      { status: 500 }
    );
  }
}