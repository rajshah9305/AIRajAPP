'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, Eye, Code2, MessageSquare, RefreshCcw } from 'lucide-react';

const EXAMPLE_PROMPTS = [
  'Create a modern todo list with drag and drop functionality',
  'Build a weather app with animated icons and forecasts',
  'Design a sleek calculator with gradient buttons',
  'Make a music player with playlist and controls',
  'Create a chat interface with message bubbles',
  'Build a photo gallery with grid layout and lightbox',
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-primary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-2 rounded-xl shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                RAJ AI APP BUILDER
              </div>
              <div className="text-xs text-gray-600">Generate React apps with AI</div>
            </div>
          </div>
          <Link
            href="/builder"
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm shadow hover:shadow-md transition-shadow"
          >
            Start building
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 sm:p-8">
            <div className="w-fit mb-4 sm:mb-6 px-2 py-1 rounded-full bg-primary-100 text-primary-700 text-xs border border-primary-200">
              Personal AI project
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
              Build beautiful React apps with AI
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-600 leading-relaxed">
              Describe what you want. Watch code stream in real-time with a live preview. Iterate
              using a chat input anchored at the bottom. No auth, no mockups — just working code.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/builder"
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow hover:shadow-lg transition-all"
              >
                Start building now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://github.com/rajshah9305/AIRajAPP"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-700 font-medium shadow-sm hover:shadow transition-all"
              >
                View on GitHub
              </a>
            </div>

            {/* Example prompts */}
            <div className="mt-6 sm:mt-8">
              <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">Try a prompt</div>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((p) => (
                  <Link
                    key={p}
                    href={`/builder?prompt=${encodeURIComponent(p)}`}
                    className="px-3 py-1.5 rounded-full text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                  >
                    {p}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 sm:p-8 text-white shadow-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-4">
                <Code2 className="w-5 h-5" />
                <div className="mt-2 font-semibold">Live Code</div>
                <div className="text-sm opacity-90">Streaming TSX editor with refresh</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <Eye className="w-5 h-5" />
                <div className="mt-2 font-semibold">Live Preview</div>
                <div className="text-sm opacity-90">Sandpack app preview with refresh</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <MessageSquare className="w-5 h-5" />
                <div className="mt-2 font-semibold">Chat Editing</div>
                <div className="text-sm opacity-90">Bottom-anchored chat input</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <RefreshCcw className="w-5 h-5" />
                <div className="mt-2 font-semibold">One-click Reset</div>
                <div className="text-sm opacity-90">Start a new app instantly</div>
              </div>
            </div>
            <div className="mt-6 sm:mt-8 text-sm text-white/90">
              Deployed on Vercel. Powered by Cerebras AI.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}