// app/notifications/page.tsx
'use client';

import { useEffect } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRelativeTime } from '@/lib/utils';
import {
  useNotificationsQuery,
  useMarkNotificationsAsReadMutation,
} from '@/hooks/use-notifications-query';
import type { Notification } from '@/types';

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 1) Fetch notifications (infinite scroll)
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    hasMore,
    isLoadingMore,
    loadMore,
    refetch,
  } = useNotificationsQuery();

  // 2) Mutation for marking read
  const { mutate: markAllAsRead, mutateAsync: markAsRead } =
    useMarkNotificationsAsReadMutation();

  // 3) On‐click handler
  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) {
      await markAsRead([n.id]);
    }
    if (n.linkUrl) {
      router.push(n.linkUrl);
    }
  };

  // 4) Auth loading / guard
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

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Bell className="h-6 w-6 mr-2" />
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="ml-2 bg-pixelshelf-primary text-white px-2 py-0.5 rounded-full text-xs">
              {unreadCount} new
            </span>
          )}
        </div>

        {notifications.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead(undefined)}
            className="text-sm"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* loading / error / empty / list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-medium mb-2">No notifications yet</h2>
          <p className="text-muted-foreground">
            When people interact with you or your content, you’ll see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-1 mb-6">
          {notifications.map((n: Notification) => (
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
                <p className="text-xs text-muted-foreground mt-1">
                  {getRelativeTime(new Date(n.createdAt))}
                </p>
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

      {/* load more */}
      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button variant="outline" onClick={() => loadMore()} disabled={isLoadingMore}>
            {isLoadingMore ? (
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
