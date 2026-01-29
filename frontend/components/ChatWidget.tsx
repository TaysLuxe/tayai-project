'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { chatApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ title: string; content: string }>;
  timestamp?: Date;
  isVoice?: boolean;
  voiceDuration?: string;
}

export default function ChatWidget() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentContext, setAttachmentContext] = useState<string>('');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [showVoiceChatEnded, setShowVoiceChatEnded] = useState(false);
  const [voiceChatDuration, setVoiceChatDuration] = useState<string>('0s');
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuIndex !== null) {
        const target = event.target as HTMLElement;
        if (!target.closest('.message-menu-container')) {
          setOpenMenuIndex(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuIndex]);

  // Cleanup for voice recognition
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleThumbsUp = (index: number) => {
    // TODO: Implement feedback API call
    console.log('Thumbs up for message', index);
  };

  const handleThumbsDown = (index: number) => {
    // TODO: Implement feedback API call
    console.log('Thumbs down for message', index);
  };

  const handleShare = (content: string) => {
    if (navigator.share) {
      navigator.share({ text: content });
    } else {
      handleCopyMessage(content);
    }
  };

  const VoiceWaveformIcon = () => (
    <div className="flex items-center gap-1 h-4">
      <div className="w-0.5 bg-white rounded-full voice-waveform-bar" style={{ height: '8px' }}></div>
      <div className="w-0.5 bg-white rounded-full voice-waveform-bar" style={{ height: '12px' }}></div>
      <div className="w-0.5 bg-white rounded-full voice-waveform-bar" style={{ height: '8px' }}></div>
    </div>
  );

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

      const response = await chatApi.sendMessage(messageToSend, conversationHistory);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        sources: response.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
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

  // @test comment  
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

  const toggleVoiceRecording = () => {
    // Guard against unsupported browsers
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Voice input is not supported in this browser.');
      return;
    }

    if (isRecording) {
      // Stop existing recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsRecording(false);
      setIsSpeaking(false);
      
      // Show voice chat ended notification
      if (recordingStartTime) {
        const duration = Math.floor((Date.now() - recordingStartTime) / 1000);
        setVoiceChatDuration(`${duration}s`);
        setShowVoiceChatEnded(true);
        setRecordingStartTime(null);
        
        // Hide notification after 5 seconds
        setTimeout(() => {
          setShowVoiceChatEnded(false);
        }, 5000);
      }
      return;
    }

    setError(null);
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true; // Keep listening until explicitly stopped

    recognition.onresult = (event: any) => {
      let transcript = '';
      let hasInterimResults = false;
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        transcript += result[0].transcript;
        
        // Check if there are any interim (non-final) results - means user is still speaking
        if (!result.isFinal) {
          hasInterimResults = true;
        }
      }
      
      // Update speaking state based on interim results
      setIsSpeaking(hasInterimResults);
      
      // Only append final results to input
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      
      if (finalTranscript) {
        setInput((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript));
      }
    };

    recognition.onspeechstart = () => {
      setIsSpeaking(true);
    };

    recognition.onspeechend = () => {
      // Small delay to allow for final results to come through
      setTimeout(() => setIsSpeaking(false), 500);
    };

    recognition.onnomatch = () => {
      setIsSpeaking(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event);
      setError('There was a problem with voice recognition. Please try again.');
      setIsRecording(false);
      setIsSpeaking(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setIsSpeaking(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      setRecordingStartTime(Date.now());
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError('Unable to start voice recording.');
      setIsRecording(false);
      setRecordingStartTime(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-gray-500">{t.auth.signInToContinue}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f] relative overflow-hidden">
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
      <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full overflow-hidden mb-4 shadow-lg shadow-[#cba2ff]/30">
              <Image
                src="/tayai-avatar.png"
                alt="TayAI"
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-md font-medium text-white mb-1">{t.chat.startConversation}</h3>
            <p className="text-sm text-purple-400 max-w-sm">
              {t.chat.askTayAIAnything}
            </p>
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
                    {/* Action Icons */}
                    <div className="flex items-center gap-2 mt-2 justify-end">
                      <button
                        onClick={() => handleCopyMessage(message.content)}
                        className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-[#242424] rounded transition-colors"
                        title={t.chat.copy}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleThumbsUp(index)}
                        className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-[#242424] rounded transition-colors"
                        title={t.chat.thumbsUp}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleThumbsDown(index)}
                        className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-[#242424] rounded transition-colors"
                        title={t.chat.thumbsDown}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleShare(message.content)}
                        className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-[#242424] rounded transition-colors"
                        title={t.chat.share}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </button>
                      <div className="relative message-menu-container">
                        <button
                          onClick={() => setOpenMenuIndex(openMenuIndex === index ? null : index)}
                          className={`p-1.5 text-gray-400 hover:text-gray-300 hover:bg-[#242424] rounded transition-colors ${
                            openMenuIndex === index ? 'bg-[#242424] text-gray-300' : ''
                          }`}
                          title={t.chat.moreActions}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                        {openMenuIndex === index && (
                          <div className="absolute right-0 top-full mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-lg py-1 min-w-[180px] z-50">
                            <button
                              onClick={() => {
                                // TODO: Implement branch in new chat
                                setOpenMenuIndex(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-[#242424] transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                              </svg>
                              {t.chat.branchInNewChat}
                            </button>
                            <button
                              onClick={() => {
                                // TODO: Implement replay
                                setOpenMenuIndex(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-[#242424] transition-colors"
                            >
                              <VoiceWaveformIcon />
                              {t.chat.replay}
                            </button>
                            <button
                              onClick={() => {
                                // TODO: Implement report message
                                setOpenMenuIndex(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-[#242424] transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                              </svg>
                              {t.chat.reportMessage}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
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
                    {/* Action Icons */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleCopyMessage(message.content)}
                        className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-[#242424] rounded transition-colors"
                        title={t.chat.copy}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleThumbsUp(index)}
                        className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-[#242424] rounded transition-colors"
                        title={t.chat.thumbsUp}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleThumbsDown(index)}
                        className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-[#242424] rounded transition-colors"
                        title={t.chat.thumbsDown}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleShare(message.content)}
                        className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-[#242424] rounded transition-colors"
                        title={t.chat.share}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </button>
                      <div className="relative message-menu-container">
                        <button
                          onClick={() => setOpenMenuIndex(openMenuIndex === index ? null : index)}
                          className={`p-1.5 text-gray-400 hover:text-gray-300 hover:bg-[#242424] rounded transition-colors ${
                            openMenuIndex === index ? 'bg-[#242424] text-gray-300' : ''
                          }`}
                          title={t.chat.moreActions}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                        {openMenuIndex === index && (
                          <div className="absolute left-0 top-full mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-lg py-1 min-w-[180px] z-50">
                            <div className="px-4 py-2 text-xs text-gray-500 border-b border-[#2a2a2a]">
                              {message.timestamp && formatTime(message.timestamp)}
                            </div>
                            <button
                              onClick={() => {
                                // TODO: Implement branch in new chat
                                setOpenMenuIndex(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-[#242424] transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                              </svg>
                              {t.chat.branchInNewChat}
                            </button>
                            <button
                              onClick={() => {
                                // TODO: Implement replay
                                setOpenMenuIndex(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-[#242424] transition-colors"
                            >
                              <VoiceWaveformIcon />
                              {t.chat.replay}
                            </button>
                            <button
                              onClick={() => {
                                // TODO: Implement report message
                                setOpenMenuIndex(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-[#242424] transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                              </svg>
                              {t.chat.reportMessage}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {message.timestamp && (
                      <p className="text-xs text-gray-600 mt-1">
                        {formatTime(message.timestamp)}
                      </p>
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

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Voice Chat Ended Notification */}
      {showVoiceChatEnded && (
        <div className="fixed bottom-20 right-4 z-50 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-2">
          <VoiceWaveformIcon />
          <div className="flex-1">
            <p className="text-sm text-gray-300">{t.chat.voiceChatEnded}</p>
            <p className="text-xs text-gray-500">{voiceChatDuration}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleThumbsUp(messages.length)}
              className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-[#242424] rounded transition-colors"
              title={t.chat.thumbsUp}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </button>
            <button
              onClick={() => handleThumbsDown(messages.length)}
              className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-[#242424] rounded transition-colors"
              title={t.chat.thumbsDown}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
              </svg>
            </button>
            <button
              onClick={() => setShowVoiceChatEnded(false)}
              className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-[#242424] rounded transition-colors"
              title="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

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
          {/* Chat Input Container */}
          <div className="relative bg-[#242424] border border-[#2a2a2a] rounded-2xl shadow-lg">
            {/* Voice Recording Overlay - ChatGPT style */}
            {isRecording && (
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  {/* Microphone Icon - shown when not speaking */}
                  {!isSpeaking && (
                    <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                      <svg 
                        className="w-5 h-5 text-white" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                      </svg>
                    </div>
                  )}
                  {/* Sound Wave Icon - shown when speaking */}
                  {isSpeaking && (
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center voice-animate">
                      <svg 
                        className="w-6 h-6 text-black voice-icon-animate" 
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Sound wave bars - varying heights */}
                        <rect x="3" y="10" width="2.5" height="4" rx="1.25" />
                        <rect x="6.5" y="8" width="2.5" height="8" rx="1.25" />
                        <rect x="10" y="5" width="2.5" height="14" rx="1.25" />
                        <rect x="13.5" y="8" width="2.5" height="8" rx="1.25" />
                        <rect x="17" y="10" width="2.5" height="4" rx="1.25" />
                      </svg>
                    </div>
                  )}
                  <span className="text-sm text-gray-300">{t.chat.listening}</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Cancel Button - Red with animation */}
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all cancel-animate"
                  >
                    {t.chat.cancel}
                  </button>
                  {/* End Button with animation when speaking */}
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all ${
                      isSpeaking ? 'voice-animate' : ''
                    }`}
                  >
                    {t.chat.end}
                  </button>
                </div>
              </div>
            )}

            {/* Regular Input Area - Hidden when recording */}
            {!isRecording && (
              <>
                {/* Placeholder Text Area */}
                <div className="px-4 pt-3 pb-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t.chat.typeMessage}
                    className="w-full bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none text-sm sm:text-base min-h-[24px] max-h-[200px]"
                    rows={1}
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (input.trim() && !loading) {
                          handleSend(e as any);
                        }
                      }
                    }}
                    style={{
                      height: 'auto',
                      overflow: 'hidden',
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = `${target.scrollHeight}px`;
                    }}
                  />
                </div>
              </>
            )}

            {/* Attached files preview */}
            {!isRecording && attachments.length > 0 && (
              <div className="px-4 pb-1 text-xs text-gray-400 flex flex-wrap gap-1">
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

            {/* Quick actions row: Add files / Take screenshot - Hidden when recording */}
            {!isRecording && (
              <div className="px-4 pb-2 text-[11px] sm:text-xs text-gray-400 flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleAddFilesOrPhotos}
                  className="group inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover:text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7v9a4 4 0 008 0V7a2 2 0 00-4 0v8a1 1 0 002 0V8"
                    />
                  </svg>
                  <span>{t.chat.addFilesOrPhotos}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTakeScreenshot}
                  className="group inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover:text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 7h3l2-3h6l2 3h3v11H4V7z"
                    />
                    <circle cx="12" cy="13" r="3" strokeWidth={2} />
                  </svg>
                  <span>{t.chat.takeScreenshot}</span>
                </button>
              </div>
            )}

            {/* Bottom Row - Hidden when recording */}
            {!isRecording && (
              <div className="flex items-center justify-end px-3 pb-3 pt-2 border-t border-[#2a2a2a]">
                <div className="flex items-center gap-3">
                  {/* Voice button */}
                  <button
                    type="button"
                    className="p-2 rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                    title={t.chat.startRecording}
                    onClick={toggleVoiceRecording}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  </button>

                  {/* Send Button (Enter) */}
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="p-2 bg-[#cba2ff] hover:bg-[#b88ff5] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                    title={t.chat.sendMessage}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>

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
      </div>
    </div>
  );
}
