import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET /api/users/[username]/following - Get users the specified user is following
export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get total count
    const totalCount = await prisma.follow.count({
      where: { followerId: user.id },
    });
    
    // Get following users with pagination
    const following = await prisma.follow.findMany({
      where: { followerId: user.id },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Format response
    const formattedFollowing = following.map((follow: { following: any; createdAt: any; }) => ({
      ...follow.following,
      followedAt: follow.createdAt,
    }));
    
    return NextResponse.json({
      following: formattedFollowing,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching following users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch following users' },
      { status: 500 }
    );
  }
}