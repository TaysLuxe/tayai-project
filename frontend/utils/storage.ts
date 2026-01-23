/**
 * Local storage utilities
 */

import { STORAGE_KEYS } from '@/constants';

export const storage = {
  get: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },

  set: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.clear();
  },
};

export const tokenStorage = {
  getAccessToken: (): string | null => storage.get(STORAGE_KEYS.ACCESS_TOKEN),
  getRefreshToken: (): string | null => storage.get(STORAGE_KEYS.REFRESH_TOKEN),
  setAccessToken: (token: string): void => storage.set(STORAGE_KEYS.ACCESS_TOKEN, token),
  setRefreshToken: (token: string): void => storage.set(STORAGE_KEYS.REFRESH_TOKEN, token),
  removeTokens: (): void => {
    storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
  },
};
