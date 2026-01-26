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
    <div className="flex flex-col h-full bg-[#0f0f0f]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full overflow-hidden mb-4 shadow-lg shadow-[#cba2ff]/20">
              <Image
                src="/tayai-avatar.png"
                alt="TayAI"
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-md font-medium text-white mb-1">Start a conversation</h3>
            <p className="text-sm text-gray-500 max-w-sm">
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
      <div className="border-t border-[#2a2a2a] bg-[#1a1a1a] px-4 sm:px-6 py-4">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message"
              className="flex-1 px-4 py-3 bg-[#242424] border border-[#2a2a2a] rounded-full focus:outline-none focus:ring-2 focus:ring-[#cba2ff]/50 focus:border-[#cba2ff] text-white placeholder-gray-500 text-sm sm:text-base"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3 bg-[#cba2ff] text-black rounded-full hover:bg-[#b88ff5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
