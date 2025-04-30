import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';

// Schema for POST request body
const createChatSchema = z.object({
  userId: z.string(),
});

// GET /api/chats - Fetch user's chats
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user's chats with participants and last message
    const userChats = await prisma.userChat.findMany({
      where: { 
        userId: session.user.id,
      },
      include: {
        chat: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
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
                userId: { not: session.user.id },
              },
            },
          },
        },
      },
      orderBy: { chat: { updatedAt: 'desc' } },
    });
    
    // Format chats for client
    const formattedChats = userChats.map(userChat => {
      const otherParticipants = userChat.chat.participants.map(p => p.user);
      const lastMessage = userChat.chat.messages[0];
      
      // Count unread messages
      const unreadCount = userChat.hasUnread ? 1 : 0; // Simplified for now
      
      return {
        id: userChat.chatId,
        participants: otherParticipants,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt,
        } : undefined,
        unreadCount,
      };
    });
    
    return NextResponse.json({ chats: formattedChats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}

// POST /api/chats - Create a new chat
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
    
    // Validate request body
    const validatedData = createChatSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.errors },
        { status: 400 }
      );
    }
    
    const { userId: otherUserId } = validatedData.data;
    
    // Check if chat already exists between these users
    const existingChat = await prisma.chat.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: session.user.id } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
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
            userId: otherUserId,
          },
        },
      },
    });
    
    if (existingChat) {
      // Format existing chat for client
      const otherParticipants = existingChat.participants.map(p => p.user);
      
      return NextResponse.json({
        id: existingChat.id,
        participants: otherParticipants,
      });
    }
    
    // Create new chat
    const newChat = await prisma.chat.create({
      data: {
        participants: {
          create: [
            { userId: session.user.id },
            { userId: otherUserId },
          ],
        },
      },
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
            userId: otherUserId,
          },
        },
      },
    });
    
    return NextResponse.json({
      id: newChat.id,
      participants: newChat.participants.map(p => p.user),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    );
  }
}