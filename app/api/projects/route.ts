import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';

// Schema for GET request query params
const getProjectsQuerySchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val) : 10)),
  userId: z.string().optional(),
  username: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['latest', 'popular', 'oldest']).optional().default('latest'),
});

// Schema for POST request body
const createProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  isPublic: z.boolean().default(false),
});

// GET /api/projects - Fetch projects with optional filtering
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    // Validate query parameters
    const validatedParams = getProjectsQuerySchema.safeParse(queryParams);
    
    if (!validatedParams.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validatedParams.error.errors },
        { status: 400 }
      );
    }
    
    const { page, limit, userId, username, search, sort } = validatedParams.data;
    
    // Build the filter object
    let where: any = {};
    
    if (userId) where.userId = userId;
    
    // If username is provided, find the user first
    if (username) {
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
      
      where.userId = user.id;
    }
    
    // Add search filter if provided
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Get current session to determine if we should include private projects
    const session = await getServerSession(authOptions);
    
    // If not the user's own projects, only show public ones
    if (!session || (userId && session.user.id !== userId) || (username && session.user.username !== username)) {
      where.isPublic = true;
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
    const totalCount = await prisma.project.count({ where });
    
    // Fetch projects with pagination
    const projects = await prisma.project.findMany({
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
        _count: {
          select: {
            assets: true,
            likes: true,
          },
        },
      },
    });
    
    // Format the response
    const formattedProjects = projects.map((project: { _count: { assets: any; likes: any; }; }) => ({
      ...project,
      assetCount: project._count.assets,
      likes: project._count.likes,
      _count: undefined,
    }));
    
    return NextResponse.json({
      projects: formattedProjects,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user has reached the free tier project limit
    if (session.user.subscriptionTier === 'FREE') {
      const projectCount = await prisma.project.count({
        where: { userId: session.user.id },
      });
      
      if (projectCount >= 3) {
        return NextResponse.json(
          { 
            error: 'Free tier limit reached', 
            message: 'You have reached the maximum of 3 projects on the free tier. Upgrade to Premium to create unlimited projects.'
          },
          { status: 403 }
        );
      }
    }
    
    const body = await req.json();
    
    // Validate request body
    const validatedData = createProjectSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.errors },
        { status: 400 }
      );
    }
    
    const { title, description, thumbnail, isPublic } = validatedData.data;
    
    // Create the project
    const newProject = await prisma.project.create({
      data: {
        title,
        description: description || '',
        thumbnail: thumbnail || null,
        isPublic,
        userId: session.user.id,
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
    
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}