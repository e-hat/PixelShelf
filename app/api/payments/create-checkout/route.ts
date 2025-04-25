import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';
import { 
  stripe, 
  createCheckoutSession, 
  createCustomer, 
  PREMIUM_PRICE_ID 
} from '@/lib/payments/stripe';

// POST /api/payments/create-checkout - Create a Stripe checkout session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the origin for return URLs
    const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL;
    
    // Check if user already has a subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });
    
    let stripeCustomerId = existingSubscription?.stripeCustomerId;
    
    // If no existing customer, create one
    if (!stripeCustomerId) {
      const customer = await createCustomer({
        email: session.user.email!,
        name: session.user.name!,
        userId: session.user.id,
      });
      
      stripeCustomerId = customer.id;
      
      // Create or update subscription record in our database
      await prisma.subscription.upsert({
        where: { userId: session.user.id },
        update: { stripeCustomerId: customer.id },
        create: {
          userId: session.user.id,
          stripeCustomerId: customer.id,
        },
      });
    }
    
    // Create a checkout session
    const checkoutSession = await createCheckoutSession({
      userId: session.user.id,
      email: session.user.email!,
      priceId: PREMIUM_PRICE_ID,
      returnUrl: origin!,
    });
    
    if (!checkoutSession.url) {
      throw new Error('Failed to create checkout session');
    }
    
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}