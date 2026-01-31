'use client';

import React from 'react';
import type { VoiceModeState } from '../lib/voice';
import VoiceOrb, { type VoiceOrbState } from './VoiceOrb';

interface VoiceModeViewProps {
  state: VoiceModeState;
  transcriptText?: string;
  /** 0–1 for orb listening visualization */
  audioLevel?: number;
  onBack: () => void;
  onMute: () => void;
  onInterrupt?: () => void;
  onEnd: () => void;
  onCancel?: () => void;
  isMuted: boolean;
  onSettings?: () => void;
  onOverflow?: () => void;
  /** Show live transcript area */
  showTranscript?: boolean;
  /** Permission denied / connection lost - show error UI */
  errorType?: 'permission' | 'connection' | null;
  onRetry?: () => void;
}

function voiceModeStateToOrbState(state: VoiceModeState): VoiceOrbState {
  switch (state) {
    case 'idle':
    case 'ready':
      return 'idle';
    case 'listening':
      return 'listening';
    case 'processing':
      return 'processing';
    case 'responding':
    case 'speaking':
      return 'speaking';
    case 'muted':
    case 'paused':
      return 'muted';
    case 'error':
      return 'error';
    default:
      return 'idle';
  }
}

const STATE_TO_STATUS_TEXT: Record<string, string> = {
  idle: 'Tap the orb to start',
  ready: 'Tap the orb to start',
  listening: 'Listening...',
  processing: 'Thinking...',
  responding: 'tayai is speaking...',
  speaking: 'tayai is speaking...',
  muted: 'Microphone muted',
  paused: 'Microphone muted',
  error: 'Something went wrong',
};

export default function VoiceModeView({
  state,
  transcriptText = '',
  audioLevel = 0,
  onBack,
  onMute,
  onInterrupt,
  onEnd,
  onCancel,
  isMuted,
  onSettings,
  onOverflow,
  showTranscript = true,
  errorType = null,
  onRetry,
}: VoiceModeViewProps) {
  const orbState = isMuted ? 'muted' : voiceModeStateToOrbState(state);
  const statusText = STATE_TO_STATUS_TEXT[state] ?? 'Listening...';

  if (errorType === 'permission') {
    return (
      <div className="fixed inset-0 z-40 flex flex-col bg-[#0a0a0a]">
        <header className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors p-2"
            aria-label="Back to chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Back to chat</span>
          </button>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-20 h-20 flex items-center justify-center rounded-full bg-red-500/20 mb-4">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Microphone access required</h3>
          <p className="text-gray-400 mb-6 max-w-xs">
            Voice mode needs microphone access to hear your voice. Please enable it in your browser settings.
          </p>
          <button
            type="button"
            onClick={onRetry ?? onBack}
            className="px-6 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-xl transition-colors"
          >
            {onRetry ? 'Try again' : 'Back to chat'}
          </button>
        </main>
      </div>
    );
  }

  if (errorType === 'connection') {
    return (
      <div className="fixed inset-0 z-40 flex flex-col bg-[#0a0a0a]">
        <header className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors p-2"
            aria-label="Back to chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Back to chat</span>
          </button>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-20 h-20 flex items-center justify-center rounded-full bg-yellow-500/20 mb-4">
            <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 010-5.656m-7.072 7.072a9 9 0 010-12.728m3.536 3.536a4 4 0 010 5.656" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Connection lost</h3>
          <p className="text-gray-400 mb-6 max-w-xs">
            We&apos;re having trouble connecting. Please check your internet and try again.
          </p>
          <button
            type="button"
            onClick={onRetry ?? onBack}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl transition-colors"
          >
            {onRetry ? 'Retry' : 'Back to chat'}
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#0a0a0a]">
      {/* Header - spec */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a] flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors p-2 -ml-2"
          aria-label="Back to chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Back to chat</span>
        </button>
        <div className="flex items-center gap-1">
          {onSettings && (
            <button
              type="button"
              onClick={onSettings}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#2a2a2a] transition-colors"
              aria-label="Voice settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
          {onOverflow && (
            <button
              type="button"
              onClick={onOverflow}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#2a2a2a] transition-colors"
              aria-label="More options"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Main - orb, status, transcript */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 min-h-0">
        <div className="relative mb-8">
          <VoiceOrb state={orbState} audioLevel={audioLevel} />
        </div>
        <p className="text-gray-400 text-lg mb-6 text-center" aria-live="polite">
          {statusText}
        </p>
        {showTranscript && transcriptText && (
          <div className="max-w-md w-full text-center px-4 py-3 bg-[#1a1a1a]/80 rounded-xl border border-[#2a2a2a]">
            <p className="text-gray-300 text-sm">{transcriptText}</p>
          </div>
        )}
      </main>

      {/* Footer - Mute & End - spec; z-[60] so End stays clickable above settings panel (z-50) */}
      <footer className="relative z-[60] px-4 py-6 border-t border-[#2a2a2a] flex-shrink-0 bg-[#0a0a0a]">
        <div className="flex items-center justify-center gap-8">
          {/* Mute */}
          <button
            type="button"
            onClick={onMute}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${
              isMuted
                ? 'bg-red-500/20 text-red-400'
                : 'bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#3a3a3a]'
            }`}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-[#1a1a1a]">
              {isMuted ? (
                <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </div>
            <span className="text-xs font-medium">{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          {/* End - explicitly onEnd so it always ends voice conversation */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEnd();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEnd();
            }}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
            aria-label="End voice conversation"
          >
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-red-500">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="text-xs font-medium">End</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
