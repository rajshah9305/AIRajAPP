'use client';

import { useState, useRef, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Loader2, Sparkles, Send, RotateCcw } from 'lucide-react';
import { CodeEditor } from '@/components/CodeEditor';
import { PreviewPanel } from '@/components/PreviewPanel';

type Message = { role: 'user' | 'assistant'; content: string };

export default function Home() {
  /* ---------- core state ---------- */
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);

  /* ---------- auto-scroll thread ---------- */
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  /* ---------- generation ---------- */
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

  /* ---------- actions ---------- */
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

        {/* ---- content area ---- */}
        <main className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-2 gap-3 p-3">
          {/* left – code */} 
          <div className="hidden xl:flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <CodeEditor code={generatedCode} isStreaming={isGenerating} onCodeChange={setGeneratedCode} />
          </div>

          {/* right – preview */} 
          <div className="flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <PreviewPanel code={generatedCode} />
          </div>

          {/* mobile code tab (optional) */}
          <div className="xl:hidden bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <CodeEditor code={generatedCode} isStreaming={isGenerating} onCodeChange={setGeneratedCode} />
          </div>
        </main>

        {/* ---- chat thread + input ---- */}
        <footer className="shrink-0 border-t border-orange-200 bg-white/95 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto px-4 py-3">
            {/* thread */} 
            <div ref={threadRef} className="max-h-48 overflow-y-auto mb-3 space-y-2">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                      m.role === 'user'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                    {m.role === 'user' ? m.content : <code className="text-xs">Component updated</code>}
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
              <button
                onClick={handleSubmit}
                disabled={!prompt.trim() || isGenerating}
                className="shrink-0 px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm shadow hover:shadow-md transition-shadow">
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
