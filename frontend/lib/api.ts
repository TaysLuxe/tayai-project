// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// API Error class
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic fetch wrapper with error handling
async function fetchApi<T>(
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

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    return fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (email: string, password: string, name?: string) => {
    return fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  logout: async () => {
    return fetchApi('/auth/logout', {
      method: 'POST',
    });
  },

  getCurrentUser: async () => {
    return fetchApi('/auth/me');
  },

  refreshToken: async () => {
    return fetchApi('/auth/refresh', {
      method: 'POST',
    });
  },
};

// Chat API
export const chatApi = {
  sendMessage: async (message: string, conversationId?: string) => {
    return fetchApi('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message, conversationId }),
    });
  },

  getConversations: async () => {
    return fetchApi('/chat/conversations');
  },

  getConversation: async (id: string) => {
    return fetchApi(`/chat/conversations/${id}`);
  },

  deleteConversation: async (id: string) => {
    return fetchApi(`/chat/conversations/${id}`, {
      method: 'DELETE',
    });
  },

  createConversation: async (title?: string) => {
    return fetchApi('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },
};

// Generic CRUD operations
export const api = {
  get: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: 'GET' }),
  
  post: <T>(endpoint: string, data: any) =>
    fetchApi<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  put: <T>(endpoint: string, data: any) =>
    fetchApi<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  patch: <T>(endpoint: string, data: any) =>
    fetchApi<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: <T>(endpoint: string) =>
    fetchApi<T>(endpoint, { method: 'DELETE' }),
};

// Helper to add authorization header
export function addAuthHeader(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
  };
}

// Export the base URL for use in other modules
export { API_BASE_URL };