// API Constants
export const API_ENDPOINTS = {
  ASSETS: '/api/assets',
  PROJECTS: '/api/projects',
  USERS: '/api/users',
  COMMENTS: '/api/comments',
  LIKES: '/api/likes',
  FOLLOW: '/api/follow',
  NOTIFICATIONS: '/api/notifications',
  SEARCH: '/api/search',
  PAYMENTS: {
    CHECKOUT: '/api/payments/create-checkout',
    PORTAL: '/api/payments/create-portal',
  },
};

// Pagination Constants
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  SMALL_LIMIT: 6,
  LARGE_LIMIT: 24,
};

// File Upload Constants
export const FILE_UPLOAD = {
  MAX_IMAGE_SIZE: 8 * 1024 * 1024, // 8MB
  MAX_AUDIO_SIZE: 16 * 1024 * 1024, // 16MB
  MAX_VIDEO_SIZE: 64 * 1024 * 1024, // 64MB
  MAX_MODEL_SIZE: 32 * 1024 * 1024, // 32MB
  MAX_DOCUMENT_SIZE: 4 * 1024 * 1024, // 4MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  ALLOWED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
  ALLOWED_MODEL_TYPES: ['model/obj', 'model/gltf+json', 'model/gltf-binary', 'application/octet-stream'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'],
};

// Asset Types
export const ASSET_TYPES = {
  IMAGE: 'IMAGE',
  MODEL_3D: 'MODEL_3D',
  AUDIO: 'AUDIO',
  VIDEO: 'VIDEO',
  DOCUMENT: 'DOCUMENT',
  OTHER: 'OTHER',
} as const;

// Display names for asset types
export const ASSET_TYPE_NAMES = {
  [ASSET_TYPES.IMAGE]: 'Image',
  [ASSET_TYPES.MODEL_3D]: '3D Model',
  [ASSET_TYPES.AUDIO]: 'Audio',
  [ASSET_TYPES.VIDEO]: 'Video',
  [ASSET_TYPES.DOCUMENT]: 'Document',
  [ASSET_TYPES.OTHER]: 'Other',
};

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    features: [
      'Build your portfolio with unlimited assets',
      'Create up to 3 projects',
      'Follow other creators',
      'Basic analytics',
    ],
    limitations: [
      'No public portfolio link',
      'No custom domain',
      'No advanced portfolio customization',
      'No advanced analytics',
    ],
  },
  PREMIUM: {
    name: 'Premium',
    price: 5,
    interval: 'month',
    features: [
      'Everything in Free',
      'Public portfolio link',
      'Unlimited projects',
      'Advanced portfolio customization',
      'Custom domain support',
      'Priority customer support',
      'Advanced analytics and insights',
    ],
  },
};

// Feature Limits by Plan
export const PLAN_LIMITS = {
  FREE: {
    MAX_PROJECTS: 3,
    MAX_ASSET_SIZE: 10 * 1024 * 1024, // 10MB
    PUBLIC_PORTFOLIO: false,
    CUSTOM_DOMAIN: false,
  },
  PREMIUM: {
    MAX_PROJECTS: Infinity,
    MAX_ASSET_SIZE: 64 * 1024 * 1024, // 64MB
    PUBLIC_PORTFOLIO: true,
    CUSTOM_DOMAIN: true,
  },
};

// Popular Tags
export const POPULAR_TAGS = [
  'pixel-art',
  '3d-models',
  'characters',
  'environments',
  'ui',
  'sound-effects',
  'music',
  'animations',
  'tilesets',
  'sprites',
  'vfx',
  'low-poly',
  'retro',
  'sci-fi',
  'fantasy',
];

// Common error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'You must be signed in to perform this action',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again',
  FILE_TOO_LARGE: 'The file is too large',
  INVALID_FILE_TYPE: 'This file type is not supported',
  FREE_TIER_LIMIT: 'You have reached the limit for the free tier',
  SUBSCRIPTION_REQUIRED: 'This feature requires a premium subscription',
};