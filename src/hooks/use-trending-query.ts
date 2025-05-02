// src/hooks/use-trending-query.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/api-client';

// Keys for trending queries
export const trendingKeys = {
  all: ['trending'] as const,
  type: (type: 'assets' | 'creators' | 'projects' | 'all') => 
    [...trendingKeys.all, type] as const,
};

// Get trending items
export function useTrendingQuery(options?: {
  type?: 'assets' | 'creators' | 'projects' | 'all';
  limit?: number;
  enabled?: boolean;
}) {
  const type = options?.type || 'all';
  
  return useQuery({
    queryKey: trendingKeys.type(type),
    queryFn: () => fetch(`/api/trending?type=${type}&limit=${options?.limit || 10}`)
      .then(res => res.json()),
    enabled: options?.enabled !== false,
    // Trending data can be cached longer since it doesn't change frequently
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}