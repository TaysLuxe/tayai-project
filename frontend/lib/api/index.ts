/**
 * API client for authentication and chat
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_V1_PREFIX = `${API_BASE_URL}/api/v1`;

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: number;
}

interface AuthVerifyResponse {
  valid: boolean;
  user_id: number;
  username: string;
  tier: string;
  is_admin: boolean;
}

interface ChatResponse {
  response: string;
  sources?: Array<{ title: string; content: string }>;
}

interface ConversationHistoryItem {
  role: string;
  content: string;
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_V1_PREFIX}${endpoint}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
    (error as any).status = response.status;
    throw error;
  }

  return response.json();
}

async function fetchApiForm<T>(endpoint: string, body: URLSearchParams): Promise<T> {
  const url = `${API_V1_PREFIX}${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
    (error as any).status = response.status;
    throw error;
  }

  return response.json();
}

export const authApi = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const body = new URLSearchParams({ username, password });
    return fetchApiForm<LoginResponse>('/auth/login', body);
  },

  async verify(): Promise<AuthVerifyResponse> {
    return fetchApi<AuthVerifyResponse>('/auth/verify', { method: 'POST' });
  },
};

export const chatApi = {
  async sendMessage(
    message: string,
    conversationHistory: ConversationHistoryItem[] = []
  ): Promise<ChatResponse> {
    const body = {
      message,
      conversation_history: conversationHistory,
      include_sources: true,
    };
    const res = await fetchApi<{ response: string; sources?: Array<{ title: string; category?: string }> }>(
      '/chat',
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
    return {
      response: res.response,
      sources: res.sources?.map((s) => ({ title: s.title, content: s.category || '' })),
    };
  },
};
