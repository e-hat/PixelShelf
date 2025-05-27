// src/components/feature-specific/recent-activity-widget.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Loader2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, getRelativeTime } from '@/lib/utils';
import { notificationService } from '@/services/notification-service';
import { useNotificationsQuery } from '@/hooks/use-notifications-query';
import { Notification } from '@/types';
import { useMarkNotificationsAsReadMutation } from '@/hooks/use-notifications-query';

interface RecentActivityWidgetProps {
  className?: string;
  limit?: number;
  showRefresh?: boolean;
  autoMarkAsRead?: boolean;
}

export function RecentActivityWidget({ 
  className, 
  limit = 5,
  showRefresh = false,
  autoMarkAsRead = false
}: RecentActivityWidgetProps) {
  const { data: session } = useSession();
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);
  const [newNotificationIds, setNewNotificationIds] = useState<Set<string>>(new Set());
  
  const { notifications, isLoading, refetch } = useNotificationsQuery({
    limit,
    enabled: !!session,
  });

  const markAsReadMutation = useMarkNotificationsAsReadMutation();

  // Update local state when query data changes
  useEffect(() => {
    if (notifications) {
      setLocalNotifications(notifications);
      
      // Auto-mark as read if enabled
      if (autoMarkAsRead) {
        const unreadIds = notifications
          .filter((n: { read: any; }) => !n.read)
          .map((n: { id: any; }) => n.id);
        
        if (unreadIds.length > 0) {
          setTimeout(() => {
            markAsReadMutation.mutate(unreadIds);
          }, 3000); // Mark as read after 3 seconds
        }
      }
    }
  }, [notifications, autoMarkAsRead, markAsReadMutation]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (session?.user?.id) {
      const unsubscribe = notificationService.subscribe('notification', (notification: Notification) => {
        // Add new notification to the top and mark it as new
        setLocalNotifications(prev => [notification, ...prev].slice(0, limit));
        setNewNotificationIds(prev => new Set([...prev, notification.id]));
        
        // Remove the "new" indicator after animation
        setTimeout(() => {
          setNewNotificationIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(notification.id);
            return newSet;
          });
        }, 3000);
        
        // Refetch to sync with server
        refetch();
      });

      return () => {
        unsubscribe();
      };
    }
  }, [session, limit, refetch]);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const getNotificationIcon = (type: Notification['type']) => {
    const iconClass = "h-3 w-3";
    switch (type) {
      case 'FOLLOW':
        return <UserCheck className={cn(iconClass, "text-blue-500")} />;
      case 'LIKE':
        return <Heart className={cn(iconClass, "text-red-500")} />;
      case 'COMMENT':
        return <MessageSquare className={cn(iconClass, "text-green-500")} />;
      case 'MESSAGE':
        return <MessageSquare className={cn(iconClass, "text-pixelshelf-primary")} />;
      case 'SYSTEM':
        return <Info className={cn(iconClass, "text-amber-500")} />;
      default:
        return <Bell className={cn(iconClass, "text-muted-foreground")} />;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate([notification.id]);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Recent Activity</h3>
        <div className="flex items-center space-x-2">
          {showRefresh && (
            <button
              onClick={handleRefresh}
              className="text-muted-foreground hover:text-foreground transition-colors"
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </button>
          )}
          <Link 
            href="/notifications" 
            className="text-xs text-pixelshelf-primary hover:underline flex items-center"
          >
            See all
            <ArrowUpRight className="h-3 w-3 ml-1" />
          </Link>
        </div>
      </div>
      
      {isLoading && localNotifications.length === 0 ? (
        <div className="py-4 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : localNotifications.length > 0 ? (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {localNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                layout
                initial={newNotificationIds.has(notification.id) ? 
                  { opacity: 0, y: -20, scale: 0.95 } : 
                  { opacity: 1, y: 0, scale: 1 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ 
                  duration: 0.2,
                  layout: { duration: 0.2 }
                }}
                className={cn(
                  "relative",
                  newNotificationIds.has(notification.id) && "overflow-hidden"
                )}
              >
                {/* New notification indicator */}
                {newNotificationIds.has(notification.id) && (
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 1.5, ease: "linear" }}
                    className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-pixelshelf-primary/20 to-transparent"
                  />
                )}
                
                <Link 
                  href={notification.linkUrl || '/notifications'}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "block p-2 rounded-md transition-colors",
                    "hover:bg-muted",
                    !notification.read && "bg-muted/50",
                    newNotificationIds.has(notification.id) && "ring-1 ring-pixelshelf-primary/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {notification.sender?.image ? (
                        <div className="relative">
                          <Image
                            src={notification.sender.image}
                            alt={notification.sender.name || ''}
                            width={32}
                            height={32}
                            className="rounded-full object-cover"
                          />
                          <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow-sm">
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
                      <p className="text-sm leading-tight line-clamp-2">
                        {notification.sender?.name && (
                          <span className="font-medium">{notification.sender.name} </span>
                        )}
                        {notification.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {getRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                    
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-pixelshelf-primary animate-pulse" />
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-8 bg-muted/30 rounded-lg">
          <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No recent activity
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            We'll notify you when something happens
          </p>
        </div>
      )}
    </div>
  );
}