import axios from 'axios';

// Get API URL from environment variable or detect from current domain
// This function is called at runtime to ensure proper detection
const getApiBaseUrl = (): string => {
  // Priority 1: Runtime detection for production (client-side only)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Production domain - backend is on same domain (if proxied/reverse proxy)
    // For ai.taysluxeacademy.com, backend should be on same domain
    if (hostname === 'ai.taysluxeacademy.com' || hostname === 'taysluxeacademy.com') {
      // Backend is on the same domain, use same origin
      // This assumes the backend is proxied through the same domain
      return `${protocol}//${hostname}`;
    }
    
    // If hostname contains railway or production indicators
    if (hostname.includes('railway') || hostname.includes('vercel') || hostname.includes('netlify')) {
      // For Railway deployments, backend might be on same domain or different subdomain
      // Try same domain first (if backend is proxied)
      return `${protocol}//${hostname}`;
    }
    
    // Development - localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
  }
  
  // Priority 2: Use environment variable if set (available at build time)
  // This is the most reliable method for production
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envApiUrl && envApiUrl.trim() !== '' && envApiUrl !== 'http://localhost:8000') {
    // Remove /api/v1 if present since we add it in baseURL
    const cleaned = envApiUrl.replace(/\/api\/v1\/?$/, '').trim();
    if (cleaned !== '' && cleaned !== 'http://localhost:8000') {
      return cleaned;
    }
  }
  
  // Priority 3: Fallback to localhost for development
  // Only use this in development - production should always have env var or runtime detection
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
  }
  
  // Last resort: log warning and use same origin
  if (typeof window !== 'undefined') {
    console.warn('API URL not configured. Using same origin. Set NEXT_PUBLIC_API_URL environment variable.');
    return `${window.location.protocol}//${window.location.hostname}`;
  }
  
  return 'http://localhost:8000';
};

// Create a function that gets the API base URL dynamically
// This ensures runtime detection works properly
const getApiBaseUrlDynamic = (): string => {
  return getApiBaseUrl();
};

// Create axios instance with dynamic base URL
// We'll set the baseURL in interceptors to ensure runtime detection
const apiClient = axios.create({
  baseURL: '/api/v1', // Will be overridden in request interceptor
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token and set dynamic base URL
apiClient.interceptors.request.use(
  (config) => {
    // Set base URL dynamically at request time to ensure proper runtime detection
    const apiBaseUrl = getApiBaseUrlDynamic();
    config.baseURL = `${apiBaseUrl}/api/v1`;
    
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          // Use the same API base URL for refresh endpoint
          const apiBaseUrl = getApiBaseUrlDynamic();
          const refreshUrl = `${apiBaseUrl}/api/v1/auth/refresh`;
          const response = await axios.post(refreshUrl, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token: new_refresh_token } = response.data;
          localStorage.setItem('access_token', access_token);
          if (new_refresh_token) {
            localStorage.setItem('refresh_token', new_refresh_token);
          }

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (username: string, password: string) => {
    const response = await apiClient.post('/auth/login', {
      username,
      password,
    });
    return response.data;
  },

  register: async (email: string, username: string, password: string) => {
    const response = await apiClient.post('/auth/register', {
      email,
      username,
      password,
    });
    return response.data;
  },

  verify: async () => {
    const response = await apiClient.get('/auth/verify');
    return response.data;
  },

  logout: async () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

export const chatApi = {
  sendMessage: async (message: string, conversationHistory: Array<{ role: string; content: string }>) => {
    const response = await apiClient.post('/chat', {
      message,
      conversation_history: conversationHistory,
    });
    return response.data;
  },
};
