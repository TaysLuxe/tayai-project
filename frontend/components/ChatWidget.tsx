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
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError('Unable to start voice recording.');
      setIsRecording(false);
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
