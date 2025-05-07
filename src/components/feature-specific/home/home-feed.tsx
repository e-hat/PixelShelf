// src/components/feature-specific/home/home-feed.tsx

'use client';

import { TrendingUp, UserCheck } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { PageHeader } from '@/components/layout/page-header';
import { DashboardFeed, TabOption } from '@/components/feature-specific/dashboard-feed';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomeFeed() {
  const { data: session } = useSession();
  
  const homeTabs: TabOption[] = [
    {
      id: 'trending',
      label: 'Trending',
      icon: <TrendingUp className="mr-2 h-4 w-4" />,
    },
    {
      id: 'following',
      label: 'Following',
      icon: <UserCheck className="mr-2 h-4 w-4" />,
      requiredAuth: true,
    },
  ];

  // Empty state component for the Following tab when user isn't following anyone
  const EmptyFollowingState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-muted h-20 w-20 rounded-full flex items-center justify-center mb-4">
        <UserCheck className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">Nothing in your feed yet</h3>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        Follow some creators to see their latest work in your feed.
      </p>
      <Link href="/explore">
        <Button variant="pixel">Discover Creators</Button>
      </Link>
    </div>
  );

  return (
    <div className="container px-4 py-8">
      <PageHeader
        title="Your Feed"
        description="Discover trending assets or see the latest from creators you follow"
      />
      
      <DashboardFeed 
        initialTab={session ? "following" : "trending"} // Start with following tab if logged in
        tabs={homeTabs}
        infiniteScroll={true}
        emptyFollowingComponent={<EmptyFollowingState />}
      />
    </div>
  );
}