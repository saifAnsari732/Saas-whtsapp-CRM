import { NextResponse } from 'next/server';
import { runBackgroundLoop } from '@/lib/whatsapp/broadcast-runner';

export async function POST(req: Request) {
  try {
    const { broadcastId, payload } = await req.json();

    if (!broadcastId) {
      return NextResponse.json({ error: 'broadcastId is required' }, { status: 400 });
    }

    // Respond immediately so client can navigate
    const res = NextResponse.json({ success: true, status: 'started' });

    // Background process in Node runtime
    void runBackgroundLoop(broadcastId, payload).catch((err) =>
      console.error('[runBackgroundLoop] Fatal error:', err)
    );

    return res;
  } catch (err) {
    console.error('Failed to start broadcast background task', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
