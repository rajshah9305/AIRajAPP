'use client';
import { useState, useMemo } from "react";
import { Eye, RefreshCw, Copy, AlertTriangle } from "lucide-react";
import { Sandpack } from "@codesandbox/sandpack-react";
import toast from "react-hot-toast";

interface PreviewPanelProps {
  code: string;
}

export function PreviewPanel({ code }: PreviewPanelProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // Clean and parse the generated code to create a proper React component structure
  const sandpackFiles = useMemo(() => {
    if (!code.trim()) {
      return {
        '/App.js': `export default function App() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'Inter, sans-serif',
      color: '#64748b'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>⚡</div>
        <div style={{ fontSize: '14px' }}>Generate a component to see live preview</div>
      </div>
    </div>
  );
}`
      };
    }

    // Clean the code by removing markdown code fences and extra formatting
    let componentCode = code
      .replace(/^```(tsx?|javascript|jsx?)?\s*\n/gm, '') // Remove opening code fences
      .replace(/\n```\s*$/gm, '') // Remove closing code fences
      .replace(/^\s*```\s*$/gm, '') // Remove standalone code fence lines
      .trim();
    
    // Basic validation and cleanup
    try {
      // If the code doesn't include export, add it
      if (!componentCode.includes('export')) {
        // Try to find function component pattern
        const functionMatch = componentCode.match(/function\s+(\w+)/);
        const arrowMatch = componentCode.match(/const\s+(\w+)\s*=/);
        
        if (functionMatch) {
          componentCode += `\n\nexport default ${functionMatch[1]};`;
        } else if (arrowMatch) {
          componentCode += `\n\nexport default ${arrowMatch[1]};`;
        } else {
          // Wrap in a default component
          componentCode = `function GeneratedComponent() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Inter, sans-serif' }}>
      ${componentCode}
    </div>
  );
}

export default GeneratedComponent;`;
        }
      }

      setHasError(false);
    } catch (error) {
      setHasError(true);
      componentCode = `export default function ErrorComponent() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'Inter, sans-serif',
      color: '#ef4444'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <div style={{ fontSize: '14px' }}>Error parsing component code</div>
      </div>
    </div>
  );
}`;
    }

    return {
      '/App.js': componentCode
    };
  }, [code]); // Removed refreshKey from dependency array as it's not directly used in the code

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setHasError(false);
    toast.success('Preview refreshed');
  };

  const handleCopyCode = async () => {
    if (code) {
      await navigator.clipboard.writeText(code);
      toast.success('Code copied to clipboard');
    }
  };

  const handleUseFallback = () => {
    setUseFallback(true);
    toast('Switched to fallback preview mode');
  };

  const renderEmptyState = () => (
    <div className="flex items-center justify-center h-full text-gray-500">
      <div className="text-center space-y-3">
        <Eye size={48} className="mx-auto opacity-20" />
        <div className="text-sm">Live preview will appear here</div>
        <div className="text-xs opacity-75">Interactive component rendering</div>
      </div>
    </div>
  );

  const renderFallbackPreview = () => (
    <div className="p-6 text-center text-gray-500">
      <div className="space-y-4">
        <div className="text-4xl opacity-30">📝</div>
        <div className="text-sm">Code Preview</div>
        <div className="text-xs opacity-75">Interactive preview temporarily unavailable</div>
        <pre className="text-left bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-64">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );

  const renderSandpackPreview = () => {
    try {
      return (
        <div className="h-full w-full">
          <Sandpack
            key={refreshKey}
            template="react"
            files={sandpackFiles}
            theme={{
              colors: {
                surface1: '#ffffff',
                surface2: '#f8fafc',
                surface3: '#f1f5f9',
                clickable: '#64748b',
                base: '#1e293b',
                disabled: '#94a3b8',
                hover: '#475569',
                accent: '#f97316',
                error: '#ef4444',
                errorSurface: '#fef2f2',
                warning: '#f59e0b',
                warningSurface: '#fffbeb',
              },
              syntax: {
                plain: '#1e293b',
                comment: '#64748b',
                keyword: '#7c3aed',
                tag: '#dc2626',
                punctuation: '#64748b',
                definition: '#059669',
                property: '#0ea5e9',
                static: '#dc2626',
                string: '#059669',
              },
              font: {
                body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                mono: '"Fira Code", "Consolas", "Monaco", monospace',
                size: '13px',
                lineHeight: '1.4',
              },
            }}
            options={{
              showNavigator: false,
              showTabs: false,
              showLineNumbers: false,
              editorHeight: '100%',
              editorWidthPercentage: 0,
              showInlineErrors: false,
              autorun: true,
              autoReload: true,
              recompileMode: 'delayed',
              recompileDelay: 300,
              initMode: 'immediate',
              showRefreshButton: false,
              showConsole: false,
              showConsoleButton: false,
            }}
            customSetup={{
              dependencies: {
                'react': '^18.0.0',
                'react-dom': '^18.0.0',
                'lucide-react': '0.263.1',
              }
            }}
          />
        </div>
      );
    } catch (error) {
      console.warn('Sandpack failed to load, falling back to static preview');
      return renderFallbackPreview();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 overflow-hidden h-full">
      <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-1 sm:gap-2">
          <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">Live Preview</h3>
          {code && (
            <div className={`flex items-center gap-1 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs ${
              hasError 
                ? 'bg-red-100 text-red-700' 
                : useFallback 
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-700'
            }`}>
              <div className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${
                hasError 
                  ? 'bg-red-500' 
                  : useFallback 
                    ? 'bg-yellow-500'
                    : 'bg-green-500 animate-pulse'
              }`} />
              <span className="hidden sm:inline">{hasError ? 'Error' : useFallback ? 'Static' : 'Live'}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {code && (
            <>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-1 sm:px-2 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Copy code"
              >
                <Copy size={12} className="sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1 px-1 sm:px-2 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Refresh preview"
              >
                <RefreshCw size={12} className="sm:w-4 sm:h-4" />
              </button>
              {!useFallback && (
                <button
                  onClick={handleUseFallback}
                  className="flex items-center gap-1 px-1 sm:px-2 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  title="Switch to fallback mode"
                >
                  <AlertTriangle size={12} className="sm:w-4 sm:h-4" />
                </button>
              )}
            </>
          )}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Eye size={12} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{useFallback ? 'Static' : 'Interactive'}</span>
          </div>
        </div>
      </div>
      <div className="flex-1 p-2 sm:p-4 min-h-0">
        {hasError && (
          <div className="mb-2 sm:mb-4 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertTriangle size={14} className="sm:w-4 sm:h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs sm:text-sm text-red-700">
              There was an issue parsing the generated code. Try refreshing the preview or generating a new component.
            </div>
          </div>
        )}
        <div className="h-full bg-gray-50 rounded-lg overflow-hidden">
          {!code ? (
            renderEmptyState()
          ) : useFallback ? (
            renderFallbackPreview()
          ) : (
            renderSandpackPreview()
          )}
        </div>
      </div>
    </div>
  );
}