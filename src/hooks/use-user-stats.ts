// src/hooks/use-user-stats.ts
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api/api-client';
import { UserProfile } from '@/types';

/**
 * Hook to fetch current user's profile stats
 */
export function useUserStats() {
  const { data: session, status } = useSession();
  const username = session?.user?.username;
  
  return useQuery({
    queryKey: ['user-stats', username],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!username) return null;
      try {
        return await api.users.getProfile(username);
      } catch (error) {
        console.error('Error fetching user stats:', error);
        return null;
      }
    },
    enabled: status === 'authenticated' && !!username,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}