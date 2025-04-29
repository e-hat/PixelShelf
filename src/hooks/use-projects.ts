'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api, ApiError } from '@/lib/api/api-client';
import { toast } from 'sonner';
import { Project, ProjectQueryParams, UseProjects } from '@/types';

export function useProjects(options: ProjectQueryParams | null = {}): UseProjects {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(options?.page || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Use refs to track previous options and prevent unnecessary refetches
  const prevOptionsRef = useRef<string | null>(null);
  
  const fetchProjects = useCallback(async (reset = false) => {
    // If options is null, don't fetch anything
    if (!options) {
      setIsLoading(false);
      setProjects([]);
      return;
    }
    
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
    // Convert options to string for comparison
    const optionsString = options ? JSON.stringify(options) : null;
    
    // Only fetch if options have changed
    if (optionsString !== prevOptionsRef.current) {
      setPage(1);
      fetchProjects(true);
      prevOptionsRef.current = optionsString;
    }
  }, [fetchProjects, options]);
  
  useEffect(() => {
    if (page > 1 && options) {
      fetchProjects(false);
    }
  }, [page, fetchProjects, options]);
  
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