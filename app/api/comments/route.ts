// app/api/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';
import { NotificationHelper } from '@/lib/notifications/notification-helper';

// Schema for GET request query params
const getCommentsQuerySchema = z.object({
  assetId: z.string(),
  page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val) : 10)),
  sort: z.enum(['latest', 'oldest']).optional().default('latest'),
});

// Schema for POST request body
const createCommentSchema = z.object({
  assetId: z.string(),
  content: z.string().min(1, 'Comment cannot be empty').max(500, 'Comment must be less than 500 characters'),
  parentId: z.string().optional(),
});

// GET /api/comments - Fetch comments for an asset
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    // Validate query parameters
    const validatedParams = getCommentsQuerySchema.safeParse(queryParams);
    
    if (!validatedParams.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validatedParams.error.errors },
        { status: 400 }
      );
    }
    
    const { assetId, page, limit, sort } = validatedParams.data;
    
    // Check if the asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });
    
    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }
    
    // Check if the asset is private and if the current user has access
    if (!asset.isPublic) {
      const session = await getServerSession(authOptions);
      
      // If not logged in or not the owner, deny access
      if (!session || session.user.id !== asset.userId) {
        return NextResponse.json(
          { error: 'You do not have permission to view this asset' },
          { status: 403 }
        );
      }
    }
    
    // Determine sort order
    const orderBy = {
      createdAt: sort === 'latest' ? 'desc' as const : 'asc' as const,
    };
    
    // Get total count for pagination
    const totalCount = await prisma.comment.count({
      where: { 
        assetId,
        parentId: null, // Only count top-level comments
      },
    });
    
    // Fetch comments with pagination
    const comments = await prisma.comment.findMany({
      where: { 
        assetId,
        parentId: null, // Only fetch top-level comments
      },
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
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
      },
    });
    
    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/comments - Create a new comment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    
    // Validate request body
    const validatedData = createCommentSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.errors },
        { status: 400 }
      );
    }
    
    const { assetId, content, parentId } = validatedData.data;
    
    // Check if the asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: { user: true },
    });
    
    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }
    
    // If this is a reply, check if the parent comment exists
    let parentComment = null;
    if (parentId) {
      parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        include: { user: true },
      });
      
      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }
      
      // Make sure the parent comment is for the same asset
      if (parentComment.assetId !== assetId) {
        return NextResponse.json(
          { error: 'Parent comment does not belong to this asset' },
          { status: 400 }
        );
      }
    }
    
    // Create the comment
    const newComment = await prisma.comment.create({
      data: {
        content,
        userId: session.user.id,
        assetId,
        parentId,
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
      },
    });
    
    // Create notifications using the helper
    await NotificationHelper.createCommentNotification(
      session.user.id,
      assetId,
      content,
      parentComment?.userId
    );
    
    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}