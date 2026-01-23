/**
 * Message List Component
 */

'use client';

import React, { useRef, useEffect } from 'react';
import MessageItem from './MessageItem';
import LoadingIndicator from './LoadingIndicator';
import type { MessageListProps } from '@/types';

export default function MessageList({ messages, loading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          <p>Start a conversation with TayAI</p>
        </div>
      )}
      
      {messages.map((message, index) => (
        <MessageItem key={index} message={message} />
      ))}
      
      {loading && <LoadingIndicator />}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
