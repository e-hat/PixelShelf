'use client';

import { useSession } from 'next-auth/react';
import LandingPage from '@/components/feature-specific/home/landing-page';
import HomeFeed from '@/components/feature-specific/home/home-feed';
import { DashboardFeed } from '@/components/feature-specific/dashboard-feed';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function Page() {
  const { data: session } = useSession();

  if (session) {
    // Authenticated user - show home feed
    return <HomeFeed />;
  } else {
    // Non-authenticated user - show landing page with trending section
    return (
      <>
         <LandingPage />
          <div className="container px-4 pb-8">
            <DashboardFeed initialTab="trending" />
            
            <div className="flex justify-center mt-8">
              <Link href="/explore">
                <Button variant="outline" size="lg">
                  Explore More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
      </>
    );
  }
}