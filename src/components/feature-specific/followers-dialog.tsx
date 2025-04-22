'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/feature-specific/user-avatar';
import { api, ApiError } from '@/lib/api/api-client';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  username: string;
  image: string | null;
  bio: string | null;
  followedAt: string;
}

interface FollowersDialogProps {
  username: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'followers' | 'following';
  initialCount: number;
}

export function FollowersDialog({ 
  username, 
  open, 
  onOpenChange, 
  type, 
  initialCount 
}: FollowersDialogProps) {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [loadingFollow, setLoadingFollow] = useState<Record<string, boolean>>({});
  
  const fetchUsers = async (resetUsers = false) => {
    if (resetUsers) {
      setIsLoading(true);
      setPage(1);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const response = type === 'followers'
        ? await api.users.getFollowers(username, { page, limit: 20 })
        : await api.users.getFollowing(username, { page, limit: 20 });
      
      const userList = type === 'followers' ? response.followers : response.following;
      
      if (resetUsers) {
        setUsers(userList);
      } else {
        setUsers(prev => [...prev, ...userList]);
      }
      
      setHasMore(page < response.pagination.totalPages);
      setError(null);
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
      setError(
        err instanceof ApiError 
          ? err.message 
          : `Failed to load ${type}`
      );
      toast.error(`Failed to load ${type}`);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };
  
  const loadMore = () => {
    if (hasMore && !isLoadingMore) {
      setPage(prev => prev + 1);
    }
  };
  
  const handleFollowToggle = async (userId: string, isFollowing: boolean) => {
    if (!session) {
      toast.error('You must be signed in to follow users');
      return;
    }
    
    setLoadingFollow(prev => ({ ...prev, [userId]: true }));
    
    try {
      if (isFollowing) {
        await api.follow.unfollowUser(userId);
        setFollowingMap(prev => ({ ...prev, [userId]: false }));
      } else {
        await api.follow.followUser(userId);
        setFollowingMap(prev => ({ ...prev, [userId]: true }));
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
      toast.error(
        err instanceof ApiError 
          ? err.message 
          : 'Failed to update follow status'
      );
    } finally {
      setLoadingFollow(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  useEffect(() => {
    if (open) {
      fetchUsers(true);
    }
  }, [open, type, username]);
  
  useEffect(() => {
    if (page > 1) {
      fetchUsers(false);
    }
  }, [page]);
  
  useEffect(() => {
    // Reset following state when users change
    if (users.length > 0 && session) {
      // Initialize with dummy data - in a real app, we'd fetch follow status
      const initialMap: Record<string, boolean> = {};
      users.forEach(user => {
        // Assume not following for simplicity
        initialMap[user.id] = false;
      });
      setFollowingMap(initialMap);
    }
  }, [users, session]);
  
  const title = type === 'followers' ? 'Followers' : 'Following';
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {initialCount} {initialCount === 1 ? 'person' : 'people'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[60vh] overflow-y-auto -mx-6 px-6">
          {isLoading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={() => fetchUsers(true)} className="mt-4">
                Retry
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                No {type === 'followers' ? 'followers' : 'following'} yet
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between">
                  <Link 
                    href={`/u/${user.username}`} 
                    className="flex items-center space-x-3 flex-1 min-w-0"
                    onClick={() => onOpenChange(false)}
                  >
                    <UserAvatar user={user} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        @{user.username}
                      </p>
                    </div>
                  </Link>
                  
                  {session && session.user.id !== user.id && (
                    <Button
                      variant={followingMap[user.id] ? 'outline' : 'pixel'}
                      size="sm"
                      className="ml-4 flex-shrink-0"
                      onClick={() => handleFollowToggle(user.id, followingMap[user.id])}
                      disabled={loadingFollow[user.id]}
                    >
                      {loadingFollow[user.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : followingMap[user.id] ? (
                        'Following'
                      ) : (
                        'Follow'
                      )}
                    </Button>
                  )}
                </div>
              ))}
              
              {hasMore && (
                <div className="pt-4 flex justify-center">
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}