// app/api/notifications/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

// Schema for notification preferences
const preferencesSchema = z.object({
  email: z.object({
    enabled: z.boolean(),
    frequency: z.enum(['instant', 'daily', 'weekly']),
    types: z.object({
      follow: z.boolean(),
      like: z.boolean(),
      comment: z.boolean(),
      message: z.boolean(),
      system: z.boolean(),
    }),
  }),
  push: z.object({
    enabled: z.boolean(),
    types: z.object({
      follow: z.boolean(),
      like: z.boolean(),
      comment: z.boolean(),
      message: z.boolean(),
      system: z.boolean(),
    }),
  }),
  inApp: z.object({
    enabled: z.boolean(),
    sound: z.boolean(),
    desktop: z.boolean(),
  }),
});

// GET /api/notifications/preferences - Get user's notification preferences
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user with preferences
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { social: true }, // We're storing preferences in the social JSON field temporarily
    });
    
    // Extract preferences from social field or return defaults
    const preferences = (user?.social as any)?.notificationPreferences || {
      email: {
        enabled: true,
        frequency: 'instant',
        types: {
          follow: true,
          like: true,
          comment: true,
          message: true,
          system: true,
        },
      },
      push: {
        enabled: true,
        types: {
          follow: true,
          like: true,
          comment: true,
          message: true,
          system: true,
        },
      },
      inApp: {
        enabled: true,
        sound: false,
        desktop: true,
      },
    };
    
    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/preferences - Update user's notification preferences
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    
    // Validate the preferences
    const validatedPreferences = preferencesSchema.safeParse(body);
    
    if (!validatedPreferences.success) {
      return NextResponse.json(
        { error: 'Invalid preferences format', details: validatedPreferences.error.errors },
        { status: 400 }
      );
    }
    
    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { social: true },
    });
    
    // Merge preferences into social field
    const currentSocial = (currentUser?.social as any) || {};
    const updatedSocial = {
      ...currentSocial,
      notificationPreferences: validatedPreferences.data,
    };
    
    // Update user
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        social: updatedSocial,
      },
    });
    
    return NextResponse.json({ 
      success: true,
      preferences: validatedPreferences.data,
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}