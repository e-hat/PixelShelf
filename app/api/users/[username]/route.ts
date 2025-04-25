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
        _count: {
          select: {
            assets: true,
            projects: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

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

    // Assemble the public profile response
    const userProfile = {
      id:               user.id,
      name:             user.name,
      username:         user.username,
      bio:              user.bio,
      image:            user.image,
      bannerImage:      user.bannerImage,
      location:         user.location,
      social:           user.social,
      subscriptionTier: user.subscriptionTier,
      createdAt:        user.createdAt,
      stats: {
        assets:    user._count.assets,
        projects:  user._count.projects,
        followers: user._count.followers,
        following: user._count.following,
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
