import { Asset } from "@/types";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date to a readable string
 */
export function formatDate(date: Date | string | number): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Formats a date or timestamp to time-only (e.g. "3:45 PM")
 */
export function formatTime(date: Date | string | number): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Returns a relative time string (e.g. "5 minutes ago")
 */
export function getRelativeTime(date: Date | string | number): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.round((now.getTime() - then.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const months = Math.round(days / 30);
  const years = Math.round(months / 12);

  if (seconds < 60) return `${seconds} seconds ago`;
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}

/**
 * Truncates a string to a specified length and adds ellipsis if needed
 */
export function truncateString(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

/**
 * Gets file extension from a URL
 */
export function getFileExtension(url: string): string {
  return url.split('.').pop()?.toLowerCase() || '';
}

/**
 * Determines the asset type based on file extension
 */
export function getAssetTypeFromUrl(url: string): 'IMAGE' | 'MODEL_3D' | 'AUDIO' | 'VIDEO' | 'DOCUMENT' | 'OTHER' {
  const extension = getFileExtension(url);
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const model3dExtensions = ['obj', 'fbx', 'glb', 'gltf', 'blend'];
  const audioExtensions = ['mp3', 'wav', 'ogg', 'flac'];
  const videoExtensions = ['mp4', 'webm', 'mov', 'avi'];
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'md'];

  if (imageExtensions.includes(extension)) return 'IMAGE';
  if (model3dExtensions.includes(extension)) return 'MODEL_3D';
  if (audioExtensions.includes(extension)) return 'AUDIO';
  if (videoExtensions.includes(extension)) return 'VIDEO';
  if (documentExtensions.includes(extension)) return 'DOCUMENT';
  return 'OTHER';
}

/**
 * Normalizes raw API asset data into a fully-typed `Asset` object.
 */
export function normalizeAsset(apiAsset: any): Asset {
  return {
    ...apiAsset,
    fileType: (apiAsset.fileType?.toUpperCase() || 'OTHER') as Asset['fileType'],
    description: apiAsset.description ?? null,
    user: {
      ...apiAsset.user,
      name: apiAsset.user?.name ?? null,
      username: apiAsset.user?.username ?? null,
      image: apiAsset.user?.image ?? null,
    },
    likes: apiAsset.likes ?? 0,
    comments: apiAsset.comments ?? 0,
  };
}