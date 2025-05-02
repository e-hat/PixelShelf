// app/explore/page.tsx

'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Filter, GridIcon, LayoutList, X, User, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AssetCard from '@/components/feature-specific/asset-card';
import { cn } from '@/lib/utils';
import { POPULAR_TAGS } from '@/constants';
import { useInfiniteSearchQuery, useSearchQuery } from '@/hooks/use-search-query';

// Search parameters component that uses useSearchParams
import { ExploreSearchParams } from './search-params';
import { Asset, UserProfile } from '@/types';

export default function ExplorePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<"assets" | "creators">("assets");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  // Use the infinite search query hook for data fetching
  const {
    results,
    isLoading,
    isError,
    error,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage
  } = useInfiniteSearchQuery({
    q: searchQuery,
    type: activeTab === 'assets' ? 'assets' : 'users',
    tag: selectedTags.length > 0 ? selectedTags[0] : undefined,
    assetType: activeTab === 'assets' ? selectedType || undefined : undefined,
    limit: 12,
    enabled: false // Manually trigger this when needed
  });

  // Extract data from results
  const assets = results?.assets || [];
  const creators = results?.users || [];
  const hasMore = results?.hasMore || false;
  const isLoadingMore = results?.isLoadingMore || false;
  
  // Initial data fetch
  useEffect(() => {
    refetch();
  }, [activeTab, searchQuery, selectedTags, selectedType, refetch]);
  
  const handleTabChange = useCallback((newTab: "assets" | "creators") => {  
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedTags.length) params.set('tag', selectedTags[0]);
    if (selectedType) params.set('type', selectedType);
    params.set('tab', newTab);
  
    router.push(`/explore?${params.toString()}`);

    setActiveTab(newTab);
  }, [searchQuery, selectedTags, selectedType, router]);
  
  // Helper function to toggle tag selection
  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
  };
  
  // Helper function to clear filters
  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedType(null);
    setSearchQuery('');
    
    // Keep current tab in the URL
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    router.push(`/explore?${params.toString()}`);
    
    // Reload data with cleared filters
    refetch();
  };
  
  // Handle form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update URL with search params
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedTags.length > 0) params.set('tag', selectedTags[0]);
    if (selectedType) params.set('type', selectedType);
    params.set('tab', activeTab);
    
    router.push(`/explore?${params.toString()}`);
    
    // Fetch data with new search params
    refetch();
  };
  
  // Load more items
  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchNextPage();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Explore</h1>
          <p className="text-muted-foreground">
            Discover game assets and connect with talented game developers
          </p>
        </div>
        
        {/* Wrap the component that uses useSearchParams in a Suspense boundary */}
        <Suspense fallback={<div>Loading search parameters...</div>}>
          <ExploreSearchParams 
            setSearchQuery={setSearchQuery}
            setSelectedTags={setSelectedTags}
            setSelectedType={setSelectedType}
            setActiveTab={setActiveTab as any}
            applyFilters={(query, tags, type, tab) => {
              // Update the state
              setSearchQuery(query);
              setSelectedTags(tags);
              setSelectedType(type);
              if (tab) setActiveTab(tab);
              
              // Trigger the refetch
              refetch();
            }}
          />
        </Suspense>
        
        {/* Search and filters */}
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search assets, creators, or tags..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-muted' : ''}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button type="submit">Search</Button>
          </form>
          
          {/* Filters panel */}
          {showFilters && (
            <div className="border rounded-lg p-4 shadow-sm space-y-4">
              <div>
                <h3 className="font-medium mb-2">Popular Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        "px-3 py-1 rounded-full text-sm transition-colors",
                        selectedTags.includes(tag) 
                          ? "bg-pixelshelf-primary text-white" 
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Asset Type</h3>
                <div className="flex flex-wrap gap-2">
                  {['IMAGE', 'MODEL_3D', 'AUDIO', 'VIDEO', 'DOCUMENT'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(selectedType === type ? null : type)}
                      className={cn(
                        "px-3 py-1 rounded-full text-sm transition-colors",
                        selectedType === type 
                          ? "bg-pixelshelf-primary text-white" 
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
          
          {/* Selected filters display */}
          {(selectedTags.length > 0 || selectedType) && (
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {selectedTags.map((tag) => (
                <div 
                  key={tag} 
                  className="flex items-center bg-pixelshelf-light text-pixelshelf-primary px-3 py-1 rounded-full text-sm"
                >
                  #{tag}
                  <button 
                    onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                    className="ml-1 hover:text-pixelshelf-dark"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {selectedType && (
                <div className="flex items-center bg-pixelshelf-light text-pixelshelf-primary px-3 py-1 rounded-full text-sm">
                  {selectedType.replace('_', ' ')}
                  <button 
                    onClick={() => setSelectedType(null)}
                    className="ml-1 hover:text-pixelshelf-dark"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <button 
                onClick={clearFilters}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
        
        {/* Tabs and view toggle */}
        <div className="flex justify-between items-center">
          <Tabs 
            defaultValue={activeTab} 
            onValueChange={(value: string) => {
              handleTabChange(value as 'assets' | 'creators');
            }}
          >
            <TabsList>
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="creators">Creators</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex rounded-md overflow-hidden border">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-muted' : 'bg-background'}`}
              title="Grid view"
            >
              <GridIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-muted' : 'bg-background'}`}
              title="List view"
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {/* Error state */}
        {!isLoading && isError && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to load data</h3>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'An error occurred while fetching data'}
            </p>
            <Button 
              variant="outline" 
              onClick={() => refetch()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}
        
        {/* Content */}
        {!isLoading && !isError && (
          <div>
            {activeTab === 'assets' ? (
              <>
                {assets.length > 0 ? (
                  <div className={viewMode === 'grid' ? 'grid-masonry' : 'space-y-4'}>
                    {assets.map((asset: Asset) => (
                      <AssetCard 
                        key={asset.id} 
                        asset={asset} 
                        variant={viewMode === 'list' ? 'horizontal' : 'vertical'} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">No assets found matching your search.</p>
                    <Button 
                      variant="outline" 
                      onClick={clearFilters}
                      className="mt-4"
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                {creators.length > 0 ? (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                    {creators.map((creator: UserProfile) => (
                      <Link 
                        key={creator.id} 
                        href={`/u/${creator.username}`}
                        className={cn(
                          "block border rounded-lg overflow-hidden hover:shadow-md transition-shadow",
                          viewMode === 'list' ? 'flex items-center p-4' : ''
                        )}
                      >
                        {viewMode === 'grid' ? (
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
                                <User className="h-24 w-24 p-6 text-muted-foreground" />
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
                        ) : (
                          <>
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
                                <User className="h-16 w-16 p-4 text-muted-foreground" />
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
                          </>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">No creators found matching your search.</p>
                    <Button 
                      variant="outline" 
                      onClick={clearFilters}
                      className="mt-4"
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
              </>
            )}
            
            {/* Load more button */}
            {!isLoading && hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
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
        )}
      </div>
    </div>
  );
}