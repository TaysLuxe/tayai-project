/**
 * Type definitions for TayAI Frontend
 */

// User types
export interface User {
  user_id: number;
  username: string;
  tier: string;
  is_admin: boolean;
}

// Auth types
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthVerifyResponse {
  valid: boolean;
  user_id: number;
  username: string;
  tier: string;
  is_admin: boolean;
}

// Chat types
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

export interface Source {
  title: string;
  content: string;
}

export interface ChatResponse {
  response: string;
  sources?: Source[];
}

export interface ConversationHistoryItem {
  role: string;
  content: string;
}

// API types
export interface ApiError {
  status: number;
  message: string;
}

// Component prop types
export interface LoginFormProps {
  onSubmit: (username: string, password: string) => Promise<void>;
  error?: string;
  loading?: boolean;
}

export interface MessageItemProps {
  message: Message;
}

export interface MessageListProps {
  messages: Message[];
  loading?: boolean;
}

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
  loading?: boolean;
}
