// src/context/notification-context.tsx
'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { Notification } from '@/types';
import { notificationService, NotificationPreferences } from '@/services/notification-service';
import { useNotificationStore } from '@/store';
import { notificationKeys } from '@/hooks/use-notifications-query';
import { toast } from 'sonner';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  preferences: NotificationPreferences | null;
  selectedNotifications: Set<string>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotifications: (notificationIds: string[]) => Promise<void>;
  toggleNotificationSelection: (notificationId: string) => void;
  selectAllNotifications: () => void;
  clearSelection: () => void;
  updatePreferences: (preferences: NotificationPreferences) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  preferences: null,
  selectedNotifications: new Set(),
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotifications: async () => {},
  toggleNotificationSelection: () => {},
  selectAllNotifications: () => {},
  clearSelection: () => {},
  updatePreferences: async () => {},
  refresh: async () => {},
});

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { setUnreadCount } = useNotificationStore();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());

  // Initialize notification service
  useEffect(() => {
    if (session?.user?.id) {
      notificationService.initialize(session.user.id);
      
      // Subscribe to real-time notifications
      const unsubscribe = notificationService.subscribe('notification', (notification) => {
        // Add new notification to the list
        setNotifications((prev) => [notification, ...prev]);
        
        // Update unread count
        setUnreadCount((prev) => prev + 1);
        
        // Invalidate queries to ensure consistency
        queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        
        // Show toast notification
        showToastNotification(notification);
      });
      
      // Subscribe to unread count updates
      const unsubscribeCount = notificationService.subscribe('unread_count', (data: any) => {
        setUnreadCount(data.unreadCount);
      });
      
      // Load preferences
      loadPreferences();
      
      return () => {
        unsubscribe();
        unsubscribeCount();
        notificationService.disconnect();
      };
    }
  }, [session?.user?.id, queryClient, setUnreadCount]);

  const loadPreferences = async () => {
    try {
      const prefs = await notificationService.getPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  };

  const showToastNotification = (notification: Notification) => {
    // Don't show toast if in-app notifications are disabled
    if (!preferences?.inApp?.enabled) {
      return;
    }

    const icon = getNotificationIcon(notification.type);
    const message = notification.sender 
      ? `${notification.sender.name} ${notification.content}`
      : notification.content;
    
    toast(message, {
      icon,
      action: notification.linkUrl ? {
        label: 'View',
        onClick: () => window.location.href = notification.linkUrl!,
      } : undefined,
      duration: 5000,
    });
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'FOLLOW':
        return '👤';
      case 'LIKE':
        return '❤️';
      case 'COMMENT':
        return '💬';
      case 'MESSAGE':
        return '✉️';
      case 'SYSTEM':
        return '🔔';
      default:
        return '📢';
    }
  };

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          notificationIds.includes(n.id) ? { ...n, read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - notificationIds.length));
      
      await notificationService.markAsRead(notificationIds);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    } catch (error) {
      // Revert on error
      setNotifications((prev) =>
        prev.map((n) =>
          notificationIds.includes(n.id) ? { ...n, read: false } : n
        )
      );
      setUnreadCount((prev) => prev + notificationIds.length);
      
      toast.error('Failed to mark notifications as read');
      throw error;
    }
  }, [queryClient, setUnreadCount]);

  const markAllAsRead = useCallback(async () => {
    try {
      // Optimistic update
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      
      await notificationService.markAllAsRead();
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      
      toast.success('All notifications marked as read');
    } catch (error) {
      // Revert on error
      toast.error('Failed to mark all notifications as read');
      throw error;
    }
  }, [notifications, queryClient, setUnreadCount]);

  const clearSelection = useCallback(() => {
    setSelectedNotifications(new Set());
  }, []);

  const deleteNotifications = useCallback(async (notificationIds: string[]) => {
    try {
      // Optimistic update
      setNotifications((prev) => prev.filter((n) => !notificationIds.includes(n.id)));
      
      await notificationService.delete(notificationIds);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      
      toast.success(`${notificationIds.length} notification${notificationIds.length > 1 ? 's' : ''} deleted`);
      clearSelection();
    } catch (error) {
      // Revert on error
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast.error('Failed to delete notifications');
      throw error;
    }
  }, [queryClient, clearSelection]);

  const toggleNotificationSelection = useCallback((notificationId: string) => {
    setSelectedNotifications((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  }, []);

  const selectAllNotifications = useCallback(() => {
    setSelectedNotifications(new Set(notifications.map((n) => n.id)));
  }, [notifications]);

  const updatePreferences = useCallback(async (newPreferences: NotificationPreferences) => {
    try {
      await notificationService.savePreferences(newPreferences);
      setPreferences(newPreferences);
      toast.success('Notification preferences updated');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast.error('Failed to update notification preferences');
      throw error;
    }
  }, []);

  const refresh = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  }, [queryClient]);

  const value: NotificationContextType = {
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    isLoading,
    preferences,
    selectedNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotifications,
    toggleNotificationSelection,
    selectAllNotifications,
    clearSelection,
    updatePreferences,
    refresh,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);