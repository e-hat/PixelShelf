// app/explore/page.tsx

'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Grid, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { POPULAR_TAGS } from '@/constants';
import { cn } from '@/lib/utils';
import { DashboardFeed, TabOption } from '@/components/feature-specific/dashboard-feed';
import type { AssetGridFilters } from '@/components/shared/asset-grid';

// Search parameters component that uses useSearchParams
import { ExploreSearchParams } from './search-params';

export default function ExplorePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<"assets" | "creators">("assets");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Define custom tabs for the explore page
  const exploreTabs: TabOption[] = [
    {
      id: 'assets',
      label: 'Assets',
      icon: <Grid className="h-4 w-4 mr-2" />,
    },
    {
      id: 'creators',
      label: 'Creators',
      icon: <Grid className="h-4 w-4 mr-2" />,
    }
  ];
  
  // Apply filters to the dashboard feed
  const handleFilterChange = useCallback((filters: AssetGridFilters) => {
    // Update filter state
    if (filters.type !== undefined) {
      setSelectedType(filters.type);
    }
    
    if (filters.tags !== undefined) {
      setSelectedTags(filters.tags);
    }
    
    // Update URL with query params
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (filters.tags && filters.tags.length > 0) params.set('tag', filters.tags[0]);
    if (filters.type) params.set('type', filters.type);
    params.set('tab', activeTab);
    
    router.push(`/explore?${params.toString()}`);
  }, [searchQuery, activeTab, router]);
  
  // Helper function to toggle tag selection
  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    
    // Update URL with query params
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (newTags.length > 0) params.set('tag', newTags[0]);
    if (selectedType) params.set('type', selectedType);
    params.set('tab', activeTab);
    
    router.push(`/explore?${params.toString()}`);
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
                    onClick={() => toggleTag(tag)}
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

        {/* Dashboard Feed with custom tabs */}
        <DashboardFeed 
          initialTab={activeTab}
          tabs={exploreTabs}
        />
      </div>
    </div>
  );
}