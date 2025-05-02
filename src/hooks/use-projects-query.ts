// src/hooks/use-projects-query.ts
import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
  type FetchNextPageOptions,
  type QueryFunctionContext,
} from '@tanstack/react-query';
import { api } from '@/lib/api/api-client';
import { Project, ProjectFormValues } from '@/types';
import { toast } from 'sonner';

// Keys for projects queries
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: any) => [...projectKeys.lists(), filters] as const,
  infiniteList: (filters: any) => [...projectKeys.lists(), 'infinite', filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

// Shape of one page of projects
type ProjectsPage = Awaited<ReturnType<typeof api.projects.getAll>>;

// Base options type for both query hooks
type ProjectQueryOptions = {
  userId?: string;
  username?: string;
  search?: string;
  sort?: 'latest' | 'oldest' | 'popular';
  limit?: number;
  enabled?: boolean;
};

// Standard projects query (single page)
export function useProjectsQuery(options: ProjectQueryOptions = {}) {
  const {
    enabled: userEnabled = true,
    limit = 12,
    ...queryOptions
  } = options;

  const queryKey = projectKeys.list({
    userId: queryOptions.userId,
    username: queryOptions.username,
    search: queryOptions.search,
    sort: queryOptions.sort,
  });

  const query = useQuery<ProjectsPage, Error>({
    queryKey,
    queryFn: () => api.projects.getAll({
      ...queryOptions,
      page: 1,
      limit,
    }),
    enabled: userEnabled,
  });

  const projects = query.data?.projects ?? [];
  const pagination = query.data?.pagination;
  const hasMore = Boolean(pagination && pagination.page < pagination.totalPages);
  const loadMore = () => Promise.resolve(); // No-op for compatibility

  return {
    projects,
    pagination,
    hasMore,
    isLoadingMore: false,
    loadMore,
    ...query,
  };
}

// Infinite projects query (paginated)
export function useInfiniteProjectsQuery(options: ProjectQueryOptions = {}) {
  const {
    enabled: userEnabled = true,
    limit = 12,
    ...queryOptions
  } = options;

  const queryKey = projectKeys.infiniteList({
    userId: queryOptions.userId,
    username: queryOptions.username,
    search: queryOptions.search,
    sort: queryOptions.sort,
  });

  const query = useInfiniteQuery<
    ProjectsPage,
    Error,
    ProjectsPage,
    typeof queryKey,
    number
  >({
    queryKey,
    queryFn: ({
      pageParam = 1,
    }: QueryFunctionContext<typeof queryKey, number>) =>
      api.projects.getAll({
        ...queryOptions,
        page: pageParam,
        limit,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    initialPageParam: 1,
    enabled: userEnabled,
  });

  // Flatten all pages into one array
  const pages = query.data?.pages ?? [];
  const projects = pages.flatMap((p: ProjectsPage) => p.projects) ?? [];
  const hasMore = query.hasNextPage;
  const isLoadingMore = query.isFetchingNextPage;
  const loadMore = query.fetchNextPage;

  return {
    projects,
    hasMore,
    isLoadingMore,
    loadMore,
    ...query,
  };
}

// Get single project by ID
export function useProjectQuery(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => api.projects.getById(id),
    enabled: options?.enabled !== false && !!id,
  });
}

// Create project mutation
export function useCreateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProjectFormValues) => api.projects.create(data),
    onSuccess: () => {
      // Invalidate both types of project lists
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success('Project created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create project');
    },
  });
}

// Update project mutation
export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      api.projects.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success('Project updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update project');
    },
  });
}

// Delete project mutation
export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.projects.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) });
      toast.success('Project deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete project');
    },
  });
}