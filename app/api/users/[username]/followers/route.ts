// app/api/users/[username]/followers/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

type RouteParams = { username: string };
type Props = { params: Promise<RouteParams> };

// GET /api/users/[username]/followers — Paginated list of followers
export async function GET(
  req: NextRequest,
  { params }: Props
) {
  const { username } = await params;

  try {
    const url = new URL(req.url);
    const page  = parseInt(url.searchParams.get('page')  || '1',  10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);

    // Find the user by username
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

    // Count total followers
    const totalCount = await prisma.follow.count({
      where: { followingId: user.id },
    });

    // Fetch paginated followers
    const followRows = await prisma.follow.findMany({
      where: { followingId: user.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        follower: {
          select: {
            id:       true,
            name:     true,
            username: true,
            image:    true,
            bio:      true,
          },
        },
      },
    });

    // Format the follower objects
    const followers = followRows.map((row: { follower: any; createdAt: any; }) => ({
      ...row.follower,
      followedAt: row.createdAt,
    }));

    return NextResponse.json({
      followers,
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
