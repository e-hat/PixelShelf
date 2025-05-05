'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
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
  Grid as GridIcon,
  LayoutList,
  Users,
} from 'lucide-react';
import { useAssetsQuery } from '@/hooks/use-assets-query';
import { PAGINATION } from '@/constants';
import { Asset, UserProfile } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export type TabOption = {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  requiredAuth?: boolean;
};

interface DashboardFeedProps {
  initialTab?: string;
  className?: string;
  tabs?: TabOption[];
  title?: string;
  description?: string;
}

const DEFAULT_TABS: TabOption[] = [
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

export function DashboardFeed({
  initialTab = 'trending',
  className,
  tabs = DEFAULT_TABS,
  title,
  description,
}: DashboardFeedProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  // Assets feed (for explore page)
  const {
    assets: assetsData,
    isLoading: isAssetsLoading,
    error: assetsError,
    hasMore: assetsHasMore,
    isLoadingMore: isAssetsLoadingMore,
    loadMore: loadMoreAssets,
    refetch: reloadAssets,
  } = useAssetsQuery({
    sort: 'latest',
    limit: PAGINATION.DEFAULT_LIMIT,
  });

  // Mock creators data for MVP
  // In a real implementation, this would fetch from the API
  const creatorsData = [
    {
      id: '1',
      name: 'Sarah Johnson',
      username: 'pixelartist',
      image: '/placeholders/user1.jpg',
      bio: 'Pixel artist specializing in retro game assets and animations',
      stats: {
        followers: 345,
        following: 120,
        assets: 48,
        projects: 12,
      },
    },
    {
      id: '2',
      name: 'David Chen',
      username: 'lowpolydave',
      image: '/placeholders/user2.jpg',
      bio: '3D modeler creating low-poly assets for indie games',
      stats: {
        followers: 521,
        following: 89,
        assets: 64,
        projects: 8,
      },
    },
    {
      id: '3',
      name: 'Maya Rodriguez',
      username: 'soundscape',
      image: '/placeholders/user3.jpg',
      bio: 'Game audio designer and composer with focus on atmospheric soundscapes',
      stats: {
        followers: 267,
        following: 142,
        assets: 36,
        projects: 5,
      },
    },
  ] as UserProfile[];
  
  const isCreatorsLoading = false;
  const creatorsError = null;
  const creatorsHasMore = false;
  const isCreatorsLoadingMore = false;
  const loadMoreCreators = () => {};
  const reloadCreators = () => {};

  // Tab switch handler
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Pull-to-refresh
  const refreshFeed = async () => {
    setIsRefreshing(true);
    try {
      switch (activeTab) {
        case 'trending':
          await reloadTrending();
          break;
        case 'following':
          await reloadFollowing();
          break;
        case 'assets':
          await reloadAssets();
          break;
        case 'creators':
          await reloadCreators();
          break;
        default:
          await reloadTrending();
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Get the right data for the active tab
  const getTabData = () => {
    switch (activeTab) {
      case 'trending':
        return {
          data: trendingAssets,
          isLoading: isTrendingLoading,
          error: trendingError,
          hasMore: trendingHasMore,
          isLoadingMore: isTrendingLoadingMore,
          loadMore: loadMoreTrending,
          reload: reloadTrending,
        };
      case 'following':
        return {
          data: followingAssets,
          isLoading: isFollowingLoading,
          error: followingError,
          hasMore: followingHasMore,
          isLoadingMore: isFollowingLoadingMore,
          loadMore: loadMoreFollowing,
          reload: reloadFollowing,
        };
      case 'assets':
        return {
          data: assetsData,
          isLoading: isAssetsLoading,
          error: assetsError,
          hasMore: assetsHasMore,
          isLoadingMore: isAssetsLoadingMore,
          loadMore: loadMoreAssets,
          reload: reloadAssets,
        };
      case 'creators':
        return {
          data: creatorsData,
          isLoading: isCreatorsLoading,
          error: creatorsError,
          hasMore: creatorsHasMore,
          isLoadingMore: isCreatorsLoadingMore,
          loadMore: loadMoreCreators,
          reload: reloadCreators,
        };
      default:
        return {
          data: trendingAssets,
          isLoading: isTrendingLoading,
          error: trendingError,
          hasMore: trendingHasMore,
          isLoadingMore: isTrendingLoadingMore,
          loadMore: loadMoreTrending,
          reload: reloadTrending,
        };
    }
  };

  const { data, isLoading, error, hasMore, isLoadingMore, loadMore } = getTabData();

  // Animation variants for grid items
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: 'easeOut'
      }
    }),
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {title && (
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      
      <Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
        <div className="flex justify-between items-center">
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center"
                disabled={tab.requiredAuth && !session}
              >
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex items-center space-x-2">
            <div className="flex rounded-md overflow-hidden border">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${
                  viewMode === "grid" ? "bg-muted" : "bg-background"
                }`}
                title="Grid view"
              >
                <GridIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${
                  viewMode === "list" ? "bg-muted" : "bg-background"
                }`}
                title="List view"
              >
                <LayoutList className="h-4 w-4" />
              </button>
            </div>
            
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
        </div>

        {/* Dynamic Tab Contents */}
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-6 mt-6">
            {/* Following tab when not logged in */}
            {tab.id === 'following' && !session ? (
              <SignInPrompt />
            ) : tab.id === 'creators' ? (
              /* Creators Tab Content */
              isCreatorsLoading ? (
                <LoadingState type="creator" />
              ) : creatorsError ? (
                <ErrorState error={creatorsError || "Failed to load creators"} onRetry={reloadCreators} />
              ) : creatorsData.length === 0 ? (
                <EmptyState message="No creators found." />
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  {creatorsData.map((creator, index) => (
                    <motion.div
                      key={creator.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      custom={index % 10}
                    >
                      <CreatorCard creator={creator} variant={viewMode} />
                    </motion.div>
                  ))}
                </div>
              )
            ) : (
              /* Asset Tabs Content (Trending, Following, Assets) */
              isLoading ? (
                <LoadingState type="asset" />
              ) : error ? (
                <ErrorState error={error.message || "Failed to load assets"} onRetry={refreshFeed} />
              ) : data.length === 0 ? (
                tab.id === 'following' ? (
                  <EmptyFollowingState />
                ) : (
                  <EmptyState message={`No ${tab.label.toLowerCase()} found.`} />
                )
              ) : (
                <>
                  {/* Asset Grid or List */}
                  <div className={viewMode === 'grid' ? 'grid-masonry' : 'space-y-4'}>
                    {data.map((asset: Asset, index: number) => (
                      <motion.div
                        key={asset.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        custom={index % 10}
                      >
                        <AssetCard 
                          key={asset.id} 
                          asset={asset} 
                          variant={viewMode === 'list' ? 'horizontal' : 'vertical'} 
                        />
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Load More Button */}
                  {hasMore && (
                    <div className="flex justify-center mt-8">
                      <Button
                        variant="outline"
                        onClick={loadMore}
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
              )
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// Creator Card Component
function CreatorCard({ creator, variant = 'grid' }: { creator: UserProfile, variant: 'grid' | 'list' }) {
  if (variant === 'grid') {
    return (
      <Link 
        href={`/u/${creator.username}`}
        className="block border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
      >
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 relative h-24 w-24 rounded-full overflow-hidden bg-muted">
            {creator.image ? (
              <Image 
                src={creator.image} 
                alt={creator.name || ''} 
                fill 
                className="object-cover"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFfwJnQMuRpQAAAABJRU5ErkJggg=="
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
              />
            ) : (
              <Users className="h-24 w-24 p-6 text-muted-foreground" />
            )}
          </div>
          <h3 className="font-medium text-lg mb-1">{creator.name || creator.username}</h3>
          <p className="text-sm text-muted-foreground mb-3">@{creator.username}</p>
          <p className="text-sm mb-4 line-clamp-2">{creator.bio || 'No bio provided.'}</p>
          <div className="flex justify-center space-x-4 text-sm text-muted-foreground">
            <span>{creator.stats?.followers || 0} followers</span>
            <span>{creator.stats?.assets || 0} assets</span>
          </div>
        </div>
      </Link>
    );
  } else {
    return (
      <Link 
        href={`/u/${creator.username}`}
        className="flex items-center p-4 border rounded-lg hover:shadow-md transition-shadow"
      >
        <div className="flex-shrink-0 mr-4 relative h-16 w-16 rounded-full overflow-hidden bg-muted">
          {creator.image ? (
            <Image 
              src={creator.image} 
              alt={creator.name || ''} 
              fill 
              className="object-cover"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFfwJnQMuRpQAAAABJRU5ErkJggg=="
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <Users className="h-16 w-16 p-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium mb-1">{creator.name || creator.username}</h3>
          <p className="text-sm text-muted-foreground mb-1">@{creator.username}</p>
          <p className="text-sm text-muted-foreground line-clamp-1">{creator.bio || 'No bio provided.'}</p>
        </div>
        <div className="flex-shrink-0 ml-4 text-sm text-muted-foreground">
          <div>{creator.stats?.followers || 0} followers</div>
          <div>{creator.stats?.assets || 0} assets</div>
        </div>
      </Link>
    );
  }
}

// Loading state component
function LoadingState({ type = 'asset' }: { type?: 'asset' | 'creator' }) {
  if (type === 'creator') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-lg border bg-card overflow-hidden p-6">
            <div className="flex flex-col items-center">
              <Skeleton className="h-24 w-24 rounded-full mb-4" />
              <Skeleton className="h-5 w-1/2 mb-2" />
              <Skeleton className="h-4 w-1/3 mb-3" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <div className="flex space-x-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

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
      <h3 className="text-lg font-semibold mb-2">Failed to load content</h3>
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
      <h3 className="text-lg font-semibold mb-2">No content found</h3>
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