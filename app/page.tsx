'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check } from 'lucide-react';
import { DashboardFeed } from '@/components/feature-specific/dashboard-feed';
import { PageHeader } from '@/components/layout/page-header';
import { SUBSCRIPTION_PLANS } from '@/constants';

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero section for non-logged in users */}
      {!session && (
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-pixelshelf-light via-background to-pixelshelf-light">
          <div className="container px-4 md:px-6 flex flex-col items-center text-center space-y-8">
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Your Game Dev Portfolio, <span className="text-pixelshelf-primary">Leveled Up</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-[85%] mx-auto">
                PixelShelf is where game developers build beautiful portfolios, share their work, and connect with the community.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button variant="pixel" size="lg" className="font-semibold">
                  Create Your Portfolio
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="outline" size="lg">
                  Explore Portfolios
                </Button>
              </Link>
            </div>
            
            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="flex flex-col items-center space-y-3 p-6 bg-background rounded-lg shadow-sm border">
                <div className="p-3 bg-pixelshelf-light rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pixelshelf-primary h-6 w-6">
                    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2zM10 4v4"></path>
                    <rect width="4" height="4" x="4" y="4" rx="1"></rect>
                    <rect width="4" height="4" x="4" y="12" rx="1"></rect>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Create Your Profile</h3>
                <p className="text-muted-foreground text-center">Upload your best work, write your bio, and link your socials.</p>
              </div>
              <div className="flex flex-col items-center space-y-3 p-6 bg-background rounded-lg shadow-sm border">
                <div className="p-3 bg-pixelshelf-light rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pixelshelf-primary h-6 w-6">
                    <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                    <path d="M3 9h18"></path>
                    <path d="M9 21V9"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Organize Projects</h3>
                <p className="text-muted-foreground text-center">Group your assets into projects to showcase complete games.</p>
              </div>
              <div className="flex flex-col items-center space-y-3 p-6 bg-background rounded-lg shadow-sm border">
                <div className="p-3 bg-pixelshelf-light rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pixelshelf-primary h-6 w-6">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Connect with Devs</h3>
                <p className="text-muted-foreground text-center">Follow creators, chat directly, and discover new collaborators.</p>
              </div>
            </div>
            
            {/* Pricing section */}
            <div className="mt-24 w-full max-w-5xl">
              <h2 className="text-3xl font-bold mb-12">Simple, Transparent Pricing</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Free tier */}
                <div className="border rounded-lg overflow-hidden bg-card">
                  <div className="p-6 border-b">
                    <h3 className="text-2xl font-bold">{SUBSCRIPTION_PLANS.FREE.name}</h3>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">${SUBSCRIPTION_PLANS.FREE.price}</span>
                      <span className="text-muted-foreground"> / Forever free</span>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <ul className="space-y-2">
                      {SUBSCRIPTION_PLANS.FREE.features.map(feature => (
                        <li key={feature} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {SUBSCRIPTION_PLANS.FREE.limitations && (
                      <ul className="space-y-2 pt-4 border-t">
                        {SUBSCRIPTION_PLANS.FREE.limitations.map(limitation => (
                          <li key={limitation} className="flex items-start text-muted-foreground">
                            <span className="mr-2">•</span>
                            <span>{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  <div className="p-6 bg-muted/30">
                    <Link href="/signup">
                      <Button className="w-full" variant="outline">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </div>
                
                {/* Premium tier */}
                <div className="border-2 border-pixelshelf-primary rounded-lg overflow-hidden bg-card relative">
                  <div className="absolute top-0 right-0">
                    <div className="bg-pixelshelf-primary text-white text-xs px-3 py-1 rounded-bl-md">
                      RECOMMENDED
                    </div>
                  </div>
                  
                  <div className="p-6 border-b">
                    <h3 className="text-2xl font-bold flex items-center">
                      {SUBSCRIPTION_PLANS.PREMIUM.name}
                    </h3>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">${SUBSCRIPTION_PLANS.PREMIUM.price}</span>
                      <span className="text-muted-foreground"> / monthly</span>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <ul className="space-y-3">
                      {SUBSCRIPTION_PLANS.PREMIUM.features.map(feature => (
                        <li key={feature} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="p-6 bg-muted/30">
                    <Link href="/signup">
                      <Button className="w-full" variant="pixel">
                        Upgrade to Premium
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main content */}
      <div className="container px-4 py-8">
        {session ? (
          <>
            <PageHeader
              title="Your Feed"
              description="Discover trending assets or see the latest from creators you follow"
            />
            <DashboardFeed initialTab="trending" />
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold mb-8">Trending Now</h2>
            <DashboardFeed initialTab="trending" />
            
            <div className="flex justify-center mt-8">
              <Link href="/explore">
                <Button variant="outline" size="lg">
                  Explore More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}