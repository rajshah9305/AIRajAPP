'use client';

import { useState, useRef, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Loader2, Sparkles, Code2, Play, Menu, X, StopCircle, MessageSquare, Eye, RotateCcw, Send } from 'lucide-react';
import { CodeEditor } from '@/components/CodeEditor';
import { PreviewPanel } from '@/components/PreviewPanel';
import { ChatInput } from '@/components/ChatInput';
import { Message } from '@/types';

const examplePrompts = [
  'Create a modern todo list with drag and drop functionality',
  'Build a weather app with animated icons and forecasts',
  'Design a sleek calculator with gradient buttons',
  'Make a music player with playlist and controls',
  'Create a chat interface with message bubbles',
  'Build a photo gallery with grid layout and lightbox'
];

export default function Home() {
  /* ---------- core state ---------- */
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'preview' | 'code' | 'both'>('both');
  const [showPreview, setShowPreview] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);

  /* ---------- auto-scroll thread ---------- */
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  /* ---------- generation and handlers ---------- */
  const handleSendMessage = async (message: string) => {
    if (!message.trim()) {
      toast.error('Please enter a description for your app');
      return;
    }

    if (message.length > 2000) {
      toast.error('Message is too long. Please keep it under 2000 characters.');
      return;
    }

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      type: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setShowPreview(true);

    await generate(message, messages.length > 0);
  };

  const generate = async (userPrompt: string, isFollowUp = false) => {
    if (!userPrompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    
    if (!prompt && !isFollowUp) setPrompt(userPrompt);

    // abort previous stream
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    let acc = '';
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: isFollowUp
            ? `Previous code:\n${generatedCode}\n\nUser request: ${userPrompt}\n\nPlease apply the requested changes and return the full updated component.`
            : userPrompt,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error((await res.json()).error || 'Generation failed');

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((l) => l.startsWith('data:'));
        for (const line of lines) {
          const data = line.replace(/^data:\s*/, '').trim();
          if (!data || data === '[DONE]') continue;
          const parsed = JSON.parse(data);
          if (parsed.stage === 'code' && parsed.content) {
            acc += parsed.content;
            setGeneratedCode(acc);
          }
          if (parsed.stage === 'complete' && parsed.fullCode) {
            acc = parsed.fullCode;
            setGeneratedCode(acc);
          }
          if (parsed.stage === 'error') throw new Error(parsed.error);
        }
      }

      if (acc.trim()) {
        toast.success('✨ App generated successfully!');
        
        // Add assistant message to chat
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: 'App generated successfully! You can now modify it by sending me additional instructions.',
          type: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('No code was generated. Please try again.');
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      
      const errorMessage = e.message || 'Failed to generate app';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Generation error:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  /* ---------- actions ---------- */
  const handleSubmit = () => {
    if (showPreview) {
      // If we're already showing preview, treat as chat message
      handleSendMessage(prompt);
    } else {
      // Initial generation
      generate(prompt, messages.length > 0);
      setShowPreview(true);
    }
    setPrompt('');
  };

  const handleReset = () => {
    setMessages([]);
    setGeneratedCode('');
    setError(null);
    setPrompt('');
    setShowPreview(false);
  };

  const handleRegenerate = () => {
    if (messages.length > 0) {
      const lastUserMessage = messages.filter(m => m.type === 'user').pop();
      if (lastUserMessage) {
        generate(lastUserMessage.content);
      }
    } else if (prompt) {
      generate(prompt);
    }
  };

  const handleStop = () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  };

  /* ---------- render ---------- */
  return (
    <>
      <Toaster position="top-center" />
      <div className="h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-orange-100">
        {/* ---- header ---- */}
        <header className="shrink-0 border-b border-orange-200 bg-white/95 backdrop-blur-xl shadow-sm px-4 sm:px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-500 to-pink-600 p-2 rounded-xl shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">RAJ AI APP BUILDER</h1>
            </div>
            <button onClick={handleReset} className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">New App</button>
          </div>
        </header>

        <main className="flex flex-col h-[calc(100vh-60px)] sm:h-[calc(100vh-80px)]">
          {!showPreview ? (
            // Landing View - Initial prompt input
            <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
              <div className="max-w-4xl w-full">
                {/* Hero Section */}
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
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                          e.preventDefault();
                          if (!isGenerating && prompt.trim()) {
                            handleSubmit();
                          }
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
                      onClick={handleSubmit}
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
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                    <p className="text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-widest">Try Examples</p>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {examplePrompts.map((example, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPrompt(example)}
                        className="text-left p-3.5 sm:p-4 bg-white rounded-xl border-2 border-orange-200 hover:border-orange-500 hover:shadow-lg transition-all group"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 p-1.5 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors flex-shrink-0">
                            <Play className="w-3.5 h-3.5 text-orange-600" />
                          </div>
                          <span className="text-xs sm:text-sm text-gray-700 leading-relaxed line-clamp-2 group-hover:text-gray-900 font-medium">{example}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Preview View - Enhanced layout with chat
            <div className="flex-1 flex flex-col">
              {/* Toolbar */}
              <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">AI App Builder</span>
                    <span className="sm:hidden">Builder</span>
                  </h3>
                  {/* Mobile View Toggle */}
                  <div className="sm:hidden flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-200">
                    <button
                      onClick={() => setCurrentView('preview')}
                      className={`p-1.5 rounded text-xs font-medium transition-colors ${
                        currentView === 'preview'
                          ? 'bg-orange-100 text-orange-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setCurrentView('code')}
                      className={`p-1.5 rounded text-xs font-medium transition-colors ${
                        currentView === 'code'
                          ? 'bg-orange-100 text-orange-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Code2 className="w-3 h-3" />
                    </button>
                  </div>
                  {/* Desktop View Toggle */}
                  <div className="hidden sm:flex items-center gap-2">
                    <button
                      onClick={() => setCurrentView('preview')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        currentView === 'preview'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Eye className="w-3 h-3 inline mr-1" />
                      Preview
                    </button>
                    <button
                      onClick={() => setCurrentView('code')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        currentView === 'code'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Code2 className="w-3 h-3 inline mr-1" />
                      Code
                    </button>
                    <button
                      onClick={() => setCurrentView('both')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        currentView === 'both'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Both
                    </button>
                  </div>
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

              {/* Main Content Area */}
              <div className="flex-1 flex overflow-hidden">
                {/* Desktop: Both views */}
                {currentView === 'both' && (
                  <div className="hidden sm:flex w-full gap-2 p-2">
                    <div className="flex-1">
                      <PreviewPanel code={generatedCode} />
                    </div>
                    <div className="w-96">
                      <CodeEditor 
                        code={generatedCode} 
                        isStreaming={isGenerating} 
                        onCodeChange={setGeneratedCode} 
                      />
                    </div>
                  </div>
                )}

                {/* Mobile: Single view toggle */}
                <div className="sm:hidden w-full p-2">
                  {currentView === 'preview' ? (
                    <PreviewPanel code={generatedCode} />
                  ) : (
                    <CodeEditor 
                      code={generatedCode} 
                      isStreaming={isGenerating} 
                      onCodeChange={setGeneratedCode} 
                    />
                  )}
                </div>

                {/* Preview only view */}
                {currentView === 'preview' && (
                  <div className="hidden sm:block w-full p-2">
                    <PreviewPanel code={generatedCode} />
                  </div>
                )}

                {/* Code only view */}
                {currentView === 'code' && (
                  <div className="hidden sm:block w-full p-2">
                    <CodeEditor 
                      code={generatedCode} 
                      isStreaming={isGenerating} 
                      onCodeChange={setGeneratedCode} 
                    />
                  </div>
                )}
              </div>

              {/* Chat Input at Bottom */}
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
    </>
  );
}
