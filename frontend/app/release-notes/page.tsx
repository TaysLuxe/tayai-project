'use client';

import Link from 'next/link';

export default function ReleaseNotesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100">
      {/* Header - help center style */}
      <header className="border-b border-[#2a2a2a] bg-[#0a0a0a] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Back to TayAI
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-1">
          Tay AI — Release Notes
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          A changelog of the latest updates and release notes for Tay AI
        </p>
        <p className="text-sm text-gray-500 mb-10">
          Updated: January 2026
        </p>

        {/* Version 1.0 */}
        <article className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">
              Version 1.0 — Initial Launch
            </h2>
            <p className="text-gray-300 leading-relaxed mb-6">
              Welcome to the first release of Tay AI. This version introduces your new
              personalised hair & beauty business mentor.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">
              What&apos;s included
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 leading-relaxed pl-1">
              <li>AI mentor trained specifically for hair & beauty businesses</li>
              <li>Guided onboarding to personalise advice</li>
              <li>
                Support for:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-gray-400">
                  <li>content & bookings</li>
                  <li>pricing & offers</li>
                  <li>client & vendor issues</li>
                  <li>digital products & classes</li>
                </ul>
              </li>
              <li>Structured, step-by-step responses (no generic AI fluff)</li>
              <li>Built-in guardrails for high-stakes decisions</li>
              <li>Clean, professional tone with real-world guidance</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">Access</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 leading-relaxed pl-1">
              <li>Full access for Elite community members</li>
              <li>3-week trial for Basic members during launch</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">Important notes</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 leading-relaxed pl-1">
              <li>Tay AI provides educational guidance only</li>
              <li>Tay AI does not replace 1:1 mentorship</li>
              <li>Daily usage limits apply</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">Coming next</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 leading-relaxed pl-1">
              <li>Smarter personalisation as you grow</li>
              <li>More frameworks & templates</li>
              <li>Advanced features for educators and brand owners</li>
              <li>Continued improvements based on community feedback</li>
            </ul>
          </section>
        </article>

        <div className="mt-12 pt-8 border-t border-[#2a2a2a]">
          <Link
            href="/"
            className="text-[#cba2ff] hover:text-[#b88ff5] transition-colors text-sm font-medium"
          >
            Back to chat
          </Link>
        </div>
      </main>
    </div>
  );
}
