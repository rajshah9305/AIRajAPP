‘use client’;

import { useState, useRef, useEffect } from ‘react’;
import { Send, Loader2, Sparkles, RotateCcw } from ‘lucide-react’;

interface Message {
id: string;
content: string;
type: ‘user’ | ‘assistant’;
timestamp: Date;
}

interface ChatInputProps {
onSendMessage: (message: string) => void;
isGenerating: boolean;
onRegenerate: () => void;
messages: Message[];
}

export function ChatInput({ onSendMessage, isGenerating, onRegenerate, messages }: ChatInputProps) {
const [input, setInput] = useState(’’);
const textareaRef = useRef<HTMLTextAreaElement>(null);
const messagesEndRef = useRef<HTMLDivElement>(null);

const adjustTextareaHeight = () => {
const textarea = textareaRef.current;
if (textarea) {
textarea.style.height = ‘auto’;
textarea.style.height = Math.min(textarea.scrollHeight, 120) + ‘px’;
}
};

useEffect(() => {
adjustTextareaHeight();
}, [input]);

useEffect(() => {
messagesEndRef.current?.scrollIntoView({ behavior: ‘smooth’ });
}, [messages]);

const handleSubmit = (e: React.FormEvent) => {
e.preventDefault();
if (!input.trim() || isGenerating) return;

```
onSendMessage(input.trim());
setInput('');

if (textareaRef.current) {
  textareaRef.current.style.height = 'auto';
}
```

};

const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
if (e.key === ‘Enter’ && !e.shiftKey) {
e.preventDefault();
handleSubmit(e);
}
};

const handleSuggestionClick = (suggestion: string) => {
setInput(suggestion);
setTimeout(() => {
textareaRef.current?.focus();
}, 0);
};

return (
<div className="border-t border-gray-200 bg-white">
{messages.length > 0 && (
<div className="max-h-48 overflow-y-auto border-b border-gray-100">
<div className="p-3 space-y-2">
{messages.slice(-3).map((message) => (
<div
key={message.id}
className={`flex animate-slideInUp ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
>
<div
className={`max-w-[80%] px-3 py-2 rounded-lg text-sm transition-all duration-200 ${ message.type === 'user' ? 'bg-orange-500 text-white rounded-br-sm shadow-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm shadow-sm' }`}
>
{message.content}
</div>
</div>
))}
</div>
<div ref={messagesEndRef} />
</div>
)}

```
  <div className="p-3 sm:p-4">
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={messages.length === 0 ? 'Describe your app idea...' : 'Ask to modify the app...'}
          className="w-full px-4 py-3 pr-16 text-sm sm:text-base border border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 resize-none outline-none transition-all min-h-[48px] max-h-[120px] disabled:bg-gray-50 disabled:cursor-not-allowed"
          disabled={isGenerating}
          rows={1}
          maxLength={2000}
        />
        <div className="absolute bottom-3 right-3 text-xs text-gray-400 pointer-events-none">
          {input.length}/2000
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {messages.length > 0 && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isGenerating}
            className="p-2.5 sm:p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed button-hover-scale shadow-sm"
            title="Regenerate response"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        <button
          type="submit"
          disabled={!input.trim() || isGenerating || input.length > 2000}
          className="p-2.5 sm:p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 button-hover-scale shadow-sm"
          title={isGenerating ? 'Generating...' : messages.length === 0 ? 'Generate app' : 'Send message'}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          ) : messages.length === 0 ? (
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>
      </div>
    </form>

    {messages.length === 0 && (
      <div className="mt-3 flex flex-wrap gap-2">
        {[
          'Create a todo app with animations',
          'Build a weather dashboard',
          'Make a pricing calculator'
        ].map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            className="px-3 py-1.5 text-xs sm:text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200 hover:border-gray-300 shadow-sm"
          >
            {suggestion}
          </button>
        ))}
      </div>
    )}

    {messages.length === 0 && (
      <div className="mt-3 text-xs text-gray-500 text-center">
        Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Enter</kbd> to send, 
        <kbd className="ml-1 px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Shift + Enter</kbd> for new line
      </div>
    )}
  </div>
</div>
```

);
}
