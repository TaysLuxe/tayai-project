/**
 * Home Page Component
 */

'use client';

import { useAuth } from '@/contexts/AuthContext';
import ChatWidget from '@/components/ChatWidget';
import { LoginForm, LoadingSpinner } from '@/components/ui';
import { useState } from 'react';
import { authApi } from '@/lib/api';

export default function Home() {
  const { isAuthenticated, login, logout, user, loading } = useAuth();
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (username: string, password: string) => {
    setLoginError('');
    setIsLoggingIn(true);
    
    try {
      await login(username, password);
    } catch (error: any) {
      setLoginError(error.response?.data?.detail || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
            TayAI
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            AI-powered assistant for hair business mentorship
          </p>
          
          <LoginForm
            onSubmit={handleLogin}
            error={loginError}
            loading={isLoggingIn}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">TayAI</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Welcome, {user?.username} ({user?.tier})
            </p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Chat Widget */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-4xl mx-auto">
          <ChatWidget />
        </div>
      </main>
    </div>
  );
}
