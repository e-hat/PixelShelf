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

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const { data: session, status } = useSession();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      // Subscribe to unread count updates
      const unsubscribe = notificationService.subscribe('unread_count', (data: any) => {
        setUnreadCount(data.unreadCount);
      });

      // Subscribe to new notifications for animation
      const unsubscribeNew = notificationService.subscribe('notification', () => {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 1000);
      });

      return () => {
        unsubscribe();
        unsubscribeNew();
      };
    }
  }, [status, session, setUnreadCount]);

  return (
    <Link 
      href="/notifications" 
      className={cn(
        "relative inline-flex items-center justify-center p-2 rounded-full hover:bg-accent transition-colors",
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
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 bg-pixelshelf-primary text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 font-medium"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}