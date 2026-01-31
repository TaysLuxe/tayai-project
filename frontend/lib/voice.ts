/**
 * Voice & Dictation - constants and types per spec.
 */

export type DictationState = 'inactive' | 'listening' | 'processing' | 'completed';

export type VoiceModeState = 'idle' | 'ready' | 'listening' | 'processing' | 'responding' | 'speaking' | 'muted' | 'paused' | 'error';

export const VOICE_PERSONAS = [
  { id: 'juniper', name: 'Juniper', description: 'Calm, clear, neutral', useCase: 'General purpose, professional' },
  { id: 'breeze', name: 'Breeze', description: 'Warm, friendly, upbeat', useCase: 'Casual conversation' },
  { id: 'ember', name: 'Ember', description: 'Confident, articulate', useCase: 'Business, presentations' },
  { id: 'cove', name: 'Cove', description: 'Soothing, measured', useCase: 'Reading, accessibility' },
  { id: 'sol', name: 'Sol', description: 'Energetic, expressive', useCase: 'Creative, entertainment' },
  { id: 'vale', name: 'Vale', description: 'Steady, reassuring', useCase: 'Support, guidance' },
] as const;

export type VoicePersonaId = typeof VOICE_PERSONAS[number]['id'];

export const VOICE_PREVIEW_PHRASE = "Hi, I'm {name}. How can I help you today?";

export const SPEECH_SETTINGS_KEYS = {
  mainLanguage: 'speech_main_language',
  voice: 'speech_voice',
  voiceModeLayout: 'speech_voice_mode_layout', // 'integrated' | 'separate'
  autoDetectLanguage: 'speech_auto_detect_language',
  showTranscriptionInVoiceMode: 'speech_show_transcription',
  autoSendAfterSilence: 'speech_auto_send_after_silence',
  autoSendSilenceDuration: 'speech_auto_send_silence_duration_sec',
  voiceSpeed: 'speech_voice_speed',
} as const;

export const DEFAULT_SPEECH_SETTINGS = {
  mainLanguage: 'en-US',
  voice: 'juniper' as VoicePersonaId,
  voiceModeLayout: 'separate' as const,
  autoDetectLanguage: true,
  showTranscriptionInVoiceMode: true,
  autoSendAfterSilence: false,
  autoSendSilenceDuration: 2,
  voiceSpeed: 1,
};

export const SILENCE_END_TURN_MS = 1800;

export const KEYBOARD_SHORTCUTS = {
  toggleVoiceMode: 'Ctrl+Shift+V',
  toggleDictation: 'Ctrl+Shift+D',
  muteInVoiceMode: 'Space',
  exitVoiceMode: 'Escape',
  sendWhileDictating: 'Enter',
} as const;

/** Read a speech setting from localStorage (client-only). */
export function getSpeechSetting<K extends keyof typeof DEFAULT_SPEECH_SETTINGS>(
  key: K
): (typeof DEFAULT_SPEECH_SETTINGS)[K] {
  if (typeof window === 'undefined') return DEFAULT_SPEECH_SETTINGS[key];
  const storageKey = (SPEECH_SETTINGS_KEYS as Record<K, string>)[key];
  const fallback = DEFAULT_SPEECH_SETTINGS[key];
  try {
    const v = localStorage.getItem(storageKey);
    if (v == null) return fallback;
    if (typeof fallback === 'boolean') return (v === 'true') as (typeof DEFAULT_SPEECH_SETTINGS)[K];
    if (typeof fallback === 'number') return Number(v) as (typeof DEFAULT_SPEECH_SETTINGS)[K];
    return v as (typeof DEFAULT_SPEECH_SETTINGS)[K];
  } catch {
    return fallback;
  }
}
