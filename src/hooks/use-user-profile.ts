'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { api, ApiError } from '@/lib/api/api-client';
import { toast } from 'sonner';

export type UserProfile = {
  id: string;
  name: string;
  username: string;
  email?: string;
  bio: string | null;
  image: string | null;
  bannerImage: string | null;
  location: string | null;
  subscriptionTier: string;
  createdAt: string;
  social: {
    twitter?: string;
    github?: string;
    website?: string;
    linkedin?: string;
  } | null;
  stats: {
    followers: number;
    following: number;
    assets: number;
    projects: number;
  };
  isFollowing: boolean;
  isCurrentUser: boolean;
};

export function useUserProfile(username: string) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  
  const fetchProfile = useCallback(async () => {
    if (!username) return;
    
    try {
      setIsLoading(true);
      
      const data = await api.users.getProfile(username);
      
      setProfile(data);
      setIsFollowing(data.isFollowing);
      setFollowerCount(data.stats.followers);
      setError(null);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to load user profile');
      
      if (err instanceof ApiError && err.status === 404) {
        toast.error('User not found');
      } else {
        toast.error('Failed to load user profile');
      }
    } finally {
      setIsLoading(false);
    }
  }, [username]);
  
  const followUser = useCallback(async () => {
    if (!profile || !session) {
      toast.error('You must be signed in to follow users');
      return;
    }
    
    try {
      await api.follow.followUser(profile.id);
      
      setIsFollowing(true);
      setFollowerCount(prev => prev + 1);
      toast.success(`Following @${profile.username}`);
    } catch (err) {
      console.error('Error following user:', err);
      toast.error(err instanceof ApiError ? err.message : 'Failed to follow user');
    }
  }, [profile, session]);
  
  const unfollowUser = useCallback(async () => {
    if (!profile || !session) return;
    
    try {
      await api.follow.unfollowUser(profile.id);
      
      setIsFollowing(false);
      setFollowerCount(prev => Math.max(0, prev - 1));
      toast.success(`Unfollowed @${profile.username}`);
    } catch (err) {
      console.error('Error unfollowing user:', err);
      toast.error(err instanceof ApiError ? err.message : 'Failed to unfollow user');
    }
  }, [profile, session]);
  
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile, username]);
  
  return {
    profile,
    isLoading,
    error,
    isFollowing,
    followerCount,
    followUser,
    unfollowUser,
    refetch: fetchProfile,
  };
}