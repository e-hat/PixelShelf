'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';

interface FollowButtonProps extends Omit<ButtonProps, 'onClick'> {
  userId: string;
  isFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({ 
  userId, 
  isFollowing: initialIsFollowing, 
  onFollowChange,
  variant = 'pixel',
  size,
  className,
  ...props
}: FollowButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    if (!session) {
      // Redirect to login if not authenticated
      router.push('/login');
      return;
    }

    setIsLoading(true);

    try {
      if (isFollowing) {
        // Unfollow user
        const response = await fetch('/api/follow', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ targetUserId: userId }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to unfollow user');
        }

        setIsFollowing(false);
        if (onFollowChange) onFollowChange(false);
        toast.success('Unfollowed successfully');
      } else {
        // Follow user
        const response = await fetch('/api/follow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ targetUserId: userId }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to follow user');
        }

        setIsFollowing(true);
        if (onFollowChange) onFollowChange(true);
        toast.success('Following successfully');
      }
    } catch (error) {
      console.error('Follow/unfollow error:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
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
        isFollowing ? 'Following' : 'Follow'
      )}
    </Button>
  );
}