/**
 * Chat Input Component
 */

'use client';

import React from 'react';
import type { ChatInputProps } from '@/types';

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  loading = false,
}: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} className="border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="flex space-x-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          disabled={disabled || loading}
        />
        <button
          type="submit"
          disabled={disabled || loading || !value.trim()}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </form>
  );
}
