import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';

// Schema for search query params
const searchQuerySchema = z.object({
  q: z.string().optional(),
  type: z.enum(['assets', 'projects', 'users', 'all']).optional().default('all'),
  tag: z.string().optional(),
  assetType: z.string().optional(),
  page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val) : 10)),
  sort: z.enum(['latest', 'oldest', 'popular']).optional().default('latest'),
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
    
    const { q, type, tag, assetType, page, limit, sort } = validatedParams.data;
    
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
      
      if (assetType) {
        assetsWhere.fileType = assetType;
      }
      
      // Determine sort order for assets
      let assetsOrderBy: any = {};
      switch (sort) {
        case 'latest':
          assetsOrderBy = { createdAt: 'desc' };
          break;
        case 'oldest':
          assetsOrderBy = { createdAt: 'asc' };
          break;
        case 'popular':
          assetsOrderBy = { 
            likes: { _count: 'desc' } 
          };
          break;
        default:
          assetsOrderBy = { createdAt: 'desc' };
      }
      
      const assetsCount = await prisma.asset.count({ where: assetsWhere });
      
      const assets = await prisma.asset.findMany({
        where: assetsWhere,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: assetsOrderBy,
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
      
      results.assets = assets.map((asset) => ({
        ...asset,
        likes: asset._count.likes,
        comments: asset._count.comments,
        _count: undefined,
      }));
      
      results.pagination.totalCount = assetsCount;
      results.pagination.totalPages = Math.ceil(assetsCount / limit);
    }
    
    // Search users (creators)
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
      
      results.users = users.map((user) => ({
        ...user,
        assetCount: user._count.assets,
        followerCount: user._count.followers,
        followingCount: user._count.following,
        stats: {
          assets: user._count.assets,
          followers: user._count.followers,
          following: user._count.following,
        },
        _count: undefined,
      }));
      
      if (type === 'users') {
        results.pagination.totalCount = usersCount;
        results.pagination.totalPages = Math.ceil(usersCount / limit);
      } else if (type === 'all') {
        results.pagination.totalCount += usersCount;
      }
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
      
      // Determine sort order for projects
      let projectsOrderBy: any = {};
      switch (sort) {
        case 'latest':
          projectsOrderBy = { createdAt: 'desc' };
          break;
        case 'oldest':
          projectsOrderBy = { createdAt: 'asc' };
          break;
        case 'popular':
          projectsOrderBy = { 
            likes: { _count: 'desc' } 
          };
          break;
        default:
          projectsOrderBy = { createdAt: 'desc' };
      }
      
      const projectsCount = await prisma.project.count({ where: projectsWhere });
      
      const projects = await prisma.project.findMany({
        where: projectsWhere,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: projectsOrderBy,
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
      
      results.projects = projects.map((project) => ({
        ...project,
        assetCount: project._count.assets,
        likes: project._count.likes,
        _count: undefined,
      }));
      
      if (type === 'projects') {
        results.pagination.totalCount = projectsCount;
        results.pagination.totalPages = Math.ceil(projectsCount / limit);
      } else if (type === 'all') {
        results.pagination.totalCount += projectsCount;
      }
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