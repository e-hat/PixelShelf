// src/hooks/use-trending-creators.ts

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/api-client';
import { UserProfile } from '@/types';

/**
 * Hook to fetch trending creators
 */
export function useTrendingCreators(limit: number = 5) {
  return useQuery({
    queryKey: ['trending-creators', limit],
    queryFn: async (): Promise<UserProfile[]> => {
      try {
        const response = await api.trending.getAll({ type: 'creators', limit });
        return response.creators || [];
      } catch (error) {
        console.error('Error fetching trending creators:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Extension for the API client
 */
export const extendApiClient = (api: any) => {
  return {
    ...api,
    users: {
      ...api.users,
      getTrendingCreators: async (limit: number = 5): Promise<UserProfile[]> => {
        try {
          const response = await api.trending.getAll({ type: 'creators', limit });
          return response.creators || [];
        } catch (error) {
          console.error('Error fetching trending creators:', error);
          return [];
        }
      }
    }
  };
};

// Extend the API client
api.users = {
  ...api.users,
  getTrendingCreators: async (limit: number = 5): Promise<UserProfile[]> => {
    try {
      const response = await api.trending.getAll({ type: 'creators', limit });
      return response.creators || [];
    } catch (error) {
      console.error('Error fetching trending creators:', error);
      return [];
    }
  }
};