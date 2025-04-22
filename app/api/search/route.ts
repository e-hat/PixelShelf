import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';

// Schema for search query params
const searchQuerySchema = z.object({
  q: z.string().optional(),
  type: z.enum(['assets', 'projects', 'users', 'all']).optional().default('all'),
  tag: z.string().optional(),
  page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val) : 10)),
});

// GET /api/search - Search for assets, projects, or users
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    // Validate query parameters
    const validatedParams = searchQuerySchema.safeParse(queryParams);
    
    if (!validatedParams.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validatedParams.error.errors },
        { status: 400 }
      );
    }
    
    const { q, type, tag, page, limit } = validatedParams.data;
    
    if (!q && !tag) {
      return NextResponse.json(
        { error: 'Search query or tag is required' },
        { status: 400 }
      );
    }
    
    const results: any = {
      pagination: {
        page,
        limit,
        totalCount: 0,
        totalPages: 0,
      },
    };
    
    // Search assets
    if (type === 'all' || type === 'assets') {
      const assetsWhere: any = {
        isPublic: true,
      };
      
      if (q) {
        assetsWhere.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ];
      }
      
      if (tag) {
        assetsWhere.tags = { has: tag };
      }
      
      const assetsCount = await prisma.asset.count({ where: assetsWhere });
      
      const assets = await prisma.asset.findMany({
        where: assetsWhere,
        skip: (page - 1) * limit,
        take: limit,
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
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });
      
      results.assets = assets.map((asset: { _count: { likes: any; comments: any; }; }) => ({
        ...asset,
        likes: asset._count.likes,
        comments: asset._count.comments,
        _count: undefined,
      }));
      
      results.pagination.totalCount = assetsCount;
      results.pagination.totalPages = Math.ceil(assetsCount / limit);
    }
    
    // Search projects
    if (type === 'all' || type === 'projects') {
      const projectsWhere: any = {
        isPublic: true,
      };
      
      if (q) {
        projectsWhere.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ];
      }
      
      // For projects, we search for those with assets that have the specified tag
      if (tag) {
        projectsWhere.assets = {
          some: {
            tags: { has: tag },
          },
        };
      }
      
      const projectsCount = await prisma.project.count({ where: projectsWhere });
      
      const projects = await prisma.project.findMany({
        where: projectsWhere,
        skip: (page - 1) * limit,
        take: limit,
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
            select: {
              assets: true,
              likes: true,
            },
          },
        },
      });
      
      results.projects = projects.map((project: { _count: { assets: any; likes: any; }; }) => ({
        ...project,
        assetCount: project._count.assets,
        likes: project._count.likes,
        _count: undefined,
      }));
      
      results.pagination.totalCount += projectsCount;
      results.pagination.totalPages = Math.max(
        results.pagination.totalPages,
        Math.ceil(projectsCount / limit)
      );
    }
    
    // Search users
    if (type === 'all' || type === 'users') {
      const usersWhere: any = {};
      
      if (q) {
        usersWhere.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { username: { contains: q, mode: 'insensitive' } },
          { bio: { contains: q, mode: 'insensitive' } },
        ];
      }
      
      // For users with a specific tag, we look for users with assets that have the tag
      if (tag) {
        usersWhere.assets = {
          some: {
            tags: { has: tag },
          },
        };
      }
      
      const usersCount = await prisma.user.count({ where: usersWhere });
      
      const users = await prisma.user.findMany({
        where: usersWhere,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          bio: true,
          _count: {
            select: {
              assets: true,
              followers: true,
              following: true,
            },
          },
        },
      });
      
      results.users = users.map((user: { _count: { assets: any; followers: any; following: any; }; }) => ({
        ...user,
        assetCount: user._count.assets,
        followerCount: user._count.followers,
        followingCount: user._count.following,
        _count: undefined,
      }));
      
      results.pagination.totalCount += usersCount;
      results.pagination.totalPages = Math.max(
        results.pagination.totalPages,
        Math.ceil(usersCount / limit)
      );
    }
    
    // Adjust for type=all
    if (type === 'all') {
      results.pagination.totalPages = Math.max(
        Math.ceil(results.pagination.totalCount / (limit * 3)),
        1
      );
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    );
  }
}