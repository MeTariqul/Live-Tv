import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return new Response('Missing url param', { status: 400 });

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': new URL(url).origin,
      },
    });

    if (!upstream.ok) return new Response(`Upstream error: ${upstream.status}`, { status: upstream.status });

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const body = upstream.body;
    if (!body) return new Response('No body', { status: 500 });

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=10',
      },
    });
  } catch (e: any) {
    return new Response(`Proxy error: ${e.message}`, { status: 500 });
  }
}
