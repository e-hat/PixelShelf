// app/notifications/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
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
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { getRelativeTime, formatDate } from '@/lib/utils';
import {
  useInfiniteNotificationsQuery,
  useMarkNotificationsAsReadMutation,
} from '@/hooks/use-notifications-query';
import type { Notification } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Type guard to verify valid notification types
function isValidNotificationType(type: string): type is Notification['type'] {
  return ['FOLLOW', 'LIKE', 'COMMENT', 'MESSAGE', 'SYSTEM'].includes(type as Notification['type']);
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [filterType, setFilterType] = useState<Notification['type'] | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // 1) Fetch notifications (infinite scroll)
  const {
    data,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteNotificationsQuery({
    enabled: status === 'authenticated'
  });

  // Derive notifications from infinite query data
  const notifications = data?.pages.flatMap(page => page.notifications) || [];
  const unreadCount = data?.pages[0]?.unreadCount || 0;

  // 2) Mutation for marking read
  const { mutate: markAllAsRead, mutateAsync: markAsRead } =
    useMarkNotificationsAsReadMutation();

  // 3) Filter notifications
  const filteredNotifications = filterType 
    ? notifications.filter(n => n.type === filterType) 
    : notifications;

  // 4) On‐click handler
  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) {
      try {
        await markAsRead([n.id]);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    if (n.linkUrl) {
      router.push(n.linkUrl);
    }
  };

  // 5) Helper to pick the right icon
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'FOLLOW':
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case 'LIKE':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'COMMENT':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'MESSAGE':
        return <MessageSquare className="h-5 w-5 text-pixelshelf-primary" />;
      case 'SYSTEM':
        return <Info className="h-5 w-5 text-amber-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // 6) Get notification type label
  const getNotificationTypeLabel = (type: Notification['type']) => {
    switch (type) {
      case 'FOLLOW':
        return 'Follows';
      case 'LIKE':
        return 'Likes';
      case 'COMMENT':
        return 'Comments';
      case 'MESSAGE':
        return 'Messages';
      case 'SYSTEM':
        return 'System';
      default:
        return 'All';
    }
  };

  // 7) Calculate notification stats with proper typing
  const notificationStats = notifications.reduce((acc, n) => {
    if (!acc[n.type]) acc[n.type] = 0;
    acc[n.type]++;
    return acc;
  }, {} as Record<Notification['type'], number>);

  // 8) Auth loading / guard
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
        description={unreadCount > 0 ? `You have ${unreadCount} new notifications` : "See all your activity"}
        actions={
          notifications.length > 0 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className={cn(
                  "flex items-center",
                  filterType && "border-pixelshelf-primary text-pixelshelf-primary"
                )}
              >
                <Filter className="h-4 w-4 mr-2" />
                {filterType ? getNotificationTypeLabel(filterType) : 'All'}
                {filterType && (
                  <X 
                    className="ml-2 h-4 w-4" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilterType(null);
                    }}
                  />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsRead(undefined)}
                className="text-sm"
                disabled={notifications.every(n => n.read)}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            </div>
          )
        }
      />
      
      {/* Filter menu */}
      {showFilterMenu && (
        <div className="mb-6 p-6 border rounded-lg shadow-sm bg-background">
          <h3 className="text-lg font-medium mb-4">Filter Notifications</h3>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant={filterType === null ? "pixel" : "outline"}
              size="sm"
              onClick={() => {
                setFilterType(null);
                setShowFilterMenu(false);
              }}
            >
              All ({notifications.length})
            </Button>
            {Object.entries(notificationStats).map(([typeKey, countValue]) => {
              // Force the type to be recognized as a valid notification type
              const type = typeKey as Notification['type'];
              const label = getNotificationTypeLabel(type);
              // Explicitly type count as number
              const count = countValue as number;
              return (
                <Button
                  key={type}
                  variant={filterType === type ? "pixel" : "outline"}
                  size="sm"
                  onClick={() => {
                    setFilterType(type);
                    setShowFilterMenu(false);
                  }}
                >
                  {label} ({count})
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading / error / empty / list */}
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
            {filterType ? `No ${getNotificationTypeLabel(filterType)} notifications` : 'No notifications yet'}
          </h2>
          <p className="text-muted-foreground">
            {filterType 
              ? `You don't have any ${getNotificationTypeLabel(filterType).toLowerCase()} notifications yet.`
              : 'When people interact with you or your content, you\'ll see it here.'}
          </p>
          {filterType && (
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => setFilterType(null)}
            >
              View all notifications
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-1 mb-6">
          {filteredNotifications.map((n: Notification) => (
            <div
              key={n.id}
              className={`flex items-start p-4 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer ${
                !n.read ? 'bg-muted/30' : ''
              }`}
              onClick={() => handleNotificationClick(n)}
            >
              <div className="flex-shrink-0 mr-4">
                {n.sender ? (
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-muted">
                      {n.sender.image ? (
                        <Image
                          src={n.sender.image}
                          alt={n.sender.name || ''}
                          width={40}
                          height={40}
                          className="object-cover"
                          placeholder="blur"
                          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFfwJnQMuRpQAAAABJRU5ErkJggg=="
                          sizes="40px"
                        />
                      ) : (
                        <User className="h-10 w-10 p-2 text-muted-foreground" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 p-0.5 rounded-full">
                      {getNotificationIcon(n.type)}
                    </div>
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    {getNotificationIcon(n.type)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">
                    {n.sender?.name || 'PixelShelf'}
                  </span>{' '}
                  {n.content}
                </p>
                <div className="flex items-center mt-1 space-x-2">
                  <p className="text-xs text-muted-foreground">
                    {getRelativeTime(new Date(n.createdAt))}
                  </p>
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    {getNotificationTypeLabel(n.type)}
                  </Badge>
                </div>
              </div>

              {!n.read && (
                <div className="flex-shrink-0 ml-2">
                  <div className="h-2 w-2 rounded-full bg-pixelshelf-primary" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasNextPage && (
        <div className="flex justify-center mt-6">
          <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
                'Load more'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}