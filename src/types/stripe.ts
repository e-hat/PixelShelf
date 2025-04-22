/**
 * Type for a Stripe Subscription with expanded `items.data.price` and `current_period_end`.
 * Needed because Stripe's latest API typings (2023-10-16 and later) remove these fields by default.
 */


import Stripe from 'stripe';

export type ExpandedSubscription = Stripe.Subscription & {
  current_period_end: number;
  items: {
    data: {
      price: {
        id: string;
      };
    }[];
  };
};

export type InvoiceWithSubscription = Stripe.Invoice & {
  subscription: string;
};