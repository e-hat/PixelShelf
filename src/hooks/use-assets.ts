'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api, ApiError } from '@/lib/api/api-client';
import { Asset } from '@/types';
import { toast } from 'sonner';
import { normalizeAsset } from '@/lib/utils';

interface UseAssetsOptions {
  userId?: string;
  projectId?: string;
  type?: string;
  tag?: string;
  search?: string;
  sort?: 'latest' | 'oldest' | 'popular';
  initialPage?: number;
  limit?: number;
}

export function useAssets(options: UseAssetsOptions | null = {}) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(options?.initialPage || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Use refs to track previous options and prevent unnecessary refetches
  const prevOptionsRef = useRef<string | null>(null);
  
  const fetchAssets = useCallback(async (reset = false) => {
    // If options is null, don't fetch anything
    if (!options) {
      setIsLoading(false);
      setAssets([]);
      return;
    }
    
    // If userId is missing and it's required, don't fetch
    if (!options.userId && !options.projectId && !options.search && !options.tag) {
      setIsLoading(false);
      setAssets([]);
      return;
    }
    
    try {
      const currentPage = reset ? 1 : page;
      
      if (reset) {
        setIsLoading(true);
        setAssets([]);
      } else if (currentPage > 1) {
        setIsLoadingMore(true);
      }
      
      const response = await api.assets.getAll({
        page: currentPage,
        limit: options.limit || 10,
        userId: options.userId,
        projectId: options.projectId,
        type: options.type,
        tag: options.tag,
        search: options.search,
        sort: options.sort || 'latest',
      });
      
      const newAssets = response.assets.map(normalizeAsset);
      
      if (reset || currentPage === 1) {
        setAssets(newAssets);
      } else {
        setAssets(prev => [...prev, ...newAssets]);
      }
      
      setPage(currentPage);
      setTotalPages(response.pagination.totalPages);
      setHasMore(currentPage < response.pagination.totalPages);
      setError(null);
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to load assets');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [options, page]);
  
  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, isLoadingMore]);
  
  const reload = useCallback(() => {
    setPage(1);
    fetchAssets(true);
  }, [fetchAssets]);
  
  useEffect(() => {
    // Convert options to string for comparison
    const optionsString = options ? JSON.stringify(options) : null;
    
    // Only fetch if options have changed
    if (optionsString !== prevOptionsRef.current) {
      setPage(1);
      fetchAssets(true);
      prevOptionsRef.current = optionsString;
    }
  }, [fetchAssets, options]);
  
  useEffect(() => {
    if (page > 1 && options) {
      fetchAssets(false);
    }
  }, [page, fetchAssets, options]);
  
  return {
    assets,
    isLoading,
    error,
    page,
    totalPages,
    hasMore,
    isLoadingMore,
    loadMore,
    reload,
  };
}