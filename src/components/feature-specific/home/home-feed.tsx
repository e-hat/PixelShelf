// src/components/feature-specific/home/home-feed.tsx

'use client';

import { TrendingUp, UserCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { DashboardFeed, TabOption } from '@/components/feature-specific/dashboard-feed';

export default function HomeFeed() {
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

  return (
    <div className="container px-4 py-8">
      <PageHeader
        title="Your Feed"
        description="Discover trending assets or see the latest from creators you follow"
      />
      <DashboardFeed 
        initialTab="trending" 
        tabs={homeTabs}
        infiniteScroll={true}
      />
    </div>
  );
}