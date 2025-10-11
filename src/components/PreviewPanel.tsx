'use client';
import { useState, useMemo, useEffect } from "react";
import { Eye, RefreshCw, Copy, AlertTriangle, CheckCircle } from "lucide-react";
import { Sandpack } from "@codesandbox/sandpack-react";
import toast from "react-hot-toast";

interface PreviewPanelProps {
  code: string;
}

export function PreviewPanel({ code }: PreviewPanelProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    if (code) {
      setPreviewStatus('loading');
      const timer = setTimeout(() => {
        if (!hasError) {
          setPreviewStatus('ready');
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setPreviewStatus('idle');
    }
  }, [code, hasError]);

  const sandpackFiles = useMemo(() => {
    if (!code.trim()) {
      return {
        '/App.tsx': {
          code: `export default function App() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#64748b',
      background: 'linear-gradient(135deg, #fef3c7 0%, #fecaca 100%)',
      margin: 0,
      padding: 0
    }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.6 }}>⚡</div>
        <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: '#334155' }}>
          Waiting for AI Magic
        </div>
        <div style={{ fontSize: '14px', color: '#64748b' }}>
          Generate a component to see live preview
        </div>
      </div>
    </div>
  );
}`,
        }
      };
    }

    let componentCode = code
      .replace(/^```+\s*(tsx?|typescript|javascript|jsx|react)?\s*$/gm, '')
      .replace(/^```+\s*$/gm, '')
      .replace(/```+$/gm, '')
      .trim();

    try {
      let cleanedCode = componentCode;

      // Ensure React import exists
      if (!cleanedCode.includes('import React') && !cleanedCode.includes('from "react"') && !cleanedCode.includes("from 'react'")) {
        cleanedCode = `import React, { useState } from 'react';\n${cleanedCode}`;
      }

      // Convert Tailwind classes to inline styles (as fallback)
      cleanedCode = cleanedCode.replace(/className="([^"]*)"/g, (match: string, classes: string) => {
        const styleMap: Record<string, string> = {
          'bg-red-500': 'backgroundColor: "#ef4444"',
          'bg-red-600': 'backgroundColor: "#dc2626"',
          'bg-red-700': 'backgroundColor: "#b91c1c"',
          'text-white': 'color: "#ffffff"',
          'text-red-500': 'color: "#ef4444"',
          'text-red-600': 'color: "#dc2626"',
          'rounded-md': 'borderRadius: "0.375rem"',
          'shadow-md': 'boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"',
          'p-10': 'padding: "2.5rem"',
          'p-4': 'padding: "1rem"',
          'px-4': 'paddingLeft: "1rem", paddingRight: "1rem"',
          'py-2': 'paddingTop: "0.5rem", paddingBottom: "0.5rem"',
          'mb-5': 'marginBottom: "1.25rem"',
          'w-full': 'width: "100%"',
          'h-screen': 'height: "100vh"',
          'flex': 'display: "flex"',
          'justify-center': 'justifyContent: "center"',
          'items-center': 'alignItems: "center"',
          'text-3xl': 'fontSize: "1.875rem"',
          'font-bold': 'fontWeight: "700"',
          'border': 'border: "1px solid #e5e7eb"',
          'border-gray-300': 'borderColor: "#d1d5db"',
        };

        const classArray = classes.split(' ').filter(Boolean);
        const styles: string[] = [];
        
        classArray.forEach((cls: string) => {
          if (styleMap[cls]) {
            styles.push(styleMap[cls]);
          }
        });

        if (styles.length > 0) {
          return `style={{${styles.join(', ')}}}`;
        }
        return match;
      });

      // Find the main component function/const
      const functionMatch = cleanedCode.match(/(?:export default )?function\s+([A-Z]\w*)/);
      const constMatch = cleanedCode.match(/(?:export default )?const\s+([A-Z]\w*)\s*=/);
      
      let componentName = '';
      if (functionMatch) {
        componentName = functionMatch[1];
      } else if (constMatch) {
        componentName = constMatch[1];
      }

      // Remove existing export default to avoid duplication
      cleanedCode = cleanedCode.replace(/export default\s+\w+;?\s*$/m, '');

      // Wrap component in a fullscreen container
      const wrappedCode = `${cleanedCode}

// Fullscreen wrapper to ensure component fills entire preview
export default function FullscreenWrapper() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      overflow: 'auto',
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      <${componentName || 'GeneratedComponent'} />
    </div>
  );
}`;

      setHasError(false);
      setErrorMessage("");
      
      return {
        '/App.tsx': {
          code: wrappedCode,
        },
        '/index.html': {
          code: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html, body, #root {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
        }
      };

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error parsing component';
      setHasError(true);
      setErrorMessage(errMsg);
      setPreviewStatus('error');
      
      return {
        '/App.tsx': {
          code: `export default function ErrorComponent() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      fontFamily: 'system-ui, sans-serif',
      color: '#ef4444',
      background: '#fef2f2',
      padding: '2rem',
      margin: 0
    }}>
      <div style={{ textAlign: 'center', maxWidth: '500px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
          Component Parse Error
        </div>
        <div style={{ fontSize: '14px', color: '#991b1b', marginBottom: '16px' }}>
          ${errMsg.replace(/"/g, "'")}
        </div>
        <div style={{ fontSize: '12px', color: '#7f1d1d' }}>
          Try refreshing or regenerating the component
        </div>
      </div>
    </div>
  );
}`,
        }
      };
    }
  }, [code]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setHasError(false);
    setErrorMessage("");
    setPreviewStatus('loading');
    toast.success('Preview refreshed');
  };

  const handleCopyCode = async () => {
    if (code) {
      await navigator.clipboard.writeText(code);
      toast.success('Code copied to clipboard');
    }
  };

  const renderEmptyState = () => (
    <div className="flex items-center justify-center h-full text-gray-500">
      <div className="text-center space-y-3 p-6">
        <div className="relative">
          <Eye size={64} className="mx-auto opacity-10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin opacity-20"></div>
          </div>
        </div>
        <div className="text-lg font-semibold text-gray-700">Live Preview</div>
        <div className="text-sm text-gray-500">Interactive component rendering</div>
        <div className="text-xs text-gray-400">Your generated app will appear here in real-time</div>
      </div>
    </div>
  );

  const getStatusColor = () => {
    switch (previewStatus) {
      case 'error': return 'bg-red-100 text-red-700 border-red-200';
      case 'loading': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'ready': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (previewStatus) {
      case 'error': return <AlertTriangle size={14} className="sm:w-4 sm:h-4" />;
      case 'ready': return <CheckCircle size={14} className="sm:w-4 sm:h-4" />;
      default: return <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (previewStatus) {
      case 'error': return 'Error';
      case 'loading': return 'Loading';
      case 'ready': return 'Live';
      default: return 'Idle';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 overflow-hidden h-full">
      <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-1 sm:gap-2">
          <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">Live Preview</h3>
          {code && (
            <div className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-full text-xs border ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="hidden sm:inline font-medium">{getStatusText()}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {code && (
            <>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition-colors border border-gray-200 shadow-sm"
                title="Copy code"
              >
                <Copy className="w-3 sm:w-4 h-3 sm:h-4" />
                <span className="hidden sm:inline">Copy</span>
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition-colors border border-gray-200 shadow-sm"
                title="Refresh preview"
              >
                <RefreshCw className="w-3 sm:w-4 h-3 sm:h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="flex-1 p-0 min-h-0 overflow-hidden">
        {hasError && errorMessage && (
          <div className="absolute top-16 left-4 right-4 z-10 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-fadeIn shadow-lg">
            <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs sm:text-sm text-red-700 flex-1">
              <div className="font-semibold mb-1">Preview Error</div>
              <div className="opacity-90">{errorMessage}</div>
              <div className="mt-2 text-xs opacity-75">
                Try refreshing the preview or regenerating the component
              </div>
            </div>
          </div>
        )}
        
        <div className="h-full bg-gray-50 overflow-hidden">
          {!code ? (
            renderEmptyState()
          ) : (
            <div className="h-full w-full">
              <Sandpack
                key={refreshKey}
                template="react-ts"
                files={sandpackFiles}
                options={{
                  showNavigator: false,
                  showTabs: false,
                  showLineNumbers: false,
                  showInlineErrors: true,
                  autorun: true,
                  autoReload: true,
                  recompileMode: 'delayed',
                  recompileDelay: 500,
                  layout: 'preview',
                }}
                customSetup={{
                  dependencies: {
                    'react': '^18.2.0',
                    'react-dom': '^18.2.0',
                  },
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
