'use client';

import { useAuth } from '@/contexts/AuthContext';
import ChatWidget from '@/components/ChatWidget';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useMemo, useState, useRef } from 'react';

interface ChatSession {
  id: number;
  title: string;
  createdAt: Date;
}

export default function Dashboard() {
  const { isAuthenticated, logout, user, loading } = useAuth();
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatSessionId, setChatSessionId] = useState(1);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showLearnMoreMenu, setShowLearnMoreMenu] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsCategory, setSettingsCategory] = useState('general');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const helpButtonRef = useRef<HTMLButtonElement>(null);
  const [helpMenuPosition, setHelpMenuPosition] = useState({ top: 0, left: 0 });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]') && !target.closest('[data-user-menu]')) {
        setShowLanguageMenu(false);
        setShowLearnMoreMenu(false);
        setShowHelpMenu(false);
        setShowUserMenu(false);
      }
    };

    if (showLanguageMenu || showLearnMoreMenu || showHelpMenu || showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLanguageMenu, showLearnMoreMenu, showHelpMenu, showUserMenu]);

  // Close settings modal on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showSettingsModal) {
        setShowSettingsModal(false);
      }
    };

    if (showSettingsModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showSettingsModal]);

  // Update Help menu position when it opens or window resizes
  useEffect(() => {
    if (showHelpMenu && helpButtonRef.current) {
      const updatePosition = () => {
        if (helpButtonRef.current) {
          const rect = helpButtonRef.current.getBoundingClientRect();
          setHelpMenuPosition({
            top: rect.top,
            left: rect.right + 4,
          });
        }
      };

      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [showHelpMenu]);

  const handleNewChat = () => {
    const nextId = chatSessionId + 1;
    const newSession: ChatSession = {
      id: nextId,
      title: `Chat ${chatHistory.length + 1}`,
      createdAt: new Date(),
    };

    setChatSessionId(nextId);
    setChatHistory((prev) => [newSession, ...prev]);
  };

  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return chatHistory;
    const term = searchTerm.toLowerCase();
    return chatHistory.filter((session) => session.title.toLowerCase().includes(term));
  }, [chatHistory, searchTerm]);

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

  const SidebarContent = (
    <div className={`flex h-full flex-col bg-[#1a1a1a] border-r border-[#2a2a2a] overflow-hidden transition-all duration-300 ${
      isSidebarCollapsed ? 'w-16' : 'w-64 lg:w-72'
    }`}>
      {/* Logo and Toggle */}
      <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
        {!isSidebarCollapsed && (
          <Image
            src="/logo.png"
            alt="Tays Luxe Academy"
            width={100}
            height={50}
            className="h-auto"
            style={{ width: '120px' }}
            priority
          />
        )}
        <div className="flex items-center gap-2 ml-auto">
          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-[#242424] transition-colors"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              {/* Vertical rectangle with dividing line */}
              <rect x="4" y="4" width="16" height="16" rx="1" stroke="currentColor" fill="none" />
              <line x1="8" y1="4" x2="8" y2="20" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          {/* Close button on mobile */}
          <button
            className="md:hidden p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-[#242424]"
            onClick={() => setIsSidebarOpen(false)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* New Chat / Search / Projects */}
      {!isSidebarCollapsed && (
        <div className="p-4 border-b border-[#2a2a2a] space-y-3">
          {/* New Chat */}
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-black bg-[#cba2ff] rounded-lg hover:bg-[#b88ff5] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>

          {/* Search chats */}
          <div className="relative">
            <svg
              className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search chats"
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#242424] border border-[#2a2a2a] rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#cba2ff]/70 focus:border-[#cba2ff]"
            />
          </div>

          {/* Projects */}
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">Projects</p>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-200 bg-[#242424] rounded-md hover:bg-[#2a2a2a] transition-colors">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#cba2ff]/15 text-[#cba2ff] text-[11px]">
                TA
              </span>
              <span className="truncate">TayAI - Default workspace</span>
            </button>
          </div>
        </div>
      )}

      {/* Collapsed: Show only icons */}
      {isSidebarCollapsed && (
        <div className="p-2 border-b border-[#2a2a2a] space-y-2">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center p-2 text-black bg-[#cba2ff] rounded-lg hover:bg-[#b88ff5] transition-colors"
            title="New Chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      )}

      {/* Chat history */}
      {!isSidebarCollapsed && (
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-2">Chat history</p>
          {filteredHistory.length === 0 ? (
            <p className="text-xs text-gray-600">No chats yet. Start a new conversation.</p>
          ) : (
            <ul className="space-y-1">
              {filteredHistory.map((session) => (
                <li
                  key={session.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[#242424] cursor-default"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#242424] text-[11px] text-gray-400">
                    💬
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-200 truncate">{session.title}</p>
                    <p className="text-[10px] text-gray-500">
                      {session.createdAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Settings / User Menu at Bottom */}
      <div className="border-t border-[#2a2a2a] mt-auto overflow-visible">
        {/* Menu Items - Only visible when user menu is open */}
        {showUserMenu && !isSidebarCollapsed && (
          <>
            {/* User Email */}
            <div className="px-4 pt-3 pb-2">
              <p className="text-xs text-gray-400">{user?.email || 'user@example.com'}</p>
            </div>

            {/* Menu Items */}
            <div className="px-2 py-1 space-y-0.5 relative overflow-visible">
              {/* Settings */}
              <button
                onClick={() => {
                  setShowSettingsModal(true);
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center justify-between px-2 py-2 text-sm text-gray-300 hover:bg-[#242424] rounded-md transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Settings</span>
                </div>
                <span className="text-xs text-gray-500 group-hover:text-gray-400">⇧⌘,</span>
              </button>

              {/* Language */}
              <div className="relative" data-dropdown>
                <button
                  onClick={() => {
                    setShowLanguageMenu(!showLanguageMenu);
                    setShowLearnMoreMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-2 text-sm text-gray-300 hover:bg-[#242424] rounded-md transition-colors ${
                    showLanguageMenu ? 'bg-[#242424]' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                      />
                    </svg>
                    <span>Language</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Language Dropdown */}
                {showLanguageMenu && (
                  <div className="absolute right-0 bottom-full mb-1 w-56 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                    <div className="py-1">
                      {[
                        'English',
                        'Français',
                        'Nederlands',
                        'Español',
                        'Português',
                      ].map((lang, idx) => (
                        <button
                          key={idx}
                          className={`w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#242424] flex items-center justify-between ${
                            idx === 0 ? 'bg-[#242424]' : ''
                          }`}
                          onClick={() => setShowLanguageMenu(false)}
                        >
                          <span>{lang}</span>
                          {idx === 0 && (
                            <svg className="w-4 h-4 text-[#cba2ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Get help */}
              <div className="relative" data-dropdown>
                <button
                  ref={helpButtonRef}
                  onClick={(e) => {
                    if (helpButtonRef.current) {
                      const rect = helpButtonRef.current.getBoundingClientRect();
                      setHelpMenuPosition({
                        top: rect.top,
                        left: rect.right + 4, // Position to the right of the button
                      });
                    }
                    setShowHelpMenu(!showHelpMenu);
                    setShowLanguageMenu(false);
                    setShowLearnMoreMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-2 text-sm text-gray-300 hover:bg-[#242424] rounded-md transition-colors ${
                    showHelpMenu ? 'bg-[#242424]' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Get help</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Help Links Dropdown - Positioned to the right using fixed positioning */}
                {showHelpMenu && (
                  <>
                    {/* Backdrop for mobile/overlay */}
                    <div
                      className="fixed inset-0 z-40 md:hidden"
                      onClick={() => setShowHelpMenu(false)}
                    />
                    <div
                      className="fixed w-56 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-50"
                      style={{
                        top: `${helpMenuPosition.top}px`,
                        left: `${helpMenuPosition.left}px`,
                      }}
                    >
                      <div className="py-1">
                        {[
                          {
                            label: 'Help center',
                            icon: (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ),
                          },
                          {
                            label: 'Release notes',
                            icon: (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            ),
                          },
                          {
                            label: 'Terms & policies',
                            icon: (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            ),
                          },
                          {
                            label: 'Report Bug',
                            icon: (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            ),
                          },
                          {
                            label: 'Download apps',
                            icon: (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            ),
                          },
                          {
                            label: 'Keyboard shortcuts',
                            icon: (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            ),
                          },
                        ].map((item, idx) => (
                          <button
                            key={idx}
                            className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#242424] flex items-center gap-2"
                            onClick={() => setShowHelpMenu(false)}
                          >
                            <span className="text-gray-400">{item.icon}</span>
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Learn more */}
              <div className="relative" data-dropdown>
                <button
                  onClick={() => {
                    setShowLearnMoreMenu(!showLearnMoreMenu);
                    setShowLanguageMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-2 text-sm text-gray-300 hover:bg-[#242424] rounded-md transition-colors ${
                    showLearnMoreMenu ? 'bg-[#242424]' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Learn more</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Learn More Dropdown */}
                {showLearnMoreMenu && (
                  <div className="absolute right-0 bottom-full mb-1 w-56 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-50">
                    <div className="py-1">
                      {[
                        { label: 'API Console', external: true },
                        { label: 'About TayAI', external: true },
                        { label: 'divider' },
                        { label: 'Usage policy', external: true },
                        { label: 'Privacy policy', external: true },
                        { label: 'Your privacy choices' },
                        { label: 'Keyboard shortcuts', shortcut: '⌘/' },
                      ].map((item, idx) => {
                        if (item.label === 'divider') {
                          return <div key={idx} className="h-px bg-[#2a2a2a] my-1"></div>;
                        }
                        return (
                          <button
                            key={idx}
                            className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#242424] flex items-center justify-between"
                            onClick={() => setShowLearnMoreMenu(false)}
                          >
                            <span>{item.label}</span>
                            <div className="flex items-center gap-2">
                              {item.shortcut && <span className="text-xs text-gray-500">{item.shortcut}</span>}
                              {item.external && (
                                <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Log out */}
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-2 py-2 text-sm text-gray-300 hover:bg-[#242424] rounded-md transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Log out</span>
              </button>
            </div>
          </>
        )}

        {/* Collapsed Sidebar Icons */}
        {isSidebarCollapsed && (
          <div className="px-2 py-2 space-y-1 border-t border-[#2a2a2a]">
            {/* Settings Icon */}
            <button
              onClick={() => {
                setIsSidebarCollapsed(false);
                setTimeout(() => setShowSettingsModal(true), 100);
              }}
              className="w-full flex items-center justify-center p-2 text-gray-300 hover:bg-[#242424] rounded-md transition-colors"
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        )}

        {/* User Profile Summary - Click to toggle menu */}
        <div className="px-2 py-2" data-user-menu>
          <button
            onClick={() => {
              if (isSidebarCollapsed) {
                setIsSidebarCollapsed(false);
                return;
              }
              setShowUserMenu(!showUserMenu);
              // Close other dropdowns when opening user menu
              if (!showUserMenu) {
                setShowLanguageMenu(false);
                setShowLearnMoreMenu(false);
              }
            }}
            className={`w-full flex items-center gap-3 px-2 py-2 rounded-md transition-colors group ${
              showUserMenu ? 'bg-[#242424]' : 'hover:bg-[#242424]'
            } ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title={isSidebarCollapsed ? `${user?.username || 'User'} - ${user?.tier || 'Basic'} plan` : ''}
          >
            {/* Avatar */}
            <div className="relative flex items-center justify-center">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                {isSidebarCollapsed ? (
                  <span className="text-black font-semibold text-xs">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </div>
            </div>

            {/* User Info - Hidden when collapsed */}
            {!isSidebarCollapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-white truncate">{user?.username || 'User'}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.tier || 'Basic'} plan</p>
                </div>

                {/* Dropdown indicator */}
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      {/* Desktop sidebar */}
      <aside className="hidden md:block">
        {SidebarContent}
      </aside>

      {/* Mobile sidebar (toggle) */}
      {isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/60 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-40 w-64 max-w-full md:hidden">
            {SidebarContent}
          </div>
        </>
      )}

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-[#0f0f0f]">
        {/* Chat Header */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#2a2a2a] bg-[#1a1a1a]">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white"
              onClick={() => setIsSidebarOpen(true)}
            >
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
          <ChatWidget key={chatSessionId} />
        </div>
      </main>

      {/* Settings Modal */}
      {showSettingsModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-50"
            onClick={() => setShowSettingsModal(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg w-full max-w-4xl h-[85vh] max-h-[800px] flex flex-col shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="p-1.5 hover:bg-[#242424] rounded-md transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <h2 className="text-lg font-semibold text-white">Settings</h2>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 overflow-hidden">
                {/* Left Navigation */}
                <div className="w-64 border-r border-[#2a2a2a] overflow-y-auto">
                  <nav className="p-2 space-y-1">
                    {[
                      { id: 'general', label: 'General', icon: '⚙️' },
                      { id: 'notifications', label: 'Notifications', icon: '🔔' },
                      { id: 'personalization', label: 'Personalization', icon: '🎨' },
                      { id: 'apps', label: 'Apps', icon: '📱' },
                      { id: 'schedules', label: 'Schedules', icon: '⏰' },
                      { id: 'data', label: 'Data controls', icon: '💾' },
                      { id: 'security', label: 'Security', icon: '🔒' },
                      { id: 'account', label: 'Account', icon: '👤' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSettingsCategory(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors ${
                          settingsCategory === item.id
                            ? 'bg-[#242424] text-white'
                            : 'text-gray-300 hover:bg-[#242424]'
                        }`}
                      >
                        <span className="text-base">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Right Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {settingsCategory === 'general' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-white mb-6">General</h3>
                      
                      {/* Appearance */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Appearance</label>
                        <select className="w-full px-3 py-2 bg-[#242424] border border-[#2a2a2a] rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#cba2ff]/50">
                          <option>System</option>
                          <option>Light</option>
                          <option>Dark</option>
                        </select>
                      </div>

                      {/* Accent color */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Accent color</label>
                        <select className="w-full px-3 py-2 bg-[#242424] border border-[#2a2a2a] rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#cba2ff]/50">
                          <option>Default</option>
                          <option>Purple</option>
                          <option>Blue</option>
                          <option>Green</option>
                        </select>
                      </div>

                      {/* Language */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Language</label>
                        <select className="w-full px-3 py-2 bg-[#242424] border border-[#2a2a2a] rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#cba2ff]/50">
                          <option>Auto-detect</option>
                          <option>English</option>
                          <option>Français</option>
                          <option>Nederlands</option>
                          <option>Español</option>
                          <option>Português</option>
                        </select>
                      </div>

                      {/* Spoken language */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Spoken language</label>
                        <select className="w-full px-3 py-2 bg-[#242424] border border-[#2a2a2a] rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#cba2ff]/50">
                          <option>Auto-detect</option>
                          <option>English</option>
                          <option>Français</option>
                          <option>Nederlands</option>
                          <option>Español</option>
                          <option>Português</option>
                        </select>
                        <p className="text-xs text-gray-500">
                          For best results, select the language you mainly speak. If it&apos;s not listed, it may still be supported via auto-detection.
                        </p>
                      </div>

                      {/* Voice */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Voice</label>
                        <div className="flex items-center gap-3">
                          <button className="p-2 bg-[#242424] border border-[#2a2a2a] rounded-full hover:bg-[#2a2a2a] transition-colors">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </button>
                          <select className="flex-1 px-3 py-2 bg-[#242424] border border-[#2a2a2a] rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#cba2ff]/50">
                            <option>Vale</option>
                            <option>Alloy</option>
                            <option>Echo</option>
                            <option>Fable</option>
                            <option>Onyx</option>
                            <option>Shimmer</option>
                          </select>
                        </div>
                      </div>

                      {/* Separate Voice */}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex-1">
                          <label className="text-sm font-medium text-gray-300 block">Separate Voice</label>
                          <p className="text-xs text-gray-500 mt-1">
                            Keep ChatGPT Voice in a separate full screen, without real time transcripts and visuals.
                          </p>
                        </div>
                        <button className="ml-4 relative inline-flex h-6 w-11 items-center rounded-full bg-[#2a2a2a] transition-colors">
                          <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                        </button>
                      </div>

                      {/* Show additional models */}
                      <div className="flex items-center justify-between py-2">
                        <label className="text-sm font-medium text-gray-300">Show additional models</label>
                        <button className="ml-4 relative inline-flex h-6 w-11 items-center rounded-full bg-[#2a2a2a] transition-colors">
                          <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                        </button>
                      </div>
                    </div>
                  )}

                  {settingsCategory === 'notifications' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-white mb-6">Notifications</h3>
                      
                      {/* Responses */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-white mb-1">Responses</h4>
                            <p className="text-xs text-gray-400">
                              Get notified when ChatGPT responds to requests that take time, like research or image generation.
                            </p>
                          </div>
                          <select className="ml-4 px-3 py-1.5 bg-[#242424] border border-[#2a2a2a] rounded-md text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#cba2ff]/50 min-w-[100px]">
                            <option>Push</option>
                            <option>Email</option>
                            <option>Push, Email</option>
                            <option>Off</option>
                          </select>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[#2a2a2a]"></div>

                      {/* Tasks */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-white mb-1">Tasks</h4>
                            <p className="text-xs text-gray-400">
                              Get notified when tasks you&apos;ve created have updates.{' '}
                              <button className="text-[#cba2ff] hover:text-[#b88ff5] underline">
                                Manage tasks
                              </button>
                            </p>
                          </div>
                          <select className="ml-4 px-3 py-1.5 bg-[#242424] border border-[#2a2a2a] rounded-md text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#cba2ff]/50 min-w-[100px]">
                            <option>Push, Email</option>
                            <option>Push</option>
                            <option>Email</option>
                            <option>Off</option>
                          </select>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[#2a2a2a]"></div>

                      {/* Projects */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-white mb-1">Projects</h4>
                            <p className="text-xs text-gray-400">
                              Get notified when you receive an email invitation to a shared project.
                            </p>
                          </div>
                          <select className="ml-4 px-3 py-1.5 bg-[#242424] border border-[#2a2a2a] rounded-md text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#cba2ff]/50 min-w-[100px]">
                            <option>Email</option>
                            <option>Push</option>
                            <option>Push, Email</option>
                            <option>Off</option>
                          </select>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[#2a2a2a]"></div>

                      {/* Recommendations */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-white mb-1">Recommendations</h4>
                            <p className="text-xs text-gray-400">
                              Stay in the loop on new tools, tips, and features from ChatGPT.
                            </p>
                          </div>
                          <select className="ml-4 px-3 py-1.5 bg-[#242424] border border-[#2a2a2a] rounded-md text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#cba2ff]/50 min-w-[100px]">
                            <option>Push, Email</option>
                            <option>Push</option>
                            <option>Email</option>
                            <option>Off</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsCategory === 'personalization' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-white mb-6">Personalization</h3>
                      
                      {/* Base style and tone */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-white">Base style and tone</h4>
                        <p className="text-xs text-gray-400">
                          Set the style and tone of how ChatGPT responds to you. This doesn&apos;t impact ChatGPT&apos;s capabilities.
                        </p>
                        <select className="w-full px-3 py-2 bg-[#242424] border border-[#2a2a2a] rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#cba2ff]/50">
                          <option>Default</option>
                          <option>Formal</option>
                          <option>Casual</option>
                          <option>Professional</option>
                          <option>Friendly</option>
                        </select>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[#2a2a2a]"></div>

                      {/* Characteristics */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-white mb-1">Characteristics</h4>
                          <p className="text-xs text-gray-400">
                            Choose additional customizations on top of your base style and tone.
                          </p>
                        </div>
                        {['Warm', 'Enthusiastic', 'Headers & Lists', 'Emoji'].map((char) => (
                          <div key={char} className="flex items-center justify-between">
                            <label className="text-sm text-gray-300">{char}</label>
                            <select className="px-3 py-1.5 bg-[#242424] border border-[#2a2a2a] rounded-md text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#cba2ff]/50 min-w-[100px]">
                              <option>Default</option>
                              <option>More</option>
                              <option>Less</option>
                            </select>
                          </div>
                        ))}
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[#2a2a2a]"></div>

                      {/* Custom instructions */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-white">Custom instructions</h4>
                        <textarea
                          placeholder="Additional behavior, style, and tone preferences"
                          className="w-full px-3 py-2 bg-[#242424] border border-[#2a2a2a] rounded-md text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#cba2ff]/50 min-h-[100px] resize-y"
                        />
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[#2a2a2a]"></div>

                      {/* About you */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-white">About you</h4>
                        
                        <div className="space-y-2">
                          <label className="text-xs text-gray-400 block">Nickname</label>
                          <input
                            type="text"
                            placeholder="What should ChatGPT call you?"
                            className="w-full px-3 py-2 bg-[#242424] border border-[#2a2a2a] rounded-md text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#cba2ff]/50"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs text-gray-400 block">Occupation</label>
                          <input
                            type="text"
                            placeholder="Your occupation"
                            className="w-full px-3 py-2 bg-[#242424] border border-[#2a2a2a] rounded-md text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#cba2ff]/50"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs text-gray-400 block">More about you</label>
                          <input
                            type="text"
                            placeholder="Interests, values, or preferences to keep in mind"
                            className="w-full px-3 py-2 bg-[#242424] border border-[#2a2a2a] rounded-md text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#cba2ff]/50"
                          />
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[#2a2a2a]"></div>

                      {/* Memory */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-white">Memory</h4>
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <button className="text-xs text-[#cba2ff] hover:text-[#b88ff5]">
                            Manage
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="text-xs font-medium text-gray-300 mb-1">Reference saved memories</h5>
                            <p className="text-xs text-gray-400">
                              Let ChatGPT save and use memories when responding.
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              ChatGPT may use Memory to personalize queries to search providers, such as Bing.{' '}
                              <button className="text-[#cba2ff] hover:text-[#b88ff5] underline">Learn more</button>
                            </p>
                          </div>
                          <button className="ml-4 relative inline-flex h-6 w-11 items-center rounded-full bg-[#cba2ff] transition-colors">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                          </button>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[#2a2a2a]"></div>

                      {/* Record mode */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-white">Record mode</h4>
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="text-xs font-medium text-gray-300 mb-1">Reference record history</h5>
                            <p className="text-xs text-gray-400">
                              Let ChatGPT reference all previous recording transcripts and notes when responding.
                            </p>
                          </div>
                          <button className="ml-4 relative inline-flex h-6 w-11 items-center rounded-full bg-[#cba2ff] transition-colors">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                          </button>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[#2a2a2a]"></div>

                      {/* Advanced */}
                      <div className="space-y-3">
                        <button
                          onClick={() => setShowAdvanced(!showAdvanced)}
                          className="w-full flex items-center justify-between text-sm font-medium text-white hover:text-gray-300 transition-colors"
                        >
                          <span>Advanced</span>
                          <svg
                            className={`w-4 h-4 text-gray-500 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {showAdvanced && (
                          <div className="space-y-4 pl-4 border-l border-[#2a2a2a]">
                            {[
                              {
                                label: 'Web search',
                                description: 'Let ChatGPT automatically search the web for answers.',
                              },
                              {
                                label: 'Code',
                                description: 'Let ChatGPT execute code using Code Interpreter.',
                              },
                              {
                                label: 'Canvas',
                                description: 'Collaborate with ChatGPT on text and code.',
                              },
                              {
                                label: 'ChatGPT Voice',
                                description: 'Enable Voice in ChatGPT',
                              },
                              {
                                label: 'Advanced voice',
                                description: 'Have more natural conversations in Voice.',
                              },
                              {
                                label: 'Connector search',
                                description: 'Let ChatGPT automatically search connected sources for answers.',
                              },
                            ].map((item) => (
                              <div key={item.label} className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h5 className="text-xs font-medium text-gray-300 mb-1">{item.label}</h5>
                                  <p className="text-xs text-gray-400">{item.description}</p>
                                </div>
                                <button className="ml-4 relative inline-flex h-6 w-11 items-center rounded-full bg-[#cba2ff] transition-colors">
                                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {settingsCategory === 'apps' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-white mb-6">Apps</h3>
                      <p className="text-sm text-gray-400">App settings coming soon...</p>
                    </div>
                  )}

                  {settingsCategory === 'schedules' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-white mb-6">Schedules</h3>
                      <p className="text-sm text-gray-400">Schedule settings coming soon...</p>
                    </div>
                  )}

                  {settingsCategory === 'data' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-white mb-6">Data controls</h3>
                      
                      {/* Improve the model for everyone */}
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-300">Improve the model for everyone</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Off</span>
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[#2a2a2a]"></div>

                      {/* Remote browser data */}
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-300">Remote browser data</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">On</span>
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[#2a2a2a]"></div>

                      {/* Shared links */}
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-300">Shared links</span>
                        <button className="px-3 py-1.5 text-xs font-medium text-white bg-[#242424] border border-[#2a2a2a] rounded-md hover:bg-[#2a2a2a] transition-colors">
                          Manage
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[#2a2a2a]"></div>

                      {/* Archived chats */}
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-300">Archived chats</span>
                        <button className="px-3 py-1.5 text-xs font-medium text-white bg-[#242424] border border-[#2a2a2a] rounded-md hover:bg-[#2a2a2a] transition-colors">
                          Manage
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[#2a2a2a]"></div>

                      {/* Archive all chats */}
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-300">Archive all chats</span>
                        <button className="px-3 py-1.5 text-xs font-medium text-white bg-[#242424] border border-[#2a2a2a] rounded-md hover:bg-[#2a2a2a] transition-colors">
                          Archive all
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[#2a2a2a]"></div>

                      {/* Delete all chats */}
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-300">Delete all chats</span>
                        <button className="px-3 py-1.5 text-xs font-medium text-red-400 bg-[#242424] border border-red-800/50 rounded-md hover:bg-red-900/20 hover:border-red-700 transition-colors">
                          Delete all
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[#2a2a2a]"></div>

                      {/* Merge data from your personal workspace */}
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-300">Merge data from your personal workspace</span>
                        <button className="px-3 py-1.5 text-xs font-medium text-white bg-[#242424] border border-[#2a2a2a] rounded-md hover:bg-[#2a2a2a] transition-colors">
                          Merge
                        </button>
                      </div>
                    </div>
                  )}

                  {settingsCategory === 'security' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-white mb-6">Security</h3>
                      
                      {/* Passkeys */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-white mb-1">Passkeys</h4>
                            <p className="text-xs text-gray-400">
                              Passkeys are secure and protect your account with multi-factor authentication. They don&apos;t require any extra steps.
                            </p>
                          </div>
                          <button className="ml-4 px-3 py-1.5 text-xs font-medium text-white bg-[#242424] border border-[#2a2a2a] rounded-md hover:bg-[#2a2a2a] transition-colors flex items-center gap-1">
                            Add
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[#2a2a2a]"></div>

                      {/* Multi-factor authentication */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-white">Multi-factor authentication (MFA)</h4>
                        
                        {/* Authenticator app */}
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="text-xs font-medium text-gray-300 mb-1">Authenticator app</h5>
                            <p className="text-xs text-gray-400">
                              Use one-time codes from an authenticator app.
                            </p>
                          </div>
                          <button className="ml-4 relative inline-flex h-6 w-11 items-center rounded-full bg-[#2a2a2a] transition-colors">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                          </button>
                        </div>

                        {/* Text message */}
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="text-xs font-medium text-gray-300 mb-1">Text message</h5>
                            <p className="text-xs text-gray-400">
                              Get 6-digit verification codes by SMS or WhatsApp based on your country code.
                            </p>
                          </div>
                          <button className="ml-4 relative inline-flex h-6 w-11 items-center rounded-full bg-[#2a2a2a] transition-colors">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                          </button>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[#2a2a2a]"></div>

                      {/* Trusted Devices */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-white">Trusted Devices</h4>
                        <p className="text-xs text-gray-400">
                          When you sign in on another device, it will be added here and can automatically receive device prompts for signing in.
                        </p>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[#2a2a2a]"></div>

                      {/* Log out of this device */}
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-300">Log out of this device</span>
                        <button className="px-3 py-1.5 text-xs font-medium text-white bg-[#242424] border border-[#2a2a2a] rounded-md hover:bg-[#2a2a2a] transition-colors">
                          Log out
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[#2a2a2a]"></div>

                      {/* Log out of all devices */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <span className="text-sm text-gray-300 block mb-1">Log out of all devices</span>
                            <p className="text-xs text-gray-400">
                              Log out of all active sessions across all devices, including your current session. It may take up to 30 minutes for other devices to be logged out.
                            </p>
                          </div>
                          <button className="ml-4 px-3 py-1.5 text-xs font-medium text-red-400 bg-[#242424] border border-red-800/50 rounded-md hover:bg-red-900/20 hover:border-red-700 transition-colors">
                            Log out all
                          </button>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[#2a2a2a]"></div>

                      {/* Secure sign in with ChatGPT */}
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-white mb-1">Secure sign in with ChatGPT</h4>
                          <p className="text-xs text-gray-400">
                            Sign in to websites and apps across the internet with the trusted security of ChatGPT.
                          </p>
                          <button className="text-xs text-[#cba2ff] hover:text-[#b88ff5] underline mt-1">
                            Learn more
                          </button>
                        </div>
                        
                        {/* Info box */}
                        <div className="bg-[#242424] border border-[#2a2a2a] rounded-md p-4">
                          <p className="text-xs text-gray-400">
                            You haven&apos;t used ChatGPT to sign into any websites or apps yet. Once you do, they&apos;ll show up here.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsCategory === 'account' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-white mb-6">Account</h3>
                      
                      {/* Name */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Name</label>
                        <div className="text-sm text-white">{user?.username || 'User'}</div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[#2a2a2a]"></div>

                      {/* GPT Builder Profile */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-white mb-1">GPT builder profile</h4>
                          <p className="text-xs text-gray-400">
                            Personalize your builder profile to connect with users of your GPTs. These settings apply to publicly shared GPTs.
                          </p>
                        </div>

                        {/* GPT Preview Card */}
                        <div className="relative bg-[#242424] border border-[#2a2a2a] rounded-lg p-6">
                          <button className="absolute top-3 right-3 px-2 py-1 text-xs font-medium text-white bg-[#1a1a1a] border border-[#2a2a2a] rounded-md hover:bg-[#2a2a2a] transition-colors">
                            Preview
                          </button>
                          <div className="flex flex-col items-center text-center space-y-3">
                            {/* Cube icon */}
                            <div className="w-16 h-16 bg-[#cba2ff]/20 rounded-lg flex items-center justify-center">
                              <svg className="w-8 h-8 text-[#cba2ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                            <div>
                              <h5 className="text-base font-medium text-white">PlaceholderGPT</h5>
                              <div className="flex items-center justify-center gap-1 mt-1">
                                <span className="text-xs text-gray-400">By {user?.username || 'User'}</span>
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Name Field */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-300">Name</label>
                            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#cba2ff] transition-colors">
                              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                            </button>
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            value={user?.username || ''}
                            className="w-full px-3 py-2 bg-[#242424] border border-[#2a2a2a] rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#cba2ff]/50"
                          />
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-[#2a2a2a]"></div>

                        {/* Links */}
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-gray-300">Links</label>
                          
                          {/* Domain */}
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            <select className="flex-1 px-3 py-2 bg-[#242424] border border-[#2a2a2a] rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#cba2ff]/50">
                              <option>Select a domain</option>
                            </select>
                          </div>

                          {/* LinkedIn */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                              </svg>
                              <span className="text-sm text-gray-300">LinkedIn</span>
                            </div>
                            <button className="px-3 py-1.5 text-xs font-medium text-white bg-[#242424] border border-[#2a2a2a] rounded-md hover:bg-[#2a2a2a] transition-colors">
                              Add
                            </button>
                          </div>

                          {/* GitHub */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                              </svg>
                              <span className="text-sm text-gray-300">GitHub</span>
                            </div>
                            <button className="px-3 py-1.5 text-xs font-medium text-white bg-[#242424] border border-[#2a2a2a] rounded-md hover:bg-[#2a2a2a] transition-colors">
                              Add
                            </button>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-[#2a2a2a]"></div>

                        {/* Email */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">Email</label>
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm text-white">{user?.email || 'user@example.com'}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <input
                              type="checkbox"
                              id="feedback-emails"
                              className="w-4 h-4 rounded border-[#2a2a2a] bg-[#242424] text-[#cba2ff] focus:ring-2 focus:ring-[#cba2ff]/50"
                            />
                            <label htmlFor="feedback-emails" className="text-xs text-gray-400 cursor-pointer">
                              Receive feedback emails
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
