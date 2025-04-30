import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';

// Schema for trending query params
const trendingQuerySchema = z.object({
  type: z.enum(['assets', 'creators', 'projects', 'all']).optional().default('assets'),
  limit: z.string().optional().transform(val => (val ? parseInt(val) : 10)),
});

// GET /api/trending - Get trending assets, creators, or projects
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    // Validate query parameters
    const validatedParams = trendingQuerySchema.safeParse(queryParams);
    
    if (!validatedParams.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validatedParams.error.errors },
        { status: 400 }
      );
    }
    
    const { type, limit } = validatedParams.data;
    const results: any = {};
    
    // Get trending assets
    if (type === 'all' || type === 'assets') {
      // For trending assets, we'll use a combination of likes, comments, and recency
      const trendingAssets = await prisma.asset.findMany({
        where: {
          isPublic: true,
        },
        take: limit,
        orderBy: [
          { likes: { _count: 'desc' } },
          { comments: { _count: 'desc' } },
          { createdAt: 'desc' },
        ],
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
      
      results.assets = trendingAssets.map((asset) => ({
        ...asset,
        likes: asset._count.likes,
        comments: asset._count.comments,
        _count: undefined,
      }));
    }
    
    // Get trending creators
    if (type === 'all' || type === 'creators') {
      // For trending creators, we'll use a combination of followers and asset engagement
      const trendingCreators = await prisma.user.findMany({
        take: limit,
        orderBy: [
          { followers: { _count: 'desc' } },
          { assets: { _count: 'desc' } },
        ],
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
      
      results.creators = trendingCreators.map((user) => ({
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
    }
    
    // Get trending projects
    if (type === 'all' || type === 'projects') {
      // For trending projects, we'll use a combination of likes and asset count
      const trendingProjects = await prisma.project.findMany({
        where: {
          isPublic: true,
        },
        take: limit,
        orderBy: [
          { likes: { _count: 'desc' } },
          { assets: { _count: 'desc' } },
          { createdAt: 'desc' },
        ],
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
      
      results.projects = trendingProjects.map((project) => ({
        ...project,
        assetCount: project._count.assets,
        likes: project._count.likes,
        _count: undefined,
      }));
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching trending items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending items' },
      { status: 500 }
    );
  }
}