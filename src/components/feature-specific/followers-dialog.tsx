// src/components/feature-specific/followers-dialog.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/shared/user-avatar';
import { api, ApiError } from '@/lib/api/api-client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { userKeys } from '@/hooks/use-user-profile-query';

interface User {
  id: string;
  name: string;
  username: string;
  image: string | null;
  bio: string | null;
  followedAt: string;
  isFollowing: boolean;
  isCurrentUser: boolean;
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
  const queryClient = useQueryClient();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState<Record<string, boolean>>({});
  
  const fetchUsers = useCallback(async (resetUsers = false) => {
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
  }, [page, type, username]);
  
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
        
        // Update local state optimistically
        setUsers(prev => 
          prev.map(user => 
            user.id === userId 
              ? { ...user, isFollowing: false } 
              : user
          )
        );
      } else {
        await api.follow.followUser(userId);
        
        // Update local state optimistically
        setUsers(prev => 
          prev.map(user => 
            user.id === userId 
              ? { ...user, isFollowing: true } 
              : user
          )
        );
      }
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: userKeys.profile(username) });
      
      // If we're modifying our own following list, also invalidate our own profile
      if (session.user.username && type === 'following' && username === session.user.username) {
        queryClient.invalidateQueries({ queryKey: userKeys.following(username) });
      }
      
    } catch (err) {
      console.error('Error toggling follow:', err);
      toast.error(
        err instanceof ApiError 
          ? err.message 
          : 'Failed to update follow status'
      );
      
      // Revert the optimistic update on error
      fetchUsers(true);
    } finally {
      setLoadingFollow(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  useEffect(() => {
    if (open) {
      fetchUsers(true);
    }
  }, [open, fetchUsers]);
  
  useEffect(() => {
    if (page > 1) {
      fetchUsers(false);
    }
  }, [page, fetchUsers]);
  
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
                      <p className="font-medium truncate">{user.name || user.username}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        @{user.username}
                      </p>
                    </div>
                  </Link>
                  
                  {session && !user.isCurrentUser && (
                    <Button
                      variant={user.isFollowing ? "outline" : "pixel"}
                      size="sm"
                      className="ml-4 flex-shrink-0"
                      onClick={() => handleFollowToggle(user.id, user.isFollowing)}
                      disabled={loadingFollow[user.id]}
                    >
                      {loadingFollow[user.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : user.isFollowing ? (
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