'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { profileApi } from '@/lib/api';
import WelcomeVideo from '@/components/WelcomeVideo';

interface OnboardingData {
  user_name?: string;
  business_type?: string;
  focus?: string;
  primary_struggle?: string;
  goals?: string;
  experience_level?: string;
  preferred_communication_style?: string;
}

const STEPS = [
  {
    id: 1,
    title: 'Welcome!',
    question: "What's your name?",
    field: 'user_name',
    type: 'text',
    placeholder: 'Enter your name',
  },
  {
    id: 2,
    title: 'Business Type',
    question: 'What type of business are you running?',
    field: 'business_type',
    type: 'select',
    options: [
      'Hair Salon',
      'Wig Business',
      'Hair Extension Business',
      'Hair Education/Coaching',
      'Other',
    ],
  },
  {
    id: 3,
    title: 'Focus Area',
    question: 'What is your main focus right now?',
    field: 'focus',
    type: 'select',
    options: [
      'Building clientele',
      'Scaling services',
      'Launching products',
      'Growing online presence',
      'Education/Teaching',
      'Other',
    ],
  },
  {
    id: 4,
    title: 'Primary Challenge',
    question: 'What is your primary struggle or challenge?',
    field: 'primary_struggle',
    type: 'textarea',
    placeholder: 'Tell us about your biggest challenge...',
  },
  {
    id: 5,
    title: 'Goals',
    question: 'What are your main goals?',
    field: 'goals',
    type: 'textarea',
    placeholder: 'What do you want to achieve?',
  },
  {
    id: 6,
    title: 'Experience Level',
    question: 'What is your experience level?',
    field: 'experience_level',
    type: 'select',
    options: [
      'Just starting out',
      '1-2 years',
      '3-5 years',
      '5-10 years',
      '10+ years',
    ],
  },
  {
    id: 7,
    title: 'Communication Style',
    question: 'How do you prefer to communicate?',
    field: 'preferred_communication_style',
    type: 'select',
    options: [
      'Direct and to the point',
      'Encouraging and supportive',
      'Detailed and thorough',
      'Quick and actionable',
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [showVideo, setShowVideo] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStepData = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;
  const progress = showVideo ? 0 : ((currentStep + 1) / STEPS.length) * 100;

  const handleVideoComplete = () => {
    setShowVideo(false);
  };

  const handleVideoSkip = () => {
    setShowVideo(false);
  };

  const handleInputChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      [currentStepData.field]: value,
    }));
    setError(null);
  };

  const handleNext = () => {
    if (!formData[currentStepData.field as keyof OnboardingData]) {
      setError('Please provide an answer before continuing.');
      return;
    }
    setError(null);
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await profileApi.saveProfile(formData);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Show welcome video first
  if (showVideo) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <WelcomeVideo onComplete={handleVideoComplete} onSkip={handleVideoSkip} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-[#242424] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#cba2ff] to-[#b88ff5] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 shadow-2xl">
          {/* Step Title */}
          <h2 className="text-2xl font-semibold text-white mb-2">{currentStepData.title}</h2>
          <p className="text-lg text-gray-300 mb-8">{currentStepData.question}</p>

          {/* Input Field */}
          <div className="mb-6">
            {currentStepData.type === 'text' && (
              <input
                type="text"
                value={formData[currentStepData.field as keyof OnboardingData] || ''}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={currentStepData.placeholder}
                className="w-full px-4 py-3 bg-[#242424] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#cba2ff]/50 focus:border-[#cba2ff] transition-all"
                autoFocus
              />
            )}

            {currentStepData.type === 'select' && (
              <div className="space-y-2">
                {currentStepData.options?.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleInputChange(option)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                      formData[currentStepData.field as keyof OnboardingData] === option
                        ? 'bg-[#cba2ff]/20 border-[#cba2ff] text-white'
                        : 'bg-[#242424] border-[#2a2a2a] text-gray-300 hover:border-[#cba2ff]/50 hover:bg-[#2a2a2a]'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {currentStepData.type === 'textarea' && (
              <textarea
                value={formData[currentStepData.field as keyof OnboardingData] || ''}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={currentStepData.placeholder}
                rows={4}
                className="w-full px-4 py-3 bg-[#242424] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#cba2ff]/50 focus:border-[#cba2ff] transition-all resize-none"
                autoFocus
              />
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-900/20 border border-red-800/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                currentStep === 0
                  ? 'bg-[#242424] text-gray-600 cursor-not-allowed'
                  : 'bg-[#242424] text-gray-300 hover:bg-[#2a2a2a] border border-[#2a2a2a]'
              }`}
            >
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="px-6 py-3 bg-[#cba2ff] text-black rounded-lg font-medium hover:bg-[#b88ff5] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  Saving...
                </>
              ) : isLastStep ? (
                'Complete Setup'
              ) : (
                'Next'
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            This information helps us personalize your experience with TayAI
          </p>
        </div>
      </div>
    </div>
  );
}
