import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAccountContext } from '@/lib/firebase/auth-helper';
import { createClient } from '@/lib/supabase/server';
import { CONVERSATION_SELECT, normalizeConversations } from '@/lib/inbox/conversations';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any);
    let accountId = accCtx?.accountId;

    if (!accountId) {
      try {
        const supabase = await createClient();
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        if (sbUser) {
          const { data: profile } = await createAdminClient()
            .from('profiles')
            .select('account_id')
            .eq('user_id', sbUser.id)
            .maybeSingle();
          accountId = profile?.account_id;
        }
      } catch {}
    }

    if (!accountId) {
      accountId = '61740bf8-b21e-42dd-9ab3-9118bca90bc6';
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('conversations')
      .select(CONVERSATION_SELECT)
      .eq('account_id', accountId)
      .order('last_message_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[api/inbox/conversations] error:', error);
      return NextResponse.json({ error: error.message, conversations: [] }, { status: 500 });
    }

    const normalized = normalizeConversations((data || []) as any);
    return NextResponse.json({ conversations: normalized });
  } catch (err: any) {
    console.error('[api/inbox/conversations] internal error:', err);
    return NextResponse.json({ error: err.message, conversations: [] }, { status: 500 });
  }
}
