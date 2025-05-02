// src/hooks/use-comments-query.ts
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type FetchNextPageOptions,
} from '@tanstack/react-query';
import { api } from '@/lib/api/api-client';
import { toast } from 'sonner';
import { useMemo } from 'react';

// Keys for comment queries
export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (assetId: string) => [...commentKeys.lists(), assetId] as const,
  infiniteList: (assetId: string) => [...commentKeys.lists(), 'infinite', assetId] as const,
  detail: (id: string) => [...commentKeys.all, 'detail', id] as const,
}

type CommentsPage = Awaited<ReturnType<typeof api.comments.getForAsset>>

// Hook for single-page comments
export function useCommentsQuery(assetId: string, opts?: {
  page?: number
  limit?: number
  enabled?: boolean
}) {
  const page = opts?.page ?? 1
  const limit = opts?.limit ?? 10

  const query = useQuery({
    queryKey: commentKeys.list(assetId),
    queryFn: () => api.comments.getForAsset(assetId, { page, limit }),
    placeholderData: {
      comments: [],
      pagination: { page, limit, totalCount: 0, totalPages: 0 },
    },
    enabled: Boolean(assetId) && opts?.enabled !== false,
    structuralSharing: false,
  })

  const hasMore = query.data ? query.data.pagination.page < query.data.pagination.totalPages : false
  const loadMore = () => Promise.resolve() // No-op for compatibility with infinite version
  
  return {
    comments: query.data?.comments ?? [],
    hasMore,
    loadMore,
    ...query // Spread the rest of the query object for direct access to other properties
  }
}

// Hook for infinite/paginated comments
export function useInfiniteCommentsQuery(assetId: string, opts?: {
  limit?: number
  enabled?: boolean
}) {
  const limit = opts?.limit ?? 10

  const query = useInfiniteQuery({
    queryKey: commentKeys.infiniteList(assetId),
    queryFn: ({ pageParam }) =>
      api.comments.getForAsset(assetId, { page: pageParam, limit }),
    initialPageParam: 1,
    placeholderData: { pages: [], pageParams: [1] },
    getNextPageParam: last =>
      last.pagination.page < last.pagination.totalPages
        ? last.pagination.page + 1
        : undefined,
    enabled: Boolean(assetId) && opts?.enabled !== false,
    structuralSharing: false,
  })

  // Flatten the pages to get all comments
  const comments = useMemo(() => {
    return (query.data?.pages ?? []).flatMap(p => p.comments)
  }, [query.data])
  
  const hasMore = query.hasNextPage
  const loadMore = query.fetchNextPage
  
  return {
    comments,
    hasMore,
    loadMore,
    ...query, // Spread the rest of the query object for direct access to other properties
  }
}

// Create comment mutation
export function useCreateCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      assetId: string;
      content: string;
      parentId?: string;
    }) => api.comments.create(data),
    onSuccess: (_, variables) => {
      // Invalidate both types of comment lists to be safe
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(variables.assetId),
      });
      queryClient.invalidateQueries({
        queryKey: commentKeys.infiniteList(variables.assetId),
      });
      queryClient.invalidateQueries({
        queryKey: ['assets', 'detail', variables.assetId],
      });
      toast.success('Comment added successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add comment');
    },
  });
}

// Update comment mutation
export function useUpdateCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: { id: string; content: string }) =>
      api.comments.update(args.id, args.content),
    onSuccess: (data) => {
      if (data.assetId) {
        // Invalidate both types of comment lists to be safe
        queryClient.invalidateQueries({
          queryKey: commentKeys.list(data.assetId),
        });
        queryClient.invalidateQueries({
          queryKey: commentKeys.infiniteList(data.assetId),
        });
      } else {
        // fallback: invalidate all comment-lists
        queryClient.invalidateQueries({ queryKey: commentKeys.lists() });
      }
      toast.success('Comment updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update comment');
    },
  });
}

// Delete comment mutation
export function useDeleteCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.comments.delete(id),
    onSuccess: () => {
      // we don't know the assetId here, so just clear all comment lists
      queryClient.invalidateQueries({ queryKey: commentKeys.lists() });
      toast.success('Comment deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete comment');
    },
  });
}