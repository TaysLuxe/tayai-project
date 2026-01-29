/**
 * API client for backend (auth, profile, chat).
 * Uses NEXT_PUBLIC_API_URL for base URL (set at build time).
 */

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || '';
  }
  return process.env.NEXT_PUBLIC_API_URL || '';
};

const apiBase = (): string => {
  const base = getBaseUrl();
  return base ? `${base.replace(/\/$/, '')}/api/v1` : '/api/v1';
};

function getHeaders(includeAuth = true): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (includeAuth && typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err: any = new Error(res.statusText || 'Request failed');
    err.status = res.status;
    err.response = res;
    try {
      err.data = await res.json();
    } catch {
      err.data = { detail: await res.text() };
    }
    throw err;
  }
  return res.json();
}

// --- Auth API ---

export const authApi = {
  async login(username: string, password: string): Promise<{ access_token: string; refresh_token: string; token_type: string; expires_in: number }> {
    const res = await fetch(`${apiBase()}/auth/login`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(res);
  },

  async register(email: string, username: string, password: string): Promise<{ id: number; email: string; username: string; tier: string; is_active: boolean; is_admin: boolean }> {
    const res = await fetch(`${apiBase()}/auth/register`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email, username, password }),
    });
    return handleResponse(res);
  },

  async verify(): Promise<{ valid: boolean; user_id?: number; username?: string; tier?: string; is_admin?: boolean }> {
    const res = await fetch(`${apiBase()}/auth/verify`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    return handleResponse(res);
  },
};

// --- Profile API ---

export const profileApi = {
  async getProfile(): Promise<{
    user_id: number;
    email: string;
    username: string;
    tier: string;
    profile_image_url?: string;
    full_name?: string;
    enrolled_courses?: unknown[];
    membership_start_date?: string;
    last_active?: string;
    metadata?: { onboarding_completed?: boolean; [key: string]: unknown };
  }> {
    const res = await fetch(`${apiBase()}/auth/profile`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    return handleResponse(res);
  },

  async saveProfile(data: {
    user_name?: string;
    business_type?: string;
    focus?: string;
    primary_struggle?: string;
    goals?: string;
    experience_level?: string;
    preferred_communication_style?: string;
  }): Promise<unknown> {
    const res = await fetch(`${apiBase()}/auth/profile`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};

// --- Chat API ---

export const chatApi = {
  async sendMessage(
    message: string,
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<{
    response: string;
    tokens_used: number;
    message_id?: number;
    sources?: Array<{ title: string; content?: string; category?: string; score?: number; chunk_id?: string }>;
  }> {
    const res = await fetch(`${apiBase()}/chat/`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        message,
        conversation_history: conversationHistory,
        include_sources: true,
      }),
    });
    return handleResponse(res);
  },
};
