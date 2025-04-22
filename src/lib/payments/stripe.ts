import { ExpandedSubscription } from '@/types/stripe';
import Stripe from 'stripe';

// Initialize Stripe with the secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil', // Use the latest stable API version
  appInfo: {
    name: 'PixelShelf',
    version: '1.0.0',
  },
});

// Premium subscription price ID
export const PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID;

// Create a Stripe checkout session
export async function createCheckoutSession({
  userId,
  email,
  priceId = PREMIUM_PRICE_ID,
  returnUrl,
}: {
  userId: string;
  email: string;
  priceId?: string;
  returnUrl: string;
}) {
  if (!priceId) {
    throw new Error('Price ID is required');
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer_email: email,
    client_reference_id: userId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    allow_promotion_codes: true,
    subscription_data: {
      metadata: {
        userId,
      },
    },
    success_url: `${returnUrl}/settings/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${returnUrl}/settings/subscription?canceled=true`,
  });

  return checkoutSession;
}

// Create a Stripe portal session for managing subscriptions
export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${returnUrl}/settings/subscription`,
  });

  return portalSession;
}

// Check if a subscription is active and valid
export function isSubscriptionActive(subscription: ExpandedSubscription): boolean {
  return (
    subscription.status === 'active' &&
    subscription.current_period_end * 1000 > Date.now()
  );
}

// Get subscription data for a customer
export async function getSubscriptionForCustomer(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    expand: ['data.default_payment_method'],
  });

  return subscriptions.data[0];
}

// Create a new customer in Stripe
export async function createCustomer({
  email,
  name,
  userId,
}: {
  email: string;
  name?: string;
  userId: string;
}) {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
    },
  });

  return customer;
}

// Cancel a subscription
export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId);
}