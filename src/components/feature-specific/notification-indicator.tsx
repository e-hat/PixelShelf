'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationsQuery } from '@/hooks/use-notifications-query';

interface NotificationIndicatorProps {
  className?: string;
}

export default function NotificationIndicator({ className }: NotificationIndicatorProps) {
  const { data: session, status } = useSession();
  
  // Use our React Query hook to fetch unread notifications
  const { unreadCount, refetch } = useNotificationsQuery({
    unreadOnly: true,
    limit: 1, // We only need the count, not actual notifications
    enabled: status === 'authenticated'
  });

  // Periodically check for new notifications
  useEffect(() => {
    if (status === 'authenticated') {
      // Poll for new notifications every minute
      const interval = setInterval(() => {
        refetch();
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [status, refetch]);

  if (status !== 'authenticated') {
    return (
      <Link href="/notifications" className={cn("relative text-foreground hover:text-pixelshelf-primary", className)}>
        <Bell className="h-5 w-5" />
      </Link>
    );
  }

  return (
    <Link href="/notifications" className={cn("relative text-foreground hover:text-pixelshelf-primary", className)}>
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-pixelshelf-primary text-white rounded-full min-w-[1rem] h-4 flex items-center justify-center text-xs font-medium">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}