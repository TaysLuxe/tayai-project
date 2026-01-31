'use client';

import React, { useState } from 'react';
import { VOICE_PERSONAS, VOICE_PREVIEW_PHRASE, type VoicePersonaId } from '../lib/voice';

interface VoiceSelectionModalProps {
  selectedVoiceId: VoicePersonaId;
  onSelect: (id: VoicePersonaId) => void;
  onClose: () => void;
}

export default function VoiceSelectionModal({
  selectedVoiceId,
  onSelect,
  onClose,
}: VoiceSelectionModalProps) {
  const [playingId, setPlayingId] = useState<VoicePersonaId | null>(null);

  const handlePlay = (id: VoicePersonaId) => {
    if (playingId === id) {
      window.speechSynthesis?.cancel();
      setPlayingId(null);
      return;
    }
    setPlayingId(id);
    const persona = VOICE_PERSONAS.find((p) => p.id === id);
    const phrase = VOICE_PREVIEW_PHRASE.replace('{name}', persona?.name ?? id);
    const u = new SpeechSynthesisUtterance(phrase);
    u.rate = 1;
    u.onend = () => setPlayingId(null);
    u.onerror = () => setPlayingId(null);
    window.speechSynthesis?.speak(u);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-semibold text-white">Choose a Voice</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4">
          {VOICE_PERSONAS.map((persona) => {
            const isSelected = selectedVoiceId === persona.id;
            const isPlaying = playingId === persona.id;
            return (
              <div
                key={persona.id}
                className={`rounded-xl border p-4 transition-colors ${
                  isSelected ? 'border-[#cba2ff] bg-[#cba2ff]/10' : 'border-[#2a2a2a] bg-[#242424] hover:border-[#3a3a3c]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{persona.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{persona.description}</p>
                  </div>
                  {isSelected && (
                    <svg className="w-5 h-5 text-[#cba2ff] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => handlePlay(persona.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3c] text-sm transition-colors"
                    aria-label={isPlaying ? 'Stop preview' : 'Play preview'}
                  >
                    {isPlaying ? (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                        Stop
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        Play
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelect(persona.id)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#cba2ff]/20 text-[#cba2ff] hover:bg-[#cba2ff]/30 text-sm font-medium transition-colors"
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-6 py-4 border-t border-[#2a2a2a]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-[#cba2ff] text-black font-medium hover:bg-[#b88ff5] transition-colors"
          >
            Save Selection
          </button>
        </div>
      </div>
    </div>
  );
}
