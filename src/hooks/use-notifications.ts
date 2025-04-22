'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api/api-client';
import { toast } from 'sonner';
import { Notification } from '@/types';
import { useNotificationStore } from '@/store';

interface UseNotificationsProps {
  initialPage?: number;
  limit?: number;
  unreadOnly?: boolean;
  pollingInterval?: number | null;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  reload: () => void;
  markAsRead: (ids?: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export function useNotifications({
  initialPage = 1,
  limit = 20,
  unreadOnly = false,
  pollingInterval = null,
}: UseNotificationsProps = {}): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Get the setUnreadCount function from store
  const setStoreUnreadCount = useNotificationStore(state => state.setUnreadCount);
  const [unreadCount, setLocalUnreadCount] = useState(0);

  // Set both local and global unread count
  const setUnreadCount = useCallback((countOrUpdater: number | ((prev: number) => number)) => {
    setLocalUnreadCount(prev => 
      typeof countOrUpdater === 'function' ? countOrUpdater(prev) : countOrUpdater
    );
    setStoreUnreadCount(prev => 
      typeof countOrUpdater === 'function' ? countOrUpdater(prev) : countOrUpdater
    );
  }, [setStoreUnreadCount]);
  
  const fetchNotifications = useCallback(async (reset = false) => {
    try {
      const currentPage = reset ? 1 : page;
      
      if (reset) {
        setIsLoading(true);
      } else if (currentPage > 1) {
        setIsLoadingMore(true);
      }
      
      const response = await api.notifications.getAll({
        page: currentPage,
        limit,
        unreadOnly,
      });
      
      if (reset || currentPage === 1) {
        setNotifications(response.notifications);
      } else {
        setNotifications(prev => [...prev, ...response.notifications]);
      }
      
      setPage(currentPage);
      setTotalPages(response.pagination.totalPages);
      setHasMore(currentPage < response.pagination.totalPages);
      setUnreadCount(response.unreadCount);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to load notifications');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [page, limit, unreadOnly, setUnreadCount]);
  
  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, isLoadingMore]);
  
  const reload = useCallback(() => {
    setPage(1);
    fetchNotifications(true);
  }, [fetchNotifications]);
  
  const markAsRead = useCallback(async (ids?: string[]) => {
    try {
      await api.notifications.markAsRead(ids);
      
      // Update the local state
      if (ids) {
        setNotifications(prev => 
          prev.map(notification => 
            ids.includes(notification.id) 
              ? { ...notification, read: true } 
              : notification
          )
        );
        
        // Update unread count
        const markedCount = ids.length;
        setUnreadCount(prev => Math.max(0, prev - markedCount));
      } else {
        // All notifications marked as read
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
        setUnreadCount(0);
      }
      
      toast.success(ids ? 'Notification marked as read' : 'All notifications marked as read');
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      toast.error('Failed to mark notifications as read');
    }
  }, [setUnreadCount]);
  
  const markAllAsRead = useCallback(() => markAsRead(), [markAsRead]);
  
  useEffect(() => {
    fetchNotifications(true);
    
    // Set up polling if requested
    if (pollingInterval) {
      const interval = setInterval(() => {
        // Just check for new unread count, not entire list
        api.notifications.getAll({ page: 1, limit: 1, unreadOnly: true })
          .then(data => {
            setUnreadCount(data.unreadCount);
          })
          .catch(err => {
            console.error('Error polling notifications:', err);
          });
      }, pollingInterval);
      
      return () => clearInterval(interval);
    }
  }, [fetchNotifications, pollingInterval, setUnreadCount]);
  
  useEffect(() => {
    if (page > 1) {
      fetchNotifications(false);
    }
  }, [page, fetchNotifications]);
  
  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    page,
    totalPages,
    hasMore,
    isLoadingMore,
    loadMore,
    reload,
    markAsRead,
    markAllAsRead,
  };
}