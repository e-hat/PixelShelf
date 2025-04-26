'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface ExploreSearchParamsProps {
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  setSelectedType: (type: string | null) => void;
  setActiveTab: (tab: string) => void;
  applyFilters: (query: string, tags: string[], type: string | null) => void;
}

export function ExploreSearchParams({
  setSearchQuery,
  setSelectedTags,
  setSelectedType,
  setActiveTab,
  applyFilters
}: ExploreSearchParamsProps) {
  const searchParams = useSearchParams();

  // Initialize search and filters from URL params
  useEffect(() => {
    const query = searchParams?.get('q') || '';
    const tag = searchParams?.get('tag') || '';
    const type = searchParams?.get('type') || '';
    const tab = searchParams?.get('tab') || 'assets';
    
    setSearchQuery(query);
    setSelectedTags(tag ? [tag] : []);
    setSelectedType(type || null);
    setActiveTab(tab === 'creators' ? 'creators' : 'assets');
    
    // Apply filters
    applyFilters(query, tag ? [tag] : [], type || null);
  }, [searchParams, setSearchQuery, setSelectedTags, setSelectedType, setActiveTab, applyFilters]);

  // This component doesn't render anything visible
  return null;
}