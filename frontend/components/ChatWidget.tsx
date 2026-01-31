'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { chatApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { DictationState } from '../lib/voice';
import type { VoiceModeState } from '../lib/voice';
import VoiceModeView from './VoiceModeView';
import VoiceSelectionModal from './VoiceSelectionModal';
import VoiceModeSettingsPanel from './VoiceModeSettingsPanel';
import TayAIAvatar from './TayAIAvatar';
import { DEFAULT_SPEECH_SETTINGS, VOICE_PERSONAS, getSpeechSetting } from '../lib/voice';
import type { VoicePersonaId } from '../lib/voice';

interface VoiceConversationTurn {
  role: 'user' | 'assistant';
  text: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ title: string; content: string }>;
  timestamp?: Date;
  isVoice?: boolean;
  voiceDuration?: string;
  /** Voice mode: full conversation block with duration and transcript */
  voiceConversation?: { duration: string; transcript: VoiceConversationTurn[] };
}

interface ChatWidgetProps {
  initialMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  loadRecentOnMount?: boolean;
  conversationId?: number | null;
  onNewMessage?: () => void;
  onConversationId?: (id: number) => void;
}

export default function ChatWidget({
  initialMessages,
  loadRecentOnMount = false,
  conversationId,
  onNewMessage,
  onConversationId,
}: ChatWidgetProps) {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>(() =>
    (initialMessages ?? []).map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: new Date(),
    }))
  );
  const [initialLoadDone, setInitialLoadDone] = useState(!loadRecentOnMount && initialMessages !== undefined);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentContext, setAttachmentContext] = useState<string>('');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [dictationState, setDictationState] = useState<DictationState>('inactive');
  const [showVoiceMode, setShowVoiceMode] = useState(false);
  const [voiceModeState, setVoiceModeState] = useState<VoiceModeState>('ready');
  const [voiceModeMuted, setVoiceModeMuted] = useState(false);
  const [voiceModeTranscript, setVoiceModeTranscript] = useState('');
  const [voiceModeError, setVoiceModeError] = useState<'permission' | 'connection' | null>(null);
  const [voiceModeRetryKey, setVoiceModeRetryKey] = useState(0);
  const [voiceHoldProgress, setVoiceHoldProgress] = useState(0);
  const [isHoldingVoiceButton, setIsHoldingVoiceButton] = useState(false);
  const voiceHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceHoldStartRef = useRef<number>(0);
  const voiceHoldRafRef = useRef<number | null>(null);
  const voiceConversationRef = useRef<VoiceConversationTurn[]>([]);
  const voiceStartTimeRef = useRef<number>(0);
  const VOICE_HOLD_DURATION_MS = 500;
  const [selectedVoiceId, setSelectedVoiceId] = useState<VoicePersonaId>(() => {
    if (typeof window === 'undefined') return DEFAULT_SPEECH_SETTINGS.voice;
    const stored = localStorage.getItem('speech_voice');
    if (stored && VOICE_PERSONAS.some((p) => p.id === stored)) return stored as VoicePersonaId;
    return DEFAULT_SPEECH_SETTINGS.voice;
  });
  const [showVoiceSelection, setShowVoiceSelection] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showVoiceTranscript, setShowVoiceTranscript] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const voiceModeRecognitionRef = useRef<any>(null);
  const voiceModeTranscriptRef = useRef('');
  const dictationInputStartRef = useRef('');
  const dictationCommittedRef = useRef('');
  const dictationSilenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dictationDurationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [dictationDurationSec, setDictationDurationSec] = useState<number>(0);
  const DICTATION_SILENCE_MS = 2000;
  const [voiceWaveformData, setVoiceWaveformData] = useState<number[]>([]);
  const voiceModeStreamRef = useRef<MediaStream | null>(null);
  const voiceModeAudioContextRef = useRef<AudioContext | null>(null);
  const voiceModeAnalyserRef = useRef<AnalyserNode | null>(null);
  const voiceModeRafRef = useRef<number | null>(null);
  const voiceModeRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceModeSilenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceModeRecordedChunksRef = useRef<Blob[]>([]);
  const WAVEFORM_BARS = 24;
  const VOICE_SILENCE_MS = 2000;
  /** Set to true to show the Voice Mode (hold-to-speak) button and enable Ctrl+Shift+V */
  const SHOW_VOICE_MODE_UI = false;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // New chat / empty session: scroll to top so UI starts from the beginning (ChatGPT-like)
  useEffect(() => {
    if (messages.length === 0 && messagesScrollRef.current) {
      messagesScrollRef.current.scrollTop = 0;
    }
  }, [messages.length]);

  // Sync messages when initialMessages prop changes (e.g. user selected another conversation)
  useEffect(() => {
    if (initialMessages != null && initialMessages.length > 0) {
      setMessages(
        initialMessages.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: new Date(),
        }))
      );
      setInitialLoadDone(true);
      // Show conversation from the start (scroll to top)
      requestAnimationFrame(() => {
        if (messagesScrollRef.current) messagesScrollRef.current.scrollTop = 0;
      });
    }
  }, [initialMessages]);

  // Load recent conversation context when in "current chat" mode
  useEffect(() => {
    if (!loadRecentOnMount || !isAuthenticated || initialLoadDone) return;
    let cancelled = false;
    chatApi
      .getConversationContext(20)
      .then((res) => {
        if (cancelled || !res.conversation_history?.length) return;
        setMessages(
          res.conversation_history.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: new Date(),
          }))
        );
      })
      .catch((err) => {
        if (!cancelled) console.error('Failed to load conversation context:', err);
      })
      .finally(() => {
        if (!cancelled) setInitialLoadDone(true);
      });
    return () => {
      cancelled = true;
    };
  }, [loadRecentOnMount, isAuthenticated, initialLoadDone]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuIndex !== null) {
        const target = event.target as HTMLElement;
        if (!target.closest('.message-menu-container')) {
          setOpenMenuIndex(null);
        }
      }
      if (showPlusMenu && plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setShowPlusMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuIndex, showPlusMenu]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (voiceModeRecognitionRef.current) {
        try {
          voiceModeRecognitionRef.current.onresult = null;
          voiceModeRecognitionRef.current.onerror = null;
          voiceModeRecognitionRef.current.onend = null;
          voiceModeRecognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Map persona id to OpenAI TTS voice (backend /voice/speak accepts alloy, echo, fable, onyx, nova, shimmer)
  const personaToOpenAIVoice: Record<string, string> = {
    juniper: 'alloy',
    breeze: 'shimmer',
    ember: 'nova',
    cove: 'echo',
    sol: 'fable',
    vale: 'onyx',
  };

  const sendVoiceRecordingAndPlayResponse = useCallback(
    async (audioBlob: Blob) => {
      const voice = personaToOpenAIVoice[selectedVoiceId] || 'alloy';
      setVoiceModeState('processing');
      try {
        const res = await chatApi.speakWithAudio(audioBlob, voice);
        const transcript = decodeURIComponent(res.headers.get('X-Transcript') || '');
        const responseText = decodeURIComponent(res.headers.get('X-Response-Text') || '');
        const audioBlobResponse = await res.blob();
        if (transcript && voiceConversationRef.current.length > 0) {
          const last = voiceConversationRef.current[voiceConversationRef.current.length - 1];
          if (last.role === 'user') last.text = transcript;
          else voiceConversationRef.current.push({ role: 'user', text: transcript });
        } else if (transcript) {
          voiceConversationRef.current.push({ role: 'user', text: transcript });
        }
        if (responseText) {
          voiceConversationRef.current.push({ role: 'assistant', text: responseText });
        }
        setVoiceModeTranscript(transcript);
        setVoiceModeState('responding');
        const url = URL.createObjectURL(audioBlobResponse);
        const audio = new Audio(url);
        audio.onended = () => {
          URL.revokeObjectURL(url);
          if (showVoiceMode && !voiceModeMuted) {
            setVoiceModeState('listening');
          }
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          setVoiceModeState('listening');
        };
        await audio.play();
      } catch (err: any) {
        setVoiceModeState('error');
        const msg = err?.data?.detail || err?.message || 'Voice request failed';
        setError(msg);
        setTimeout(() => setVoiceModeState('listening'), 2000);
      }
    },
    [selectedVoiceId, showVoiceMode, voiceModeMuted]
  );

  // Voice Mode: record user speech, send audio to server on silence, play TTS response
  useEffect(() => {
    if (!showVoiceMode || voiceModeMuted) {
      if (voiceModeRecognitionRef.current) {
        try {
          voiceModeRecognitionRef.current.stop();
        } catch {
          // ignore
        }
        voiceModeRecognitionRef.current = null;
      }
      if (voiceModeSilenceTimeoutRef.current) {
        clearTimeout(voiceModeSilenceTimeoutRef.current);
        voiceModeSilenceTimeoutRef.current = null;
      }
      return;
    }
    const SR = (typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition))
      ? new ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)()
      : null;
    if (!SR) return;
    voiceModeTranscriptRef.current = '';
    setVoiceModeTranscript('');
    SR.lang = 'en-US';
    SR.interimResults = true;
    SR.continuous = true;
    SR.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        voiceModeTranscriptRef.current = (voiceModeTranscriptRef.current + ' ' + finalTranscript).trim();
        setVoiceModeTranscript(voiceModeTranscriptRef.current);
        voiceConversationRef.current.push({ role: 'user', text: finalTranscript.trim() });

        const stream = voiceModeStreamRef.current;
        if (stream && !voiceModeRecorderRef.current && typeof MediaRecorder !== 'undefined') {
          voiceModeRecordedChunksRef.current = [];
          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
          const recorder = new MediaRecorder(stream, { mimeType });
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) voiceModeRecordedChunksRef.current.push(e.data);
          };
          recorder.onstop = () => {
            const chunks = voiceModeRecordedChunksRef.current;
            if (chunks.length > 0) {
              const blob = new Blob(chunks, { type: mimeType });
              sendVoiceRecordingAndPlayResponse(blob);
            }
            voiceModeRecorderRef.current = null;
            voiceModeRecordedChunksRef.current = [];
          };
          recorder.start(100);
          voiceModeRecorderRef.current = recorder;
        }
        if (voiceModeSilenceTimeoutRef.current) clearTimeout(voiceModeSilenceTimeoutRef.current);
        voiceModeSilenceTimeoutRef.current = setTimeout(() => {
          voiceModeSilenceTimeoutRef.current = null;
          const rec = voiceModeRecorderRef.current;
          if (rec && rec.state === 'recording') {
            rec.stop();
          }
        }, VOICE_SILENCE_MS);
      }
    };
    SR.onerror = () => {
      voiceModeRecognitionRef.current = null;
    };
    SR.onend = () => {
      voiceModeRecognitionRef.current = null;
    };
    try {
      SR.start();
      voiceModeRecognitionRef.current = SR;
    } catch {
      voiceModeRecognitionRef.current = null;
    }
    return () => {
      if (voiceModeRecognitionRef.current) {
        try {
          voiceModeRecognitionRef.current.stop();
        } catch {
          // ignore
        }
        voiceModeRecognitionRef.current = null;
      }
      if (voiceModeSilenceTimeoutRef.current) {
        clearTimeout(voiceModeSilenceTimeoutRef.current);
        voiceModeSilenceTimeoutRef.current = null;
      }
    };
  }, [showVoiceMode, voiceModeMuted, sendVoiceRecordingAndPlayResponse]);

  // Voice Mode: live waveform from mic frequency (AnalyserNode)
  useEffect(() => {
    if (!showVoiceMode || typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setVoiceWaveformData([]);
      return;
    }
    let cancelled = false;
    const startAnalyser = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        voiceModeStreamRef.current = stream;
        const ctx = new AudioContext();
        voiceModeAudioContextRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.7;
        voiceModeAnalyserRef.current = analyser;
        const src = ctx.createMediaStreamSource(stream);
        src.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          if (cancelled || !voiceModeAnalyserRef.current) return;
          voiceModeAnalyserRef.current.getByteFrequencyData(data);
          const bars: number[] = [];
          const binCount = data.length;
          for (let i = 0; i < WAVEFORM_BARS; i++) {
            const idx = Math.floor((i / WAVEFORM_BARS) * binCount);
            bars.push(data[idx] ?? 0);
          }
          setVoiceWaveformData(bars);
          voiceModeRafRef.current = requestAnimationFrame(tick);
        };
        voiceModeRafRef.current = requestAnimationFrame(tick);
      } catch {
        setVoiceWaveformData([]);
        if (!cancelled) setVoiceModeError('permission');
      }
    };
    startAnalyser();
    return () => {
      cancelled = true;
      setVoiceModeError(null);
      if (voiceModeRafRef.current != null) {
        cancelAnimationFrame(voiceModeRafRef.current);
        voiceModeRafRef.current = null;
      }
      voiceModeAnalyserRef.current = null;
      if (voiceModeAudioContextRef.current) {
        voiceModeAudioContextRef.current.close().catch(() => {});
        voiceModeAudioContextRef.current = null;
      }
      if (voiceModeStreamRef.current) {
        voiceModeStreamRef.current.getTracks().forEach((t) => t.stop());
        voiceModeStreamRef.current = null;
      }
      setVoiceWaveformData([]);
    };
  }, [showVoiceMode, voiceModeRetryKey]);

  useEffect(() => {
    if (showVoiceMode) setShowVoiceTranscript(getSpeechSetting('showTranscriptionInVoiceMode'));
  }, [showVoiceMode]);

  const getSpeechRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    return SR ? new SR() : null;
  }, []);

  const stopDictationAndKeepText = useCallback(() => {
    if (dictationSilenceTimeoutRef.current) {
      clearTimeout(dictationSilenceTimeoutRef.current);
      dictationSilenceTimeoutRef.current = null;
    }
    if (dictationDurationRef.current) {
      clearInterval(dictationDurationRef.current);
      dictationDurationRef.current = null;
    }
    setDictationDurationSec(0);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setDictationState('completed');
  }, []);

  const cancelDictationAndDiscard = useCallback(() => {
    if (dictationSilenceTimeoutRef.current) {
      clearTimeout(dictationSilenceTimeoutRef.current);
      dictationSilenceTimeoutRef.current = null;
    }
    if (dictationDurationRef.current) {
      clearInterval(dictationDurationRef.current);
      dictationDurationRef.current = null;
    }
    setDictationDurationSec(0);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setInput(dictationInputStartRef.current);
    setDictationState('inactive');
  }, []);

  const toggleDictation = useCallback(async () => {
    if (dictationState === 'listening' || dictationState === 'processing') {
      stopDictationAndKeepText();
      return;
    }
    const recognition = getSpeechRecognition();
    if (!recognition) {
      setError('Voice input is not supported in this browser.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Microphone access is not available.');
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setError('Microphone access is required for dictation. Please allow mic access and try again.');
      return;
    }
    dictationInputStartRef.current = input;
    dictationCommittedRef.current = '';
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event: any) => {
      if (dictationSilenceTimeoutRef.current) {
        clearTimeout(dictationSilenceTimeoutRef.current);
      }
      dictationSilenceTimeoutRef.current = setTimeout(() => {
        dictationSilenceTimeoutRef.current = null;
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {
            // ignore
          }
          recognitionRef.current = null;
        }
        if (dictationDurationRef.current) {
          clearInterval(dictationDurationRef.current);
          dictationDurationRef.current = null;
        }
        setDictationDurationSec(0);
        setDictationState('completed');
      }, DICTATION_SILENCE_MS);
      let committed = dictationCommittedRef.current;
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? '';
        if (result.isFinal) {
          committed += (committed ? ' ' : '') + transcript;
          interim = '';
        } else {
          interim = transcript;
        }
      }
      dictationCommittedRef.current = committed;
      const prefix = dictationInputStartRef.current.trim();
      const parts = [prefix, committed, interim].filter(Boolean);
      setInput(parts.join(' '));
    };
    recognition.onerror = (event: any) => {
      if (dictationSilenceTimeoutRef.current) {
        clearTimeout(dictationSilenceTimeoutRef.current);
        dictationSilenceTimeoutRef.current = null;
      }
      if (dictationDurationRef.current) {
        clearInterval(dictationDurationRef.current);
        dictationDurationRef.current = null;
      }
      setDictationDurationSec(0);
      if (event.error !== 'aborted') {
        setError('There was a problem with voice recognition. Please try again.');
      }
      setDictationState('inactive');
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      if (dictationDurationRef.current) {
        clearInterval(dictationDurationRef.current);
        dictationDurationRef.current = null;
      }
      setDictationState((s) => {
        if (s === 'listening') {
          setTimeout(() => setDictationState('completed'), 300);
          return 'processing';
        }
        return s;
      });
      recognitionRef.current = null;
    };
    try {
      recognition.start();
      recognitionRef.current = recognition;
      setDictationState('listening');
      setDictationDurationSec(0);
      dictationDurationRef.current = setInterval(() => {
        setDictationDurationSec((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Unable to start voice recording.');
      setDictationState('inactive');
    }
  }, [dictationState, getSpeechRecognition, input, stopDictationAndKeepText]);

  const openVoiceMode = useCallback(() => {
    voiceStartTimeRef.current = Date.now();
    voiceConversationRef.current = [];
    setShowVoiceMode(true);
    setVoiceModeState('listening');
    setVoiceModeMuted(false);
  }, []);

  const startVoiceHold = useCallback(() => {
    if (showVoiceMode) return;
    setIsHoldingVoiceButton(true);
    setVoiceHoldProgress(0);
    voiceHoldStartRef.current = Date.now();
    if (voiceHoldTimerRef.current) clearTimeout(voiceHoldTimerRef.current);
    voiceHoldTimerRef.current = setTimeout(() => {
      voiceHoldTimerRef.current = null;
      setIsHoldingVoiceButton(false);
      setVoiceHoldProgress(0);
      openVoiceMode();
    }, VOICE_HOLD_DURATION_MS);
    const tick = () => {
      if (!voiceHoldStartRef.current) return;
      const elapsed = Date.now() - voiceHoldStartRef.current;
      const p = Math.min(elapsed / VOICE_HOLD_DURATION_MS, 1);
      setVoiceHoldProgress(p);
      if (p < 1) voiceHoldRafRef.current = requestAnimationFrame(tick);
    };
    voiceHoldRafRef.current = requestAnimationFrame(tick);
  }, [showVoiceMode, openVoiceMode]);

  const cancelVoiceHold = useCallback(() => {
    setIsHoldingVoiceButton(false);
    setVoiceHoldProgress(0);
    if (voiceHoldTimerRef.current) {
      clearTimeout(voiceHoldTimerRef.current);
      voiceHoldTimerRef.current = null;
    }
    voiceHoldStartRef.current = 0;
    if (voiceHoldRafRef.current) {
      cancelAnimationFrame(voiceHoldRafRef.current);
      voiceHoldRafRef.current = null;
    }
  }, []);

  const closeVoiceModeAndApplyTranscript = useCallback(() => {
    const t = voiceModeTranscriptRef.current.trim();
    const transcript = voiceConversationRef.current;
    const startTime = voiceStartTimeRef.current;
    if (transcript.length > 0 && startTime > 0) {
      const durationSec = Math.floor((Date.now() - startTime) / 1000);
      const duration = `${Math.floor(durationSec / 60)}:${(durationSec % 60).toString().padStart(2, '0')}`;
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          voiceConversation: { duration, transcript: [...transcript] },
        },
      ]);
      scrollToBottom();
    }
    if (t) {
      setInput((prev) => (prev ? `${prev} ${t}`.trim() : t));
    }
    setVoiceModeTranscript('');
    voiceModeTranscriptRef.current = '';
    voiceConversationRef.current = [];
    setVoiceModeError(null);
    // Stop speech recognition
    if (voiceModeRecognitionRef.current) {
      try {
        voiceModeRecognitionRef.current.stop();
      } catch {
        // ignore
      }
      voiceModeRecognitionRef.current = null;
    }
    // Release microphone and audio immediately (don't rely only on effect cleanup)
    if (voiceModeRafRef.current != null) {
      cancelAnimationFrame(voiceModeRafRef.current);
      voiceModeRafRef.current = null;
    }
    voiceModeAnalyserRef.current = null;
    if (voiceModeAudioContextRef.current) {
      voiceModeAudioContextRef.current.close().catch(() => {});
      voiceModeAudioContextRef.current = null;
    }
    if (voiceModeStreamRef.current) {
      voiceModeStreamRef.current.getTracks().forEach((track) => track.stop());
      voiceModeStreamRef.current = null;
    }
    setVoiceWaveformData([]);
    setShowVoiceMode(false);
    setShowVoiceSettings(false);
  }, []);

  // Keyboard shortcuts - spec: Ctrl+Shift+V voice mode, Space mute, Escape exit, Enter interrupt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showVoiceMode) closeVoiceModeAndApplyTranscript();
        else if (dictationState === 'listening' || dictationState === 'processing') {
          e.preventDefault();
          cancelDictationAndDiscard();
        }
        return;
      }
      if (showVoiceMode) {
        if (e.key === ' ') {
          e.preventDefault();
          setVoiceModeMuted((m) => {
            const next = !m;
            setVoiceModeState(next ? 'muted' : 'listening');
            return next;
          });
        }
        if (e.key === 'Enter' && (voiceModeState === 'responding' || voiceModeState === 'speaking')) {
          e.preventDefault();
          setVoiceModeState('listening');
        }
      }
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && e.shiftKey && e.key === 'V') {
        if (!SHOW_VOICE_MODE_UI) return;
        e.preventDefault();
        if (showVoiceMode) closeVoiceModeAndApplyTranscript();
        else openVoiceMode();
      }
      if (isMod && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        if (dictationState === 'listening' || dictationState === 'processing') {
          stopDictationAndKeepText();
        } else {
          toggleDictation();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showVoiceMode, dictationState, voiceModeState, toggleDictation, closeVoiceModeAndApplyTranscript, openVoiceMode, stopDictationAndKeepText, cancelDictationAndDiscard]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !isAuthenticated) return;

    // Merge current input with any attachment-derived context
    let messageToSend = input.trim();
    if (attachmentContext.trim()) {
      messageToSend += `\n\nAdditional context from uploaded files:\n${attachmentContext.trim()}`;
    }

    const userMessage: Message = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setAttachmentContext('');
    setLoading(true);
    setError(null);

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await chatApi.sendMessage(messageToSend, conversationHistory, conversationId ?? undefined);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        sources: response.sources?.map((s: any) => ({
          title: s.title,
          content: s.content ?? '',
        })),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (response.conversation_id != null) onConversationId?.(response.conversation_id);
      onNewMessage?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send message');
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setAttachments(fileArray);

    // Build text context from supported file types
    const textSnippets: string[] = [];

    await Promise.all(
      fileArray.map(async (file) => {
        const isTextLike =
          file.type.startsWith('text/') ||
          /\.((txt|md|csv|json))$/i.test(file.name);

        if (isTextLike) {
          const content = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string) || '');
            reader.readAsText(file);
          });

          const trimmed = content.trim().slice(0, 4000); // avoid huge payloads
          textSnippets.push(
            `--- File: ${file.name} (text excerpt) ---\n${trimmed}`
          );
        } else {
          // Non-text file (image, PDF, etc.) – mention it so the AI knows it exists
          textSnippets.push(
            `--- File: ${file.name} (non-text attachment such as an image, screenshot, or document). `
            + `You cannot see this file directly; rely on the user's description of it in their question. ---`
          );
        }
      })
    );

    setAttachmentContext(textSnippets.join('\n\n'));
  };

  const handleAddFilesOrPhotos = () => {
    fileInputRef.current?.click();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const handleOpenCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera is not supported in this browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setShowCamera(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraError('Could not access your camera. Please check permissions.');
    }
  };

  const handleCloseCamera = () => {
    stopCamera();
    setShowCamera(false);
  };

  // @test comment    test
  const handleCaptureScreenshot = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Match canvas to video size
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const fileName = `tayai-screenshot-${Date.now()}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // Use DataTransfer to construct a FileList for existing handler
      const dt = new DataTransfer();
      dt.items.add(file);
      await handleFilesSelected(dt.files);

      // Add explicit prompt context for screenshot use-case
      setAttachmentContext((prev) => {
        const extra =
          '\nScreenshot context: This image is the post I am referring to; please create a prompt or content similar to this.';
        return prev ? `${prev}\n${extra}` : extra.trimStart();
      });

      handleCloseCamera();
    }, 'image/png');
  };

  const handleTakeScreenshot = () => {
    handleOpenCamera();
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-gray-500">{t.auth.signInToContinue}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#000000] relative overflow-hidden">
      {/* Gradient semi-circle background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Semi-circle container */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[60%] w-[140%] aspect-square">
          {/* Blue/purple blob - left side */}
          <div className="absolute left-[10%] top-[20%] w-[45%] h-[45%] rounded-full bg-[#60a5fa] opacity-60 blur-[80px]"></div>
          {/* Pink/red blob - right side */}
          <div className="absolute right-[10%] top-[15%] w-[50%] h-[50%] rounded-full bg-[#f472b6] opacity-50 blur-[80px]"></div>
          {/* Purple center blend */}
          <div className="absolute left-1/2 -translate-x-1/2 top-[25%] w-[40%] h-[40%] rounded-full bg-[#a855f7] opacity-40 blur-[60px]"></div>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesScrollRef} className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <TayAIAvatar size={80} />
            <div className="font-semibold">
              <p className="text-lg text-[#363636] dark:text-[#e5e5e5] mb-1">
                {(() => {
                  const h = new Date().getHours();
                  const timeGreeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
                  const displayName = (user?.username || 'User').toUpperCase();
                  return `${timeGreeting}, ${displayName}`;
                })()}
              </p>
              <p className="text-lg">
                <span className="text-[#363636] dark:text-[#e5e5e5]">How Can I </span>
                <span className="text-[#6960f4]">Assist You Today?</span>
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6 max-w-3xl mx-auto">
          {messages.map((message, index) => (
            <div key={index}>
              {/* User Message */}
              {message.role === 'user' && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] sm:max-w-[75%]">
                    <div className="bg-[#cba2ff] text-black rounded-2xl rounded-br-md px-4 py-3">
                      <p className="text-sm sm:text-base whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {/* Voice indicator for voice messages */}
                    {message.isVoice && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 justify-end">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        {message.voiceDuration && <span>{message.voiceDuration}</span>}
                      </div>
                    )}
                    {message.timestamp && (
                      <p className="text-xs text-gray-600 mt-1 text-right">
                        {formatTime(message.timestamp)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Assistant Message */}
              {message.role === 'assistant' && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] sm:max-w-[75%]">
                    {message.voiceConversation ? (
                      <div className="flex flex-col gap-4 p-4 bg-gradient-to-br from-blue-900/20 to-[#1a1a1a] rounded-2xl border border-blue-800/30">
                        <div className="flex items-center gap-2 text-blue-400">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                          <span className="text-sm font-medium">Voice conversation</span>
                          <span className="text-blue-500/60 text-xs">• {message.voiceConversation.duration}</span>
                        </div>
                        <div className="space-y-3">
                          {message.voiceConversation.transcript.map((turn, idx) => (
                            <div key={idx} className="flex gap-3">
                              {turn.role === 'user' ? (
                                <>
                                  <div className="w-6 h-6 rounded-full bg-[#2a2a2a] flex items-center justify-center shrink-0">
                                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                  </div>
                                  <p className="text-gray-300 text-sm leading-relaxed">{turn.text}</p>
                                </>
                              ) : (
                                <>
                                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0 text-xs">🤖</div>
                                  <p className="text-gray-300 text-sm leading-relaxed">{turn.text}</p>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-[#1a1a1a] rounded-2xl rounded-bl-md px-4 py-3 border border-[#2a2a2a]">
                          <p className="text-sm sm:text-base text-gray-200 whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </p>
                          {message.sources && message.sources.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                              <p className="text-xs font-medium text-gray-500 mb-2">Sources:</p>
                              <div className="space-y-1">
                                {message.sources.map((source, idx) => (
                                  <p key={idx} className="text-xs text-[#cba2ff]">
                                    {source.title}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {message.timestamp && (
                          <p className="text-xs text-gray-600 mt-1">
                            {formatTime(message.timestamp)}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#1a1a1a] rounded-2xl rounded-bl-md px-4 py-3 border border-[#2a2a2a]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-[#cba2ff] rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-[#cba2ff] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-[#cba2ff] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Error (inline for chat errors) */}
          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="relative z-10 border-t border-[#2a2a2a] bg-[#1a1a1a] px-4 sm:px-6 py-4">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto">
          {/* Hidden file input for attachments */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,text/*,.txt,.md,.csv,.json"
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
          {/* Chat Input Container - Single-row: + dropdown | textarea | send */}
          <div className="relative">
                {/* Attached files preview - above the bar */}
                {attachments.length > 0 && (
                  <div className="px-3 pt-2 pb-1 text-xs text-gray-400 flex flex-wrap gap-1">
                    <span className="mr-1 text-gray-500">Attached:</span>
                    {attachments.map((file) => (
                      <span
                        key={file.name}
                        className="px-2 py-0.5 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300"
                      >
                        {file.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Single-row input: + dropdown | textarea | mic (inside field) | send */}
                <div
                  ref={plusMenuRef}
                  className="flex items-center gap-2 px-3 bg-[#232323] border border-[#cfcfcf] min-h-[52px]"
                >
                  {/* Plus button + dropdown */}
                  <div className="relative flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowPlusMenu((v) => !v)}
                      className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${showPlusMenu ? 'bg-[#3a3a3c] text-[#cfcfcf]' : 'text-gray-400 hover:text-white hover:bg-[#3a3a3c]'}`}
                      aria-label="Add or more options"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>

                    {/* Dropdown menu */}
                    {showPlusMenu && (
                      <div className="absolute left-0 bottom-full mb-1 w-64 rounded-xl bg-[#2c2c2e] border border-[#3a3a3c] shadow-xl py-1.5 z-20">
                        <button
                          type="button"
                          onClick={() => { fileInputRef.current?.click(); setShowPlusMenu(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3a3a3c] transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <span>{t.chat.addPhotosAndFiles}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPlusMenu(false)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3a3a3c] transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          <span>{t.chat.addFromGoogleDrive}</span>
                        </button>
                        <div className="my-1 border-t border-[#3a3a3c]" />
                        <button
                          type="button"
                          onClick={() => { handleOpenCamera(); setShowPlusMenu(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3a3a3c] transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{t.chat.createImage}</span>
                        </button>
                        <button type="button" onClick={() => setShowPlusMenu(false)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3a3a3c] transition-colors">
                          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <span>{t.chat.thinking}</span>
                        </button>
                        <button type="button" onClick={() => setShowPlusMenu(false)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3a3a3c] transition-colors">
                          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <span>{t.chat.deepResearch}</span>
                        </button>
                        <button type="button" onClick={() => setShowPlusMenu(false)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3a3a3c] transition-colors">
                          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          <span>{t.chat.shoppingResearch}</span>
                        </button>
                        <button type="button" onClick={() => setShowPlusMenu(false)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3a3a3c] transition-colors">
                          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                          </svg>
                          <span>{t.chat.moreActions}</span>
                          <svg className="w-4 h-4 ml-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Recording indicator bar - spec */}
                  {(dictationState === 'listening' || dictationState === 'processing') && (
                    <div
                      className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex-shrink-0"
                      aria-live="polite"
                      role="status"
                    >
                      {dictationState === 'processing' ? (
                        <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden>
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0" aria-hidden />
                      )}
                      <span>{dictationState === 'processing' ? 'Processing...' : 'Recording...'}</span>
                      {dictationState === 'listening' && dictationDurationSec > 0 && (
                        <span className="text-red-300 text-xs tabular-nums">
                          {Math.floor(dictationDurationSec / 60)}:{(dictationDurationSec % 60).toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Text input - real-time transcription when listening */}
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={dictationState === 'listening' || dictationState === 'processing' ? undefined : t.chat.typeMessage}
                    className="flex-1 min-w-0 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none text-[12px] min-h-[24px] max-h-[200px] py-1"
                    rows={1}
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        if (dictationState === 'listening' || dictationState === 'processing') {
                          e.preventDefault();
                          cancelDictationAndDiscard();
                        }
                        return;
                      }
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (dictationState === 'listening' || dictationState === 'processing') {
                          stopDictationAndKeepText();
                          if (input.trim() && !loading) handleSend(e as any);
                        } else if (input.trim() && !loading) {
                          handleSend(e as any);
                        }
                      }
                    }}
                    style={{ height: 'auto', overflow: 'hidden' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = `${target.scrollHeight}px`;
                    }}
                  />

                  {/* Dictation: mic - spec UI states (Idle / Recording / Processing / Disabled) */}
                  <button
                    type="button"
                    onClick={toggleDictation}
                    disabled={dictationState === 'processing' || (dictationState === 'inactive' && !getSpeechRecognition())}
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors flex-shrink-0 relative ${
                      dictationState === 'listening'
                        ? 'bg-red-500 text-white animate-pulse'
                        : dictationState === 'processing'
                          ? 'bg-gray-600 text-white cursor-wait'
                          : dictationState === 'inactive' && !getSpeechRecognition()
                            ? 'text-gray-600 cursor-not-allowed opacity-50'
                            : 'text-gray-400 hover:text-white'
                    }`}
                    title={
                      dictationState === 'processing'
                        ? 'Processing...'
                        : dictationState === 'listening'
                          ? 'Stop Dictation'
                          : dictationState === 'inactive' && !getSpeechRecognition()
                            ? 'Microphone unavailable'
                            : 'Dictate'
                    }
                    aria-label={
                      dictationState === 'processing'
                        ? 'Processing speech'
                        : dictationState === 'listening'
                          ? 'Stop Dictation'
                          : dictationState === 'inactive' && !getSpeechRecognition()
                            ? 'Microphone unavailable'
                            : 'Dictate'
                    }
                  >
                    {dictationState === 'listening' && (
                      <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" aria-hidden />
                    )}
                    {dictationState === 'processing' ? (
                      <svg className="w-5 h-5 animate-spin relative z-10" fill="none" viewBox="0 0 24 24" aria-hidden>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    )}
                  </button>

                  {/* Voice Mode: hidden for now - set SHOW_VOICE_MODE_UI to true to re-enable */}
                  {SHOW_VOICE_MODE_UI && (
                    <button
                      type="button"
                      onMouseDown={startVoiceHold}
                      onMouseUp={cancelVoiceHold}
                      onMouseLeave={cancelVoiceHold}
                      onTouchStart={(e) => { e.preventDefault(); startVoiceHold(); }}
                      onTouchEnd={cancelVoiceHold}
                      onTouchCancel={cancelVoiceHold}
                      className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-colors flex-shrink-0 ${
                        isHoldingVoiceButton ? 'text-cyan-400' : 'text-gray-400 hover:text-white'
                      }`}
                      title="Voice mode"
                      aria-label={isHoldingVoiceButton ? 'Release to cancel, keep holding to start' : 'Hold to start voice mode'}
                    >
                      {isHoldingVoiceButton && (
                        <svg className="absolute inset-0 w-10 h-10 -rotate-90" aria-hidden>
                          <circle
                            cx="20"
                            cy="20"
                            r="18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeDasharray={113}
                            strokeDashoffset={113 - voiceHoldProgress * 113}
                            className="text-cyan-500 transition-all duration-100"
                          />
                        </svg>
                      )}
                      <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </button>
                  )}

                  {/* Send: disabled or hidden when inactive with no text - spec 1.2 */}
                  {input.trim() && (
                    <button
                      type="submit"
                      disabled={loading || dictationState === 'listening'}
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                      title={t.chat.sendMessage}
                      aria-label={t.chat.sendMessage}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    </button>
                  )}
                </div>
          </div>
        </form>

        {/* Full-screen Voice Mode - spec 2.2 */}
        {showVoiceMode && (
          <VoiceModeView
            state={voiceModeMuted ? 'muted' : voiceModeState}
            transcriptText={voiceModeTranscript}
            audioLevel={
              voiceWaveformData.length === 24
                ? voiceWaveformData.reduce((a, b) => a + b, 0) / (24 * 255)
                : 0
            }
            onBack={closeVoiceModeAndApplyTranscript}
            onMute={() => {
              setVoiceModeMuted((m) => {
                const next = !m;
                setVoiceModeState(next ? 'muted' : 'listening');
                return next;
              });
            }}
            onInterrupt={() => setVoiceModeState('listening')}
            onEnd={closeVoiceModeAndApplyTranscript}
            onCancel={closeVoiceModeAndApplyTranscript}
            isMuted={voiceModeMuted}
            onSettings={() => setShowVoiceSettings(true)}
            onOverflow={() => {}}
            showTranscript={showVoiceTranscript}
            errorType={voiceModeError}
            onRetry={() => { setVoiceModeError(null); setVoiceModeRetryKey((k) => k + 1); }}
          />
        )}

        {/* Voice Mode settings panel (slide-out) */}
        {showVoiceMode && showVoiceSettings && (
          <VoiceModeSettingsPanel
            onClose={() => {
              setShowVoiceSettings(false);
              setShowVoiceTranscript(getSpeechSetting('showTranscriptionInVoiceMode'));
            }}
            onOpenVoiceSelection={() => setShowVoiceSelection(true)}
            selectedVoiceId={selectedVoiceId}
          />
        )}

        {/* Voice selection modal - spec 3.2 */}
        {showVoiceSelection && (
          <VoiceSelectionModal
            selectedVoiceId={selectedVoiceId}
            onSelect={(id) => {
              setSelectedVoiceId(id);
              if (typeof window !== 'undefined') localStorage.setItem('speech_voice', id);
            }}
            onClose={() => setShowVoiceSelection(false)}
          />
        )}

        {/* Camera modal for in-browser screenshot capture */}
        {showCamera && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 sm:p-6 w-full max-w-lg shadow-2xl">
              <h3 className="text-white text-lg font-semibold mb-3">
                {t.chat.capturePhoto}
              </h3> 
              <p className="text-xs text-gray-400 mb-3">
                Position the post or content you want to reference in front of your webcam, then click
                &quot;Capture&quot;. TayAI will use this screenshot as context (you can still describe it
                in your message, e.g. &quot;make a prompt similar to this&quot;).
              </p>
              {cameraError && (
                <div className="mb-3 p-2 text-xs rounded-lg bg-red-900/30 border border-red-800 text-red-400">
                  {cameraError}
                </div>
              )}
              <div className="relative bg-black rounded-xl overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  autoPlay
                  muted
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseCamera}
                  className="px-4 py-2 text-sm rounded-lg border border-[#2a2a2a] text-gray-300 hover:bg-[#242424] transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleCaptureScreenshot}
                  className="px-4 py-2 text-sm rounded-lg bg-[#cba2ff] text-black hover:bg-[#b88ff5] transition-colors"
                >
                  {t.chat.capturePhoto}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dictation/voice error toast - spec */}
        {error && (
          <div
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 bg-red-900/90 border border-red-700 rounded-lg text-white text-sm shadow-lg max-w-[90vw]"
            role="alert"
          >
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-2 text-red-300 hover:text-white underline text-xs flex-shrink-0"
              aria-label="Dismiss"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
