'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Loader2, CreditCard, ExternalLink } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';

interface SubscriptionButtonProps extends Omit<ButtonProps, 'type'> {
  actionType: 'checkout' | 'portal';
  children: React.ReactNode;
}

export default function SubscriptionButton({ 
  actionType, 
  children, 
  variant = 'pixel',
  size,
  className,
  ...props 
}: SubscriptionButtonProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscriptionAction = async () => {
    if (!session) {
      toast.error('You must be signed in to manage subscriptions');
      return;
    }

    setIsLoading(true);

    try {
      // Call the appropriate API endpoint based on button type
      const endpoint = actionType === 'checkout' 
        ? '/api/payments/create-checkout' 
        : '/api/payments/create-portal';
      
      const response = await fetch(endpoint, { method: 'POST' });
      
      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      
      const { url } = await response.json();
      
      // Redirect to Stripe
      window.location.href = url;
    } catch (error) {
      console.error('Subscription action error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSubscriptionAction}
      variant={variant}
      size={size}
      className={className}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          {actionType === 'checkout' ? (
            <CreditCard className="mr-2 h-4 w-4" />
          ) : (
            <ExternalLink className="mr-2 h-4 w-4" />
          )}
          {children}
        </>
      )}
    </Button>
  );
}