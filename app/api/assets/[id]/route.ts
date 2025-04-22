import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';

// Schema for PATCH request
const updateAssetSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  description: z.string().optional(),
  projectId: z.string().nullable().optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// GET /api/assets/[id] - Fetch a single asset by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Find the asset
    const asset = await prisma.asset.findUnique({
      where: { id },
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
            user: {
              select: {
                username: true,
              },
            },
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        comments: {
          orderBy: {
            createdAt: 'desc',
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
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
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
    
    // Format the response
    const formattedAsset = {
      ...asset,
      likes: asset._count.likes,
      likedByUser: false,
      _count: undefined,
    };
    
    // Check if the current user has liked the asset
    const session = await getServerSession(authOptions);
    if (session && session.user) {
      formattedAsset.likedByUser = asset.likes.some((like: { userId: any; }) => like.userId === session.user.id);
    }
    
    return NextResponse.json(formattedAsset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    return NextResponse.json(
      { error: 'Failed to fetch asset' },
      { status: 500 }
    );
  }
}

// PATCH /api/assets/[id] - Update an asset
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Find the asset
    const asset = await prisma.asset.findUnique({
      where: { id },
    });
    
    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }
    
    // Check if the user has permission to update this asset
    if (asset.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this asset' },
        { status: 403 }
      );
    }
    
    // Validate the request body
    const body = await req.json();
    const validatedData = updateAssetSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.errors },
        { status: 400 }
      );
    }
    
    const { title, description, projectId, isPublic, tags } = validatedData.data;
    
    // If projectId is provided, check if it exists and user has access to it
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
    
    // Update the asset
    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        title: title ?? asset.title,
        description: description ?? asset.description,
        projectId: projectId === null ? null : projectId ?? asset.projectId,
        isPublic: isPublic ?? asset.isPublic,
        tags: tags ?? asset.tags,
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
      },
    });
    
    return NextResponse.json(updatedAsset);
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json(
      { error: 'Failed to update asset' },
      { status: 500 }
    );
  }
}

// DELETE /api/assets/[id] - Delete an asset
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Find the asset
    const asset = await prisma.asset.findUnique({
      where: { id },
    });
    
    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }
    
    // Check if the user has permission to delete this asset
    if (asset.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this asset' },
        { status: 403 }
      );
    }
    
    // Delete the asset
    await prisma.asset.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    );
  }
}