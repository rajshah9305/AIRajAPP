'use client';

import { useState } from 'react';
import { Send, Loader2, RotateCcw } from 'lucide-react';
import { Message } from '@/types';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isGenerating: boolean;
  onRegenerate: () => void;
  messages: Message[];
}

export function ChatInput({ onSendMessage, isGenerating, onRegenerate, messages }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    
    await onSendMessage(input);
    setInput('');
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={messages.length > 0 ? 'Tell the AI what to change...' : 'Describe the React component you want...'}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
          disabled={isGenerating}
        />
        {messages.length > 0 && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isGenerating}
            className="shrink-0 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Regenerate</span>
          </button>
        )}
        <button
          type="submit"
          disabled={!input.trim() || isGenerating}
          className="shrink-0 px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm shadow hover:shadow-md transition-shadow"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}