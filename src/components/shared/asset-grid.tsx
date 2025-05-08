// src/components/shared/asset-grid.tsx
'use client';

import { useState, useEffect, useMemo, RefObject, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Masonry from 'react-responsive-masonry';
import { Button } from '@/components/ui/button';
import AssetCard from '@/components/feature-specific/asset-card';
import { Skeleton } from '@/components/ui/skeleton-loader';
import { Loader2, GridIcon, LayoutList, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Asset, AssetViewMode } from '@/types';
import { useAppStore } from '@/store';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ASSET_TYPES } from '@/constants';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

interface AssetGridProps {
  assets: Asset[];
  isLoading?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  emptyMessage?: string;
  allowViewToggle?: boolean;
  allowFiltering?: boolean;
  className?: string;
  onFilterChange?: (filters: AssetGridFilters) => void;
  variant?: AssetViewMode | 'grid' | 'list';
  infiniteScroll?: boolean; // New prop to toggle infinite scrolling
}

export interface AssetGridFilters {
  type?: string | null;
  sort?: 'latest' | 'oldest' | 'popular';
  tags?: string[];
}

export function AssetGrid({
  assets,
  isLoading = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  emptyMessage = 'No assets found',
  allowViewToggle = true,
  allowFiltering = false,
  className,
  onFilterChange,
  variant,
  infiniteScroll = true, // Default to infinite scrolling
}: AssetGridProps) {
  // Get view mode from store for persistence
  const preferences = useAppStore((state) => state.preferences);
  const updatePreferences = useAppStore((state) => state.updatePreferences);
  const [viewMode, setViewMode] = useState<AssetViewMode>(
    variant ? (variant as AssetViewMode) : preferences.gridViewMode
  );
  const [filters, setFilters] = useState<AssetGridFilters>({
    type: null,
    sort: 'latest',
    tags: [],
  });
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Update local state when store or props change
  useEffect(() => {
    if (variant) {
      setViewMode(variant as AssetViewMode);
    } else {
      setViewMode(preferences.gridViewMode);
    }
  }, [preferences.gridViewMode, variant]);

  // Extract available tags from assets
  useEffect(() => {
    if (assets.length > 0) {
      const tags = new Set<string>();
      assets.forEach(asset => {
        asset.tags?.forEach(tag => tags.add(tag));
      });
      setAvailableTags(Array.from(tags).sort());
    }
  }, [assets]);

  // Setup intersection observer for infinite scrolling
  const fetchMoreContent = useCallback(() => {
    if (hasMore && onLoadMore && !isLoadingMore) {
      onLoadMore();
    }
  }, [hasMore, onLoadMore, isLoadingMore]);
  
  const { ref: loadMoreRef } = useIntersectionObserver({
    rootMargin: '500px', // Increase to load content earlier
    enabled: infiniteScroll && !!hasMore,
    onIntersect: fetchMoreContent,
    skip: isLoadingMore,
  });

  // Handle view mode toggle
  const toggleViewMode = () => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newMode);
    updatePreferences({ gridViewMode: newMode });
  };

  // Handle filter change
  const handleFilterChange = (key: keyof AssetGridFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  // Handle tag toggle
  const toggleTag = (tag: string) => {
    const newTags = filters.tags?.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...(filters.tags || []), tag];
    
    handleFilterChange('tags', newTags);
  };

  // Clear all filters
  const clearFilters = () => {
    const newFilters: AssetGridFilters = {
      type: null,
      sort: 'latest',
      tags: [],
    };
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
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

  // Filter indicator - shows how many filters are active
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.type) count++;
    if (filters.sort && filters.sort !== 'latest') count++;
    if (filters.tags && filters.tags.length > 0) count += filters.tags.length;
    return count;
  }, [filters]);

  if (isLoading) {
    return <LoadingGrid viewMode={viewMode} />;
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-muted h-20 w-20 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        </div>
        <p className="text-lg font-medium mb-2">No assets found</p>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">{emptyMessage}</p>
        {activeFilterCount > 0 && (
          <Button variant="outline" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Controls bar */}
      {(allowViewToggle || allowFiltering) && (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
          {/* Filter toggle */}
          {allowFiltering && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters ? "bg-muted" : "", "relative")}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-pixelshelf-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          )}

          {/* View mode toggle */}
          {allowViewToggle && (
            <div className="flex rounded-md overflow-hidden border self-end">
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
          )}
        </div>
      )}

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border rounded-lg p-4 shadow-sm space-y-4">
              <div className="flex flex-wrap gap-4">
                {/* Type filter */}
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">Asset Type</label>
                  <Select
                    value={filters.type || ""}
                    onValueChange={(value: any) => handleFilterChange('type', value || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      {Object.entries(ASSET_TYPES).map(([key, value]) => (
                        <SelectItem key={key} value={value}>
                          {key.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Sort filter */}
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <Select
                    value={filters.sort}
                    onValueChange={(value: string) => handleFilterChange('sort', value as 'latest' | 'oldest' | 'popular')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">Latest</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tags */}
              {availableTags.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Tags</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          "px-3 py-1 rounded-full text-sm transition-colors",
                          filters.tags?.includes(tag)
                            ? "bg-pixelshelf-primary text-white"
                            : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear filters
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected filters display */}
      {activeFilterCount > 0 && (
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.type && (
            <div className="flex items-center bg-pixelshelf-light text-pixelshelf-primary px-3 py-1 rounded-full text-sm">
              {filters.type.replace('_', ' ')}
              <button
                onClick={() => handleFilterChange('type', null)}
                className="ml-1 hover:text-pixelshelf-dark"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {filters.sort && filters.sort !== 'latest' && (
            <div className="flex items-center bg-pixelshelf-light text-pixelshelf-primary px-3 py-1 rounded-full text-sm">
              Sort: {filters.sort}
              <button
                onClick={() => handleFilterChange('sort', 'latest')}
                className="ml-1 hover:text-pixelshelf-dark"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {filters.tags?.map((tag) => (
            <div
              key={tag}
              className="flex items-center bg-pixelshelf-light text-pixelshelf-primary px-3 py-1 rounded-full text-sm"
            >
              #{tag}
              <button
                onClick={() => toggleTag(tag)}
                className="ml-1 hover:text-pixelshelf-dark"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Asset grid */}
      {viewMode === 'grid' ? (
        <Masonry columnsCountBreakPoints={columnCountBreakpoints} gutter="16px">
          {assets.map((asset, index) => (
            <motion.div
              key={asset.id}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              custom={index % 10} // Limit animation delay to 10 items
            >
              <AssetCard asset={asset} variant="vertical" />
            </motion.div>
          ))}
        </Masonry>
      ) : (
        <div className="space-y-4">
          {assets.map((asset, index) => (
            <motion.div
              key={asset.id}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              custom={index % 10} // Limit animation delay to 10 items
            >
              <AssetCard asset={asset} variant="horizontal" />
            </motion.div>
          ))}
        </div>
      )}

      {/* Infinite scroll loading indicator or load more button */}
      {hasMore && (
        <div 
          ref={loadMoreRef}
          className="w-full flex justify-center py-8"
          style={{ minHeight: '100px' }} // Ensure element has height
        >
          {infiniteScroll ? (
            isLoadingMore && (
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground mt-2">Loading more...</span>
              </div>
            )
          ) : (
            <Button
              variant="outline"
              onClick={() => onLoadMore?.()}
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
          )}
        </div>
      )}

      {!hasMore && !isLoading && assets.length > 0 && (
        <div className="w-full flex justify-center py-8 text-muted-foreground text-sm">
          You've reached the end
        </div>
      )}
    </div>
  );
}

// Loading state component
function LoadingGrid({ viewMode }: { viewMode: AssetViewMode }) {
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