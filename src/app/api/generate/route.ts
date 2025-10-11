// src/app/api/generate/route.ts
import { NextRequest } from 'next/server';
import Cerebras from '@cerebras/cerebras_cloud_sdk';

const client = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY!,
});

const systemPrompt = `You are an expert React/TypeScript developer. Generate ONLY valid React component code.

CRITICAL RULES:
1. Return ONLY valid React/TypeScript code - no explanations, no markdown fences, no comments outside the code
2. Use functional components with TypeScript interfaces
3. Include proper TypeScript types for all props and state
4. Use Tailwind CSS utility classes for styling (NO custom CSS, NO style objects unless absolutely necessary)
5. Make components interactive and production-ready with proper state management
6. Include all necessary imports (React, useState, useEffect, etc.)
7. ALWAYS export the component as default: "export default function ComponentName() { ... }"
8. Start directly with imports - no preamble text
9. Use semantic HTML and accessible markup
10. Handle edge cases and provide good UX

STYLING REQUIREMENTS:
- Use Tailwind CSS utility classes exclusively
- Create responsive designs with sm:, md:, lg: prefixes
- Add smooth transitions and hover effects
- Use modern color schemes (gradients, shadows, etc.)
- Ensure proper spacing and layout

COMPONENT STRUCTURE:
import React, { useState } from 'react';

interface ComponentNameProps {
  // Define props with TypeScript types
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
    <div className="tailwind classes here">
      {/* Component JSX */}
    </div>
  );
}

Remember: NO markdown, NO explanations, ONLY code!`;

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
          // Send initial status
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              stage: 'thinking', 
              content: 'Generating your component...' 
            })}\n\n`)
          );

          const completion = await client.chat.completions.create({
            model: 'llama3.1-8b',
            messages: [
              { role: 'system', content: systemPrompt },
              { 
                role: 'user', 
                content: `Create a React TypeScript component with the following requirements: ${prompt}\n\nRemember: Output ONLY the code, no markdown fences, no explanations.` 
              },
            ],
            stream: true,
            max_tokens: 4096,
            temperature: 0.7,
            top_p: 0.9,
          });

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
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
          
          if (startIndex > 0) {
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
