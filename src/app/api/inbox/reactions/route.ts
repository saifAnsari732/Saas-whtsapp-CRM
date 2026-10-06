import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ reactions: [] });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('message_reactions')
      .select('*')
      .eq('conversation_id', conversationId);

    if (error) {
      // Table might not exist or empty in some environments
      return NextResponse.json({ reactions: [] });
    }

    return NextResponse.json({ reactions: data || [] });
  } catch {
    return NextResponse.json({ reactions: [] });
  }
}
