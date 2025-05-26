// src/components/feature-specific/recent-activity-widget.tsx - New component
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Bell, 
  Heart, 
  MessageSquare, 
  UserCheck, 
  Info,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, getRelativeTime } from '@/lib/utils';
import { notificationService } from '@/services/notification-service';
import { useNotificationsQuery } from '@/hooks/use-notifications-query';
import { Notification } from '@/types';

interface RecentActivityWidgetProps {
  className?: string;
  limit?: number;
}

export function RecentActivityWidget({ className, limit = 5 }: RecentActivityWidgetProps) {
  const { data: session } = useSession();
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);
  
  const { notifications, isLoading, refetch } = useNotificationsQuery({
    limit,
    enabled: !!session,
  });

  useEffect(() => {
    if (notifications) {
      setLocalNotifications(notifications);
    }
  }, [notifications]);

  useEffect(() => {
    if (session?.user?.id) {
      // Subscribe to new notifications
      const unsubscribe = notificationService.subscribe('notification', (notification: Notification) => {
        setLocalNotifications(prev => [notification, ...prev].slice(0, limit));
        refetch(); // Refetch to get latest data
      });

      return () => {
        unsubscribe();
      };
    }
  }, [session, limit, refetch]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'FOLLOW':
        return <UserCheck className="h-3 w-3 text-blue-500" />;
      case 'LIKE':
        return <Heart className="h-3 w-3 text-red-500" />;
      case 'COMMENT':
        return <MessageSquare className="h-3 w-3 text-green-500" />;
      case 'MESSAGE':
        return <MessageSquare className="h-3 w-3 text-pixelshelf-primary" />;
      case 'SYSTEM':
        return <Info className="h-3 w-3 text-amber-500" />;
      default:
        return <Bell className="h-3 w-3 text-muted-foreground" />;
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">Recent Activity</h3>
        <Link 
          href="/notifications" 
          className="text-xs text-pixelshelf-primary hover:underline flex items-center"
        >
          See all
          <ArrowUpRight className="h-3 w-3 ml-1" />
        </Link>
      </div>
      
      {isLoading ? (
        <div className="py-4 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : localNotifications.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {localNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                layout
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Link 
                  href={notification.linkUrl || '/notifications'}
                  className={cn(
                    "flex items-start gap-3 p-2 rounded-md transition-colors",
                    "hover:bg-muted",
                    !notification.read && "bg-muted/50"
                  )}
                >
                  <div className="flex-shrink-0">
                    {notification.sender?.image ? (
                      <div className="relative">
                        <Image
                          src={notification.sender.image}
                          alt={notification.sender.name || ''}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-tight">
                      {notification.sender?.name && (
                        <span className="font-medium">{notification.sender.name} </span>
                      )}
                      {notification.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No recent activity
        </p>
      )}
    </div>
  );
}