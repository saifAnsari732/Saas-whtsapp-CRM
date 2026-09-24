import { NextResponse } from 'next/server';
import { runPendingFollowUps } from '@/lib/chatbot/followup-runner';

export async function POST() {
  try {
    const result = await runPendingFollowUps();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await runPendingFollowUps();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
