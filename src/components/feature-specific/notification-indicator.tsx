'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationIndicatorProps {
  className?: string;
}

export default function NotificationIndicator({ className }: NotificationIndicatorProps) {
  const { data: session, status } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    if (!session) return;
    
    try {
      const response = await fetch('/api/notifications?limit=1&unreadOnly=true');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch notifications on mount and set up a polling interval
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUnreadCount();
      
      // Poll for new notifications every minute
      const interval = setInterval(fetchUnreadCount, 60000);
      
      return () => clearInterval(interval);
    } else {
      setIsLoading(false);
    }
  }, [status, session]);

  if (status !== 'authenticated' || isLoading) {
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