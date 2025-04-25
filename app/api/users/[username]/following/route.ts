// app/api/users/[username]/following/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

type RouteParams = { username: string };
type Props = { params: Promise<RouteParams> };

// GET /api/users/[username]/following — Paginated list of users that the specified user is following
export async function GET(
  req: NextRequest,
  { params }: Props
) {
  const { username } = await params;

  try {
    const url   = new URL(req.url);
    const page  = parseInt(url.searchParams.get('page')  || '1',  10);
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
            id:       true,
            name:     true,
            username: true,
            image:    true,
            bio:      true,
          },
        },
      },
    });

    // Format the "following" users
    const following = followRows.map((row: { following: any; createdAt: any; }) => ({
      ...row.following,
      followedAt: row.createdAt,
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
