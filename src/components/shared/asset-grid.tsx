'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import AssetCard from '@/components/feature-specific/asset-card';
import { Skeleton } from '@/components/ui/skeleton-loader';
import { Loader2, GridIcon, LayoutList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Asset } from '@/types';
import { useAppStore } from '@/store';

// Dynamic import for Masonry component to avoid SSR issues
const ResponsiveMasonry = dynamic(
  () => import('react-responsive-masonry').then((mod) => mod.default),
  { ssr: false }
);

const Masonry = dynamic(
  () => import('react-responsive-masonry').then((mod) => mod.Masonry),
  { ssr: false }
);

interface AssetGridProps {
  assets: Asset[];
  isLoading?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  emptyMessage?: string;
  allowViewToggle?: boolean;
  className?: string;
}

export function AssetGrid({
  assets,
  isLoading = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  emptyMessage = 'No assets found',
  allowViewToggle = true,
  className,
}: AssetGridProps) {
  // Get view mode from store for persistence
  const preferences = useAppStore((state) => state.preferences);
  const updatePreferences = useAppStore((state) => state.updatePreferences);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(preferences.gridViewMode);

  // Update local state when store changes
  useEffect(() => {
    setViewMode(preferences.gridViewMode);
  }, [preferences.gridViewMode]);

  // Handle view mode toggle
  const toggleViewMode = () => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newMode);
    updatePreferences({ gridViewMode: newMode });
  };

  // Column settings for masonry layout based on screen size
  const columnCountBreakpoints = {
    350: 1,
    750: 2,
    1100: 3,
    1400: 4,
  };

  // Empty state checker
  const isEmpty = !isLoading && assets.length === 0;

  if (isLoading) {
    return <LoadingGrid viewMode={viewMode} />;
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground mb-4">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* View toggle */}
      {allowViewToggle && (
        <div className="flex justify-end">
          <div className="flex rounded-md overflow-hidden border">
            <button
              onClick={() => toggleViewMode()}
              className={`p-2 ${viewMode === 'grid' ? 'bg-muted' : 'bg-background'}`}
              title="Grid view"
            >
              <GridIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => toggleViewMode()}
              className={`p-2 ${viewMode === 'list' ? 'bg-muted' : 'bg-background'}`}
              title="List view"
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Asset grid */}
      {viewMode === 'grid' ? (
        <ResponsiveMasonry columnsCountBreakPoints={columnCountBreakpoints} gutter="16px">
          <Masonry>
            {assets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} variant="vertical" />
            ))}
          </Masonry>
        </ResponsiveMasonry>
      ) : (
        <div className="space-y-4">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} variant="horizontal" />
          ))}
        </div>
      )}

      {/* Load more button */}
      {hasMore && onLoadMore && (
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
    </div>
  );
}

function LoadingGrid({ viewMode }: { viewMode: 'grid' | 'list' }) {
  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className={cn(
          "rounded-lg border bg-card overflow-hidden",
          viewMode === 'list' && "flex"
        )}>
          <Skeleton className={cn(
            viewMode === 'grid' ? "aspect-game-card w-full" : "w-64 h-36"
          )} />
          <div className="p-4 space-y-3 flex-1">
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