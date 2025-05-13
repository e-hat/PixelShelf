// app/api/users/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';

const updateProfileSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' }),
  bio: z.string().optional(),
  location: z.string().optional(),
  // role: z.string().optional(), // TODO: Implement role...
  image: z.string().optional(),
  bannerImage: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    
    const validated = updateProfileSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validated.error.errors },
        { status: 400 }
      );
    }
    
    // Check if username is already taken by another user
    if (validated.data.username) {
      const existingUser = await prisma.user.findFirst({
        where: { 
          username: validated.data.username,
          NOT: { 
            id: session.user.id 
          }
        },
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        );
      }
    }
    
    // Update the user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        username: validated.data.username,
        bio: validated.data.bio || undefined,
        location: validated.data.location || undefined,
        // role: validated.data.role || undefined, // TODO: Implement role...
        image: validated.data.image || undefined,
        bannerImage: validated.data.bannerImage || undefined,
      },
    });
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}