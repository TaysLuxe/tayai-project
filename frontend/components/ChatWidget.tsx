'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { chatApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ title: string; content: string }>;
  timestamp?: Date;
}

export default function ChatWidget() {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !isAuthenticated) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await chatApi.sendMessage(input, conversationHistory);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        sources: response.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send message');
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-gray-500">Please log in to use the chat.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f] relative overflow-hidden">
      {/* Gradient semi-circle background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Semi-circle container */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[60%] w-[140%] aspect-square">
          {/* Blue/purple blob - left side */}
          <div className="absolute left-[10%] top-[20%] w-[45%] h-[45%] rounded-full bg-[#60a5fa] opacity-60 blur-[80px]"></div>
          {/* Pink/red blob - right side */}
          <div className="absolute right-[10%] top-[15%] w-[50%] h-[50%] rounded-full bg-[#f472b6] opacity-50 blur-[80px]"></div>
          {/* Purple center blend */}
          <div className="absolute left-1/2 -translate-x-1/2 top-[25%] w-[40%] h-[40%] rounded-full bg-[#a855f7] opacity-40 blur-[60px]"></div>
        </div>
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full overflow-hidden mb-4 shadow-lg shadow-[#cba2ff]/30">
              <Image
                src="/tayai-avatar.png"
                alt="TayAI"
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-md font-medium text-white mb-1">Start a conversation</h3>
            <p className="text-sm text-purple-400 max-w-sm">
              Ask TayAI anything about hair business, marketing, clients, or growing your brand.
            </p>
          </div>
        )}

        <div className="space-y-6 max-w-3xl mx-auto">
          {messages.map((message, index) => (
            <div key={index}>
              {/* User Message */}
              {message.role === 'user' && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] sm:max-w-[75%]">
                    <div className="bg-[#cba2ff] text-black rounded-2xl rounded-br-md px-4 py-3">
                      <p className="text-sm sm:text-base whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.timestamp && (
                      <p className="text-xs text-gray-600 mt-1 text-right">
                        {formatTime(message.timestamp)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Assistant Message */}
              {message.role === 'assistant' && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] sm:max-w-[75%]">
                    <div className="bg-[#1a1a1a] rounded-2xl rounded-bl-md px-4 py-3 border border-[#2a2a2a]">
                      <p className="text-sm sm:text-base text-gray-200 whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                          <p className="text-xs font-medium text-gray-500 mb-2">Sources:</p>
                          <div className="space-y-1">
                            {message.sources.map((source, idx) => (
                              <p key={idx} className="text-xs text-[#cba2ff]">
                                {source.title}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {message.timestamp && (
                      <p className="text-xs text-gray-600 mt-1">
                        {formatTime(message.timestamp)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#1a1a1a] rounded-2xl rounded-bl-md px-4 py-3 border border-[#2a2a2a]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-[#cba2ff] rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-[#cba2ff] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-[#cba2ff] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="relative z-10 border-t border-[#2a2a2a] bg-[#1a1a1a] px-4 sm:px-6 py-4">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto">
          {/* Chat Input Container */}
          <div className="relative bg-[#242424] border border-[#2a2a2a] rounded-2xl shadow-lg">
            {/* Placeholder Text Area */}
            <div className="px-4 pt-3 pb-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="How can I help you today?"
                className="w-full bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none text-sm sm:text-base min-h-[24px] max-h-[200px]"
                rows={1}
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() && !loading) {
                      handleSend(e as any);
                    }
                  }
                }}
                style={{
                  height: 'auto',
                  overflow: 'hidden',
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
            </div>
            
            {/* Bottom Row */}
            <div className="flex items-center justify-between px-3 pb-3 pt-2 border-t border-[#2a2a2a]">
              {/* Left Side - Plus and History */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-300 hover:bg-[#2a2a2a] rounded-lg transition-colors"
                  title="Attach files"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                
                <button
                  type="button"
                  className="p-2 border border-blue-500 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                  title="History"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2" />
                  </svg>
                </button>
              </div>
              
              {/* Right Side - Model Selection and Send */}
              <div className="flex items-center gap-3">
                {/* Model Selection */}
                <button
                  type="button"
                  className="flex items-center gap-1 px-3 py-1.5 text-gray-400 hover:text-gray-300 hover:bg-[#2a2a2a] rounded-lg transition-colors text-sm"
                >
                  <span>Haiku 4.5</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Send Button */}
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="p-2 bg-[#8B4513] hover:bg-[#A0522D] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  title="Send message"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
