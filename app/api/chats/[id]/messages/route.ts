import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';

// Schema for POST request body
const createMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
});

type RouteParams = { id: string };
type Props = { params: RouteParams };

// POST /api/chats/[id]/messages - Send a message to a chat
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
    
    const body = await req.json();
    
    // Validate request body
    const validatedData = createMessageSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.errors },
        { status: 400 }
      );
    }
    
    const { content } = validatedData.data;
    
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
    
    // Get the other participant in the chat
    const otherParticipant = await prisma.userChat.findFirst({
      where: {
        chatId: id,
        userId: { not: session.user.id },
      },
      select: {
        userId: true,
      },
    });
    
    if (!otherParticipant) {
      return NextResponse.json(
        { error: 'Chat has no other participant' },
        { status: 400 }
      );
    }
    
    // Create the message
    const message = await prisma.message.create({
      data: {
        content,
        chatId: id,
        senderId: session.user.id,
        receiverId: otherParticipant.userId,
      },
    });
    
    // Mark the chat as unread for the other participant
    await prisma.userChat.update({
      where: {
        userId_chatId: {
          userId: otherParticipant.userId,
          chatId: id,
        },
      },
      data: {
        hasUnread: true,
      },
    });
    
    // Update chat's updatedAt
    await prisma.chat.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
    
    // Create notification for the receiver
    await prisma.notification.create({
      data: {
        type: 'MESSAGE',
        content: `sent you a message`,
        linkUrl: `/chat?with=${session.user.id}`,
        receiverId: otherParticipant.userId,
        senderId: session.user.id,
      },
    });
    
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}