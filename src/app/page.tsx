'use client';
import { useState, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Loader2, Copy, Sparkles, Code2, Play, AlertCircle, Github, Menu, X } from 'lucide-react';
import { CodeEditor } from '@/components/CodeEditor';
import { PreviewPanel } from '@/components/PreviewPanel';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const examplePrompts = [
    'Create a beautiful todo list with animations and gradient design',
    'Build a weather dashboard with cards and smooth transitions',
    'Make an interactive pricing calculator with slider controls',
    'Design a sleek contact form with validation and success state',
    'Create a modern login page with animated background',
    'Build a product card with hover effects and image carousel',
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a description for your app');
      return;
    }

    // Validate prompt length
    if (prompt.length > 2000) {
      toast.error('Prompt is too long. Please keep it under 2000 characters.');
      return;
    }

    setIsGenerating(true);
    setShowPreview(true);
    setGeneratedCode('');
    setError(null);
    
    // Clean up previous abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to generate code';
        
        // Show specific message for API key issues
        if (errorMessage.includes('CEREBRAS_API_KEY')) {
          toast.error('⚠️ API Key Required: Please set your CEREBRAS_API_KEY in the .env file');
        }
        
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedCode = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim().startsWith('data:'));

        for (const line of lines) {
          const data = line.replace('data: ', '').trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.stage === 'error') {
              throw new Error(parsed.error || 'Generation failed');
            }

            if (parsed.stage === 'code' && parsed.content) {
              accumulatedCode += parsed.content;
              setGeneratedCode(accumulatedCode);
            }
          } catch (parseError) {
            // Silently ignore parse errors for streaming data
            // This is expected behavior for SSE streams
          }
        }
      }

      if (accumulatedCode) {
        toast.success('App generated successfully!');
      } else {
        throw new Error('No code was generated');
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
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

  const handleCopy = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      toast.success('Code copied to clipboard!');
    }
  };

  const handleReset = () => {
    setShowPreview(false);
    setGeneratedCode('');
    setError(null);
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-orange-200 bg-white/95 backdrop-blur-xl shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-orange-500 to-pink-600 p-2.5 rounded-xl shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                    RAJ AI APP BUILDER
                  </h1>
                </div>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-6">
                <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg border border-orange-200">
                  <Code2 className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Powered by Cerebras AI</span>
                </div>
                <a
                  href="https://github.com/rajshah9305/NLPCEREBRAS"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-semibold transition-all hover:shadow-lg"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden mt-4 pt-4 border-t border-orange-200 animate-fadeIn">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg border border-orange-200">
                    <Code2 className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Powered by Cerebras AI</span>
                  </div>
                  <a
                    href="https://github.com/rajshah9305/NLPCEREBRAS"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-semibold transition-colors w-fit"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Github className="w-4 h-4" />
                    GitHub
                  </a>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 h-[calc(100vh-60px)] sm:h-[calc(100vh-80px)] overflow-y-auto">
          {!showPreview ? (
            // Prompt Input View
            <div className="max-w-5xl mx-auto flex flex-col">
              {/* Hero Section */}
              <div className="text-center mb-6 sm:mb-8 space-y-3 sm:space-y-4">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                  <span className="bg-gradient-to-b from-orange-900 via-orange-600 to-orange-400 bg-clip-text text-transparent">
                    Think It. Build It.
                  </span>
                </h2>
                <p className="text-base sm:text-lg text-gray-500 max-w-3xl mx-auto leading-relaxed font-medium">
                  Transform natural language into production-ready AI applications
                </p>
              </div>

              {/* Input Card */}
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden mb-6 flex-shrink-0">
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
                          handleGenerate();
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
                    onClick={handleGenerate}
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
              <div className="space-y-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-widest">Try Examples</p>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {examplePrompts.slice(0, 6).map((example, idx) => (
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
          ) : (
            // Preview View - Responsive Layout
            <div className="h-full flex flex-col xl:grid xl:grid-cols-2 gap-2 sm:gap-3">
              {/* Mobile/Tablet: Prompt Card */}
              <div className="xl:hidden bg-white rounded-lg shadow-lg border border-gray-200 p-2 sm:p-3 flex-shrink-0">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Your Prompt</h3>
                  <button
                    onClick={handleReset}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium transition-colors"
                  >
                    New App
                  </button>
                </div>
                <p className="text-gray-700 text-xs leading-relaxed line-clamp-2">{prompt}</p>
              </div>

              {/* Desktop: Left Column - Prompt & Code */}
              <div className="hidden xl:flex xl:flex-col xl:space-y-2 xl:h-full">
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 flex-shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-900">Your Prompt</h3>
                    <button
                      onClick={handleReset}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium transition-colors"
                    >
                      New App
                    </button>
                  </div>
                  <p className="text-gray-700 text-xs line-clamp-3">{prompt}</p>
                </div>

                <div className="flex-1 min-h-0">
                  <CodeEditor 
                    code={generatedCode} 
                    isStreaming={isGenerating} 
                    onCodeChange={setGeneratedCode} 
                  />
                </div>
              </div>

              {/* Preview Panel - Always visible */}
              <div className="flex-1 min-h-0">
                <PreviewPanel code={generatedCode} />
              </div>

              {/* Mobile/Tablet: Code Section */}
              <div className="xl:hidden flex-1 min-h-0">
                <CodeEditor 
                  code={generatedCode} 
                  isStreaming={isGenerating} 
                  onCodeChange={setGeneratedCode} 
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
