'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api/api-client';
import { toast } from 'sonner';
import { Project, ProjectQueryParams, UseProjects } from '@/types';

export function useProjects(options: ProjectQueryParams = {}): UseProjects {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(options.page || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const fetchProjects = useCallback(async (reset = false) => {
    try {
      const currentPage = reset ? 1 : page;
      
      if (reset) {
        setIsLoading(true);
        setProjects([]);
      } else if (currentPage > 1) {
        setIsLoadingMore(true);
      }
      
      const response = await api.projects.getAll({
        page: currentPage,
        limit: options.limit || 10,
        userId: options.userId,
        username: options.username,
        search: options.search,
        sort: options.sort || 'latest',
      });
      
      const newProjects = response.projects;
      
      if (reset || currentPage === 1) {
        setProjects(newProjects);
      } else {
        setProjects(prev => [...prev, ...newProjects]);
      }
      
      setPage(currentPage);
      setTotalPages(response.pagination.totalPages);
      setHasMore(currentPage < response.pagination.totalPages);
      setError(null);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to load projects');
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [options, page]);
  
  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, isLoadingMore]);
  
  const reload = useCallback(() => {
    setPage(1);
    fetchProjects(true);
  }, [fetchProjects]);
  
  useEffect(() => {
    fetchProjects(true);
  }, [
    fetchProjects,
    options.userId,
    options.username,
    options.search,
    options.sort,
    options.limit,
  ]);
  
  useEffect(() => {
    if (page > 1) {
      fetchProjects(false);
    }
  }, [page, fetchProjects]);
  
  return {
    projects,
    isLoading,
    error,
    page,
    totalPages,
    hasMore,
    isLoadingMore,
    loadMore,
    reload,
  };
}