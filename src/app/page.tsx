'use client';

import { useState, useRef, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';
import {
  Loader2,
  Sparkles,
  Play,
  Menu,
  X,
  StopCircle,
  MessageSquare,
  RotateCcw,
} from 'lucide-react';
import { CodeEditor } from '@/components/CodeEditor';
import { PreviewPanel } from '@/components/PreviewPanel';
import { ChatInput } from '@/components/ChatInput';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
}

export default function Home() {
  /* ---------- core state ---------- */
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);

  const examplePrompts = [
    'Create a beautiful todo list with drag and drop, animations, and a gradient design',
    'Build a weather dashboard with cards, charts, and smooth transitions',
    'Make an interactive pricing calculator with slider controls and real-time updates',
    'Design a sleek contact form with validation, animations, and success state',
    'Create a modern login page with animated background and social auth buttons',
    'Build a product showcase with image carousel, zoom, and hover effects',
  ];

  /* ---------- auto-scroll thread ---------- */
  useEffect(() => {
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  /* ---------- generation ---------- */
  const handleSendMessage = async (message: string) => {
    if (!message.trim()) {
      toast.error('Please enter a description for your app');
      return;
    }
    if (message.length > 2000) {
      toast.error('Message is too long. Please keep it under 2000 characters.');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      type: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    await handleGenerate(message);
  };

  const handleGenerate = async (inputPrompt: string = prompt) => {
    if (!inputPrompt.trim()) {
      toast.error('Please enter a description for your app');
      return;
    }

    setIsGenerating(true);
    setShowPreview(true);
    setGeneratedCode('');
    setError(null);
    if (!prompt) setPrompt(inputPrompt);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    let accumulatedCode = '';

    try {
      const isFollowUp = messages.length > 0;
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: isFollowUp
            ? `Previous code:\n${generatedCode}\n\nUser request: ${inputPrompt}\n\nPlease apply the requested changes and return the full updated component.`
            : inputPrompt,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to generate code';
        if (errorMessage.includes('CEREBRAS_API_KEY')) {
          toast.error('⚠️ API Key Required: Please set your CEREBRAS_API_KEY in the .env file');
        } else {
          toast.error(errorMessage);
        }
        throw new Error(errorMessage);
      }
      if (!response.body) throw new Error('No response body received');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((l) => l.trim().startsWith('data:'));

        for (const line of lines) {
          const data = line.replace(/^data:\s*/, '').trim();
          if (!data || data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.stage === 'error') throw new Error(parsed.error || 'Generation failed');
            if (parsed.stage === 'code' && parsed.content) {
              accumulatedCode += parsed.content;
              setGeneratedCode(accumulatedCode);
            }
            if (parsed.stage === 'complete' && parsed.fullCode) {
              setGeneratedCode(parsed.fullCode);
              accumulatedCode = parsed.fullCode;
            }
          } catch (parseError) {
            console.debug('Stream parse error:', parseError);
          }
        }
      }

      if (accumulatedCode.trim()) {
        toast.success('✨ App generated successfully!');
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: 'App generated successfully! You can now modify it by sending me additional instructions.',
          type: 'assistant',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error('No code was generated. Please try again.');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') return;
        const errorMessage = error.message || 'Failed to generate app';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Generation error:', error);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      toast.success('Generation stopped');
    }
  };

  const handleReset = () => {
    setShowPreview(false);
    setGeneratedCode('');
    setError(null);
    setMessages([]);
    setPrompt('');
  };

  const handleRegenerate = () => {
    const lastUserMessage = messages.filter((m) => m.type === 'user').pop();
    if (lastUserMessage) handleGenerate(lastUserMessage.content);
    else handleGenerate(prompt);
  };

  /* ---------- render ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-primary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg ring-2 ring-primary-500/20">
              <Image
                src="/logo.png"
                alt="RAJ AI APP BUILDER Logo"
                width={48}
                height={48}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            <div className="text-lg font-bold text-primary-600" style={{ fontSize: '1.125rem', letterSpacing: '0.025em' }}>
              RAJ AI APP BUILDER
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            <a
              href="https://github.com/rajshah9305/AIRajAPP"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm shadow-sm hover:shadow transition-shadow"
            >
              GitHub
            </a>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pb-3 flex items-center gap-2">
            <a
              href="https://github.com/rajshah9305/AIRajAPP"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm shadow-sm hover:shadow transition-shadow"
            >
              GitHub
            </a>
          </div>
        )}
      </header>

      <main className="flex flex-col h-[calc(100vh-60px)] sm:h-[calc(100vh-80px)]">
        {!showPreview ? (
          /* --------------- Landing view --------------- */
          <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
            <div className="max-w-4xl w-full">
              {/* Hero */}
              <div className="text-center mb-8 space-y-4">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                  <span className="bg-gradient-to-b from-orange-900 via-orange-600 to-orange-400 bg-clip-text text-transparent">
                    Think It. Build It.
                  </span>
                </h2>
                <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium">
                  Transform natural language into production-ready React applications
                </p>
              </div>

              {/* Input Card */}
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden mb-6">
                <div className="p-6 sm:p-8">
                  <label className="block text-sm font-bold text-gray-900 mb-3 tracking-wide">
                    Describe your app
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., Create a modern todo list with drag and drop, animations, and a beautiful gradient design..."
                    className="w-full h-24 sm:h-28 px-4 py-3 text-sm sm:text-base text-gray-900 placeholder-gray-400 border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all resize-none outline-none leading-relaxed"
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isGenerating && prompt.trim()) {
                        e.preventDefault();
                        handleSendMessage(prompt);
                      }
                    }}
                  />
                  <div className="mt-3 flex justify-between items-center text-xs sm:text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono shadow-sm">⌘</kbd>
                      <span className="text-gray-400 font-medium">+</span>
                      <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono shadow-sm">Enter</kbd>
                      <span className="hidden sm:inline font-medium">to generate</span>
                    </span>
                    <span className="font-semibold text-gray-600">{prompt.length} / 2000</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 sm:px-8 py-4 border-t border-orange-200">
                  <button
                    onClick={() => handleSendMessage(prompt)}
                    disabled={!prompt.trim() || isGenerating}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Generating your app...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Generate App</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Example Prompts */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                  <p className="text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-widest">Try Examples</p>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {examplePrompts.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(ex)}
                      className="text-left p-3.5 sm:p-4 bg-white rounded-xl border-2 border-orange-200 hover:border-orange-500 hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 p-1.5 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors flex-shrink-0">
                          <Play className="w-3.5 h-3.5 text-orange-600" />
                        </div>
                        <span className="text-xs sm:text-sm text-gray-700 leading-relaxed line-clamp-2 group-hover:text-gray-900 font-medium">
                          {ex}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* --------------- Builder view --------------- */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">AI App Builder</span>
                  <span className="sm:hidden">Builder</span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {isGenerating && (
                  <button
                    onClick={handleStop}
                    className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <StopCircle className="w-3 h-3" />
                    Stop
                  </button>
                )}
                <button
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <RotateCcw className="w-3 h-3" />
                  Regenerate
                </button>
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                >
                  New App
                </button>
              </div>
            </div>

            {/* Two-Column Layout: Code Editor | Live Preview */}
            <div className="flex-1 flex gap-3 p-3 overflow-hidden bg-gray-50">
              {/* Left Side - Code Editor */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden h-full">
                  <CodeEditor code={generatedCode} isStreaming={isGenerating} onCodeChange={setGeneratedCode} />
                </div>
              </div>

              {/* Right Side - Live Preview */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden h-full">
                  <PreviewPanel code={generatedCode} />
                </div>
              </div>
            </div>

            {/* Bottom-anchored chat */}
            <ChatInput
              onSendMessage={handleSendMessage}
              isGenerating={isGenerating}
              onRegenerate={handleRegenerate}
              messages={messages}
            />
          </div>
        )}
      </main>
    </div>
  );
}