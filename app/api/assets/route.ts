// app/api/assets/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';

// Schema for GET request query params - adding 'following' filter
const getAssetsQuerySchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val) : 10)),
  userId: z.string().optional(),
  projectId: z.string().optional(),
  type: z.string().optional(),
  search: z.string().optional(),
  tag: z.string().optional(),
  sort: z.enum(['latest', 'popular', 'oldest']).optional().default('latest'),
  following: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
});

// GET /api/assets - Fetch assets with optional filtering
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    // Validate query parameters
    const validatedParams = getAssetsQuerySchema.safeParse(queryParams);
    
    if (!validatedParams.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validatedParams.error.errors },
        { status: 400 }
      );
    }
    
    const { page, limit, userId, projectId, type, search, tag, sort, following } = validatedParams.data;
    
    // Get the current user's session
    const session = await getServerSession(authOptions);
    
    // Build the filter object
    const where: any = {};
    
    if (userId) where.userId = userId;
    if (projectId) where.projectId = projectId;
    if (type) where.fileType = type;
    if (tag) where.tags = { has: tag };
    
    // Add search filter if provided
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Add followed users filter
    if (following && session?.user) {
      // Only show posts from users the current user follows
      const followedUsers = await prisma.follow.findMany({
        where: { followerId: session.user.id },
        select: { followingId: true }
      });
      
      const followedUserIds = followedUsers.map(follow => follow.followingId);
      
      // Only show posts from followed users
      if (followedUserIds.length > 0) {
        where.userId = { in: followedUserIds };
      } else {
        // If the user doesn't follow anyone, return an empty result
        where.userId = { equals: 'no-results' }; // This ensures no results
      }
    }
    
    // Determine sort order
    let orderBy: any = {};
    switch (sort) {
      case 'latest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'popular':
        orderBy = { likes: { _count: 'desc' } };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }
    
    // Get total count for pagination
    const totalCount = await prisma.asset.count({ where });
    
    // Get user's liked assets (if authenticated)
    let userLikedAssetIds: string[] = [];
    if (session?.user) {
      const userLikes = await prisma.like.findMany({
        where: {
          userId: session.user.id,
          assetId: { not: null },
        },
        select: { assetId: true },
      });
      userLikedAssetIds = userLikes.map(like => like.assetId as string);
    }
    
    // Fetch assets with pagination
    const assets = await prisma.asset.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });
    
    // Format the response with like counts and liked status
    const formattedAssets = assets.map((asset: any) => ({
      ...asset,
      likes: asset._count.likes,
      comments: asset._count.comments,
      likedByUser: userLikedAssetIds.includes(asset.id),
      _count: undefined,
    }));
    
    return NextResponse.json({
      assets: formattedAssets,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

// Schema for POST request body
const createAssetSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  fileUrl: z.string().url('Invalid file URL'),
  fileType: z.enum(['IMAGE', 'MODEL_3D', 'AUDIO', 'VIDEO', 'DOCUMENT', 'OTHER']),
  projectId: z.string().nullable().optional(),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
});

// POST /api/assets - Create a new asset
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    
    // Validate request body
    const validatedData = createAssetSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.errors },
        { status: 400 }
      );
    }
    
    const { title, description, fileUrl, fileType, projectId, isPublic, tags } = validatedData.data;
    
    // If projectId is provided, verify the user owns the project
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      
      if (project.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'You do not have permission to add assets to this project' },
          { status: 403 }
        );
      }
    }
    
    // Create the asset
    const newAsset = await prisma.asset.create({
      data: {
        title,
        description: description || '',
        fileUrl,
        fileType,
        projectId: projectId || null,
        userId: session.user.id,
        isPublic,
        tags,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });
    
    // Format the response
    const formattedAsset = {
      ...newAsset,
      likes: newAsset._count.likes,
      comments: newAsset._count.comments,
      likedByUser: false,
      _count: undefined,
    };
    
    return NextResponse.json(formattedAsset, { status: 201 });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json(
      { error: 'Failed to create asset' },
      { status: 500 }
    );
  }
}