// src/app/api/generate/route.ts
import { NextRequest } from 'next/server';

// Dynamically import Cerebras only when needed to avoid build errors
let Cerebras: any;
let client: any;

// Initialize Cerebras client only when API is called
const getClient = async () => {
  if (!client) {
    if (!Cerebras) {
      Cerebras = (await import('@cerebras/cerebras_cloud_sdk')).default;
    }
    
    if (!process.env.CEREBRAS_API_KEY) {
      throw new Error('CEREBRAS_API_KEY is not configured. Please add it to your .env file.');
    }
    
    client = new Cerebras({
      apiKey: process.env.CEREBRAS_API_KEY,
    });
  }
  
  return client;
};

const systemPrompt = `You are an expert React/TypeScript developer. Generate ONLY valid React component code.

CRITICAL RULES:
1. Return ONLY valid React/TypeScript code - no explanations, no markdown fences, no comments outside the code
2. Use functional components with TypeScript interfaces
3. Include proper TypeScript types for all props and state
4. ALWAYS use inline styles with the style={{}} prop - NEVER use className or Tailwind classes
5. Make components interactive and production-ready with proper state management
6. Include all necessary imports (React, useState, useEffect, etc.)
7. ALWAYS export the component as default: "export default function ComponentName() { ... }"
8. Start directly with imports - no preamble text
9. Use semantic HTML and accessible markup
10. Handle edge cases and provide good UX

STYLING REQUIREMENTS (CRITICAL):
- Use ONLY inline styles with camelCase CSS properties
- Example: style={{ backgroundColor: '#ef4444', color: '#ffffff', padding: '1rem' }}
- DO NOT use className prop
- DO NOT use Tailwind utility classes
- Create responsive designs using CSS properties
- Add smooth transitions and hover effects using inline styles
- Use modern color schemes with hex codes or rgba values

COLOR PALETTE TO USE:
- Red shades: #ef4444 (red-500), #dc2626 (red-600), #b91c1c (red-700)
- Orange shades: #f97316 (orange-500), #ea580c (orange-600), #fb923c (orange-400)
- Blue shades: #3b82f6 (blue-500), #2563eb (blue-600), #1d4ed8 (blue-700)
- Gray shades: #f3f4f6 (gray-100), #e5e7eb (gray-200), #6b7280 (gray-500)
- Green shades: #10b981 (green-500), #059669 (green-600)

COMPONENT STRUCTURE:
import React, { useState } from 'react';

interface ComponentNameProps {
  // Define props with TypeScript types if needed
}

export default function ComponentName() {
  // State and hooks
  const [state, setState] = useState();

  // Event handlers
  const handleEvent = () => {
    // Implementation
  };

  // Render
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      padding: '2rem'
    }}>
      {/* Component JSX with inline styles */}
    </div>
  );
}

EXAMPLE BUTTON STYLE:
<button
  onClick={handleClick}
  style={{
    backgroundColor: '#ef4444',
    color: '#ffffff',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.2s'
  }}
  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
>
  Click Me
</button>

EXAMPLE INPUT STYLE:
<input
  type="text"
  placeholder="Enter text..."
  style={{
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    outline: 'none'
  }}
  onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
  onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
/>

Remember: NO markdown, NO explanations, NO Tailwind classes, ONLY inline styled code!`;

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }), 
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate API key
    if (!process.env.CEREBRAS_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'CEREBRAS_API_KEY is not configured. Please add it to your .env file.' 
        }), 
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = '';
        let hasStartedCode = false;
        
        try {
          const clientInstance = await getClient();
          
          // Send initial status
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              stage: 'thinking', 
              content: 'Generating your component...' 
            })}\n\n`)
          );

          const completion = await clientInstance.chat.completions.create({
            model: 'llama3.1-8b',
            messages: [
              { role: 'system', content: systemPrompt },
              { 
                role: 'user', 
                content: `Create a React TypeScript component with the following requirements: ${prompt}

REMEMBER: Use ONLY inline styles (style={{}}), NO className prop, NO Tailwind classes. Make it beautiful with proper colors, spacing, and interactions.` 
              },
            ],
            stream: true,
            max_tokens: 4096,
            temperature: 0.7,
            top_p: 0.9,
          });

          for await (const chunk of completion) {
            // Type-safe access to chunk properties
            const delta = (chunk as any).choices?.[0]?.delta;
            const content = delta?.content || '';
            
            if (!content) continue;

            fullResponse += content;

            // Start streaming once we see code beginning
            if (!hasStartedCode && (content.includes('import') || content.includes('function') || content.includes('const'))) {
              hasStartedCode = true;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  stage: 'code', 
                  content: '' 
                })}\n\n`)
              );
            }

            // Stream the content
            if (hasStartedCode) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  stage: 'code', 
                  content 
                })}\n\n`)
              );
            }
          }

          // Post-process the complete response
          let cleanedCode = fullResponse
            .replace(/^```+\s*(typescript|tsx|jsx|javascript|ts|js|react)?\s*\n?/gm, '')
            .replace(/\n?```+\s*$/gm, '')
            .replace(/^```+\s*$/gm, '')
            .trim();

          // Remove any leading text before the first import
          const firstImportIndex = cleanedCode.indexOf('import');
          const firstFunctionIndex = cleanedCode.indexOf('function');
          const firstConstIndex = cleanedCode.indexOf('const');
          
          const startIndex = Math.min(
            ...[firstImportIndex, firstFunctionIndex, firstConstIndex].filter(i => i !== -1)
          );
          
          if (startIndex > 0 && startIndex !== Infinity) {
            cleanedCode = cleanedCode.substring(startIndex);
          }

          // Validate that we have actual code
          if (!cleanedCode || cleanedCode.length < 50) {
            throw new Error('Generated code is too short or invalid');
          }

          // Ensure export default exists
          if (!cleanedCode.includes('export default')) {
            // Try to find component name and add export
            const functionMatch = cleanedCode.match(/function\s+([A-Z]\w*)/);
            const constMatch = cleanedCode.match(/const\s+([A-Z]\w*)\s*=/);
            
            if (functionMatch) {
              cleanedCode += `\n\nexport default ${functionMatch[1]};`;
            } else if (constMatch) {
              cleanedCode += `\n\nexport default ${constMatch[1]};`;
            }
          }

          // Send completion signal with the final cleaned code
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              stage: 'complete',
              content: '',
              fullCode: cleanedCode,
            })}\n\n`)
          );

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();

        } catch (error: any) {
          console.error('Stream generation error:', error);
          
          const errorMessage = error.message || 'Failed to generate component';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              stage: 'error', 
              error: errorMessage 
            })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });

  } catch (error: any) {
    console.error('API route error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
