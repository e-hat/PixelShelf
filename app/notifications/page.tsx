'use client';

import { useState, useEffect } from 'react';
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
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRelativeTime } from '@/lib/utils';

type Notification = {
  id: string;
  type: 'FOLLOW' | 'LIKE' | 'COMMENT' | 'MESSAGE' | 'SYSTEM';
  content: string;
  linkUrl?: string;
  read: boolean;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    username: string;
    image: string;
  };
};

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch notifications
  const fetchNotifications = async (pageNum = 1, replace = true) => {
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const response = await fetch(`/api/notifications?page=${pageNum}&limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      
      if (replace) {
        setNotifications(data.notifications);
      } else {
        setNotifications(prev => [...prev, ...data.notifications]);
      }
      
      setUnreadCount(data.unreadCount);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again.');
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Load more notifications
  const loadMore = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage, false);
    }
  };

  // Mark notifications as read
  const markAsRead = async (ids?: string[]) => {
    try {
      const payload = ids ? { ids } : { all: true };
      
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }
      
      // Update local state
      if (ids) {
        setNotifications(prev => 
          prev.map(notification => 
            ids.includes(notification.id) 
              ? { ...notification, read: true } 
              : notification
          )
        );
        
        // Update unread count
        const markedCount = ids.length;
        setUnreadCount(prev => Math.max(0, prev - markedCount));
      } else {
        // All notifications marked as read
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
        setUnreadCount(0);
      }
      
      toast.success(ids ? 'Notification marked as read' : 'All notifications marked as read');
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      toast.error('Failed to mark notifications as read');
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      // Mark as read when clicked
      await markAsRead([notification.id]);
    }
    
    // Navigate to the link URL if provided
    if (notification.linkUrl) {
      router.push(notification.linkUrl);
    }
  };

  // Load notifications on mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotifications();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Check for authentication
  if (status === 'loading') {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect in useEffect
  }

  // Get notification icon based on type
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
            onClick={() => markAsRead()}
            className="text-sm"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchNotifications()}>Try again</Button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-medium mb-2">No notifications yet</h2>
          <p className="text-muted-foreground">
            When people interact with you or your content, you'll see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-1 mb-6">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start p-4 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer ${
                !notification.read ? 'bg-muted/30' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex-shrink-0 mr-4">
                {notification.sender ? (
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-muted">
                      {notification.sender.image ? (
                        <Image
                          src={notification.sender.image}
                          alt={notification.sender.name}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      ) : (
                        <User className="h-10 w-10 p-2 text-muted-foreground" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 p-0.5 rounded-full">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    {getNotificationIcon(notification.type)}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">
                    {notification.sender?.name || 'PixelShelf'}
                  </span>{' '}
                  {notification.content}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {getRelativeTime(new Date(notification.createdAt))}
                </p>
              </div>
              
              {!notification.read && (
                <div className="flex-shrink-0 ml-2">
                  <div className="h-2 w-2 rounded-full bg-pixelshelf-primary"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Load more button */}
      {page < totalPages && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isLoadingMore}
          >
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