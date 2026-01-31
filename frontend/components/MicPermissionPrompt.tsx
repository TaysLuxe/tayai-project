'use client';

import React from 'react';

interface MicPermissionPromptProps {
  onAllow: () => void;
  onDeny: () => void;
}

export default function MicPermissionPrompt({ onAllow, onDeny }: MicPermissionPromptProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-[#242424] flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Allow microphone access?</h3>
        <p className="text-sm text-gray-400 mb-6">
          Voice features require microphone access to hear your questions and commands.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onDeny}
            className="flex-1 py-2.5 rounded-lg border border-[#2a2a2a] text-gray-300 hover:bg-[#242424] transition-colors font-medium"
          >
            Deny
          </button>
          <button
            type="button"
            onClick={onAllow}
            className="flex-1 py-2.5 rounded-lg bg-[#cba2ff] text-black hover:bg-[#b88ff5] transition-colors font-medium"
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}
