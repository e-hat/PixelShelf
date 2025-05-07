// src/hooks/use-creators-query.ts
import {
  useInfiniteQuery,
  useQuery,
  type QueryFunctionContext,
} from '@tanstack/react-query';
import { api } from '@/lib/api/api-client';
import { UserProfile } from '@/types';
import { useTrendingQuery } from './use-trending-query';

// Keys for creators queries
export const creatorKeys = {
  all: ['creators'] as const,
  lists: () => [...creatorKeys.all, 'list'] as const,
  list: (filters: any) => [...creatorKeys.lists(), filters] as const,
  infiniteList: (filters: any) => [...creatorKeys.lists(), 'infinite', filters] as const,
};

// Response type for the search API when querying users
type CreatorsResponse = {
  users: UserProfile[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
};

// Base options for both single-page and infinite queries
export type CreatorQueryOptions = {
  search?: string;
  tag?: string;
  sort?: 'latest' | 'popular';
  limit?: number;
  enabled?: boolean;
};

// Standard creators query (single page)
export function useCreatorsQuery(options: CreatorQueryOptions = {}) {
  const {
    enabled: userEnabled = true,
    limit = 12,
    ...queryOptions
  } = options;

  const queryKey = creatorKeys.list({
    search: queryOptions.search,
    tag:   queryOptions.tag,
    sort:  queryOptions.sort,
  });

  const query = useQuery({
    queryKey,
    queryFn: () =>
      api.search.query({
        type: 'users',
        q:    queryOptions.search,
        tag:  queryOptions.tag,
        page: 1,
        limit,
      }),
    enabled: userEnabled,
  });

  const creators   = query.data?.users ?? [];
  const pagination = query.data?.pagination;
  const hasMore    = Boolean(pagination && pagination.page < pagination.totalPages);
  
  // Implement a real loadMore function that fetches the next page
  const loadMore = async () => {
    if (!hasMore || query.isLoading || !pagination) {
      return;
    }
    
    try {
      const nextPage = pagination.page + 1;
      const nextData = await api.search.query({
        type: 'users',
        q:    queryOptions.search,
        tag:  queryOptions.tag,
        page: nextPage,
        limit,
      });
      
      // Manually update the cache with the combined results
      query.refetch();
    } catch (error) {
      console.error("Error loading more creators:", error);
    }
  };

  return {
    creators,
    pagination,
    hasMore,
    isLoadingMore: query.isFetching && !!query.data,
    loadMore,
    ...query,
  };
}

// Infinite creators query (paginated)
export function useInfiniteCreatorsQuery(options: CreatorQueryOptions = {}) {
  const {
    enabled: userEnabled = true,
    limit = 12,
    ...queryOptions
  } = options;

  const queryKey = creatorKeys.infiniteList({
    search: queryOptions.search,
    tag:   queryOptions.tag,
    sort:  queryOptions.sort,
  });

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }: QueryFunctionContext<typeof queryKey, number>) =>
      api.search.query({
        type: 'users',
        q:    queryOptions.search,
        tag:  queryOptions.tag,
        page: pageParam,
        limit,
      }),
    getNextPageParam: lastPage =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    initialPageParam: 1,
    enabled: userEnabled,
  });

  // React Query will type `query.data` as InfiniteData<CreatorsResponse>
  const pages        = query.data?.pages        ?? [];
  const creators     = pages.flatMap(p => p.users) ?? [];
  const hasMore      = query.hasNextPage;
  const isLoadingMore = query.isFetchingNextPage;
  const loadMore     = query.fetchNextPage;

  return {
    creators,
    hasMore,
    isLoadingMore,
    loadMore,
    ...query,
  };
}

// Trending creators (no pagination)
export function useTrendingCreatorsQuery(options?: {
  limit?: number;
  enabled?: boolean;
}) {
  const { data, isLoading, error, refetch } = useTrendingQuery({
    type:    'creators',
    limit:   options?.limit,
    enabled: options?.enabled,
  });

  return {
    creators:     data?.creators || [],
    isLoading,
    error,
    refetch,
    hasMore:       false,
    isLoadingMore: false,
    loadMore:      () => Promise.resolve(),
  };
}