'use client';

import { useState, useRef, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Loader2, Sparkles, Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CodeEditor } from '@/components/CodeEditor';
import { PreviewPanel } from '@/components/PreviewPanel';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

function BuilderContent() {
  // core state
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeRefreshKey, setCodeRefreshKey] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();

  // prefill from query param once
  useEffect(() => {
    const q = searchParams.get('prompt');
    if (q) setPrompt(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto-scroll thread
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const generate = async (userPrompt: string, isFollowUp = false) => {
    if (!userPrompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    // add user message to thread
    setMessages((prev) => [...prev, { role: 'user', content: userPrompt }]);

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
            ? `Previous code:\n${generatedCode}\n\nUser request: ${userPrompt}\n\nPlease apply the requested changes and return the full updated component. REMEMBER: Use ONLY inline styles (style={{}}), NO className prop, NO Tailwind classes. Make it beautiful with proper colors, spacing, and interactions.`
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

      setMessages((prev) => [...prev, { role: 'assistant', content: acc }]);
      toast.success('Component updated!');
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      setError(e.message);
      toast.error(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = () => {
    generate(prompt, messages.length > 0);
    setPrompt('');
  };

  const handleReset = () => {
    setMessages([]);
    setGeneratedCode('');
    setError(null);
    setPrompt('');
  };

  const handleRefreshCode = () => {
    setCodeRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="h-screen flex flex-col bg-gradient-to-br from-primary-50 via-white to-primary-100">
        {/* header */}
        <header className="shrink-0 border-b border-primary-200 bg-white/95 backdrop-blur-xl shadow-sm px-4 sm:px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-2 rounded-xl shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">RAJ AI APP BUILDER</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/" className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Home
              </Link>
              <button onClick={handleReset} className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">New App</button>
            </div>
          </div>
        </header>

        {/* content area */}
        <main className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-2 gap-3 p-3">
          {/* left – code */}
          <div className="hidden xl:flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <CodeEditor key={codeRefreshKey} code={generatedCode} isStreaming={isGenerating} onCodeChange={setGeneratedCode} onRefresh={handleRefreshCode} />
          </div>

          {/* right – preview */}
          <div className="flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <PreviewPanel code={generatedCode} />
          </div>

          {/* mobile code */}
          <div className="xl:hidden bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <CodeEditor key={`m-${codeRefreshKey}`} code={generatedCode} isStreaming={isGenerating} onCodeChange={setGeneratedCode} onRefresh={handleRefreshCode} />
          </div>
        </main>

        {/* chat footer */}
        <footer className="shrink-0 border-t border-primary-200 bg-white/95 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto px-4 py-3">
            {/* thread */}
            <div ref={threadRef} className="max-h-48 overflow-y-auto mb-3 space-y-2">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                      m.role === 'user'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                    {m.role === 'user' ? m.content : <code className="text-xs">{m.content.length > 50 ? m.content.substring(0, 50) + '...' : m.content}</code>}
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-xl bg-gray-100 text-gray-800 text-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                  </div>
                </div>
              )}
            </div>

            {/* input bar */}
            <div className="flex items-center gap-2">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
                placeholder={messages.length ? 'Tell the AI what to change...' : 'Describe the React component you want...'}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
              <button
                onClick={handleSubmit}
                disabled={!prompt.trim() || isGenerating}
                className="shrink-0 px-3 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm shadow hover:shadow-md transition-shadow">
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default function Builder() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-600">Loading…</div>}>
      <BuilderContent />
    </Suspense>
  );
}
