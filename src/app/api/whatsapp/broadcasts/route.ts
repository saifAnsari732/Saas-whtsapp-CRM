import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAccountContext } from '@/lib/firebase/auth-helper';
import { runBackgroundLoop } from '@/lib/whatsapp/broadcast-runner';

export async function GET(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any);
    let accountId = accCtx?.accountId;

    if (!accCtx?.user || !accountId) {
      return NextResponse.json({ broadcasts: [] }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();

    const { data: broadcasts, error } = await supabaseAdmin
      .from('broadcasts')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/whatsapp/broadcasts] Error:', error);
      return NextResponse.json({ broadcasts: [] }, { status: 500 });
    }

    const list = broadcasts ?? [];

    // Auto-resume any stuck/sending broadcasts in background
    for (const bc of list) {
      if (bc.status === 'sending') {
        void runBackgroundLoop(bc.id).catch((e) =>
          console.error(`[GET /api/whatsapp/broadcasts] Auto-resume failed for ${bc.id}:`, e)
        );
      }
    }

    return NextResponse.json({ broadcasts: list });
  } catch (err: any) {
    console.error('[GET /api/whatsapp/broadcasts] Catch:', err);
    return NextResponse.json({ broadcasts: [] }, { status: 500 });
  }
}
