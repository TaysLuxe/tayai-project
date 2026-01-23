/**
 * Application constants
 */

// API Configuration (backend base; v1 prefix applied in api utils)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const API_V1_PREFIX = API_BASE_URL.replace(/\/$/, '') + (API_BASE_URL.endsWith('/api/v1') ? '' : '/api/v1');

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

// User Tiers
export const USER_TIERS = {
  BASIC: 'basic',
  VIP: 'vip',
  ELITE: 'elite',
  PAID: 'paid',
  PREMIUM: 'premium',
} as const;

// API Endpoints (relative to /api/v1)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
    VERIFY: '/auth/verify',
  },
  CHAT: {
    MESSAGE: '/chat',
    CONVERSATIONS: '/chat/conversations',
    CONVERSATION: (id: string) => `/chat/conversations/${id}`,
  },
} as const;

// UI Constants
export const UI = {
  MAX_MESSAGE_WIDTH: '80%',
  ANIMATION_DELAYS: {
    BOUNCE_1: '0.1s',
    BOUNCE_2: '0.2s',
  },
} as const;
