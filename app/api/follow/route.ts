// app/api/follow/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';

// Schema for POST request (follow user)
const followUserSchema = z.object({
  targetUserId: z.string(),
});

// Schema for DELETE request (unfollow user)
const unfollowUserSchema = z.object({
  targetUserId: z.string(),
});

// POST /api/follow - Follow a user
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
    const validatedData = followUserSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.errors },
        { status: 400 }
      );
    }
    
    const { targetUserId } = validatedData.data;
    
    // Can't follow yourself
    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot follow yourself' },
        { status: 400 }
      );
    }
    
    // Check if the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, username: true }
    });
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUserId,
        },
      },
    });
    
    if (existingFollow) {
      return NextResponse.json(
        { error: 'You are already following this user' },
        { status: 400 }
      );
    }
    
    // Create the follow relationship
    const follow = await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId: targetUserId,
      },
    });
    
    // Create a notification for the target user
    await prisma.notification.create({
      data: {
        type: 'FOLLOW',
        content: `started following you`,
        linkUrl: `/u/${session.user.username}`,
        receiverId: targetUserId,
        senderId: session.user.id,
      },
    });
    
    // Return the result with follower info
    return NextResponse.json({
      ...follow,
      follower: {
        id: session.user.id,
        name: session.user.name,
        username: session.user.username
      },
      following: targetUser
    }, { status: 201 });
  } catch (error) {
    console.error('Error following user:', error);
    return NextResponse.json(
      { error: 'Failed to follow user' },
      { status: 500 }
    );
  }
}

// DELETE /api/follow - Unfollow a user
export async function DELETE(req: NextRequest) {
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
    const validatedData = unfollowUserSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.errors },
        { status: 400 }
      );
    }
    
    const { targetUserId } = validatedData.data;
    
    // Check if actually following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUserId,
        },
      },
    });
    
    if (!existingFollow) {
      return NextResponse.json(
        { error: 'You are not following this user' },
        { status: 400 }
      );
    }
    
    // Delete the follow relationship
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUserId,
        },
      },
    });
    
    return NextResponse.json({ 
      success: true,
      unfollowed: targetUserId
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return NextResponse.json(
      { error: 'Failed to unfollow user' },
      { status: 500 }
    );
  }
}