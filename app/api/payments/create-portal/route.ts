import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';
import { createPortalSession } from '@/lib/payments/stripe';

// POST /api/payments/create-portal - Create a Stripe customer portal session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the origin for return URL
    const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL;
    
    // Get the user's subscription from our database
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });
    
    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }
    
    // Create a portal session
    const portalSession = await createPortalSession({
      customerId: subscription.stripeCustomerId,
      returnUrl: origin!,
    });
    
    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}