// app/api/users/[username]/following/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

type RouteParams = { username: string };
type Props = { params: Promise<RouteParams> };

// GET /api/users/[username]/following — Paginated list of users that the specified user is following
export async function GET(
  req: NextRequest,
  { params }: Props
) {
  const { username } = await params;

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);

    // Lookup the user by username
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

    // Get the current session to check follow status
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    // Total count of follows
    const totalCount = await prisma.follow.count({
      where: { followerId: user.id },
    });

    // Fetch paginated follow records
    const followRows = await prisma.follow.findMany({
      where: { followerId: user.id },
      orderBy: { createdAt: 'desc' },
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
    });

    // If logged in, check which users the current user follows
    let followedByCurrentUser: Record<string, boolean> = {};
    if (currentUserId) {
      const userIds = followRows.map(row => row.following.id);
      const follows = await prisma.follow.findMany({
        where: {
          followerId: currentUserId,
          followingId: { in: userIds },
        },
        select: {
          followingId: true,
        },
      });
      
      // Create a lookup map of who the current user follows
      followedByCurrentUser = follows.reduce((acc, follow) => {
        acc[follow.followingId] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }

    // Format the "following" users with follow status
    const following = followRows.map(row => ({
      ...row.following,
      followedAt: row.createdAt,
      isFollowing: currentUserId ? followedByCurrentUser[row.following.id] || false : false,
      isCurrentUser: currentUserId === row.following.id,
    }));

    return NextResponse.json({
      following,
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