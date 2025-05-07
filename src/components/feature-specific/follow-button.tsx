// src/components/feature-specific/follow-button.tsx - Enhanced for production use

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useFollowUserMutation, useUnfollowUserMutation } from '@/hooks/use-user-profile-query';

interface FollowButtonProps extends Omit<ButtonProps, 'onClick'> {
  userId: string;
  isFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: 'sm' | 'lg' | 'default'; 
  showIcon?: boolean;
}

export default function FollowButton({ 
  userId, 
  isFollowing: initialIsFollowing, 
  onFollowChange,
  variant = 'pixel',
  size = 'default',
  showIcon = false,
  className,
  ...props
}: FollowButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  
  // Use the follow/unfollow mutations from our hooks
  const followMutation = useFollowUserMutation();
  const unfollowMutation = useUnfollowUserMutation();
  
  // Track loading state
  const isLoading = followMutation.isPending || unfollowMutation.isPending;

  // Sync state from props
  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  const handleFollow = async () => {
    if (!session) {
      // Redirect to login if not authenticated
      router.push('/login');
      return;
    }

    try {
      if (isFollowing) {
        // Unfollow user - but first update UI state optimistically
        setIsFollowing(false);
        if (onFollowChange) onFollowChange(false);
        
        // Execute the unfollow mutation
        await unfollowMutation.mutateAsync(userId);
      } else {
        // Follow user - but first update UI state optimistically
        setIsFollowing(true);
        if (onFollowChange) onFollowChange(true);
        
        // Execute the follow mutation
        await followMutation.mutateAsync(userId);
      }
    } catch (error) {
      console.error('Follow/unfollow error:', error);
      
      // Revert the optimistic update on error
      setIsFollowing(initialIsFollowing);
      if (onFollowChange) onFollowChange(initialIsFollowing);
      
      // Show error toast
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  if (session?.user?.id === userId) {
    // Don't show follow button for the current user
    return null;
  }

  return (
    <Button
      onClick={handleFollow}
      variant={isFollowing ? 'outline' : variant}
      size={size}
      className={className}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isFollowing ? 'Unfollowing...' : 'Following...'}
        </>
      ) : (
        <>
          {showIcon && isFollowing && (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="mr-2 h-4 w-4"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <polyline points="16 11 18 13 22 9" />
            </svg>
          )}
          {showIcon && !isFollowing && (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="mr-2 h-4 w-4"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" x2="19" y1="8" y2="14" />
              <line x1="16" x2="22" y1="11" y2="11" />
            </svg>
          )}
          {isFollowing ? 'Following' : 'Follow'}
        </>
      )}
    </Button>
  );
}