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

// Base options type for both query hooks
type AssetQueryOptions = {
  userId?: string;
  projectId?: string;
  type?: string;
  tag?: string;
  search?: string;
  sort?: 'latest' | 'oldest' | 'popular';
  limit?: number;
  enabled?: boolean;
};

// Standard query for assets (single page)
export function useAssetsQuery(options: AssetQueryOptions = {}) {
  const {
    enabled: userEnabled = true,
    limit = 12,
    ...queryOptions
  } = options;

  const queryKey = assetKeys.list({
    userId: queryOptions.userId,
    projectId: queryOptions.projectId,
    type: queryOptions.type,
    tag: queryOptions.tag,
    search: queryOptions.search,
    sort: queryOptions.sort,
  });

  const query = useQuery<AssetsPage, Error>({
    queryKey,
    queryFn: () => api.assets.getAll({
      ...queryOptions,
      page: 1,
      limit,
    }),
    enabled: userEnabled,
  });

  const assets = query.data?.assets ?? [];
  const pagination = query.data?.pagination;
  const hasMore = !!pagination && pagination.page < pagination.totalPages;
  const loadMore = () => Promise.resolve(); // No-op for compatibility

  return {
    assets,
    pagination,
    hasMore,
    isLoadingMore: false,
    loadMore,
    ...query,
  };
}

// Infinite query for assets (paginated)
export function useInfiniteAssetsQuery(options: AssetQueryOptions = {}) {
  const {
    enabled: userEnabled = true,
    limit = 12,
    ...queryOptions
  } = options;

  const queryKey = assetKeys.infiniteList({
    userId: queryOptions.userId,
    projectId: queryOptions.projectId,
    type: queryOptions.type,
    tag: queryOptions.tag,
    search: queryOptions.search,
    sort: queryOptions.sort,
  });

  const query = useInfiniteQuery<AssetsPage, Error>({
    queryKey,
    queryFn: ({ pageParam = 1 }) => api.assets.getAll({
      ...queryOptions,
      page: pageParam,
      limit,
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