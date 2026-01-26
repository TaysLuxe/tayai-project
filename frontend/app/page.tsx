'use client';

import { useAuth } from '@/contexts/AuthContext';
import ChatWidget from '@/components/ChatWidget';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';

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
      <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f]">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#cba2ff] mx-auto"></div>
          <p className="mt-4 text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 lg:w-72 flex-col bg-[#1a1a1a] border-r border-[#2a2a2a]">
        {/* Logo */}
        <div className="p-4 border-b border-[#2a2a2a] flex justify-center">
          <Image
            src="/logo.png"
            alt="Tays Luxe Academy"
            width={100}
            height={50}
            className="h-auto"
            style={{ width: '120px' }}
            priority
          />
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            {/* Avatar with concentric glow rings */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-16 h-16 rounded-full bg-[#cba2ff]/5"></div>
              <div className="absolute w-14 h-14 rounded-full bg-[#cba2ff]/10"></div>
              <div className="absolute w-12 h-12 rounded-full bg-[#cba2ff]/20"></div>
              <div className="relative w-10 h-10 rounded-full bg-[#cba2ff] flex items-center justify-center">
                <span className="text-black font-semibold text-base">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <p className="text-base font-semibold text-white">{user?.username}</p>
              <p className="text-sm text-gray-500 capitalize">{user?.tier} Tier</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#cba2ff] bg-[#cba2ff]/10 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chat with TayAI
            </a>
          </div>
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-[#2a2a2a]">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-400 bg-[#242424] rounded-lg hover:bg-[#2a2a2a] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-[#0f0f0f]">
        {/* Chat Header */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#2a2a2a] bg-[#1a1a1a]">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* AI Avatar */}
            <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg shadow-[#cba2ff]/20">
              <Image
                src="/tayai-avatar.png"
                alt="TayAI"
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title & Status */}
            <div>
              <h1 className="text-md font-medium text-white">Chat with TayAI</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm text-gray-500">Online</span>
              </div>
            </div>
          </div>

          {/* Mobile user info */}
          <div className="md:hidden flex items-center gap-2">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-12 h-12 rounded-full bg-[#cba2ff]/5"></div>
              <div className="absolute w-10 h-10 rounded-full bg-[#cba2ff]/10"></div>
              <div className="relative w-8 h-8 rounded-full bg-[#cba2ff] flex items-center justify-center">
                <span className="text-black font-semibold text-xs">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden">
          <ChatWidget />
        </div>
      </main>
    </div>
  );
}
