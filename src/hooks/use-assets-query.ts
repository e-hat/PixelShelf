// src/hooks/use-assets-query.ts

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type FetchNextPageOptions,
} from '@tanstack/react-query';
import { api } from '@/lib/api/api-client';
import { Asset, AssetFormValues } from '@/types';
import { toast } from 'sonner';
import { useCallback, useState } from 'react';

// Keys for assets queries
export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (filters: any) => [...assetKeys.lists(), filters] as const,
  infiniteList: (filters: any) => [...assetKeys.lists(), 'infinite', filters] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
};

// Define the shape of one page of API results
type AssetsPage = Awaited<ReturnType<typeof api.assets.getAll>>;

// Base options type for both query hooks - adding following option
type AssetQueryOptions = {
  userId?: string;
  projectId?: string;
  type?: string;
  tag?: string;
  search?: string;
  sort?: 'latest' | 'oldest' | 'popular';
  limit?: number;
  enabled?: boolean;
  following?: boolean; // New option to filter by followed users
};

// Standard query for assets (single page)
export function useAssetsQuery(options: AssetQueryOptions = {}) {
  const {
    enabled: userEnabled = true,
    limit = 12,
    following = false,
    ...queryOptions
  } = options;

  const queryKey = assetKeys.list({
    userId: queryOptions.userId,
    projectId: queryOptions.projectId,
    type: queryOptions.type,
    tag: queryOptions.tag,
    search: queryOptions.search,
    sort: queryOptions.sort,
    following, // Include in the query key
  });

  const query = useQuery<AssetsPage, Error>({
    queryKey,
    queryFn: () => api.assets.getAll({
      ...queryOptions,
      page: 1,
      limit,
      following, // Pass to the API
    }),
    enabled: userEnabled,
  });

  const assets = query.data?.assets ?? [];
  const pagination = query.data?.pagination;
  const hasMore = !!pagination && pagination.page < pagination.totalPages;
  
  // Implement a real loadMore function that fetches the next page
  const loadMore = async () => {
    if (!hasMore || query.isLoading || !pagination) {
      return;
    }
    
    try {
      const nextPage = pagination.page + 1;
      const nextData = await api.assets.getAll({
        ...queryOptions,
        page: nextPage,
        limit,
        following, // Pass to the API
      });
      
      // Manually update the cache with the combined results
      query.refetch();
    } catch (error) {
      console.error("Error loading more assets:", error);
      toast.error("Failed to load more assets");
    }
  };

  return {
    assets,
    pagination,
    hasMore,
    isLoadingMore: query.isFetching && !!query.data,
    loadMore,
    ...query,
  };
}

// Infinite query for assets (paginated) - updated with following filter
export function useInfiniteAssetsQuery(options: AssetQueryOptions = {}) {
  const {
    enabled: userEnabled = true,
    limit = 12,
    following = false,
    ...queryOptions
  } = options;

  const queryKey = assetKeys.infiniteList({
    userId: queryOptions.userId,
    projectId: queryOptions.projectId,
    type: queryOptions.type,
    tag: queryOptions.tag,
    search: queryOptions.search,
    sort: queryOptions.sort,
    following, // Include in the query key
  });

  const query = useInfiniteQuery<AssetsPage, Error>({
    queryKey,
    queryFn: ({ pageParam = 1 }) => api.assets.getAll({
      ...queryOptions,
      page: pageParam,
      limit,
      following, // Pass to the API
    }),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: userEnabled,
  });

  // Flatten all pages into one array
  const pages = query.data?.pages ?? [];
  const assets = pages.flatMap((p) => p.assets) ?? [];
  const hasMore = query.hasNextPage;
  const isLoadingMore = query.isFetchingNextPage;
  const loadMore = query.fetchNextPage;

  return {
    assets,
    hasMore,
    isLoadingMore,
    loadMore,
    ...query,
  };
}

// Get single asset by ID
export function useAssetQuery(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: assetKeys.detail(id),
    queryFn: () => api.assets.getById(id),
    enabled: options?.enabled !== false && !!id,
  });
}

// Create asset mutation
export function useCreateAssetMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: AssetFormValues) => api.assets.create(data),
    onSuccess: () => {
      // Invalidate both standard and infinite lists
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      toast.success('Asset created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create asset');
    },
  });
}

// Update asset mutation
export function useUpdateAssetMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Asset> }) => 
      api.assets.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      toast.success('Asset updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update asset');
    },
  });
}

// Delete asset mutation
export function useDeleteAssetMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.assets.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.removeQueries({ queryKey: assetKeys.detail(id) });
      toast.success('Asset deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete asset');
    },
  });
}

export function useEnhancedInfiniteAssetsQuery(options: AssetQueryOptions = {}) {
  const {
    enabled: userEnabled = true,
    limit = 12,
    following = false,
    ...queryOptions
  } = options;

  // Base infinite query
  const infiniteQuery = useInfiniteAssetsQuery({
    ...options,
    enabled: userEnabled,
  });
  
  // Add loading state tracking
  const [isManuallyFetching, setIsManuallyFetching] = useState(false);
  
  // Enhanced fetchNextPage function with error handling and loading state
  const fetchNextPage = useCallback(async () => {
    if (!infiniteQuery.hasNextPage || infiniteQuery.isFetchingNextPage || isManuallyFetching) {
      return;
    }
    
    try {
      setIsManuallyFetching(true);
      await infiniteQuery.fetchNextPage();
    } catch (error) {
      console.error("Error fetching next page:", error);
      // Consider adding toast notification here
    } finally {
      setIsManuallyFetching(false);
    }
  }, [
    infiniteQuery.hasNextPage,
    infiniteQuery.isFetchingNextPage,
    infiniteQuery.fetchNextPage,
    isManuallyFetching
  ]);
  
  // Determine if loading more content
  const isLoadingMore = infiniteQuery.isFetchingNextPage || isManuallyFetching;
  
  return {
    ...infiniteQuery,
    isLoadingMore,
    fetchNextPage,
  };
}