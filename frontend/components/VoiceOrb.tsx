'use client';

import React from 'react';

export type VoiceOrbState = 'idle' | 'listening' | 'processing' | 'speaking' | 'muted' | 'error';

interface VoiceOrbProps {
  state: VoiceOrbState;
  /** 0–1 for audio amplitude (listening state) */
  audioLevel?: number;
}

/* Orb color #b47bff (rgb 180, 123, 255) */
const ORB_GLOW: Record<VoiceOrbState, string> = {
  idle: 'shadow-[0_0_60px_rgba(180,123,255,0.3)]',
  listening: 'shadow-[0_0_100px_rgba(180,123,255,0.5)]',
  processing: 'shadow-[0_0_80px_rgba(180,123,255,0.4)]',
  speaking: 'shadow-[0_0_120px_rgba(180,123,255,0.6)]',
  muted: 'shadow-[0_0_40px_rgba(107,114,128,0.3)]',
  error: 'shadow-[0_0_60px_rgba(239,68,68,0.4)]',
};

const ORB_CLASS: Record<VoiceOrbState, string> = {
  idle: 'voice-orb-breathe',
  listening: 'voice-orb-pulse-slow scale-105',
  processing: 'voice-orb-spin-slow',
  speaking: 'scale-110',
  muted: 'opacity-60 grayscale-[30%]',
  error: 'voice-orb-shake',
};

export default function VoiceOrb({ state, audioLevel = 0 }: VoiceOrbProps) {
  const glowClass = ORB_GLOW[state];
  const orbClass = ORB_CLASS[state];
  const orbStyle: React.CSSProperties =
    state === 'listening' && audioLevel > 0
      ? { transform: `scale(${1.05 + audioLevel * 0.15})` }
      : {};

  return (
    <div className="relative w-48 h-48 flex items-center justify-center" aria-hidden>
      {/* Outer glow */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-500 ${glowClass}`}
      />

      {/* Pulsing rings for listening/speaking - #b47bff */}
      {(state === 'listening' || state === 'speaking') && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: 'rgba(180,123,255,0.2)' }} />
          <div className="absolute inset-4 rounded-full animate-ping voice-orb-ping-delay" style={{ backgroundColor: 'rgba(180,123,255,0.15)' }} />
          <div className="absolute inset-8 rounded-full animate-ping" style={{ backgroundColor: 'rgba(180,123,255,0.1)', animationDelay: '300ms' }} />
        </div>
      )}

      {/* Main orb */}
      <div
        className={`relative w-32 h-32 rounded-full transition-all duration-300 ${orbClass}`}
        style={orbStyle}
      >
        {/* Orb fill #b47bff with gradient depth and highlight */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#cba2ff] via-[#b47bff] to-[#9333ea]" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-transparent to-white/20" />

        {/* Listening indicator - subtle inner pulse - spec */}
        {state === 'listening' && (
          <div className="absolute inset-4 rounded-full border-2 border-white/30 animate-pulse pointer-events-none" />
        )}

        {/* Shimmer overlay (processing) */}
        {state === 'processing' && (
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent voice-orb-shimmer" />
          </div>
        )}

        {/* Waveform bars (speaking) */}
        {state === 'speaking' && (
          <div className="absolute inset-0 flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className="w-1.5 bg-white/60 rounded-full voice-orb-waveform-bar"
                style={{
                  height: `${20 + (i * 12)}%`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Muted overlay */}
        {state === 'muted' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-full">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          </div>
        )}

        {/* Error overlay */}
        {state === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-full">
            <svg
              className="w-12 h-12 text-red-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
