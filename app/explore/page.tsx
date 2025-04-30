// app/explore/page.tsx

// TODO: Filter functionality

'use client';

import { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Filter, GridIcon, LayoutList, User, X, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AssetCard from '@/components/feature-specific/asset-card';
import { cn } from '@/lib/utils';
import { Asset } from '@/types';
import { api, ApiError } from '@/lib/api/api-client';
import { POPULAR_TAGS } from '@/constants';

// Search parameters component that uses useSearchParams
import { ExploreSearchParams } from './search-params';

export default function ExplorePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<"assets" | "creators">("assets");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  // State for API data
  const [assets, setAssets] = useState<Asset[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Use ref to keep track of previous fetch to prevent duplicate calls
  const lastFetchRef = useRef<string>('');
  
  // Function to fetch explore data from the API
  const fetchExploreData = useCallback(async (
    tab: 'assets' | 'creators',
    query: string,
    tags: string[],
    type: string | null,
    page: number,
    replace: boolean = true
  ) => {
    // Create a request signature to check for duplicates
    const requestSignature = JSON.stringify({ tab, query, tags, type, page });
    
    // Check if this is a duplicate fetch request
    if (requestSignature === lastFetchRef.current) {
      return; // Skip duplicate fetch
    }
    
    // Update the last fetch reference
    lastFetchRef.current = requestSignature;
    
    if (replace) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    setError(null);
    
    try {
      // Use search API to get data
      const searchParams: Record<string, any> = {
        q: query,
        type: tab === 'assets' ? 'assets' : 'users',
        page,
        limit: 12,
      };
      
      // Add tag filter if selected
      if (tags.length > 0) {
        searchParams.tag = tags[0]; // Currently just using the first tag
      }
      
      // Add asset type filter if selected (only for assets)
      if (tab === 'assets' && type) {
        searchParams.assetType = type;
      }
      
      const response = await api.search.query(searchParams);
      
      if (tab === 'assets') {
        // Update assets list
        if (replace) {
          setAssets(response.assets || []);
        } else {
          setAssets(prev => [...prev, ...(response.assets || [])]);
        }
        
        // Update pagination info
        setHasMore(page < (response.pagination?.totalPages || 1));
      } else {
        // Update creators list
        if (replace) {
          setCreators(response.users || []);
        } else {
          setCreators(prev => [...prev, ...(response.users || [])]);
        }
        
        // Update pagination info
        setHasMore(page < (response.pagination?.totalPages || 1));
      }
      
    } catch (err) {
      console.error('Error fetching explore data:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchExploreData(activeTab, searchQuery, selectedTags, selectedType, 1)
  }, [])
  
  const handleTabChange = useCallback((newTab: "assets" | "creators") => {
    setActiveTab(newTab);
  
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedTags.length) params.set('tag', selectedTags[0]);
    if (selectedType) params.set('type', selectedType);
    params.set('tab', newTab);
  
    router.push(`/explore?${params.toString()}`);
  
    // ← fetch immediately on tab switch
    fetchExploreData(
      newTab,
      searchQuery,
      selectedTags,
      selectedType,
      1,
      true
    );
  }, [ searchQuery, selectedTags, selectedType, router, fetchExploreData ]);
  
  
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
    fetchExploreData(activeTab, '', [], null, 1);
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
    fetchExploreData(activeTab, searchQuery, selectedTags, selectedType, 1);
  };
  
  // Load more items
  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchExploreData(activeTab, searchQuery, selectedTags, selectedType, nextPage, false);
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
              fetchExploreData(
                tab === 'creators' ? 'creators' : 'assets', 
                query, 
                tags, 
                type, 
                1
              );
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
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to load data</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => fetchExploreData(activeTab, searchQuery, selectedTags, selectedType, 1)}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}
        
        {/* Content */}
        {!isLoading && !error && (
          <div>
            {activeTab === 'assets' ? (
              <>
                {assets.length > 0 ? (
                  <div className={viewMode === 'grid' ? 'grid-masonry' : 'space-y-4'}>
                    {assets.map((asset) => (
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
                    {creators.map((creator) => (
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
                              <span>{creator.followerCount || creator.stats?.followers || 0} followers</span>
                              <span>{creator.assetCount || creator.stats?.assets || 0} assets</span>
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
                              <div>{creator.followerCount || creator.stats?.followers || 0} followers</div>
                              <div>{creator.assetCount || creator.stats?.assets || 0} assets</div>
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
        )}
      </div>
    </div>
  );
}