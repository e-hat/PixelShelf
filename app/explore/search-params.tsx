'use client';

import { useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { useSearchParams } from 'next/navigation';

interface ExploreSearchParamsProps {
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setSelectedTags: Dispatch<SetStateAction<string[]>>;
  setSelectedType: Dispatch<SetStateAction<string | null>>;
  setActiveTab: Dispatch<SetStateAction<"assets" | "creators">>;
  applyFilters: (
    query: string,
    tags: string[],
    type: string | null,
    tab?: 'assets' | 'creators'
  ) => void;
}

export function ExploreSearchParams({
  setSearchQuery,
  setSelectedTags,
  setSelectedType,
  setActiveTab,
  applyFilters
}: ExploreSearchParamsProps) {
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);
  const prevParamsRef = useRef<string>('');

  // Initialize search and filters from URL params
  useEffect(() => {
    const query = searchParams?.get('q') || '';
    const tag = searchParams?.get('tag') || '';
    const type = searchParams?.get('type') || '';
    const tab = searchParams?.get('tab') || 'assets';
    
    // Create a string representation of current params to compare
    const currentParamsString = `${query}|${tag}|${type}|${tab}`;
    
    // Skip if params haven't changed
    if (currentParamsString === prevParamsRef.current) {
      return;
    }
    
    // Update the previous params ref
    prevParamsRef.current = currentParamsString;
    
    // Set values in parent component
    setSearchQuery(query);
    setSelectedTags(tag ? [tag] : []);
    setSelectedType(type || null);
    setActiveTab(tab === 'creators' ? 'creators' : 'assets');
    
    // Only apply filters if not the first render or if there are actual filter params
    if (!isFirstRender.current || query || tag || type) {
      applyFilters(query, tag ? [tag] : [], type || null, tab === 'creators' ? 'creators' : 'assets');
    }
    
    // Mark first render as complete
    isFirstRender.current = false;
  }, [searchParams, setSearchQuery, setSelectedTags, setSelectedType, setActiveTab, applyFilters]);

  // This component doesn't render anything visible
  return null;
}