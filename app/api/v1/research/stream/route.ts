import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    const domain = process.env.MARAS_EXT_BACKEND;
    if (!domain) {
      console.error('MARAS_EXT_BACKEND not configured');
      return new Response(JSON.stringify({ error: 'MARAS_EXT_BACKEND not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error('API_KEY not configured');
      return new Response(JSON.stringify({ error: 'API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Ensure the URL matches: domain + /api/v1/research/stream
    const backendUrl = `${domain.replace(/\/$/, '')}/api/v1/research/stream`;

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey!,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`External API error: HTTP ${response.status} - ${errorText}`);
      return new Response(JSON.stringify({ error: `External API error: ${errorText}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!response.body) {
      console.error('External API did not return a stream body');
      return new Response(JSON.stringify({ error: 'External API did not return a stream' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Proxy the stream directly to the client in real-time
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: any) {
    console.error('Error proxying SSE stream:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
