'use client';

import React, { useState, useEffect } from 'react';
import {
  VOICE_PERSONAS,
  SPEECH_SETTINGS_KEYS,
  DEFAULT_SPEECH_SETTINGS,
  type VoicePersonaId,
} from '../lib/voice';

const LANGUAGES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
  { value: 'ja-JP', label: 'Japanese' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
] as const;

interface VoiceModeSettingsPanelProps {
  onClose: () => void;
  onOpenVoiceSelection: () => void;
  selectedVoiceId: VoicePersonaId;
}

function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = localStorage.getItem(key);
    if (v == null) return fallback;
    if (typeof fallback === 'boolean') return (v === 'true') as T;
    if (typeof fallback === 'number') return Number(v) as T;
    return v as T;
  } catch {
    return fallback;
  }
}

function setStored(key: string, value: string | number | boolean) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // ignore
  }
}

export default function VoiceModeSettingsPanel({
  onClose,
  onOpenVoiceSelection,
  selectedVoiceId,
}: VoiceModeSettingsPanelProps) {
  const [language, setLanguage] = useState(DEFAULT_SPEECH_SETTINGS.mainLanguage);
  const [speechSpeed, setSpeechSpeed] = useState(DEFAULT_SPEECH_SETTINGS.voiceSpeed);
  const [showTranscript, setShowTranscript] = useState(DEFAULT_SPEECH_SETTINGS.showTranscriptionInVoiceMode);
  const [autoDetect, setAutoDetect] = useState(DEFAULT_SPEECH_SETTINGS.autoDetectLanguage);

  useEffect(() => {
    setLanguage(getStored(SPEECH_SETTINGS_KEYS.mainLanguage, DEFAULT_SPEECH_SETTINGS.mainLanguage));
    setSpeechSpeed(getStored(SPEECH_SETTINGS_KEYS.voiceSpeed, DEFAULT_SPEECH_SETTINGS.voiceSpeed));
    setShowTranscript(getStored(SPEECH_SETTINGS_KEYS.showTranscriptionInVoiceMode, DEFAULT_SPEECH_SETTINGS.showTranscriptionInVoiceMode));
    setAutoDetect(getStored(SPEECH_SETTINGS_KEYS.autoDetectLanguage, DEFAULT_SPEECH_SETTINGS.autoDetectLanguage));
  }, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setLanguage(v);
    setStored(SPEECH_SETTINGS_KEYS.mainLanguage, v);
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setSpeechSpeed(v);
    setStored(SPEECH_SETTINGS_KEYS.voiceSpeed, v);
  };

  const toggleShowTranscript = () => {
    const next = !showTranscript;
    setShowTranscript(next);
    setStored(SPEECH_SETTINGS_KEYS.showTranscriptionInVoiceMode, next);
  };

  const toggleAutoDetect = () => {
    const next = !autoDetect;
    setAutoDetect(next);
    setStored(SPEECH_SETTINGS_KEYS.autoDetectLanguage, next);
  };

  const selectedVoice = VOICE_PERSONAS.find((p) => p.id === selectedVoiceId);

  return (
    <div
      className="fixed inset-y-0 right-0 w-80 max-w-[90vw] bg-[#1a1a1a] border-l border-[#2a2a2a] z-50 flex flex-col shadow-xl"
      role="dialog"
      aria-label="Voice settings"
    >
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#2a2a2a]">
        <h2 className="text-lg font-semibold text-white">Voice Settings</h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#2a2a2a] transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto flex-1">
        {/* Voice */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Voice</label>
          <button
            type="button"
            onClick={onOpenVoiceSelection}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#2a2a2a] rounded-xl text-white hover:bg-[#3a3a3a] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg text-[#cba2ff]">♪</span>
              <span>{selectedVoice?.name ?? selectedVoiceId}</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Language</label>
          <select
            value={language}
            onChange={handleLanguageChange}
            className="w-full px-4 py-3 bg-[#2a2a2a] rounded-xl text-white border-none focus:ring-2 focus:ring-[#cba2ff] focus:outline-none"
          >
            {LANGUAGES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Speech Speed */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Speech Speed: {speechSpeed}x
          </label>
          <input
            type="range"
            min="0.75"
            max="1.5"
            step="0.25"
            value={speechSpeed}
            onChange={handleSpeedChange}
            className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-[#cba2ff]"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0.75x</span>
            <span>1x</span>
            <span>1.5x</span>
          </div>
        </div>

        {/* Show live transcription */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-white text-sm block">Show live transcription</span>
            <p className="text-gray-500 text-xs">Display text while speaking</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showTranscript}
            onClick={toggleShowTranscript}
            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
              showTranscript ? 'bg-[#cba2ff]' : 'bg-[#2a2a2a]'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                showTranscript ? 'translate-x-7 left-0.5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Auto-detect language */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-white text-sm block">Auto-detect language</span>
            <p className="text-gray-500 text-xs">Automatically detect spoken language</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoDetect}
            onClick={toggleAutoDetect}
            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
              autoDetect ? 'bg-[#cba2ff]' : 'bg-[#2a2a2a]'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                autoDetect ? 'translate-x-7 left-0.5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
