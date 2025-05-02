'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import AssetCard from '@/components/feature-specific/asset-card';
import { Skeleton } from '@/components/ui/skeleton-loader';
import {
  Loader2,
  RefreshCw,
  TrendingUp,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { useAssetsQuery } from '@/hooks/use-assets-query';
import { PAGINATION } from '@/constants';
import { Asset } from '@/types';
import { cn } from '@/lib/utils';

interface DashboardFeedProps {
  initialTab?: 'trending' | 'following';
  className?: string;
}

export function DashboardFeed({
  initialTab = 'trending',
  className,
}: DashboardFeedProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'trending' | 'following'>(initialTab);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Trending feed (infinite)
  const {
    assets: trendingAssets,
    isLoading: isTrendingLoading,
    error: trendingError,
    hasMore: trendingHasMore,
    isLoadingMore: isTrendingLoadingMore,
    loadMore: loadMoreTrending,
    refetch: reloadTrending,
  } = useAssetsQuery({
    sort: 'popular',
    limit: PAGINATION.DEFAULT_LIMIT,
  });

  // Following feed (infinite, only after sign-in)
  const {
    assets: followingAssets,
    isLoading: isFollowingLoading,
    error: followingError,
    hasMore: followingHasMore,
    isLoadingMore: isFollowingLoadingMore,
    loadMore: loadMoreFollowing,
    refetch: reloadFollowing,
  } = useAssetsQuery({
    sort: 'latest',
    limit: PAGINATION.DEFAULT_LIMIT,
    enabled: !!session,
  });

  // Tab switch handler
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as 'trending' | 'following');
  };

  // Pull-to-refresh
  const refreshFeed = async () => {
    setIsRefreshing(true);
    try {
      if (activeTab === 'trending') {
        await reloadTrending();
      } else {
        await reloadFollowing();
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Load more pages
  const loadMore = () => {
    if (activeTab === 'trending') {
      loadMoreTrending();
    } else {
      loadMoreFollowing();
    }
  };

  // Choose the right data for the active tab
  const currentAssets = activeTab === 'trending' ? trendingAssets : followingAssets;
  const isLoading = activeTab === 'trending' ? isTrendingLoading : isFollowingLoading;
  const error = activeTab === 'trending' ? trendingError : followingError;
  const hasMore = activeTab === 'trending' ? trendingHasMore : followingHasMore;
  const isLoadingMore =
    activeTab === 'trending' ? isTrendingLoadingMore : isFollowingLoadingMore;

  // Simulate “following” filter client-side (MVP)
  const filteredFollowingAssets = followingAssets.slice(0, 3);

  return (
    <div className={cn('space-y-6', className)}>
      <Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="trending" className="flex items-center">
              <TrendingUp className="mr-2 h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className="flex items-center"
              disabled={!session}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Following
            </TabsTrigger>
          </TabsList>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshFeed}
            disabled={isLoading || isRefreshing}
          >
            <RefreshCw
              className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')}
            />
            Refresh
          </Button>
        </div>

        {/* Trending Tab Content */}
        <TabsContent value="trending" className="space-y-6 mt-6">
          {isTrendingLoading ? (
            <LoadingState />
          ) : trendingError ? (
            <ErrorState error={trendingError.message} onRetry={reloadTrending} />
          ) : trendingAssets.length === 0 ? (
            <EmptyState message="No trending assets found." />
          ) : (
            <AssetGrid
              assets={trendingAssets}
              hasMore={trendingHasMore}
              isLoadingMore={isTrendingLoadingMore}
              onLoadMore={loadMore}
            />
          )}
        </TabsContent>

        {/* Following Tab Content */}
        <TabsContent value="following" className="space-y-6 mt-6">
          {!session ? (
            <SignInPrompt />
          ) : isFollowingLoading ? (
            <LoadingState />
          ) : followingError ? (
            <ErrorState error={followingError.message} onRetry={reloadFollowing} />
          ) : filteredFollowingAssets.length === 0 ? (
            <EmptyFollowingState />
          ) : (
            <AssetGrid
              assets={filteredFollowingAssets}
              hasMore={followingHasMore}
              isLoadingMore={isFollowingLoadingMore}
              onLoadMore={loadMore}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Loading state component
function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-lg border bg-card overflow-hidden">
          <Skeleton className="aspect-game-card w-full" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <div className="flex items-center pt-2">
              <Skeleton className="h-8 w-8 rounded-full mr-2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Error state component
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h3 className="text-lg font-semibold mb-2">Failed to load assets</h3>
      <p className="text-muted-foreground mb-6">{error}</p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}

// Empty state component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
        <TrendingUp className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No assets found</h3>
      <p className="text-muted-foreground mb-6">{message}</p>
      <Link href="/explore">
        <Button variant="pixel">Explore Assets</Button>
      </Link>
    </div>
  );
}

// Empty following state component
function EmptyFollowingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
        <UserCheck className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No assets from creators you follow</h3>
      <p className="text-muted-foreground mb-6">
        Follow some creators to see their work in your feed
      </p>
      <Link href="/explore">
        <Button variant="pixel">Discover Creators</Button>
      </Link>
    </div>
  );
}

// Sign in prompt component
function SignInPrompt() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/30">
      <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
        <UserCheck className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Sign in to see your feed</h3>
      <p className="text-muted-foreground mb-6">
        Follow creators and see their latest work in your feed
      </p>
      <div className="flex gap-4">
        <Link href="/login">
          <Button variant="outline">Sign In</Button>
        </Link>
        <Link href="/signup">
          <Button variant="pixel">Create Account</Button>
        </Link>
      </div>
    </div>
  );
}

// Asset grid component
function AssetGrid({ 
  assets, 
  hasMore, 
  isLoadingMore, 
  onLoadMore 
}: { 
  assets: Asset[]; 
  hasMore: boolean; 
  isLoadingMore: boolean; 
  onLoadMore: () => void; 
}) {
  return (
    <>
      <div className="grid-masonry">
        {assets.map((asset) => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </div>
      
      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </>
  );
}