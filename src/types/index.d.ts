import { ASSET_TYPES } from '@/constants';
import type { User as PrismaUser, Subscription } from '@prisma/client';

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Application Models
export interface User extends Omit<PrismaUser, 'password' | 'emailVerified' | 'social'> {
  social?: {
    twitter?: string;
    github?: string;
    website?: string;
    linkedin?: string;
  };
  stats?: {
    followers: number;
    following: number;
    assets: number;
    projects: number;
  };
  isFollowing?: boolean;
}

export interface UserProfile extends User {
  stats: {
    followers: number;
    following: number;
    assets: number;
    projects: number;
  };
  isFollowing: boolean;
  isCurrentUser: boolean;
}

export interface Asset {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: keyof typeof ASSET_TYPES;
  projectId: string | null;
  userId: string;
  isPublic: boolean;
  tags: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  project?: {
    id: string;
    title: string;
  } | null;
  likes?: number;
  comments?: number;
  likedByUser?: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  userId: string;
  isPublic: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  assets?: Asset[];
  assetCount?: number;
  likes?: number;
  likedByUser?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  assetId: string;
  parentId: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  replies?: Comment[];
}

export interface Like {
  id: string;
  userId: string;
  assetId?: string | null;
  projectId?: string | null;
  createdAt: string | Date;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string | Date;
  follower?: User;
  following?: User;
}

export interface Message {
  id: string;
  content: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  read: boolean;
  createdAt: string | Date;
  sender?: User;
  receiver?: User;
}

export interface Chat {
  id: string;
  participants: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    isOnline?: boolean;
  }[];
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: Date | string;
  };
  unreadCount?: number;
  messages?: Message[];
}

export interface Notification {
  id: string;
  type: 'FOLLOW' | 'LIKE' | 'COMMENT' | 'MESSAGE' | 'SYSTEM';
  content: string;
  linkUrl?: string | null;
  read: boolean;
  receiverId: string;
  senderId?: string | null;
  createdAt: string | Date;
  sender?: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  } | null;
}

export interface SubscriptionPlan {
  name: string;
  price: number;
  interval?: 'month' | 'year';
  features: string[];
  limitations?: string[];
}

export interface SubscriptionWithCustomer extends Subscription {
  user: User;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: string;
  message?: string;
  details?: any;
  status: number;
}

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

// Component Prop Types
export interface AssetCardProps {
  asset: Asset;
  variant?: 'default' | 'horizontal' | 'vertical';
  className?: string;
}

export interface UserAvatarProps {
  user: {
    name?: string | null;
    image?: string | null;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  isOnline?: boolean;
  isPremium?: boolean;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'pixel';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

// Form Types
export interface LoginFormValues {
  email: string;
  password: string;
}

export interface SignupFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

export interface ProfileFormValues {
  name: string;
  username: string;
  bio?: string;
  location?: string;
  website?: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
}

export interface AssetFormValues {
  title: string;
  description?: string;
  fileUrl: string;
  fileType: keyof typeof ASSET_TYPES;
  projectId?: string | null;
  isPublic: boolean;
  tags?: string[];
}

export interface ProjectFormValues {
  title: string;
  description?: string;
  thumbnail?: string;
  isPublic: boolean;
}

// Theme and UI Types
export type ThemeType = 'light' | 'dark' | 'system';

export type AssetViewMode = 'grid' | 'list';

export type NotificationType = 'FOLLOW' | 'LIKE' | 'COMMENT' | 'MESSAGE' | 'SYSTEM';

// API Query Parameters
export interface AssetQueryParams {
  page?: number;
  limit?: number;
  userId?: string;
  projectId?: string;
  type?: string;
  tag?: string;
  search?: string;
  sort?: 'latest' | 'oldest' | 'popular';
}

export interface ProjectQueryParams {
  page?: number;
  limit?: number;
  userId?: string;
  username?: string;
  search?: string;
  sort?: 'latest' | 'oldest' | 'popular';
}

export interface SearchQueryParams {
  q?: string;
  type?: 'assets' | 'projects' | 'users' | 'all';
  tag?: string;
  page?: number;
  limit?: number;
}

// Hook Return Types
export interface UseAssets {
  assets: Asset[];
  isLoading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  reload: () => void;
}

export interface UseProjects {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  reload: () => void;
}

export interface UseUserProfile {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  isFollowing: boolean;
  followerCount: number;
  followUser: () => Promise<void>;
  unfollowUser: () => Promise<void>;
  refetch: () => Promise<void>;
}