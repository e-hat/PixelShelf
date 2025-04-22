'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import SettingsLayout from '@/components/layout/settings-layout';
import { 
  CreditCard, 
  Check, 
  X, 
  Loader2, 
  Globe, 
  Palette, 
  Sparkles, 
  BarChart4, 
  MessageSquare,
  Zap,
  Lock
} from 'lucide-react';
import SubscriptionButton from '@/components/feature-specific/subscription-button';
import { User } from '@/types';

// Mock user data for the MVP
const MOCK_USER: User = {
  id: '1',
  name: 'Alex Johnson',
  email: 'alex@example.com',
  subscriptionTier: 'FREE',
  subscriptionId: null,
  subscriptionStart: null,
  subscriptionEnd: null,
};


export default function SubscriptionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(MOCK_USER);

  const handleSubscribe = async () => {
    setIsLoading(true);
    
    // In a real app, this would redirect to Stripe checkout
    // For the MVP, we'll simulate a successful subscription after a short delay
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Update user state
      setUser({
        ...user,
        subscriptionTier: 'PREMIUM',
        subscriptionId: 'sub_' + Math.random().toString(36).substring(2, 11),
        subscriptionStart: new Date(),
        subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });
      
      toast.success('Subscription activated successfully!');
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to process subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    
    // In a real app, this would cancel the subscription in Stripe
    // For the MVP, we'll simulate a successful cancellation after a short delay
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Update user state but keep premium until the end of the period
      setUser({
        ...user,
        subscriptionId: null,
      });
      
      toast.success('Your subscription will remain active until the end of your billing period, then automatically cancel.');
    } catch (error) {
      console.error('Subscription cancellation error:', error);
      toast.error('Failed to cancel subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="bg-muted p-6 rounded-full">
            <CreditCard className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Sign in to access subscription settings</h1>
          <p className="text-muted-foreground">
            You need to sign in to view and manage your subscription.
          </p>
          <Button variant="pixel" onClick={() => router.push('/login')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const isPremium = user.subscriptionTier === 'PREMIUM';

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription plan and billing settings.
          </p>
        </div>

        {/* Current subscription status */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              You are currently on the {isPremium ? 'Premium' : 'Free'} plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {isPremium ? 'Premium Plan' : 'Free Plan'}
                </p>
                {isPremium && user.subscriptionEnd && (
                  <p className="text-sm text-muted-foreground">
                    Your subscription renews on {new Date(user.subscriptionEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {isPremium ? (
                  <div className="flex items-center bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 py-1 px-3 rounded-full text-sm font-medium">
                    <Check className="h-4 w-4 mr-1" />
                    Active
                  </div>
                ) : (
                  <div className="flex items-center bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 py-1 px-3 rounded-full text-sm font-medium">
                    Free
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          {isPremium && (
            <CardFooter className="border-t pt-6">
              <Button 
                variant="outline" 
                className="text-destructive hover:bg-destructive/10"
                onClick={handleCancelSubscription}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Cancel subscription'
                )}
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Compare plans */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Compare Plans</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>
                  Basic access to PixelShelf
                </CardDescription>
                <div className="mt-4">
                  <p className="text-3xl font-bold">$0</p>
                  <p className="text-sm text-muted-foreground">Forever free</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-500 mt-1" />
                    <p>Build your portfolio with unlimited assets</p>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-500 mt-1" />
                    <p>Create up to 3 projects</p>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-500 mt-1" />
                    <p>Follow other creators</p>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-500 mt-1" />
                    <p>Basic analytics</p>
                  </div>
                  <div className="flex items-start">
                    <X className="h-4 w-4 mr-2 text-gray-300 mt-1" />
                    <p className="text-muted-foreground">Public portfolio link</p>
                  </div>
                  <div className="flex items-start">
                    <X className="h-4 w-4 mr-2 text-gray-300 mt-1" />
                    <p className="text-muted-foreground">Custom domain</p>
                  </div>
                  <div className="flex items-start">
                    <X className="h-4 w-4 mr-2 text-gray-300 mt-1" />
                    <p className="text-muted-foreground">Advanced portfolio customization</p>
                  </div>
                  <div className="flex items-start">
                    <X className="h-4 w-4 mr-2 text-gray-300 mt-1" />
                    <p className="text-muted-foreground">Advanced analytics</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                {!isPremium ? (
                  <Button disabled className="w-full" variant="outline">
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={handleCancelSubscription}
                    disabled={isLoading}
                  >
                    Downgrade
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* Premium Plan */}
            <Card className={isPremium ? 'border-pixelshelf-primary' : ''}>
              <div className="absolute top-0 right-0 p-1">
                {isPremium && (
                  <div className="bg-pixelshelf-primary text-white text-xs px-2 py-1 rounded-bl-md rounded-tr-md">
                    Current
                  </div>
                )}
              </div>
              <CardHeader>
                <div className="flex items-center">
                  <CardTitle>Premium</CardTitle>
                  <Sparkles className="h-5 w-5 ml-2 text-pixelshelf-primary" />
                </div>
                <CardDescription>
                  Professional features for serious game developers
                </CardDescription>
                <div className="mt-4">
                  <p className="text-3xl font-bold">$5</p>
                  <p className="text-sm text-muted-foreground">per month</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-500 mt-1" />
                    <p>
                      <strong>Everything in Free</strong>, plus:
                    </p>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-500 mt-1" />
                    <div>
                      <p><strong>Public portfolio link</strong></p>
                      <p className="text-sm text-muted-foreground">Share your work with the world</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-500 mt-1" />
                    <p>Unlimited projects</p>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-500 mt-1" />
                    <div>
                      <p><strong>Advanced portfolio customization</strong></p>
                      <p className="text-sm text-muted-foreground">Custom themes and layouts</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-500 mt-1" />
                    <p>Custom domain support</p>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-500 mt-1" />
                    <p>Priority customer support</p>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-500 mt-1" />
                    <p>Advanced analytics and insights</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                {isPremium ? (
                  <SubscriptionButton
                    actionType="portal"
                    className="w-full"
                    variant="outline"
                  >
                    Manage Subscription
                  </SubscriptionButton>
                ) : (
                  <SubscriptionButton
                    actionType="checkout"
                    className="w-full"
                    variant="pixel"
                  >
                    Upgrade to Premium
                  </SubscriptionButton>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Premium features */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Premium Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center space-x-2">
                <div className="bg-pixelshelf-light p-2 rounded-full">
                  <Globe className="h-5 w-5 text-pixelshelf-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Public Portfolio</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Share your work with a dedicated portfolio page perfect for job applications and networking.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center space-x-2">
                <div className="bg-pixelshelf-light p-2 rounded-full">
                  <Palette className="h-5 w-5 text-pixelshelf-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Advanced Customization</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Customize your portfolio with themes, layouts, and branding options to stand out.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center space-x-2">
                <div className="bg-pixelshelf-light p-2 rounded-full">
                  <BarChart4 className="h-5 w-5 text-pixelshelf-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Advanced Analytics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get detailed insights on who's viewing your work, which assets perform best, and more.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center space-x-2">
                <div className="bg-pixelshelf-light p-2 rounded-full">
                  <MessageSquare className="h-5 w-5 text-pixelshelf-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Priority Support</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get faster responses and dedicated assistance from our support team.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center space-x-2">
                <div className="bg-pixelshelf-light p-2 rounded-full">
                  <Zap className="h-5 w-5 text-pixelshelf-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Unlimited Projects</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create as many projects as you need with no restrictions on portfolio organization.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center space-x-2">
                <div className="bg-pixelshelf-light p-2 rounded-full">
                  <Lock className="h-5 w-5 text-pixelshelf-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Private Collections</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create private asset collections to share securely with select clients or teams.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}