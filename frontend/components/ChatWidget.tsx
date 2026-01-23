/**
 * Chat Widget Component
 * Main chat interface component
 */

'use client';

import React, { useState } from 'react';
import { chatApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { MessageList, ChatInput, ErrorAlert } from './ui';
import type { Message } from '@/types';

export default function ChatWidget() {
  const { isAuthenticated, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !isAuthenticated) return;

    const userMessage: Message = { role: 'user', content: input };
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
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <MessageList messages={messages} loading={loading} />
        
        {error && (
        <div className="px-4 pb-2">
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
          </div>
        )}
        
      <ChatInput
            value={input}
        onChange={setInput}
        onSubmit={handleSend}
        disabled={!isAuthenticated}
        loading={loading}
      />
    </div>
  );
}
