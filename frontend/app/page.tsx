'use client';

import { useAuth } from '@/contexts/AuthContext';
import ChatWidget from '@/components/ChatWidget';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Dashboard() {
  const { isAuthenticated, logout, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="Tays Luxe Academy"
                  width={120}
                  height={48}
                  className="h-auto w-auto"
                  priority
                />
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.tier} tier
                </p>
              </div>
              
              <button
                onClick={logout}
                className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:ring-offset-2 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="mx-auto h-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-full max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Welcome back, {user?.username}!
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                AI-powered assistant for hair business mentorship
              </p>
            </div>
            <ChatWidget />
          </div>
        </div>
      </main>
    </div>
  );
}

