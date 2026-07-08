import { NextResponse } from 'next/server';

// In-memory chat broadcast (resets on cold start, which is fine for Vercel free tier)
const chatHistory: { id: string; username: string; message: string; timestamp: string }[] = [];
const subscribers: Set<(msg: any) => void> = new Set();

export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send recent history
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'history', messages: chatHistory.slice(-50) })}\n\n`));

      const send = (msg: any) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`)); } catch {}
      };
      subscribers.add(send);

      // Heartbeat
      const interval = setInterval(() => {
        try { controller.enqueue(encoder.encode(': heartbeat\n\n')); } catch { clearInterval(interval); }
      }, 15000);

      // Cleanup on close
      const originalCancel = controller.close.bind(controller);
      const cleanup = () => { clearInterval(interval); subscribers.delete(send); };
      // Use a timeout to check if client is still connected
      const checkAlive = setInterval(() => {
        try { controller.enqueue(encoder.encode(': ping\n\n')); } catch { clearInterval(checkAlive); cleanup(); }
      }, 30000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, message } = body;

    if (!username || !message || typeof username !== 'string' || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }

    const msg = {
      id: Math.random().toString(36).substring(2, 15),
      username: username.slice(0, 30),
      message: message.slice(0, 500),
      timestamp: new Date().toISOString(),
    };

    // Store in memory (last 200 messages)
    chatHistory.push(msg);
    if (chatHistory.length > 200) chatHistory.splice(0, chatHistory.length - 200);

    // Broadcast to all connected clients
    for (const sub of subscribers) {
      sub({ type: 'message', ...msg });
    }

    return NextResponse.json(msg);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
