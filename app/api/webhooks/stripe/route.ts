import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/payments/stripe';
import prisma from '@/lib/db/prisma';
import Stripe from 'stripe';
import { ExpandedSubscription, InvoiceWithSubscription } from '@/types/stripe';

// POST /api/webhooks/stripe - Handle Stripe webhook events
export async function POST(req: NextRequest) {
  const body = await req.text();
  const headerList = await headers();
  const signature = headerList.get('stripe-signature') as string;

  
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing Stripe signature' },
      { status: 400 }
    );
  }
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }
  
  try {
    // Handle the event based on its type
    switch (event.type) {
      case 'checkout.session.completed': {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const userId = checkoutSession.client_reference_id;
        const subscriptionId = checkoutSession.subscription as string;
        
        if (userId && subscriptionId) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ['items.data.price'],
          }) as unknown as ExpandedSubscription;

          const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
          
          // Update our database
          await prisma.subscription.upsert({
            where: { userId },
            update: { 
              stripeSubscriptionId: subscriptionId,
              stripePriceId: subscription.items.data[0].price.id,
              stripeCurrentPeriodEnd: currentPeriodEnd,
            },
            create: {
              userId,
              stripeCustomerId: checkoutSession.customer as string,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: subscription.items.data[0].price.id,
              stripeCurrentPeriodEnd: currentPeriodEnd,
            },
          });
          
          // Update user subscription tier
          await prisma.user.update({
            where: { id: userId },
            data: { 
              subscriptionTier: 'PREMIUM',
              subscriptionStart: new Date(),
              subscriptionEnd: currentPeriodEnd,
            },
          });
          
          // Create a notification for the user
          await prisma.notification.create({
            data: {
              type: 'SYSTEM',
              content: 'Your PixelShelf Premium subscription is now active!',
              linkUrl: '/settings/subscription',
              receiverId: userId,
            },
          });
        }
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as InvoiceWithSubscription;
        const subscriptionId = invoice.subscription;
        const customerId = invoice.customer as string;
        
        if (subscriptionId && customerId) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ['items.data.price'],
          }) as unknown as ExpandedSubscription;
          
          
          // Find the user by stripe customer ID
          const userSubscription = await prisma.subscription.findFirst({
            where: { stripeCustomerId: customerId },
          });
          
          if (userSubscription) {
            // Update subscription data
            await prisma.subscription.update({
              where: { userId: userSubscription.userId },
              data: { 
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
              },
            });
            
            // Update user subscription end date
            await prisma.user.update({
              where: { id: userSubscription.userId },
              data: { 
                subscriptionEnd: new Date(subscription.current_period_end * 1000),
              },
            });
          }
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const rawSubscription = event.data.object as Stripe.Subscription;
        const subscription = rawSubscription as ExpandedSubscription;
        const customerId = subscription.customer as string;
        
        // Find the user by stripe customer ID
        const userSubscription = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        });
        
        if (userSubscription) {
          // Update subscription status
          await prisma.subscription.update({
            where: { userId: userSubscription.userId },
            data: { 
              stripePriceId: subscription.items.data[0].price.id,
              stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          });
          
          // Update user subscription end date
          await prisma.user.update({
            where: { id: userSubscription.userId },
            data: { 
              subscriptionEnd: new Date(subscription.current_period_end * 1000),
            },
          });
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Find the user by stripe customer ID
        const userSubscription = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        });
        
        if (userSubscription) {
          // Update subscription status
          await prisma.subscription.update({
            where: { userId: userSubscription.userId },
            data: { 
              stripeSubscriptionId: null,
              stripePriceId: null,
              stripeCurrentPeriodEnd: null,
            },
          });
          
          // Downgrade user to free tier after the current period ends
          if (subscription.cancel_at_period_end) {
            // Subscription will end at current period end
            await prisma.user.update({
              where: { id: userSubscription.userId },
              data: { 
                subscriptionTier: 'FREE',
                subscriptionEnd: null,
              },
            });
            
            // Create a notification for the user
            await prisma.notification.create({
              data: {
                type: 'SYSTEM',
                content: 'Your PixelShelf Premium subscription has ended. You have been downgraded to the free plan.',
                linkUrl: '/settings/subscription',
                receiverId: userSubscription.userId,
              },
            });
          }
        }
        break;
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook event:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}