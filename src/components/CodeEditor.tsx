‘use client’;
import { useEffect, useRef } from “react”;
import { Copy, Download, RefreshCw } from “lucide-react”;
import toast from “react-hot-toast”;

interface CodeEditorProps {
code: string;
isStreaming: boolean;
onCodeChange: (code: string) => void;
onRefresh: () => void;
}

export function CodeEditor({ code, isStreaming, onCodeChange, onRefresh }: CodeEditorProps) {
const textareaRef = useRef<HTMLTextAreaElement>(null);

useEffect(() => {
if (textareaRef.current && isStreaming) {
textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
}
}, [code, isStreaming]);

const handleCopyCode = async () => {
try {
await navigator.clipboard.writeText(code);
toast.success(“Code copied to clipboard!”);
} catch (error) {
toast.error(“Failed to copy code”);
}
};

const handleDownloadCode = () => {
try {
const blob = new Blob([code], { type: ‘text/plain’ });
const url = URL.createObjectURL(blob);
const a = document.createElement(‘a’);
a.href = url;
a.download = ‘generated-component.tsx’;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);
toast.success(“Code downloaded!”);
} catch (error) {
toast.error(“Failed to download code”);
}
};

return (
<div className="flex-1 flex flex-col bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 overflow-hidden h-full">
{/* Header */}
<div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
<div className="flex items-center gap-1 sm:gap-2">
<h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">Generated Code</h3>
{isStreaming && (
<div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-orange-100 text-orange-700 rounded-full text-xs border border-orange-200">
<div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-orange-500 rounded-full animate-pulse" />
<span className="hidden sm:inline font-medium">Streaming</span>
</div>
)}
</div>
<div className="flex items-center gap-1 sm:gap-2">
<button 
onClick={handleCopyCode}
disabled={!code}
className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition-colors border border-gray-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
title="Copy code to clipboard"
>
<Copy className="w-3 sm:w-4 h-3 sm:h-4" />
<span className="hidden sm:inline">Copy</span>
</button>
<button 
onClick={handleDownloadCode}
disabled={!code}
className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition-colors border border-gray-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
title="Download code as .tsx file"
>
<Download className="w-3 sm:w-4 h-3 sm:h-4" />
<span className="hidden md:inline">Download</span>
</button>
<button 
onClick={onRefresh}
disabled={isStreaming}
className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition-colors border border-gray-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
title="Refresh preview"
>
<RefreshCw className="w-3 sm:w-4 h-3 sm:h-4" />
<span className="hidden sm:inline">Refresh</span>
</button>
</div>
</div>

```
  {/* Code Editor Area */}
  <div className="flex-1 relative min-h-0 overflow-hidden">
    <textarea
      ref={textareaRef}
      value={code}
      onChange={(e) => onCodeChange(e.target.value)}
      className={`w-full h-full p-3 sm:p-4 font-mono text-xs sm:text-sm leading-relaxed bg-gray-900 text-gray-100 border-0 resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500 ${
        isStreaming ? 'streaming-cursor' : ''
      }`}
      placeholder="Generated React component code will appear here..."
      spellCheck={false}
      style={{
        tabSize: 2,
        fontFamily: '"Fira Code", "Cascadia Code", "Source Code Pro", Consolas, Monaco, "Courier New", monospace',
      }}
    />
    
    {/* Empty State */}
    {!code && !isStreaming && (
      <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
        <div className="text-center space-y-3 p-6">
          <div className="text-3xl sm:text-5xl opacity-10 font-mono">{'</>'}</div>
          <div className="text-sm sm:text-base text-gray-500 font-medium">
            Generated code will stream here in real-time
          </div>
          <div className="text-xs sm:text-sm text-gray-400">
            Start by describing what you want to build
          </div>
        </div>
      </div>
    )}
  </div>
</div>
```

);
}
