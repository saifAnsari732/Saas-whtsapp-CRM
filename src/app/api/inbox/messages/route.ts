import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId required', messages: [] }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('[api/inbox/messages] query error:', error);
      return NextResponse.json({ error: error.message, messages: [] }, { status: 500 });
    }

    return NextResponse.json({ messages: data || [], data: data || [] });
  } catch (err: any) {
    console.error('[api/inbox/messages] internal error:', err);
    return NextResponse.json({ error: err.message, messages: [] }, { status: 500 });
  }
}
