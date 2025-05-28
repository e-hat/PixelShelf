// src/hooks/use-notifications-query.ts
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type FetchNextPageOptions,
  type QueryFunctionContext,
} from '@tanstack/react-query';
import { api } from '@/lib/api/api-client';
import { toast } from 'sonner';
import { useNotificationStore } from '@/store';
import { useEffect } from 'react';

type NotificationsPage = Awaited<ReturnType<typeof api.notifications.getAll>>;

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (filters: { unreadOnly?: boolean, archivedOnly?: boolean }) =>
    [...notificationKeys.all, 'list', filters] as const,
  infiniteList: (filters: { unreadOnly?: boolean, archivedOnly?: boolean }) =>
    [...notificationKeys.all, 'list', 'infinite', filters] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
};

// Base options type for notification queries
type NotificationQueryOptions = {
  limit?: number;
  unreadOnly?: boolean;
  archivedOnly?: boolean;
  enabled?: boolean;
};

// Standard notifications query (single page)
export function useNotificationsQuery(options?: NotificationQueryOptions) {
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const {
    limit = 20,
    unreadOnly = false,
    archivedOnly = false,
    enabled: userEnabled = true,
  } = options ?? {};

  const queryKey = notificationKeys.list({ unreadOnly, archivedOnly });

  const query = useQuery<NotificationsPage, Error>({
    queryKey,
    queryFn: () =>
      api.notifications.getAll({
        page: 1,
        limit,
        unreadOnly,
        archivedOnly,
      }),
    enabled: userEnabled,
    staleTime: 30000, // 30 seconds - for notifications we want relatively fresh data
  });

  // Sync unread count to global store
  useEffect(() => {
    if (query.isSuccess && query.data && (unreadOnly || query.data.unreadCount !== undefined)) {
      setUnreadCount(query.data.unreadCount);
    }
  }, [query.isSuccess, query.data, setUnreadCount, unreadOnly]);

  // Extract data for convenience
  const notifications = query.data?.notifications ?? [];
  const unreadCount = query.data?.unreadCount ?? 0;
  const pagination = query.data?.pagination;
  const hasMore = Boolean(pagination && pagination.page < pagination.totalPages);
  
  // For compatibility with infinite query
  const loadMore = () => Promise.resolve(); // No-op for compatibility
  const isLoadingMore = false;

  return {
    notifications,
    unreadCount,
    pagination,
    hasMore,
    isLoadingMore,
    loadMore,
    ...query,
  };
}

// Infinite notifications query (paginated)
export function useInfiniteNotificationsQuery(options?: NotificationQueryOptions) {
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const {
    limit = 20,
    unreadOnly = false,
    archivedOnly = false,
    enabled: userEnabled = true,
  } = options ?? {};

  const queryKey = notificationKeys.infiniteList({ unreadOnly, archivedOnly });

  const query = useInfiniteQuery<
    NotificationsPage,
    Error,
    InfiniteData<NotificationsPage>,
    typeof queryKey,
    number
  >({
    queryKey,
    queryFn: ({ pageParam = 1 }: QueryFunctionContext<typeof queryKey, number>) =>
      api.notifications.getAll({
        page: pageParam,
        limit,
        unreadOnly,
        archivedOnly,
      }),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: userEnabled,
    staleTime: 30000, // 30 seconds - for notifications we want relatively fresh data
  });

  // Sync unread count to global store
  useEffect(() => {
    if (query.isSuccess && query.data?.pages.length) {
      setUnreadCount(query.data.pages[0].unreadCount);
    }
  }, [query.isSuccess, query.data, setUnreadCount]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
    // Added convenience fields for consistent API with regular query
    notifications: query.data?.pages.flatMap(p => p.notifications) ?? [],
    unreadCount: query.data?.pages[0]?.unreadCount ?? 0,
    hasMore: query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    loadMore: query.fetchNextPage,
  };
}

export function useMarkNotificationsAsReadMutation() {
  const queryClient = useQueryClient();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  return useMutation({
    mutationFn: (ids?: string[]) => api.notifications.markAsRead(ids),
    onSuccess: (_, ids) => {
      // Invalidate all notification queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });

      if (!ids) {
        // If marking all as read, just set count to 0
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      } else {
        // If marking specific notifications, update the cached data
        queryClient.setQueriesData(
          { queryKey: notificationKeys.all },
          (oldData: any) => {
            if (!oldData) return oldData;

            // Handle both infinite query and regular query data structures
            if ('pages' in oldData) {
              return {
                ...oldData,
                pages: oldData.pages.map((page: any) => ({
                  ...page,
                  notifications: page.notifications.map((n: any) =>
                    ids.includes(n.id) ? { ...n, read: true } : n
                  ),
                  unreadCount: Math.max(0, page.unreadCount - ids.length),
                })),
              };
            }

            return {
              ...oldData,
              notifications: oldData.notifications.map((n: any) =>
                ids.includes(n.id) ? { ...n, read: true } : n
              ),
              unreadCount: Math.max(0, oldData.unreadCount - ids.length),
            };
          }
        );
        
        // Update count in store
        setUnreadCount((prev) => Math.max(0, prev - ids.length));
        toast.success(ids.length === 1 ? 'Notification marked as read' : 'Notifications marked as read');
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to mark notifications as read');
    },
  });
}