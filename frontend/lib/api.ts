import axios from 'axios';

// Get API URL from environment variable or detect from current domain
// This function is called at runtime to ensure proper detection
const getApiBaseUrl = (): string => {
  // Priority 1: Use environment variable if set (available at build time)
  // This is the most reliable method for production
  // Railway should set NEXT_PUBLIC_API_URL to the backend service URL
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // Debug logging (only in browser console)
  if (typeof window !== 'undefined') {
    console.log('[API Client] NEXT_PUBLIC_API_URL:', envApiUrl || 'NOT SET');
  }
  
  if (envApiUrl && envApiUrl.trim() !== '' && envApiUrl !== 'http://localhost:8000') {
    // Remove /api/v1 if present since we add it in baseURL
    const cleaned = envApiUrl.replace(/\/api\/v1\/?$/, '').trim();
    if (cleaned !== '' && cleaned !== 'http://localhost:8000') {
      if (typeof window !== 'undefined') {
        console.log('[API Client] Using API URL from environment:', cleaned);
      }
      return cleaned;
    }
  }
  
  // Priority 2: Runtime detection for production (client-side only)
  // If NEXT_PUBLIC_API_URL is not set, use same origin (Next.js rewrites will proxy)
  // This works when Next.js rewrites are configured to proxy /api/v1/* to backend
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Production domain - use same origin (Next.js rewrites will handle proxying)
    // This assumes Next.js rewrites are configured in next.config.js
    if (hostname === 'ai.taysluxeacademy.com' || hostname === 'taysluxeacademy.com') {
      // Use same origin - Next.js rewrites will proxy /api/v1/* to backend
      // If rewrites are not configured, set NEXT_PUBLIC_API_URL to backend Railway URL
      const sameOrigin = `${protocol}//${hostname}`;
      console.error(
        '[API Client] NEXT_PUBLIC_API_URL is not set! ' +
        'Set NEXT_PUBLIC_API_URL=https://api.taysluxeacademy.com in Railway frontend service variables. ' +
        'Falling back to same origin (this will cause 404 errors).'
      );
      return sameOrigin;
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
  
  // Priority 3: Fallback to localhost for development only
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
  }
  
  // Last resort: log error and use same origin
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    console.error(
      '[API Client] CRITICAL: API URL not configured. ' +
      `Current hostname: ${hostname}. ` +
      'Set NEXT_PUBLIC_API_URL=https://api.taysluxeacademy.com in Railway frontend service variables and redeploy. ' +
      'Example: https://api.taysluxeacademy.com'
    );
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
    const response = await apiClient.post('/chat/', {
      message,
      conversation_history: conversationHistory,
    });
    return response.data;
  },
};
