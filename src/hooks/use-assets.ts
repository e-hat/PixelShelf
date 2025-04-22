'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api/api-client';
import { toast } from 'sonner';

export type Asset = {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
  projectId?: string | null;
  userId: string;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    image: string;
  };
  project?: {
    id: string;
    title: string;
  } | null;
  likes: number;
  comments: number;
  likedByUser?: boolean;
};

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

export function useAssets(options: UseAssetsOptions = {}) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(options.initialPage || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const fetchAssets = useCallback(async (reset = false) => {
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
      
      const newAssets = response.assets;
      
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
      toast.error('Failed to load assets');
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
    fetchAssets(true);
  }, [
    options.userId,
    options.projectId,
    options.type,
    options.tag,
    options.search,
    options.sort,
    options.limit,
  ]);
  
  useEffect(() => {
    if (page > 1) {
      fetchAssets(false);
    }
  }, [page, fetchAssets]);
  
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