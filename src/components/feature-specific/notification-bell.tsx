// src/components/feature-specific/notification-bell.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/store';
import { notificationService } from '@/services/notification-service';
import { useNotificationsQuery } from '@/hooks/use-notifications-query';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const { data: session, status } = useSession();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [preferences, setPreferences] = useState<any>(null);

  // Use React Query to get initial unread count
  const { unreadCount: queryUnreadCount } = useNotificationsQuery({
    limit: 1,
    unreadOnly: true,
    enabled: status === 'authenticated',
  });

  // Sync query unread count to store
  useEffect(() => {
    if (queryUnreadCount !== undefined && queryUnreadCount !== unreadCount) {
      setUnreadCount(queryUnreadCount);
    }
  }, [queryUnreadCount, setUnreadCount]);

  // Load notification preferences
  useEffect(() => {
    if (status === 'authenticated') {
      notificationService.getPreferences().then(setPreferences);
    }
  }, [status]);

  // Initialize notification service and subscribe to updates
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && preferences?.inApp?.enabled) {
      // Initialize the notification service
      notificationService.initialize(session.user.id);

      // Subscribe to unread count updates
      const unsubscribeCount = notificationService.subscribe('unread_count', (data: any) => {
        const newCount = data.count || data.unreadCount || 0;
        setUnreadCount(newCount);
      });

      // Subscribe to new notifications for animation
      const unsubscribeNew = notificationService.subscribe('notification', (notification: any) => {
        // Trigger animations
        setIsAnimating(true);
        setShowPulse(true);
        
        // Increment unread count
        setUnreadCount(prev => prev + 1);
        
        // Reset animations after delay
        setTimeout(() => {
          setIsAnimating(false);
          setShowPulse(false);
        }, 2000);
      });

      return () => {
        unsubscribeCount();
        unsubscribeNew();
      };
    }
  }, [status, session, setUnreadCount, preferences?.inApp?.enabled]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (status === 'unauthenticated') {
        notificationService.disconnect();
      }
    };
  }, [status]);

  if (status !== 'authenticated') {
    return (
      <Link 
        href="/notifications" 
        className={cn(
          "relative inline-flex items-center justify-center p-2 rounded-full",
          "hover:bg-accent transition-colors",
          className
        )}
      >
        <Bell className="h-5 w-5" />
      </Link>
    );
  }

  return (
    <Link 
      href="/notifications" 
      className={cn(
        "relative inline-flex items-center justify-center p-2 rounded-full",
        "hover:bg-accent transition-colors",
        className
      )}
    >
      <motion.div
        animate={isAnimating ? { 
          rotate: [0, -10, 10, -10, 10, 0],
          scale: [1, 1.1, 1]
        } : {}}
        transition={{ duration: 0.5 }}
      >
        <Bell className="h-5 w-5" />
      </motion.div>
      
      <AnimatePresence>
        {unreadCount > 0 && preferences?.inApp?.enabled && (
          <>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className={cn(
                "absolute -top-1 -right-1 bg-pixelshelf-primary text-white text-xs rounded-full",
                "min-w-[20px] h-5 flex items-center justify-center px-1 font-medium"
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
            
            {/* Pulse animation for new notifications */}
            {showPulse && (
              <motion.span
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute -top-1 -right-1 bg-pixelshelf-primary rounded-full min-w-[20px] h-5"
              />
            )}
          </>
        )}
      </AnimatePresence>
    </Link>
  );
}