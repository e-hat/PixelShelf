// src/hooks/use-user-profile-query.ts - Fixed version with proper TypeScript types

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/api-client';
import { toast } from 'sonner';
import { UserProfile } from '@/types';
import { useEffect } from 'react';

// Keys for user queries
export const userKeys = {
  all: ['users'] as const,
  profiles: () => [...userKeys.all, 'profile'] as const,
  profile: (username: string) => [...userKeys.profiles(), username] as const,
  followers: (username: string) => [...userKeys.profile(username), 'followers'] as const,
  following: (username: string) => [...userKeys.profile(username), 'following'] as const,
};

// Get user profile by username
export function useUserProfileQuery(username: string, options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();
  
  const query = useQuery<UserProfile, Error>({
    queryKey: userKeys.profile(username),
    queryFn: () => api.users.getProfile(username),
    enabled: options?.enabled !== false && !!username,
  });
  
  // Use an effect to pre-populate followers/following data when profile is loaded
  useEffect(() => {
    if (query.data && query.data.stats) {
      // Pre-populate the user's followers/following lists with empty results
      // This prevents unnecessary loading states when opening the followers/following dialogs
      queryClient.setQueryData(
        [...userKeys.followers(username), { page: 1, limit: 20 }],
        {
          followers: [],
          pagination: {
            page: 1,
            limit: 20,
            totalCount: query.data.stats.followers,
            totalPages: Math.ceil(query.data.stats.followers / 20),
          },
        }
      );
      
      queryClient.setQueryData(
        [...userKeys.following(username), { page: 1, limit: 20 }],
        {
          following: [],
          pagination: {
            page: 1,
            limit: 20,
            totalCount: query.data.stats.following,
            totalPages: Math.ceil(query.data.stats.following / 20),
          },
        }
      );
    }
  }, [query.data, username, queryClient]);
  
  return query;
}

interface FollowersResponse {
  followers: UserProfile[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

interface FollowingResponse {
  following: UserProfile[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

// Get user followers
export function useUserFollowersQuery(username: string, options?: { 
  page?: number;
  limit?: number;
  enabled?: boolean;
}) {
  return useQuery<FollowersResponse, Error>({
    queryKey: [...userKeys.followers(username), { page: options?.page || 1, limit: options?.limit || 20 }],
    queryFn: () => api.users.getFollowers(username, {
      page: options?.page || 1,
      limit: options?.limit || 20,
    }),
    enabled: options?.enabled !== false && !!username,
  });
}

// Get user following
export function useUserFollowingQuery(username: string, options?: { 
  page?: number;
  limit?: number;
  enabled?: boolean;
}) {
  return useQuery<FollowingResponse, Error>({
    queryKey: [...userKeys.following(username), { page: options?.page || 1, limit: options?.limit || 20 }],
    queryFn: () => api.users.getFollowing(username, {
      page: options?.page || 1,
      limit: options?.limit || 20,
    }),
    enabled: options?.enabled !== false && !!username,
  });
}

// Follow user mutation with optimistic updates
export function useFollowUserMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (targetUserId: string) => api.follow.followUser(targetUserId),
    onMutate: async (targetUserId) => {
      // 1. Capture current state for potential rollback
      const previousUserData = queryClient.getQueriesData({ queryKey: userKeys.profiles() });
      
      // 2. Find any profiles in the cache that match this user ID
      const matchingQueries = queryClient.getQueriesData<UserProfile>({ queryKey: userKeys.profiles() });
      
      for (const [queryKey, userData] of matchingQueries) {
        if (userData && userData.id === targetUserId) {
          // Update the profile with the new follow status
          queryClient.setQueryData(queryKey, {
            ...userData,
            isFollowing: true,
            stats: {
              ...userData.stats,
              followers: userData.stats.followers + 1,
            },
          });
        }
      }
      
      // Return context for rollback
      return { previousUserData };
    },
    onError: (error, targetUserId, context) => {
      // Rollback on error
      if (context?.previousUserData) {
        for (const [queryKey, userData] of context.previousUserData) {
          queryClient.setQueryData(queryKey, userData);
        }
      }
      
      toast.error(error instanceof Error ? error.message : 'Failed to follow user');
    },
    onSuccess: (data, targetUserId) => {
      // Invalidate all profile data to refresh counts
      queryClient.invalidateQueries({ queryKey: userKeys.profiles() });
      toast.success('Followed user successfully');
    },
  });
}

// Unfollow user mutation with optimistic updates
export function useUnfollowUserMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (targetUserId: string) => api.follow.unfollowUser(targetUserId),
    onMutate: async (targetUserId) => {
      // 1. Capture current state for potential rollback
      const previousUserData = queryClient.getQueriesData({ queryKey: userKeys.profiles() });
      
      // 2. Find any profiles in the cache that match this user ID
      const matchingQueries = queryClient.getQueriesData<UserProfile>({ queryKey: userKeys.profiles() });
      
      for (const [queryKey, userData] of matchingQueries) {
        if (userData && userData.id === targetUserId) {
          // Update the profile with the new follow status
          queryClient.setQueryData(queryKey, {
            ...userData,
            isFollowing: false,
            stats: {
              ...userData.stats,
              followers: Math.max(0, userData.stats.followers - 1),
            },
          });
        }
      }
      
      // Return context for rollback
      return { previousUserData };
    },
    onError: (error, targetUserId, context) => {
      // Rollback on error
      if (context?.previousUserData) {
        for (const [queryKey, userData] of context.previousUserData) {
          queryClient.setQueryData(queryKey, userData);
        }
      }
      
      toast.error(error instanceof Error ? error.message : 'Failed to unfollow user');
    },
    onSuccess: (data, targetUserId) => {
      // Invalidate all profile data to refresh counts
      queryClient.invalidateQueries({ queryKey: userKeys.profiles() });
      toast.success('Unfollowed user successfully');
    },
  });
}

// Update user profile mutation
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => api.users.updateProfile(data),
    onSuccess: (data) => {
      // Invalidate current user profile
      queryClient.invalidateQueries({ queryKey: userKeys.profile(data.username) });
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
}