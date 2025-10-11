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

  // Reset preview status when code changes
  useEffect(() => {
    if (code) {
      setPreviewStatus('loading');
      // Set a timeout to mark as ready after Sandpack initializes
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

  // Clean and parse the generated code to create a proper React component structure
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
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#64748b',
      background: 'linear-gradient(135deg, #fef3c7 0%, #fecaca 100%)'
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

    // Clean the code by removing markdown code fences and extra formatting
    let componentCode = code
      .replace(/^```+\s*(tsx?|typescript|javascript|jsx|react)?\s*$/gm, '') // Remove opening fences with labels
      .replace(/^```+\s*$/gm, '') // Remove standalone code fence lines
      .replace(/```+$/gm, '') // Remove closing fences
      .trim();

    try {
      // Detect if it's TypeScript or JavaScript based on content
      const isTypeScript = componentCode.includes('interface ') || 
                          componentCode.includes('type ') || 
                          componentCode.includes(': React.') ||
                          componentCode.includes('<FC') ||
                          componentCode.includes('Props>');

      // Remove TypeScript-only syntax if needed for preview
      let cleanedCode = componentCode;
      
      // Handle common TypeScript patterns
      if (isTypeScript) {
        // Keep the TypeScript code but ensure it's valid
        cleanedCode = componentCode
          .replace(/import\s+React,\s*{/g, 'import React, {')
          .replace(/from\s+"react";/g, 'from "react";')
          .replace(/from\s+'react';/g, 'from "react";');
      }

      // Ensure there's an export statement
      if (!cleanedCode.includes('export default')) {
        // Try to find the component name
        const functionMatch = cleanedCode.match(/function\s+([A-Z]\w*)/);
        const constMatch = cleanedCode.match(/const\s+([A-Z]\w*)\s*[=:]/);
        
        if (functionMatch) {
          cleanedCode += `\n\nexport default ${functionMatch[1]};`;
        } else if (constMatch) {
          cleanedCode += `\n\nexport default ${constMatch[1]};`;
        } else {
          // Wrap the entire code in a component
          cleanedCode = `import React from 'react';

export default function GeneratedComponent() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', minHeight: '100vh' }}>
      {${cleanedCode}}
    </div>
  );
}`;
        }
      }

      // Ensure React is imported
      if (!cleanedCode.includes('import') && !cleanedCode.includes('require')) {
        cleanedCode = `import React from 'react';\n${cleanedCode}`;
      }

      setHasError(false);
      setErrorMessage("");
      
      return {
        '/App.tsx': {
          code: cleanedCode,
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
      fontFamily: 'system-ui, sans-serif',
      color: '#ef4444',
      background: '#fef2f2',
      padding: '2rem'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '500px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
          Component Parse Error
        </div>
        <div style={{ fontSize: '14px', color: '#991b1b', marginBottom: '16px' }}>
          ${errMsg}
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
      
      <div className="flex-1 p-2 sm:p-4 min-h-0 overflow-hidden">
        {hasError && errorMessage && (
          <div className="mb-2 sm:mb-4 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-fadeIn">
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
        
        <div className="h-full bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
          {!code ? (
            renderEmptyState()
          ) : (
            <div className="h-full w-full">
              <Sandpack
                key={refreshKey}
                template="react-ts"
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
                    comment: {color: '#64748b', fontStyle: 'italic'},
                    keyword: '#7c3aed',
                    tag: '#dc2626',
                    punctuation: '#64748b',
                    definition: '#059669',
                    property: '#0ea5e9',
                    static: '#dc2626',
                    string: '#059669',
                  },
                  font: {
                    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
                  showInlineErrors: true,
                  autorun: true,
                  autoReload: true,
                  recompileMode: 'delayed',
                  recompileDelay: 500,
                  initMode: 'lazy',
                  classes: {
                    'sp-wrapper': 'h-full',
                    'sp-layout': 'h-full',
                    'sp-preview-container': 'h-full',
                    'sp-preview-iframe': 'h-full',
                  },
                }}
                customSetup={{
                  dependencies: {
                    'react': '^18.2.0',
                    'react-dom': '^18.2.0',
                    'lucide-react': '0.263.1',
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
