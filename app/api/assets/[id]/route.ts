// app/api/assets/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';

// Schema for validating PATCH request bodies
const updateAssetSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  description: z.string().optional(),
  projectId: z.string().nullable().optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

type RouteParams = { id: string };
type Props = {
  params: Promise<RouteParams>;
};

// GET /api/assets/[id] — Fetch a single asset by ID
export async function GET(
  req: NextRequest,
  { params }: Props
) {
  const { id } = await params;

  try {
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true },
        },
        project: {
          select: {
            id: true,
            title: true,
            user: { select: { username: true } },
          },
        },
        _count: { 
          select: { 
            likes: true, 
            comments: true 
          } 
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // If private, only the owner may view
    if (!asset.isPublic) {
      const session = await getServerSession(authOptions);
      if (!session || session.user.id !== asset.userId) {
        return NextResponse.json(
          { error: 'You do not have permission to view this asset' },
          { status: 403 }
        );
      }
    }

    const session = await getServerSession(authOptions);
    
    // Check if the current user has liked this asset
    let likedByUser = false;
    if (session?.user) {
      const like = await prisma.like.findUnique({
        where: {
          userId_assetId: {
            userId: session.user.id,
            assetId: id,
          },
        },
      });
      likedByUser = !!like;
    }
    
    // Format the response payload
    const formattedAsset = {
      ...asset,
      likes: asset._count.likes,
      comments: asset._count.comments,
      likedByUser,
      _count: undefined,
    };

    return NextResponse.json(formattedAsset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    return NextResponse.json(
      { error: 'Failed to fetch asset' },
      { status: 500 }
    );
  }
}

// PATCH /api/assets/[id] — Update an asset
export async function PATCH(
  req: NextRequest,
  { params }: Props
) {
  const { id } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    if (asset.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this asset' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = updateAssetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { title, description, projectId, isPublic, tags } = parsed.data;

    // If changing project, ensure the user owns that project
    if (projectId !== null) {
      const project = await prisma.project.findUnique({
        where: { id: projectId as string },
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

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        title: title ?? asset.title,
        description: description ?? asset.description,
        projectId:
          projectId === null
            ? null
            : projectId ?? asset.projectId,
        isPublic: isPublic ?? asset.isPublic,
        tags: tags ?? asset.tags,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true },
        },
        project: {
          select: { id: true, title: true },
        },
        _count: {
          select: { 
            likes: true,
            comments: true 
          },
        },
      },
    });
    
    // Check if the user has liked this asset
    const like = await prisma.like.findUnique({
      where: {
        userId_assetId: {
          userId: session.user.id,
          assetId: id,
        },
      },
    });
    
    // Format the response payload
    const formattedAsset = {
      ...updatedAsset,
      likes: updatedAsset._count.likes,
      comments: updatedAsset._count.comments,
      likedByUser: !!like,
      _count: undefined,
    };

    return NextResponse.json(formattedAsset);
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json(
      { error: 'Failed to update asset' },
      { status: 500 }
    );
  }
}

// DELETE /api/assets/[id] — Delete an asset
export async function DELETE(
  req: NextRequest,
  { params }: Props
) {
  const { id } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    if (asset.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this asset' },
        { status: 403 }
      );
    }

    await prisma.asset.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    );
  }
}