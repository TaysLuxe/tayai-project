/**
 * API client for backend (auth, profile, chat).
 * Uses NEXT_PUBLIC_API_URL for base URL (set at build time).
 */

/** Discriminated union: when valid is true, user fields are required */
export type UserVerifyResponse =
  | { valid: false }
  | {
      valid: true;
      user_id: number;
      username: string;
      tier: string;
      is_admin: boolean;
    };

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

export const authApi = {
  async login(username: string, password: string): Promise<{ access_token: string; refresh_token: string; token_type: string; expires_in: number }> {
    const body = new URLSearchParams({ username, password });
    const res = await fetch(`${apiBase()}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
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

  async verify(): Promise<UserVerifyResponse> {
    const res = await fetch(`${apiBase()}/auth/verify`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    return handleResponse(res);
  },

  async requestPasswordReset(email: string): Promise<{ message: string; reset_link?: string }> {
    const res = await fetch(`${apiBase()}/auth/password/reset-request`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  async confirmPasswordReset(token: string, newPassword: string): Promise<{ message: string }> {
    const res = await fetch(`${apiBase()}/auth/password/reset-confirm`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ token, new_password: newPassword }),
    });
    return handleResponse(res);
  },
};

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

/** Single chat message from history API (one user message + assistant response). */
export interface ChatHistoryMessage {
  id?: number;
  user_id: number;
  message: string;
  response?: string | null;
  tokens_used?: number;
  created_at?: string;
}

export interface ChatHistoryResponse {
  messages: ChatHistoryMessage[];
  total_count: number;
  has_more: boolean;
}

/** One conversation/session (sidebar item). */
export interface ConversationSummary {
  id: number;
  title?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ListConversationsResponse {
  conversations: ConversationSummary[];
  total_count: number;
  has_more: boolean;
}

export interface ConversationMessagesResponse {
  conversation_id: number;
  messages: ChatHistoryMessage[];
  total_count: number;
}

export const chatApi = {
  async sendMessage(
    message: string,
    conversationHistory: Array<{ role: string; content: string }>,
    conversationId?: number | null
  ): Promise<{
    response: string;
    tokens_used: number;
    message_id?: number;
    conversation_id?: number;
    sources?: Array<{ title: string; content?: string; category?: string; score?: number; chunk_id?: string }>;
  }> {
    const body: Record<string, unknown> = {
      message,
      conversation_history: conversationHistory,
      include_sources: true,
    };
    if (conversationId != null) body.conversation_id = conversationId;
    const res = await fetch(`${apiBase()}/chat/`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async getConversations(limit = 50, offset = 0): Promise<ListConversationsResponse> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    const res = await fetch(`${apiBase()}/chat/conversations?${params}`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    return handleResponse(res);
  },

  async getConversationMessages(conversationId: number): Promise<ConversationMessagesResponse> {
    const res = await fetch(`${apiBase()}/chat/conversations/${conversationId}/messages`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    return handleResponse(res);
  },

  async getChatHistory(limit = 50, offset = 0): Promise<ChatHistoryResponse> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    const res = await fetch(`${apiBase()}/chat/history?${params}`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    return handleResponse(res);
  },

  async getConversationContext(messageCount = 20): Promise<{ conversation_history: Array<{ role: string; content: string }> }> {
    const params = new URLSearchParams({ message_count: String(messageCount) });
    const res = await fetch(`${apiBase()}/chat/context?${params}`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    return handleResponse(res);
  },

  /** Voice engine: dictation (return transcript) or user_voice (LLM response). */
  async processVoice(
    transcript: string,
    mode: 'dictation' | 'user_voice'
  ): Promise<{ text: string; tokens_used: number }> {
    const res = await fetch(`${apiBase()}/chat/voice`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ transcript: transcript.trim(), mode }),
    });
    return handleResponse(res);
  },

  /**
   * Send recorded audio for server-side STT + LLM + TTS; returns streamed audio response.
   * Response headers: X-Transcript (user speech), X-Response-Text (assistant text). Body: audio/mpeg stream.
   */
  async speakWithAudio(audioBlob: Blob, voice: string = 'alloy'): Promise<Response> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const form = new FormData();
    form.append('audio', audioBlob, 'audio.webm');
    form.append('voice', voice);
    const res = await fetch(`${apiBase()}/chat/voice/speak`, {
      method: 'POST',
      headers,
      body: form,
    });
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
    return res;
  },
};
