import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET /api/users/[username]/followers - Get user's followers
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
      where: { followingId: user.id },
    });
    
    // Get followers with pagination
    const followers = await prisma.follow.findMany({
      where: { followingId: user.id },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        follower: {
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
    const formattedFollowers = followers.map((follow: { follower: any; createdAt: any; }) => ({
      ...follow.follower,
      followedAt: follow.createdAt,
    }));
    
    return NextResponse.json({
      followers: formattedFollowers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching followers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch followers' },
      { status: 500 }
    );
  }
}