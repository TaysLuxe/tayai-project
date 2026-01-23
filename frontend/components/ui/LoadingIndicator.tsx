/**
 * Loading Indicator Component (for chat messages)
 */

'use client';

import React from 'react';
import { UI } from '@/constants';

export default function LoadingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-3">
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
            style={{ animationDelay: UI.ANIMATION_DELAYS.BOUNCE_1 }}
          ></div>
          <div
            className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
            style={{ animationDelay: UI.ANIMATION_DELAYS.BOUNCE_2 }}
          ></div>
        </div>
      </div>
    </div>
  );
}
