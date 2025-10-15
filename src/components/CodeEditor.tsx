'use client';
import { useEffect, useRef } from "react";
import { Copy, Download } from "lucide-react";
import toast from "react-hot-toast";

interface CodeEditorProps {
  code: string;
  isStreaming: boolean;
  onCodeChange: (code: string) => void;
}

export function CodeEditor({ code, isStreaming, onCodeChange }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current && isStreaming) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [code, isStreaming]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy code");
    }
  };

  const handleDownloadCode = () => {
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-component.tsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Code downloaded!");
  };

  return (
    <div className="flex-1 flex flex-col bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 overflow-hidden h-full">
      <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-1 sm:gap-2">
          <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">Generated Code</h3>
          {isStreaming && (
            <div className="flex items-center gap-1 px-1 sm:px-2 py-0.5 sm:py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
              <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="hidden sm:inline">Streaming</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button 
            onClick={handleCopyCode}
            disabled={!code}
            className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Copy className="w-3 sm:w-4 h-3 sm:h-4" />
            <span className="hidden sm:inline">Copy</span>
          </button>
          <button 
            onClick={handleDownloadCode}
            disabled={!code}
            className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-3 sm:w-4 h-3 sm:h-4" />
            <span className="hidden md:inline">Download</span>
          </button>
        </div>
      </div>
      <div className="flex-1 relative min-h-0">
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          className={`w-full h-full p-2 sm:p-3 font-mono text-xs sm:text-sm bg-gray-900 text-gray-100 border-0 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 ${
            isStreaming ? 'streaming-cursor' : ''
          }`}
          placeholder="Generated React component code will appear here..."
          spellCheck={false}
        />
        {!code && !isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center space-y-2">
              <div className="text-2xl sm:text-4xl opacity-20">{'</>'}</div>
              <div className="text-xs sm:text-sm">Generated code will stream here in real-time</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
