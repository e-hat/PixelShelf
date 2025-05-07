// app/api/follow/status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('targetUserId');
    
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'targetUserId is required' },
        { status: 400 }
      );
    }
    
    // Check if the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if the current user follows the target user
    const followRecord = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUserId,
        },
      },
    });
    
    return NextResponse.json({
      isFollowing: !!followRecord,
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json(
      { error: 'Failed to check follow status' },
      { status: 500 }
    );
  }
}