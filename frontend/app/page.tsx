'use client';

import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import ChatWidget from '../components/ChatWidget';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { profileApi, chatApi, type ChatHistoryMessage } from '../lib/api';
import type { Language } from '../lib/translations';

/** One chat in the sidebar: can be a single Q&A or a grouped conversation. */
interface Conversation {
  id: number;
  title: string;
  createdAt: Date;
  messages: ChatHistoryMessage[];
}

export default function Dashboard() {
  const { isAuthenticated, logout, user, loading } = useAuth();
  const { language, setLanguage, t, languageNames, languageCodes } = useLanguage();
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatSessionId, setChatSessionId] = useState(1);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [historyItems, setHistoryItems] = useState<ChatHistoryMessage[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

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
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [selectedChatTitle, setSelectedChatTitle] = useState<string>(t.dashboard.yourChats);
  
  // Settings state
  const [appearance, setAppearance] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tayai_appearance') || 'system';
    }
    return 'system';
  });
  const [accentColor, setAccentColor] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tayai_accent_color') || 'default';
    }
    return 'default';
  });
  const [spokenLanguage, setSpokenLanguage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tayai_spoken_language') || 'auto-detect';
    }
    return 'auto-detect';
  });
  const [voice, setVoice] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tayai_voice') || 'vale';
    }
    return 'vale';
  });
  const [separateVoice, setSeparateVoice] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tayai_separate_voice') === 'true';
    }
    return false;
  });
  const [showAdditionalModels, setShowAdditionalModels] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tayai_show_additional_models') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  // Check if user has completed onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!loading && isAuthenticated) {
        try {
          const profile = await profileApi.getProfile();
          // Check if onboarding is completed
          const onboardingCompleted = profile?.metadata?.onboarding_completed === true;
          
          if (!onboardingCompleted) {
            router.push('/onboarding');
          } else {
            setCheckingOnboarding(false);
          }
        } catch (error) {
          // If profile fetch fails, assume onboarding not completed
          console.error('Failed to check onboarding status:', error);
          router.push('/onboarding');
        }
      }
    };

    checkOnboarding();
  }, [loading, isAuthenticated, router]);

  // Shared refresh: load chat history from API (used on mount, when opening dropdown, and after sending)
  const refreshHistory = useCallback(() => {
    if (!isAuthenticated) return;
    setHistoryLoading(true);
    chatApi
      .getChatHistory(50, 0)
      .then((res) => {
        const list = Array.isArray(res?.messages) ? res.messages : [];
        setHistoryItems(list);
      })
      .catch((err) => {
        console.error('Failed to load chat history:', err);
        setHistoryItems([]);
      })
      .finally(() => setHistoryLoading(false));
  }, [isAuthenticated]);

  // Fetch chat history when authenticated and onboarding done
  useEffect(() => {
    if (!isAuthenticated || checkingOnboarding) return;
    refreshHistory();
  }, [isAuthenticated, checkingOnboarding, refreshHistory]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest('[data-dropdown]') &&
        !target.closest('[data-user-menu]') &&
        !target.closest('[data-history-dropdown]')
      ) {
        setShowLanguageMenu(false);
        setShowLearnMoreMenu(false);
        setShowHelpMenu(false);
        setShowUserMenu(false);
        setShowHistoryDropdown(false);
      }
    };

    if (showLanguageMenu || showLearnMoreMenu || showHelpMenu || showUserMenu || showHistoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLanguageMenu, showLearnMoreMenu, showHelpMenu, showUserMenu, showHistoryDropdown]);

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
    setChatSessionId((prev) => prev + 1);
    setSelectedConversationId(null);
    setSelectedChatTitle(t.dashboard.yourChats);
    setShowHistoryDropdown(false);
  };

  // Each backend message = one row in "Your chats" (so every previous chat shows)
  const conversationsList = useMemo(() => {
    if (!historyItems.length) return [];
    return historyItems.map((m) => {
      const id = m.id ?? 0;
      const title = (m.message ?? '').trim().slice(0, 45) || t.dashboard.newChat;
      const createdAt = m.created_at ? new Date(m.created_at) : new Date();
      return {
        id,
        title,
        createdAt,
        messages: [m],
      } as Conversation;
    });
  }, [historyItems, t.dashboard.newChat]);

  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return conversationsList;
    const term = searchTerm.toLowerCase();
    return conversationsList.filter((c) => c.title.toLowerCase().includes(term));
  }, [conversationsList, searchTerm]);

  const selectedHistoryMessages = useMemo(() => {
    if (selectedConversationId == null) return undefined;
    const conv = conversationsList.find((c) => c.id === selectedConversationId);
    if (!conv?.messages?.length) return undefined;
    const msgs: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    for (const m of conv.messages) {
      msgs.push({ role: 'user', content: m.message });
      if (m.response) msgs.push({ role: 'assistant', content: m.response });
    }
    return msgs;
  }, [selectedConversationId, conversationsList]);

  if (loading || checkingOnboarding) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f]">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#cba2ff] mx-auto"></div>
          <p className="mt-4 text-gray-400 text-sm">{t.common.loading}</p>
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
            {t.dashboard.newChat}
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
              placeholder={t.dashboard.searchChats}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#242424] border border-[#2a2a2a] rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#cba2ff]/70 focus:border-[#cba2ff]"
            />
          </div>

          {/* Projects */}
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">{t.dashboard.projects}</p>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-200 bg-[#242424] rounded-md hover:bg-[#2a2a2a] transition-colors">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#cba2ff]/15 text-[#cba2ff] text-[11px]">
                TA
              </span>
              <span className="truncate">{t.dashboard.tayAIWorkspace}</span>
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

      {/* Chat history - compact dropdown style */}
      {!isSidebarCollapsed && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="relative mb-2" data-history-dropdown>
            <button
              onClick={() => {
                const opening = !showHistoryDropdown;
                setShowHistoryDropdown((prev) => !prev);
                if (opening) refreshHistory();
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs bg-[#242424] border border-[#2a2a2a] rounded-md text-gray-200 hover:border-[#cba2ff]/70 focus:outline-none focus:ring-1 focus:ring-[#cba2ff]/70"
            >
              <span className="truncate">
                {filteredHistory.length === 0 ? t.dashboard.yourChats : selectedChatTitle || t.dashboard.yourChats}
              </span>
              <svg
                className={`w-3 h-3 text-gray-400 ml-2 transition-transform ${showHistoryDropdown ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showHistoryDropdown && (
              <div className="absolute mt-1 w-full bg-[#111111] border border-[#2a2a2a] rounded-md shadow-xl z-20 max-h-56 overflow-y-auto">
                {historyLoading ? (
                  <div className="px-3 py-4 text-center text-xs text-gray-500">{t.common.loading}</div>
                ) : filteredHistory.length > 0 ? (
                  filteredHistory.map((session, idx) => (
                    <button
                      key={session.id ? String(session.id) : `chat-${idx}`}
                      onClick={() => {
                        setSelectedConversationId(session.id);
                        setSelectedChatTitle(session.title);
                        setShowHistoryDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-[#242424] truncate"
                    >
                      {session.title}
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-4 text-xs text-gray-500">{t.dashboard.noChatsYet}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings / User Menu at Bottom */}
      <div className="border-t border-[#2a2a2a] mt-auto overflow-visible">
        {/* Menu Items - Only visible when user menu is open */}
        {showUserMenu && !isSidebarCollapsed && (
          <>
            {/* User Display - using username since User interface doesn't include email */}
            <div className="px-4 pt-3 pb-2">
              <p className="text-xs text-gray-400">{user?.username || 'user'}</p>
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
                  <span>{t.common.settings}</span>
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
                    <span>{t.common.language}</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Language Dropdown - use language codes so setLanguage gets the correct value */}
                {showLanguageMenu && (
                  <div className="absolute right-0 bottom-full mb-1 w-56 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                    <div className="py-1">
                      {(Object.keys(languageNames) as Language[]).map((langCode) => {
                        const isSelected = language === langCode;
                        return (
                          <button
                            key={langCode}
                            className={`w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#242424] flex items-center justify-between ${
                              isSelected ? 'bg-[#242424]' : ''
                            }`}
                            onClick={() => {
                              setLanguage(langCode);
                              setShowLanguageMenu(false);
                            }}
                          >
                            <span>{languageNames[langCode]}</span>
                            {isSelected && (
                              <svg className="w-4 h-4 text-[#cba2ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
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
                    <span>{t.dashboard.getHelp}</span>
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
                            label: t.dashboard.helpCenter,
                            icon: (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ),
                          },
                          {
                            label: t.dashboard.releaseNotes,
                            icon: (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            ),
                          },
                          {
                            label: t.dashboard.termsPolicies,
                            icon: (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            ),
                          },
                          {
                            label: t.dashboard.keyboardShortcuts,
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
                    <span>{t.dashboard.learnMore}</span>
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
                        { label: t.dashboard.aboutTayAI, external: true },
                        { label: 'divider' },
                        { label: t.dashboard.usagePolicy, external: true },
                        { label: t.dashboard.keyboardShortcuts, shortcut: '⌘/' },
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
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
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
                <span>{t.common.logout}</span>
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
              <h1 className="text-md font-medium text-white">{t.dashboard.chatWithTayAI}</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm text-gray-500">{t.common.online}</span>
              </div>
            </div>
          </div>

          {/* Right-side actions */}
          <div className="flex items-center gap-3">
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

            {/* Global Settings button (always opens modal) */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#242424] transition-colors"
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
              <span className="text-sm">{t.common.settings}</span>
            </button>
          </div>
        </header>

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden">
          <ChatWidget
            key={selectedConversationId ?? `new-${chatSessionId}`}
            initialMessages={selectedHistoryMessages ?? []}
            loadRecentOnMount={false}
            onNewMessage={refreshHistory}
          />
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
                  <h2 className="text-lg font-semibold text-white">{t.common.settings}</h2>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 overflow-hidden">
                {/* Left Navigation */}
                <div className="w-64 border-r border-[#2a2a2a] overflow-y-auto">
                  <nav className="p-2 space-y-1">
                    {[
                      { 
                        id: 'general', 
                        label: t.settings.general, 
                        icon: (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )
                      },
                      { 
                        id: 'notifications', 
                        label: t.settings.notifications, 
                        icon: (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                        )
                      },
                      { 
                        id: 'personalization', 
                        label: t.settings.personalization, 
                        icon: (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                        )
                      },
                      { 
                        id: 'schedules', 
                        label: t.settings.schedules, 
                        icon: (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )
                      },
                      { 
                        id: 'account', 
                        label: t.settings.account, 
                        icon: (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )
                      },
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
                        <span className="flex items-center text-white">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Right Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {settingsCategory === 'general' && (
                    <div className="space-y-0">
                      <h3 className="text-xl font-semibold text-white mb-4">{t.settings.general}</h3>
                      
                      {/* Divider */}
                      <div className="h-px bg-[#2a2a2a] mb-0"></div>
                      
                      {/* Appearance */}
                      <div className="flex items-center justify-between py-3 border-b border-[#2a2a2a]">
                        <label className="text-sm font-medium text-gray-300">{t.settings.appearance}</label>
                        <select 
                          value={appearance}
                          onChange={(e) => {
                            setAppearance(e.target.value);
                            localStorage.setItem('tayai_appearance', e.target.value);
                          }}
                          className="px-3 py-1.5 bg-[#242424] border border-[#2a2a2a] rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#cba2ff]/50 min-w-[120px]"
                        >
                          <option value="system">{t.settings.system}</option>
                          <option value="light">{t.settings.light}</option>
                          <option value="dark">{t.settings.dark}</option>
                        </select>
                      </div>

                      {/* Accent color */}
                      <div className="flex items-center justify-between py-3 border-b border-[#2a2a2a]">
                        <label className="text-sm font-medium text-gray-300">{t.settings.accentColor}</label>
                        <select 
                          value={accentColor}
                          onChange={(e) => {
                            setAccentColor(e.target.value);
                            localStorage.setItem('tayai_accent_color', e.target.value);
                          }}
                          className="px-3 py-1.5 bg-[#242424] border border-[#2a2a2a] rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#cba2ff]/50 min-w-[120px]"
                        >
                          <option value="default">{t.settings.default}</option>
                          <option value="purple">{t.settings.purple}</option>
                          <option value="blue">{t.settings.blue}</option>
                          <option value="green">{t.settings.green}</option>
                          <option value="yellow">Yellow</option>
                          <option value="pink">Pink</option>
                          <option value="orange">Orange</option>
                        </select>
                      </div>

                      {/* Language */}
                      <div className="flex items-center justify-between py-3 border-b border-[#2a2a2a]">
                        <label className="text-sm font-medium text-gray-300">{t.common.language}</label>
                        <select 
                          className="px-3 py-1.5 bg-[#242424] border border-[#2a2a2a] rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#cba2ff]/50 min-w-[120px]"
                          value={language}
                          onChange={(e) => setLanguage(e.target.value as Language)}
                        >
                          <option value="en">English</option>
                          <option value="fr">Français</option>
                          <option value="nl">Nederlands</option>
                          <option value="es">Español</option>
                          <option value="pt">Português</option>
                        </select>
                      </div>

                      {/* Spoken language */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">{t.settings.spokenLanguage}</label>
                        <select 
                          value={spokenLanguage}
                          onChange={(e) => {
                            setSpokenLanguage(e.target.value);
                            localStorage.setItem('tayai_spoken_language', e.target.value);
                          }}
                          className="w-full px-3 py-2 bg-[#242424] border border-[#2a2a2a] rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#cba2ff]/50"
                        >
                          <option value="auto-detect">{t.settings.autoDetect}</option>
                          <option value="akk">Akkadian</option>
                          <option value="am">አማርኛ</option>
                          <option value="ar">العربية</option>
                          <option value="bg">български</option>
                          <option value="bn">বাংলা</option>
                          <option value="bs">bosanski</option>
                          <option value="ca">català</option>
                          <option value="cs">čeština</option>
                          <option value="da">dansk</option>
                          <option value="de">Deutsch</option>
                          <option value="el">Ελληνικά</option>
                          <option value="es-419">español (Latinoamérica)</option>
                          <option value="es-ES">español (España)</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                          <option value="hi">हिन्दी</option>
                          <option value="hr">hrvatski</option>
                          <option value="hu">magyar</option>
                          <option value="id">Bahasa Indonesia</option>
                          <option value="it">italiano</option>
                          <option value="ja">日本語</option>
                          <option value="ko">한국어</option>
                          <option value="ms">Bahasa Melayu</option>
                          <option value="nl">Nederlands</option>
                          <option value="no">norsk</option>
                          <option value="pl">polski</option>
                          <option value="pt-BR">português (Brasil)</option>
                          <option value="pt-PT">português (Portugal)</option>
                          <option value="pt">Português</option>
                          <option value="ro">română</option>
                          <option value="ru">русский</option>
                          <option value="sk">slovenčina</option>
                          <option value="sl">slovenščina</option>
                          <option value="sr">српски</option>
                          <option value="sv">svenska</option>
                          <option value="sw">Kiswahili</option>
                          <option value="ta">தமிழ்</option>
                          <option value="th">ไทย</option>
                          <option value="tr">Türkçe</option>
                          <option value="uk">українська</option>
                          <option value="ur">اردو</option>
                          <option value="vi">Tiếng Việt</option>
                          <option value="zh-CN">中文 (简体)</option>
                          <option value="zh-TW">中文 (繁體)</option>
                        </select>
                        <p className="text-xs text-gray-500">
                          For best results, select the language you mainly speak. If it&apos;s not listed, it may still be supported via auto-detection.
                        </p>
                      </div>

                      {/* Voice */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">{t.settings.voice}</label>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => {
                              // Voice preview functionality can be added here
                              console.log('Preview voice:', voice);
                            }}
                            className="p-2 bg-[#242424] border border-[#2a2a2a] rounded-full hover:bg-[#2a2a2a] transition-colors"
                          >
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </button>
                          <select 
                            value={voice}
                            onChange={(e) => {
                              setVoice(e.target.value);
                              localStorage.setItem('tayai_voice', e.target.value);
                            }}
                            className="flex-1 px-3 py-2 bg-[#242424] border border-[#2a2a2a] rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#cba2ff]/50"
                          >
                            <option value="vale">Vale</option>
                            <option value="alloy">Alloy</option>
                            <option value="echo">Echo</option>
                            <option value="fable">Fable</option>
                            <option value="onyx">Onyx</option>
                            <option value="shimmer">Shimmer</option>
                          </select>
                        </div>
                      </div>

                      {/* Separate Voice */}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex-1">
                          <label className="text-sm font-medium text-gray-300 block">{t.settings.separateVoice}</label>
                          <p className="text-xs text-gray-500 mt-1">
                            Keep Tay AI Voice in a separate full screen, without real time transcripts and visuals.
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            const newValue = !separateVoice;
                            setSeparateVoice(newValue);
                            localStorage.setItem('tayai_separate_voice', String(newValue));
                          }}
                          className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            separateVoice ? 'bg-[#cba2ff]' : 'bg-[#2a2a2a]'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            separateVoice ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      {/* Show additional models */}
                      <div className="flex items-center justify-between py-2">
                        <label className="text-sm font-medium text-gray-300">{t.settings.showAdditionalModels}</label>
                        <button 
                          onClick={() => {
                            const newValue = !showAdditionalModels;
                            setShowAdditionalModels(newValue);
                            localStorage.setItem('tayai_show_additional_models', String(newValue));
                          }}
                          className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            showAdditionalModels ? 'bg-[#cba2ff]' : 'bg-[#2a2a2a]'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            showAdditionalModels ? 'translate-x-6' : 'translate-x-1'
                          }`} />
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
                              Get notified when Tay AI responds to requests that take time, like research or image generation.
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
                              Stay in the loop on new tools, tips, and features from Tay AI.
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
                          Set the style and tone of how Tay AI responds to you. This doesn&apos;t impact Tay AI&apos;s capabilities.
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
                            placeholder="What should Tay AI call you?"
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
                              Let Tay AI save and use memories when responding.
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Tay AI may use Memory to personalize queries to search providers, such as Bing.{' '}
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
                              Let Tay AI reference all previous recording transcripts and notes when responding.
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
                                description: 'Let Tay AI automatically search the web for answers.',
                              },
                              {
                                label: 'Code',
                                description: 'Let Tay AI execute code using Code Interpreter.',
                              },
                              {
                                label: 'Canvas',
                                description: 'Collaborate with Tay AI on text and code.',
                              },
                              {
                                label: 'Tay AI Voice',
                                description: 'Enable Voice in Tay AI',
                              },
                              {
                                label: 'Advanced voice',
                                description: 'Have more natural conversations in Voice.',
                              },
                              {
                                label: 'Connector search',
                                description: 'Let Tay AI automatically search connected sources for answers.',
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

                  {settingsCategory === 'schedules' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-white mb-6">Schedules</h3>
                      <p className="text-sm text-gray-400">Schedule settings coming soon...</p>
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

                      {/* Tay AI Builder Profile */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-white mb-1">Tay AI builder profile</h4>
                          <p className="text-xs text-gray-400">
                            Personalize your builder profile to connect with users of your Tay AI assistants. These settings apply to publicly shared Tay AI assistants.
                          </p>
                        </div>

                        {/* Tay AI Preview Card */}
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
                              <h5 className="text-base font-medium text-white">Tay AI</h5>
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
                            <span className="text-sm text-white">{user?.username || 'user'}</span>
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
