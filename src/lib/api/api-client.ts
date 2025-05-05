'use client';

// Define a custom error class for API errors
export class ApiError extends Error {
  public status: number;
  public data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Define base API client
export const apiClient = {
  // GET request
  async get<T = any>(url: string, options?: RequestInit): Promise<T> {
    return await request<T>(url, {
      ...options,
      method: 'GET',
    });
  },

  // POST request
  async post<T = any>(url: string, data?: any, options?: RequestInit): Promise<T> {
    return await request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // PUT request
  async put<T = any>(url: string, data?: any, options?: RequestInit): Promise<T> {
    return await request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // PATCH request
  async patch<T = any>(url: string, data?: any, options?: RequestInit): Promise<T> {
    return await request<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // DELETE request
  async delete<T = any>(url: string, options?: RequestInit): Promise<T> {
    return await request<T>(url, {
      ...options,
      method: 'DELETE',
    });
  },
};

// Generic request function
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options?.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  let data: any;
  try {
    data = await response.json();
  } catch (error) {
    // If the response is not JSON, use the status text as the response data
    data = { message: response.statusText };
  }

  if (!response.ok) {
    throw new ApiError(
      data?.error || data?.message || 'Something went wrong',
      response.status,
      data
    );
  }

  return data as T;
}

// Type-safe API endpoints
export const api = {
  // Assets
  assets: {
    getAll: (params?: Record<string, any>) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
      }
      return apiClient.get(`/api/assets?${searchParams.toString()}`);
    },
    getById: (id: string) => apiClient.get(`/api/assets/${id}`),
    create: (data: any) => apiClient.post('/api/assets', data),
    update: (id: string, data: any) => apiClient.patch(`/api/assets/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/assets/${id}`),
  },

  // Projects
  projects: {
    getAll: (params?: Record<string, any>) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
      }
      return apiClient.get(`/api/projects?${searchParams.toString()}`);
    },
    getById: (id: string) => apiClient.get(`/api/projects/${id}`),
    create: (data: any) => apiClient.post('/api/projects', data),
    update: (id: string, data: any) => apiClient.patch(`/api/projects/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/projects/${id}`),
  },

  // Users
  users: {
    getProfile: (username: string) => apiClient.get(`/api/users/${username}`),
    getFollowers: (username: string, params?: { page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', String(params.page));
      if (params?.limit) searchParams.append('limit', String(params.limit));
      return apiClient.get(`/api/users/${username}/followers?${searchParams.toString()}`);
    },
    getFollowing: (username: string, params?: { page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', String(params.page));
      if (params?.limit) searchParams.append('limit', String(params.limit));
      return apiClient.get(`/api/users/${username}/following?${searchParams.toString()}`);
    },
    updateProfile: (data: any) => apiClient.patch('/api/users/profile', data),
    getCreators: (params?: { 
      search?: string; 
      tag?: string; 
      page?: number; 
      limit?: number;
      sort?: 'popular' | 'latest'
    }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
      }
      return apiClient.get(`/api/users?${searchParams.toString()}`);
    },
  },

  // Follow
  follow: {
    followUser: (targetUserId: string) => apiClient.post('/api/follow', { targetUserId }),
    unfollowUser: (targetUserId: string) => apiClient.delete('/api/follow', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId }),
    }),
  },

  // Comments
  comments: {
    getForAsset: (assetId: string, params?: { page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      searchParams.append('assetId', assetId);
      if (params?.page) searchParams.append('page', String(params.page));
      if (params?.limit) searchParams.append('limit', String(params.limit));
      return apiClient.get(`/api/comments?${searchParams.toString()}`);
    },
    create: (data: { assetId: string; content: string; parentId?: string }) => 
      apiClient.post('/api/comments', data),
    update: (id: string, content: string) => apiClient.patch(`/api/comments/${id}`, { content }),
    delete: (id: string) => apiClient.delete(`/api/comments/${id}`),
  },

  // Likes
  likes: {
    likeAsset: (assetId: string) => apiClient.post('/api/likes', { assetId }),
    unlikeAsset: (assetId: string) => apiClient.delete('/api/likes', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetId }),
    }),
    likeProject: (projectId: string) => apiClient.post('/api/likes', { projectId }),
    unlikeProject: (projectId: string) => apiClient.delete('/api/likes', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    }),
  },

  // Notifications
  notifications: {
    getAll: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', String(params.page));
      if (params?.limit) searchParams.append('limit', String(params.limit));
      if (params?.unreadOnly) searchParams.append('unreadOnly', String(params.unreadOnly));
      return apiClient.get(`/api/notifications?${searchParams.toString()}`);
    },
    markAsRead: (ids?: string[]) => {
      return apiClient.patch('/api/notifications', ids ? { ids } : { all: true });
    },
  },

  // Payments
  payments: {
    createCheckoutSession: () => apiClient.post('/api/payments/create-checkout'),
    createPortalSession: () => apiClient.post('/api/payments/create-portal'),
  },

  // Search
  search: {
    query: (params: { q?: string; type?: string; tag?: string; page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params.q) searchParams.append('q', params.q);
      if (params.type) searchParams.append('type', params.type);
      if (params.tag) searchParams.append('tag', params.tag);
      if (params.page) searchParams.append('page', String(params.page));
      if (params.limit) searchParams.append('limit', String(params.limit));
      return apiClient.get(`/api/search?${searchParams.toString()}`);
    },
  },

  // Chats
  chats: {
    getAll: () => apiClient.get('/api/chats'),
    getById: (id: string) => apiClient.get(`/api/chats/${id}`),
    create: (userId: string) => apiClient.post('/api/chats', { userId }),
    sendMessage: (chatId: string, content: string) => 
      apiClient.post(`/api/chats/${chatId}/messages`, { content }),
    markAsRead: (chatId: string) => apiClient.post(`/api/chats/${chatId}/read`),
  },
};