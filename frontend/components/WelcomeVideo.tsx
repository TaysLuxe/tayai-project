'use client';

import { useState, useRef } from 'react';

interface WelcomeVideoProps {
  videoUrl?: string;
  onComplete?: () => void;
  onSkip?: () => void;
}

export default function WelcomeVideo({ videoUrl, onComplete, onSkip }: WelcomeVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Default video URL - replace with your actual welcome video URL
  const defaultVideoUrl = videoUrl || '/videos/welcome.mp4';

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleEnded = () => {
    setIsCompleted(true);
    setIsPlaying(false);
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (onSkip) {
      onSkip();
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
      {/* Video Player */}
      <div className="relative aspect-video bg-black">
        {defaultVideoUrl ? (
          <video
            ref={videoRef}
            src={defaultVideoUrl}
            className="w-full h-full object-contain"
            onEnded={handleEnded}
            controls={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#cba2ff]/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[#cba2ff]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-gray-400">Welcome Video</p>
              <p className="text-sm text-gray-500 mt-2">
                Add your welcome video URL to display it here
              </p>
            </div>
          </div>
        )}

        {/* Custom Controls Overlay */}
        {defaultVideoUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            {!isPlaying && !isCompleted && (
              <button
                onClick={handlePlay}
                className="w-20 h-20 rounded-full bg-[#cba2ff] hover:bg-[#b88ff5] flex items-center justify-center transition-all shadow-lg shadow-[#cba2ff]/30"
              >
                <svg
                  className="w-10 h-10 text-black ml-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            )}
            {isPlaying && (
              <button
                onClick={handlePause}
                className="w-20 h-20 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all backdrop-blur-sm"
              >
                <svg
                  className="w-10 h-10 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Video Info and Controls */}
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-white mb-2">Welcome to TayAI!</h2>
        <p className="text-gray-400 mb-6">
          Watch this short video to learn how to get the most out of your AI assistant.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          {isCompleted ? (
            <button
              onClick={onComplete}
              className="px-6 py-3 bg-[#cba2ff] text-black rounded-lg font-medium hover:bg-[#b88ff5] transition-all"
            >
              Continue to Setup
            </button>
          ) : (
            <>
              <button
                onClick={handleSkip}
                className="px-6 py-3 bg-[#242424] text-gray-300 rounded-lg font-medium hover:bg-[#2a2a2a] border border-[#2a2a2a] transition-all"
              >
                Skip Video
              </button>
              {isPlaying && (
                <button
                  onClick={handlePause}
                  className="px-6 py-3 bg-[#242424] text-gray-300 rounded-lg font-medium hover:bg-[#2a2a2a] border border-[#2a2a2a] transition-all"
                >
                  Pause
                </button>
              )}
              {!isPlaying && !isCompleted && (
                <button
                  onClick={handlePlay}
                  className="px-6 py-3 bg-[#cba2ff] text-black rounded-lg font-medium hover:bg-[#b88ff5] transition-all"
                >
                  Play Video
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
