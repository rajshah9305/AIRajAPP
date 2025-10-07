// src/app/api/generate/route.ts
import { NextRequest } from ‘next/server’;
import Cerebras from ‘@cerebras/cerebras_cloud_sdk’;

// Initialize Cerebras client
const client = new Cerebras({
apiKey: process.env.CEREBRAS_API_KEY,
});

export async function POST(req: NextRequest) {
try {
const { prompt } = await req.json();

```
if (!prompt) {
  return new Response(
    JSON.stringify({ error: 'Prompt is required' }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}

// Enhanced system prompt optimized for GPT-OSS-120B
const systemPrompt = `You are an expert React developer. Generate ONLY the React component code based on the user's description.
```

CRITICAL RULES:

1. Return ONLY valid React/TypeScript code - no explanations, no markdown, no comments outside the code
1. Use functional components with TypeScript
1. Include proper TypeScript types and interfaces
1. Use Tailwind CSS for styling (utility classes only)
1. Make components interactive and production-ready
1. Include proper imports (React, useState, useEffect, etc.)
1. Export the component as default
1. Start directly with imports - no preamble

Example format:
import React, { useState } from ‘react’;

interface ComponentProps {
// props here
}

export default function ComponentName({ }: ComponentProps) {
// component code
return (
<div className="...">
{/* JSX here */}
</div>
);
}`;

```
const encoder = new TextEncoder();
const stream = new ReadableStream({
  async start(controller) {
    try {
      // Create streaming completion with gpt-oss-120b model
      const completion = await client.chat.completions.create({
        model: 'gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Create a React component: ${prompt}`,
          },
        ],
        stream: true,
        max_tokens: 4000,
        temperature: 0.7,
        top_p: 0.9,
      });

      let fullResponse = '';
      let codeStarted = false;

      // Process the stream
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        
        if (content) {
          fullResponse += content;

          // Detect when actual code starts (skip any markdown fences or explanations)
          if (!codeStarted && (content.includes('import') || content.includes('export'))) {
            codeStarted = true;
          }

          // Send the chunk to client
          if (codeStarted) {
            const data = JSON.stringify({ 
              content,
              done: false 
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }
      }

      // Clean up the response and extract only the code
      let cleanedCode = fullResponse;

      // Remove markdown code fences if present
      cleanedCode = cleanedCode
        .replace(/```typescript\n?/g, '')
        .replace(/```tsx\n?/g, '')
        .replace(/```jsx\n?/g, '')
        .replace(/```javascript\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Remove any explanatory text before the first import
      const importMatch = cleanedCode.match(/^[\s\S]*?(import\s)/);
      if (importMatch) {
        const firstImportIndex = cleanedCode.indexOf('import');
        cleanedCode = cleanedCode.substring(firstImportIndex);
      }

      // Validate that we have actual code
      if (!cleanedCode.includes('import') && !cleanedCode.includes('export')) {
        throw new Error('No valid React component code was generated');
      }

      // Send final message with complete code
      const finalData = JSON.stringify({
        content: '',
        done: true,
        fullCode: cleanedCode,
      });
      controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));

      controller.close();
    } catch (error) {
      console.error('Stream error:', error);
      const errorData = JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to generate component',
      });
      controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
      controller.close();
    }
  },
});

return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  },
});
```

} catch (error) {
console.error(‘API route error:’, error);
return new Response(
JSON.stringify({
error: error instanceof Error ? error.message : ‘Internal server error’,
}),
{
status: 500,
headers: { ‘Content-Type’: ‘application/json’ },
}
);
}
}

export const runtime = ‘nodejs’;
export const dynamic = ‘force-dynamic’;
