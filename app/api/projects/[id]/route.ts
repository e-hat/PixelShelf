import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';

// Schema for PATCH request
const updateProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  description: z.string().optional(),
  thumbnail: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
});

// GET /api/projects/[id] - Fetch a single project by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Find the project
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
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            assets: true,
          },
        },
      },
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Check if the project is private and if the current user has access
    if (!project.isPublic) {
      const session = await getServerSession(authOptions);
      
      // If not logged in or not the owner, deny access
      if (!session || session.user.id !== project.userId) {
        return NextResponse.json(
          { error: 'You do not have permission to view this project' },
          { status: 403 }
        );
      }
    }
    
    // Format the response
    const formattedAssets = project.assets.map((asset: { _count: { likes: any; comments: any; }; }) => ({
      ...asset,
      likes: asset._count.likes,
      comments: asset._count.comments,
      _count: undefined,
    }));
    
    const formattedProject = {
      ...project,
      assets: formattedAssets,
      likes: project._count.likes,
      assetCount: project._count.assets,
      likedByUser: false,
      _count: undefined,
    };
    
    // Check if the current user has liked the project
    const session = await getServerSession(authOptions);
    if (session && session.user) {
      formattedProject.likedByUser = project.likes.some((like: { userId: string; }) => like.userId === session.user.id);
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

// PATCH /api/projects/[id] - Update a project
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
    
    // Find the project
    const project = await prisma.project.findUnique({
      where: { id },
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Check if the user has permission to update this project
    if (project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this project' },
        { status: 403 }
      );
    }
    
    // Validate the request body
    const body = await req.json();
    const validatedData = updateProjectSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.errors },
        { status: 400 }
      );
    }
    
    const { title, description, thumbnail, isPublic } = validatedData.data;
    
    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        title: title ?? project.title,
        description: description ?? project.description,
        thumbnail: thumbnail === null ? null : thumbnail ?? project.thumbnail,
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

// DELETE /api/projects/[id] - Delete a project
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
    
    // Find the project
    const project = await prisma.project.findUnique({
      where: { id },
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Check if the user has permission to delete this project
    if (project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this project' },
        { status: 403 }
      );
    }
    
    // Delete the project (this will also remove the project ID from associated assets)
    await prisma.project.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}