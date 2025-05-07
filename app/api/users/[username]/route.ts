// app/api/users/[username]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';

type RouteParams = { username: string };
type Props = { params: Promise<RouteParams> };

// GET /api/users/[username] — Get a user profile
export async function GET(
  req: NextRequest,
  { params }: Props
) {
  const { username } = await params;

  try {
    // Lookup the user by username
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        image: true,
        bannerImage: true,
        location: true,
        social: true,
        subscriptionTier: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get follower and following counts with a direct database query
    const followersCount = await prisma.follow.count({
      where: { followingId: user.id },
    });

    const followingCount = await prisma.follow.count({
      where: { followerId: user.id },
    });

    // Get asset and project counts
    const assetsCount = await prisma.asset.count({
      where: { userId: user.id },
    });

    const projectsCount = await prisma.project.count({
      where: { userId: user.id },
    });

    // Determine follow status and whether this is the current user
    const session = await getServerSession(authOptions);
    let isFollowing = false;
    let isCurrentUser = false;

    if (session?.user?.id) {
      isCurrentUser = session.user.id === user.id;
      if (!isCurrentUser) {
        const followRecord = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: session.user.id,
              followingId: user.id,
            },
          },
        });
        isFollowing = Boolean(followRecord);
      }
    }

    // Assemble the public profile response with accurate counts
    const userProfile = {
      id: user.id,
      name: user.name,
      username: user.username,
      bio: user.bio,
      image: user.image,
      bannerImage: user.bannerImage,
      location: user.location,
      social: user.social,
      subscriptionTier: user.subscriptionTier,
      createdAt: user.createdAt,
      stats: {
        assets: assetsCount,
        projects: projectsCount,
        followers: followersCount,
        following: followingCount,
      },
      isFollowing,
      isCurrentUser,
    };

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}