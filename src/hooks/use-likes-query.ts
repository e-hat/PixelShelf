// src/hooks/use-likes-query.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/api-client';
import { toast } from 'sonner';
import { assetKeys } from './use-assets-query';
import { projectKeys } from './use-projects-query';

// Like asset mutation
export function useLikeAssetMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (assetId: string) => api.likes.likeAsset(assetId),
    onSuccess: (_, assetId) => {
      // Invalidate asset detail to update liked status
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(assetId) });
      
      // Update asset lists to reflect new like count
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      
      toast.success('Asset liked');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to like asset');
    },
  });
}

// Unlike asset mutation
export function useUnlikeAssetMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (assetId: string) => api.likes.unlikeAsset(assetId),
    onSuccess: (_, assetId) => {
      // Invalidate asset detail to update liked status
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(assetId) });
      
      // Update asset lists to reflect new like count
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      
      toast.success('Like removed');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unlike asset');
    },
  });
}

// Like project mutation
export function useLikeProjectMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (projectId: string) => api.likes.likeProject(projectId),
    onSuccess: (_, projectId) => {
      // Invalidate project detail to update liked status
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      
      // Update project lists to reflect new like count
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      
      toast.success('Project liked');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to like project');
    },
  });
}

// Unlike project mutation
export function useUnlikeProjectMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (projectId: string) => api.likes.unlikeProject(projectId),
    onSuccess: (_, projectId) => {
      // Invalidate project detail to update liked status
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      
      // Update project lists to reflect new like count
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      
      toast.success('Like removed');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unlike project');
    },
  });
}

// Combined like/unlike toggle function
export function useAssetLikeToggle() {
  const likeMutation = useLikeAssetMutation();
  const unlikeMutation = useUnlikeAssetMutation();
  
  return {
    toggleLike: (assetId: string, isLiked: boolean) => {
      if (isLiked) {
        unlikeMutation.mutate(assetId);
      } else {
        likeMutation.mutate(assetId);
      }
    },
    isLoading: likeMutation.isPending || unlikeMutation.isPending,
  };
}

export function useProjectLikeToggle() {
  const likeMutation = useLikeProjectMutation();
  const unlikeMutation = useUnlikeProjectMutation();
  
  return {
    toggleLike: (projectId: string, isLiked: boolean) => {
      if (isLiked) {
        unlikeMutation.mutate(projectId);
      } else {
        likeMutation.mutate(projectId);
      }
    },
    isLoading: likeMutation.isPending || unlikeMutation.isPending,
  };
}