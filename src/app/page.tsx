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
  const [generationStage, setGenerationStage] = useState<'idle' | 'thinking' | 'code' | 'complete'>('idle');
  const abortControllerRef = useRef<AbortController | null>(null);

  const examplePrompts = [
    'Create a beautiful todo list with drag and drop, animations, and a gradient design',
    'Build a weather dashboard with cards, charts, and smooth transitions',
    'Make an interactive pricing calculator with slider controls and real-time updates',
    'Design a sleek contact form with validation, animations, and success state',
    'Create a modern login page with animated background and social auth buttons',
    'Build a product showcase with image carousel, zoom, and hover effects',
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a description for your app');
      return;
    }

    if (prompt.length > 2000) {
      toast.error('Prompt is too long. Please keep it under 2000 characters.');
      return;
    }

    setIsGenerating(true);
    setShowPreview(true);
    setGeneratedCode('');
    setError(null);
    setGenerationStage('thinking');
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    let accumulatedCode = '';

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
        
        if (errorMessage.includes('CEREBRAS_API_KEY')) {
          toast.error('⚠️ API Key Required: Please set your CEREBRAS_API_KEY in the .env file');
        } else {
          toast.error(errorMessage);
        }
        
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

        for (const line of lines) {
          const data = line.replace(/^data:\s*/, '').trim();
          if (!data || data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);

            // Handle different stages
            if (parsed.stage === 'thinking') {
              setGenerationStage('thinking');
              continue;
            }

            if (parsed.stage === 'error') {
              throw new Error(parsed.error || 'Generation failed');
            }

            if (parsed.stage === 'code' && parsed.content) {
              setGenerationStage('code');
              accumulatedCode += parsed.content;
              setGeneratedCode(accumulatedCode);
            }

            if (parsed.stage === 'complete') {
              setGenerationStage('complete');
              // Use the cleaned full code if provided
              if (parsed.fullCode) {
                setGeneratedCode(parsed.fullCode);
                accumulatedCode = parsed.fullCode;
              }
            }

          } catch (parseError) {
            // Skip malformed JSON in stream
            console.debug('Stream parse error:', parseError);
          }
        }
      }

      if (accumulatedCode.trim()) {
        toast.success('✨ App generated successfully!');
        setGenerationStage('complete');
      } else {
        throw new Error('No code was generated. Please try again.');
      }

    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          // User cancelled, don't show error
          return;
        }
        
        const errorMessage = error.message || 'Failed to generate app';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Generation error:', error);
      }
    } finally {
      setIsGenerating(false);
      setGenerationStage('idle');
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      setGenerationStage('idle');
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
    setGenerationStage('idle');
  };

  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#1e293b',
            border: '1px solid #e2e8f0',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 500,
          },
