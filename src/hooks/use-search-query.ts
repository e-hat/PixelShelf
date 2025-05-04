// src/hooks/use-search-query.ts

// TODO: Fix search happening on every key press. Debounce?

import {
  useInfiniteQuery,
  useQuery,
  type FetchNextPageOptions,
  type QueryFunctionContext,
} from '@tanstack/react-query';
import { api } from '@/lib/api/api-client';

// Keys for search queries
export const searchKeys = {
  all: ['search'] as const,
  query: (params: {
    q?: string;
    type?: 'assets' | 'projects' | 'users' | 'all';
    tag?: string;
    assetType?: string;
    sort?: 'latest' | 'oldest' | 'popular';
  }) => [...searchKeys.all, params] as const,
  infiniteQuery: (params: {
    q?: string;
    type?: 'assets' | 'projects' | 'users' | 'all';
    tag?: string;
    assetType?: string;
    sort?: 'latest' | 'oldest' | 'popular';
  }) => [...searchKeys.all, 'infinite', params] as const,
};

type SearchResponse = Awaited<ReturnType<typeof api.search.query>>;

// Base search parameters type
type SearchParams = {
  q?: string;
  type?: 'assets' | 'projects' | 'users' | 'all';
  tag?: string;
  assetType?: string;
  sort?: 'latest' | 'oldest' | 'popular';
  limit?: number;
  enabled?: boolean;
};

// Standard search query (single page)
export function useSearchQuery(params: SearchParams & { page?: number }) {
  const {
    q,
    type,
    tag,
    assetType,
    sort,
    page = 1,
    limit = 12,
    enabled: userEnabled = true,
  } = params;

  // Only run when there's something to search
  const canSearch = Boolean(q || tag || assetType);

  const queryKey = searchKeys.query({ q, type, tag, assetType, sort });

  const query = useQuery<SearchResponse, Error>({
    queryKey,
    queryFn: () =>
      api.search.query({
        q,
        type,
        tag,
        page,
        limit,
      }),
    enabled: userEnabled && canSearch,
  });

  // Extract data
  const assets = query.data?.assets || [];
  const projects = query.data?.projects || [];
  const users = query.data?.users || [];
  const pagination = query.data?.pagination;
  const hasMore = Boolean(pagination && pagination.page < pagination.totalPages);
  const loadMore = () => Promise.resolve(); // No-op for compatibility

  // Return search results with query object
  return {
    ...query,
    results: { 
      assets, 
      projects, 
      users, 
      pagination, 
      hasMore, 
      loadMore 
    },
  };
}

// Infinite search query (paginated)
export function useInfiniteSearchQuery(params: SearchParams) {
  const {
    q,
    type,
    tag,
    assetType,
    sort,
    limit = 12,
    enabled: userEnabled = true,
  } = params;

  // Only run when there's something to search
  const canSearch = Boolean(q || tag || assetType);

  const queryKey = searchKeys.infiniteQuery({ q, type, tag, assetType, sort });

  const query = useInfiniteQuery<
    SearchResponse,
    Error,
    SearchResponse,
    typeof queryKey,
    number
  >({
    queryKey,
    queryFn: ({
      pageParam = 1,
    }: QueryFunctionContext<typeof queryKey, number>) =>
      api.search.query({
        q,
        type,
        tag,
        page: pageParam,
        limit,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    initialPageParam: 1,
    enabled: userEnabled && canSearch,
  });

  // Flatten results from all pages
  const pages = query.data?.pages ?? [];
  const assets = pages.flatMap((p: { assets: any; }) => p.assets || []) ?? [];
  const projects = pages.flatMap((p: { projects: any; }) => p.projects || []) ?? [];
  const users = pages.flatMap((p: { users: any; }) => p.users || []) ?? [];
  
  const hasMore = query.hasNextPage;
  const isLoadingMore = query.isFetchingNextPage;
  const loadMore = query.fetchNextPage;

  // Return search results with query object
  return {
    ...query,
    results: { 
      assets, 
      projects, 
      users, 
      hasMore, 
      isLoadingMore, 
      loadMore 
    },
  };
}