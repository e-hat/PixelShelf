// app/api/comments/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';

// Schema for validating PATCH request bodies
const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(500, 'Comment must be less than 500 characters'),
});

type RouteParams = { id: string };
type Props = {
  params: Promise<RouteParams>;
};

// PATCH /api/comments/[id] — Update a comment
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

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }
    if (comment.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this comment' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = updateCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { content: parsed.data.content },
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

    return NextResponse.json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[id] — Delete a comment
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

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        asset: {
          select: { userId: true },
        },
      },
    });
    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }
    if (
      comment.userId !== session.user.id &&
      comment.asset.userId !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this comment' },
        { status: 403 }
      );
    }

    await prisma.comment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
