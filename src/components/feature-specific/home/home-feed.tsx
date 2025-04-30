// src/components/feature-specific/home/home-feed.tsx

'use client';

import { PageHeader } from '@/components/layout/page-header';
import { DashboardFeed } from '@/components/feature-specific/dashboard-feed';

export default function HomeFeed() {
  return (
    <div className="container px-4 py-8">
      <PageHeader
        title="Your Feed"
        description="Discover trending assets or see the latest from creators you follow"
      />
      <DashboardFeed initialTab="trending" />
    </div>
  );
}