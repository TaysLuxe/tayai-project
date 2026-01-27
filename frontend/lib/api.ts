import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_V1_PREFIX = '/api/v1';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}${API_V1_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
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

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}${API_V1_PREFIX}/auth/refresh`,
            { refresh_token: refreshToken }
          );

          const { access_token, refresh_token } = response.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    const response = await apiClient.post('/auth/login', { username, password });
    return response.data;
  },

  register: async (email: string, username: string, password: string) => {
    const response = await apiClient.post('/auth/register', { email, username, password });
    return response.data;
  },

  verify: async () => {
    const response = await apiClient.get('/auth/verify');
    return response.data;
  },
};

// Chat API
export const chatApi = {
  sendMessage: async (message: string, conversationHistory: any[] = []) => {
    const response = await apiClient.post('/chat/message', {
      message,
      conversation_history: conversationHistory,
      include_sources: true,
    });
    return response.data;
  },
};

// User Profile API
export const profileApi = {
  getProfile: async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  saveProfile: async (profileData: {
    user_name?: string;
    business_type?: string;
    focus?: string;
    primary_struggle?: string;
    goals?: string;
    experience_level?: string;
    preferred_communication_style?: string;
  }) => {
    const response = await apiClient.post('/auth/profile', profileData);
    return response.data;
  },
};
