/**
 * Message Item Component
 */

'use client';

import React from 'react';
import type { MessageItemProps } from '@/types';

export default function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
            <p className="text-xs font-semibold mb-1">Sources:</p>
            {message.sources.map((source, idx) => (
              <div key={idx} className="text-xs mb-1">
                <span className="font-medium">{source.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
