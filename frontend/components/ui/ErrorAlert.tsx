/**
 * Error Alert Component
 */

'use client';

import React from 'react';

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

export default function ErrorAlert({ message, onDismiss }: ErrorAlertProps) {
  return (
    <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded">
      <div className="flex items-center justify-between">
        <span>{message}</span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
