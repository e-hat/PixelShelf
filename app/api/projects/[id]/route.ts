// app/api/projects/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';

// Schema for validating PATCH request bodies
const updateProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  description: z.string().optional(),
  thumbnail: z.string().nullable().optional(),
  isPublic: z.boolean().optional(),
});

type RouteParams = { id: string };
type Props = { params: Promise<RouteParams> };

// GET /api/projects/[id] — Fetch a single project by ID
export async function GET(
  req: NextRequest,
  { params }: Props
) {
  const { id } = await params;

  try {
    const project = await prisma.project.findUnique({
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
        assets: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
            _count: {
              select: { likes: true, comments: true },
            },
          },
        },
        likes: {
          select: { userId: true },
        },
        _count: {
          select: { likes: true, assets: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Enforce privacy
    if (!project.isPublic) {
      const session = await getServerSession(authOptions);
      if (!session?.user || session.user.id !== project.userId) {
        return NextResponse.json(
          { error: 'You do not have permission to view this project' },
          { status: 403 }
        );
      }
    }

    // Format assets
    const formattedAssets = project.assets.map((asset: { _count: { likes: any; comments: any; }; }) => ({
      ...asset,
      likes: asset._count.likes,
      comments: asset._count.comments,
      _count: undefined,
    }));

    // Build formatted project
    const formattedProject: any = {
      ...project,
      assets: formattedAssets,
      likes: project._count.likes,
      assetCount: project._count.assets,
      likedByUser: false,
      _count: undefined,
    };

    // Mark likedByUser
    const session = await getServerSession(authOptions);
    if (session?.user) {
      formattedProject.likedByUser = project.likes.some(
        ( like: { userId: string; }) => like.userId === session.user.id
      );
    }

    return NextResponse.json(formattedProject);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id] — Update a project
export async function PATCH(
  req: NextRequest,
  { params }: Props
) {
  const { id } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    if (project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this project' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { title, description, thumbnail, isPublic } = parsed.data;

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        title: title ?? project.title,
        description: description ?? project.description,
        thumbnail:
          thumbnail === null
            ? null
            : thumbnail ?? project.thumbnail,
        isPublic: isPublic ?? project.isPublic,
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

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] — Delete a project
export async function DELETE(
  req: NextRequest,
  { params }: Props
) {
  const { id } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    if (project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this project' },
        { status: 403 }
      );
    }

    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
