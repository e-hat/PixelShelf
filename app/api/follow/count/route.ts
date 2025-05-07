// app/api/follow/count/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    
    if (!type || (type !== 'followers' && type !== 'following')) {
      return NextResponse.json(
        { error: 'type must be either "followers" or "following"' },
        { status: 400 }
      );
    }
    
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    let count = 0;
    
    if (type === 'followers') {
      // Count users who follow this user
      count = await prisma.follow.count({
        where: { followingId: userId },
      });
    } else {
      // Count users this user follows
      count = await prisma.follow.count({
        where: { followerId: userId },
      });
    }
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error getting follow count:', error);
    return NextResponse.json(
      { error: 'Failed to get follow count' },
      { status: 500 }
    );
  }
}