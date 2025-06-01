// app/api/notifications/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';
import type { NotificationPreferences } from '@/types';

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
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: session.user.id },
    });

    if (!preferences) {
      // Return default preferences if none exist
      return NextResponse.json({
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
      });
    }

    return NextResponse.json({
      email: preferences.email as NotificationPreferences['email'],
      push: preferences.push as NotificationPreferences['push'],
      inApp: preferences.inApp as NotificationPreferences['inApp'],
    });
  } catch (error) {
    console.error('Failed to get notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to get notification preferences' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/preferences - Update user's notification preferences
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await request.json();

    // Validate preferences structure
    if (!preferences.email || !preferences.push || !preferences.inApp) {
      return NextResponse.json(
        { error: 'Invalid preferences structure' },
        { status: 400 }
      );
    }

    // Upsert preferences (create if not exists, update if exists)
    const updatedPreferences = await prisma.notificationPreferences.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        email: preferences.email,
        push: preferences.push,
        inApp: preferences.inApp,
      },
      update: {
        email: preferences.email,
        push: preferences.push,
        inApp: preferences.inApp,
      },
    });

    return NextResponse.json({
      email: updatedPreferences.email as NotificationPreferences['email'],
      push: updatedPreferences.push as NotificationPreferences['push'],
      inApp: updatedPreferences.inApp as NotificationPreferences['inApp'],
    });
  } catch (error) {
    console.error('Failed to update notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}