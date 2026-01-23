/**
 * API utility functions
 */

import { API_V1_PREFIX, API_ENDPOINTS } from '@/constants';
import { tokenStorage } from '@/utils/storage';
import type { AuthVerifyResponse, ChatResponse, ConversationHistoryItem, Source } from '@/types';

/**
 * Extract error message from FastAPI-style error body (detail string or array)
 */
function getErrorMessage(status: number, data: { detail?: unknown; message?: string }): string {
  const d = data.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d) && d.length > 0 && d[0] && typeof (d[0] as { msg?: string }).msg === 'string') {
    return (d[0] as { msg: string }).msg;
  }
  return data.message || `HTTP error! status: ${status}`;
}

/**
 * Generic fetch wrapper with error handling
 */
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_V1_PREFIX}${endpoint}`;
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  const response = await fetch(url, config);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { detail?: unknown; message?: string };
    const msg = getErrorMessage(response.status, errorData);
    const err = new Error(msg) as Error & { status?: number };
    err.status = response.status;
    throw err;
  }
  return response.json();
}

/**
 * Fetch with form-urlencoded body (for OAuth2 login)
 */
async function fetchApiForm<T>(endpoint: string, body: URLSearchParams): Promise<T> {
  const url = `${API_V1_PREFIX}${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { detail?: unknown; message?: string };
    const msg = getErrorMessage(response.status, errorData);
    const err = new Error(msg) as Error & { status?: number };
    err.status = response.status;
    throw err;
  }
  return response.json();
}

/**
 * Fetch with Bearer token
 */
async function fetchApiAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return fetchApi<T>(endpoint, { ...options, headers });
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: number;
}

export const authApi = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const body = new URLSearchParams({ username, password });
    return fetchApiForm<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, body);
  },
  async verify(): Promise<AuthVerifyResponse> {
    const res = await fetchApiAuth<AuthVerifyResponse>(API_ENDPOINTS.AUTH.VERIFY, { method: 'POST' });
    return res;
  },
};

interface ChatApiResponse {
  response: string;
  tokens_used?: number;
  sources?: Array<{ title: string; category?: string; score?: number; chunk_id?: string }>;
}

function mapSources(raw?: ChatApiResponse['sources']): Source[] | undefined {
  if (!raw || !raw.length) return undefined;
  return raw.map((s) => ({ title: s.title, content: s.category || '' }));
}

export const chatApi = {
  async sendMessage(
    message: string,
    conversationHistory: ConversationHistoryItem[]
  ): Promise<ChatResponse> {
    const body = {
      message,
      conversation_history: conversationHistory,
      include_sources: true,
    };
    const res = await fetchApiAuth<ChatApiResponse>(API_ENDPOINTS.CHAT.MESSAGE, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return {
      response: res.response,
      sources: mapSources(res.sources),
    };
  },
};
