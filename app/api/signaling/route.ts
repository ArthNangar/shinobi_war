import { NextRequest, NextResponse } from 'next/server';

// Global in-memory signaling store for local Next.js server instance
// Stores SDP offers, answers, and ICE candidates across normal/incognito windows and devices
const signalingStore = new Map<string, any>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json({ error: 'Path required' }, { status: 400 });
  }

  const normalizedPath = path.replace(/^\//, '');
  const data = signalingStore.get(normalizedPath) ?? null;

  return NextResponse.json({ path: normalizedPath, data });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, path, data } = body;

    if (!path) {
      return NextResponse.json({ error: 'Path required' }, { status: 400 });
    }

    const normalizedPath = path.replace(/^\//, '');

    if (action === 'set') {
      signalingStore.set(normalizedPath, data);
      return NextResponse.json({ success: true, path: normalizedPath });
    }

    if (action === 'push') {
      const pushKey = `node_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const existing = signalingStore.get(normalizedPath) || {};
      existing[pushKey] = data;
      signalingStore.set(normalizedPath, existing);
      return NextResponse.json({ success: true, key: pushKey, path: normalizedPath });
    }

    if (action === 'clear') {
      const prefix = normalizedPath.replace(/\/$/, '');
      const keys = Array.from(signalingStore.keys());
      for (const key of keys) {
        if (key === prefix || key.startsWith(`${prefix}/`)) {
          signalingStore.delete(key);
        }
      }
      return NextResponse.json({ success: true, cleared: prefix });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
