// src/hooks/use-user-profile-query.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/api-client';
import { toast } from 'sonner';

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
  return useQuery({
    queryKey: userKeys.profile(username),
    queryFn: () => api.users.getProfile(username),
    enabled: options?.enabled !== false && !!username,
  });
}

// Get user followers
export function useUserFollowersQuery(username: string, options?: { 
  page?: number;
  limit?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: [...userKeys.followers(username), { page: options?.page || 1, limit: options?.limit || 10 }],
    queryFn: () => api.users.getFollowers(username, {
      page: options?.page || 1,
      limit: options?.limit || 10,
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
  return useQuery({
    queryKey: [...userKeys.following(username), { page: options?.page || 1, limit: options?.limit || 10 }],
    queryFn: () => api.users.getFollowing(username, {
      page: options?.page || 1,
      limit: options?.limit || 10,
    }),
    enabled: options?.enabled !== false && !!username,
  });
}

// Follow user mutation
export function useFollowUserMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (targetUserId: string) => api.follow.followUser(targetUserId),
    onSuccess: (_, targetUserId) => {
      // We don't know the username from just the ID, so invalidate all profiles
      queryClient.invalidateQueries({ queryKey: userKeys.profiles() });
      toast.success('Followed user successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to follow user');
    },
  });
}

// Unfollow user mutation
export function useUnfollowUserMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (targetUserId: string) => api.follow.unfollowUser(targetUserId),
    onSuccess: (_, targetUserId) => {
      // Invalidate all profiles
      queryClient.invalidateQueries({ queryKey: userKeys.profiles() });
      toast.success('Unfollowed user successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unfollow user');
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