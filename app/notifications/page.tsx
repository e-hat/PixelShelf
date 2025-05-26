// app/notifications/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  User,
  Loader2,
  Heart,
  MessageSquare,
  UserPlus,
  CheckCheck,
  Info,
  AlertCircle,
  RefreshCw,
  Calendar,
  Filter,
  X,
  Archive,
  Trash2,
  Settings,
  Check,
  Search,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getRelativeTime, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/notification-context';
import {
  useInfiniteNotificationsQuery,
} from '@/hooks/use-notifications-query';
import type { Notification } from '@/types';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

const NOTIFICATION_TYPES = [
  { value: 'FOLLOW', label: 'Follows', icon: UserPlus, color: 'text-blue-500' },
  { value: 'LIKE', label: 'Likes', icon: Heart, color: 'text-red-500' },
  { value: 'COMMENT', label: 'Comments', icon: MessageSquare, color: 'text-green-500' },
  { value: 'MESSAGE', label: 'Messages', icon: MessageSquare, color: 'text-pixelshelf-primary' },
  { value: 'SYSTEM', label: 'System', icon: Info, color: 'text-amber-500' },
] as const;

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const {
    selectedNotifications,
    toggleNotificationSelection,
    selectAllNotifications,
    clearSelection,
    markAsRead,
    markAllAsRead,
    archiveNotifications,
    deleteNotifications,
  } = useNotifications();
  
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [filterTypes, setFilterTypes] = useState<Set<Notification['type']>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});

  // Fetch notifications with infinite scroll
  const {
    data,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteNotificationsQuery({
    unreadOnly: activeTab === 'unread',
    enabled: status === 'authenticated',
  });

  // Flatten pages of notifications
  const allNotifications = data?.pages.flatMap(page => page.notifications) || [];
  const unreadCount = data?.pages[0]?.unreadCount || 0;

  // Filter notifications based on criteria
  const filteredNotifications = useMemo(() => {
    let filtered = allNotifications;
    
    // Filter by type
    if (filterTypes.size > 0) {
      filtered = filtered.filter(n => filterTypes.has(n.type));
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.content.toLowerCase().includes(query) ||
        n.sender?.name?.toLowerCase().includes(query) ||
        n.sender?.username?.toLowerCase().includes(query)
      );
    }
    
    // Filter by date range
    if (dateRange.start) {
      filtered = filtered.filter(n => new Date(n.createdAt) >= dateRange.start!);
    }
    if (dateRange.end) {
      filtered = filtered.filter(n => new Date(n.createdAt) <= dateRange.end!);
    }
    
    return filtered;
  }, [allNotifications, filterTypes, searchQuery, dateRange]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    filteredNotifications.forEach(notification => {
      const date = new Date(notification.createdAt);
      let key: string;
      
      if (date.toDateString() === today.toDateString()) {
        key = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Yesterday';
      } else {
        key = formatDate(date);
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(notification);
    });
    
    return groups;
  }, [filteredNotifications]);

  // Set up infinite scroll
  const { ref: loadMoreRef } = useIntersectionObserver({
    rootMargin: '100px',
    enabled: hasNextPage && !isFetchingNextPage,
    onIntersect: fetchNextPage,
  });

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead([notification.id]);
    }
    if (notification.linkUrl) {
      router.push(notification.linkUrl);
    }
  };

  const handleBulkAction = async (action: 'read' | 'archive' | 'delete') => {
    const selectedIds = Array.from(selectedNotifications);
    if (selectedIds.length === 0) return;
    
    try {
      switch (action) {
        case 'read':
          await markAsRead(selectedIds);
          break;
        case 'archive':
          await archiveNotifications(selectedIds);
          break;
        case 'delete':
          await deleteNotifications(selectedIds);
          break;
      }
      clearSelection();
    } catch (error) {
      console.error(`Failed to ${action} notifications:`, error);
    }
  };

  const toggleTypeFilter = (type: Notification['type']) => {
    setFilterTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  if (status === 'loading') {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="bg-muted p-6 rounded-full">
            <Bell className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Sign in to view notifications</h1>
          <p className="text-muted-foreground">
            You need to sign in to access your notifications.
          </p>
          <Button variant="pixel" onClick={() => router.push('/login')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `You have ${unreadCount} unread notifications` : "You're all caught up!"}
        actions={
          <div className="flex items-center space-x-2">
            <Link href="/settings/notifications">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Tabs and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'unread')}>
            <TabsList>
              <TabsTrigger value="all" className="flex items-center">
                All
                {allNotifications.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {allNotifications.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex items-center">
                Unread
                {unreadCount > 0 && (
                  <Badge variant="pixel" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>

            {/* Filter button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && "bg-muted")}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {filterTypes.size > 0 && (
                <Badge variant="pixel" className="ml-2">
                  {filterTypes.size}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border rounded-lg p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3">Notification Type</h3>
                  <div className="flex flex-wrap gap-2">
                    {NOTIFICATION_TYPES.map(({ value, label, icon: Icon, color }) => (
                      <Button
                        key={value}
                        variant={filterTypes.has(value) ? "pixel" : "outline"}
                        size="sm"
                        onClick={() => toggleTypeFilter(value)}
                      >
                        <Icon className={cn("h-4 w-4 mr-2", color)} />
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFilterTypes(new Set());
                      setSearchQuery('');
                      setDateRange({});
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bulk actions */}
      {selectedNotifications.size > 0 && (
        <div className="mb-4 p-4 bg-muted rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={selectedNotifications.size === filteredNotifications.length}
              onCheckedChange={(checked) => {
                if (checked) {
                  selectAllNotifications();
                } else {
                  clearSelection();
                }
              }}
            />
            <span className="text-sm font-medium">
              {selectedNotifications.size} selected
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('read')}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark as read
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('archive')}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('delete')}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Mark all as read */}
      {unreadCount > 0 && selectedNotifications.size === 0 && (
        <div className="mb-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        </div>
      )}

      {/* Notifications list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'Failed to load notifications'}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-medium mb-2">
            {searchQuery || filterTypes.size > 0 
              ? 'No notifications match your filters' 
              : activeTab === 'unread' 
                ? 'No unread notifications' 
                : 'No notifications yet'}
          </h2>
          <p className="text-muted-foreground">
            {searchQuery || filterTypes.size > 0
              ? 'Try adjusting your filters'
              : activeTab === 'unread'
                ? "You're all caught up!"
                : 'When people interact with you or your content, you\'ll see it here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(([date, notifications]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{date}</h3>
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    isSelected={selectedNotifications.has(notification.id)}
                    onToggleSelect={() => toggleNotificationSelection(notification.id)}
                    onClick={() => handleNotificationClick(notification)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more indicator */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="w-full flex justify-center py-8">
          {isFetchingNextPage && (
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground mt-2">Loading more...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  isSelected,
  onToggleSelect,
  onClick,
}: {
  notification: Notification;
  isSelected: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
}) {
  const notificationType = NOTIFICATION_TYPES.find(t => t.value === notification.type);
  const Icon = notificationType?.icon || Bell;
  const iconColor = notificationType?.color || 'text-muted-foreground';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-start p-4 hover:bg-muted/50 rounded-lg transition-colors group",
        !notification.read && "bg-muted/30"
      )}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggleSelect}
        className="mr-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      />
      
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-4">
            {notification.sender ? (
              <div className="relative">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-muted">
                  {notification.sender.image ? (
                    <Image
                      src={notification.sender.image}
                      alt={notification.sender.name || ''}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 p-2 text-muted-foreground" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 p-0.5 rounded-full">
                  <Icon className={cn("h-4 w-4", iconColor)} />
                </div>
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Icon className={cn("h-5 w-5", iconColor)} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm">
              {notification.sender && (
                <span className="font-medium">{notification.sender.name} </span>
              )}
              {notification.content}
            </p>
            <div className="flex items-center mt-1 space-x-2">
              <p className="text-xs text-muted-foreground">
                {getRelativeTime(new Date(notification.createdAt))}
              </p>
              <Badge variant="outline" className="text-xs">
                {notificationType?.label || notification.type}
              </Badge>
            </div>
          </div>

          {!notification.read && (
            <div className="flex-shrink-0 ml-2">
              <div className="h-2 w-2 rounded-full bg-pixelshelf-primary" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}