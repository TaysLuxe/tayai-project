/**
 * API utility functions
 */

import { API_BASE_URL } from '@/constants';
import { ApiError } from '@/types';

/**
 * Generic fetch wrapper with error handling
 */
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Add authorization header to request
 */
export function addAuthHeader(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
  };
}
