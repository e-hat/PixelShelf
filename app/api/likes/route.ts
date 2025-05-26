// app/api/likes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';
import { NotificationHelper } from '@/lib/notifications/notification-helper';

// Schema for POST request body
const likeSchema = z.object({
  assetId: z.string().optional(),
  projectId: z.string().optional(),
}).refine(data => data.assetId || data.projectId, {
  message: 'Either assetId or projectId must be provided',
});

// Schema for DELETE request body
const unlikeSchema = z.object({
  assetId: z.string().optional(),
  projectId: z.string().optional(),
}).refine(data => data.assetId || data.projectId, {
  message: 'Either assetId or projectId must be provided',
});

// POST /api/likes - Like an asset or project
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
    const validatedData = likeSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.errors },
        { status: 400 }
      );
    }
    
    const { assetId, projectId } = validatedData.data;
    
    // Check if the asset or project exists
    if (assetId) {
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
      
      // Check if the user has already liked this asset
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_assetId: {
            userId: session.user.id,
            assetId,
          },
        },
      });
      
      if (existingLike) {
        return NextResponse.json(
          { error: 'You have already liked this asset' },
          { status: 400 }
        );
      }
      
      // Create the like
      const newLike = await prisma.like.create({
        data: {
          userId: session.user.id,
          assetId,
        },
      });
      
      // Create notification for the asset owner
      if (asset.userId !== session.user.id) {
        await NotificationHelper.createAssetLikeNotification(session.user.id, assetId);
      }
      
      return NextResponse.json(newLike, { status: 201 });
    }
    
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { user: true },
      });
      
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      
      // Check if the user has already liked this project
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_projectId: {
            userId: session.user.id,
            projectId,
          },
        },
      });
      
      if (existingLike) {
        return NextResponse.json(
          { error: 'You have already liked this project' },
          { status: 400 }
        );
      }
      
      // Create the like
      const newLike = await prisma.like.create({
        data: {
          userId: session.user.id,
          projectId,
        },
      });
      
      // Create notification for the project owner
      if (project.userId !== session.user.id) {
        await NotificationHelper.createProjectLikeNotification(session.user.id, projectId);
      }
      
      return NextResponse.json(newLike, { status: 201 });
    }
    
    // This should never happen due to zod validation
    return NextResponse.json(
      { error: 'Either assetId or projectId must be provided' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error creating like:', error);
    return NextResponse.json(
      { error: 'Failed to like item' },
      { status: 500 }
    );
  }
}

// DELETE /api/likes - Unlike an asset or project
export async function DELETE(req: NextRequest) {
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
    const validatedData = unlikeSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.errors },
        { status: 400 }
      );
    }
    
    const { assetId, projectId } = validatedData.data;
    
    // Delete the like
    if (assetId) {
      try {
        await prisma.like.delete({
          where: {
            userId_assetId: {
              userId: session.user.id,
              assetId,
            },
          },
        });
        
        return NextResponse.json({ success: true });
      } catch (error) {
        return NextResponse.json(
          { error: 'You have not liked this asset' },
          { status: 404 }
        );
      }
    }
    
    if (projectId) {
      try {
        await prisma.like.delete({
          where: {
            userId_projectId: {
              userId: session.user.id,
              projectId,
            },
          },
        });
        
        return NextResponse.json({ success: true });
      } catch (error) {
        return NextResponse.json(
          { error: 'You have not liked this project' },
          { status: 404 }
        );
      }
    }
    
    // This should never happen due to zod validation
    return NextResponse.json(
      { error: 'Either assetId or projectId must be provided' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error removing like:', error);
    return NextResponse.json(
      { error: 'Failed to unlike item' },
      { status: 500 }
    );
  }
}