import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAccountContext } from '@/lib/firebase/auth-helper';
import { runBackgroundLoop } from '@/lib/whatsapp/broadcast-runner';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: broadcastId } = await params;
    const accCtx = await getAccountContext(request as any);
    const accountId = accCtx?.accountId;

    if (!accCtx?.user || !accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();

    // 1. Fetch broadcast row
    const { data: broadcast, error: bcError } = await supabaseAdmin
      .from('broadcasts')
      .select('*')
      .eq('id', broadcastId)
      .eq('account_id', accountId)
      .single();

    if (bcError || !broadcast) {
      return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });
    }

    // Auto-resume if status is sending
    if (broadcast.status === 'sending') {
      void runBackgroundLoop(broadcastId).catch((e) =>
        console.error(`[GET /api/whatsapp/broadcasts/${broadcastId}] Auto-resume error:`, e)
      );
    }

    // 2. Fetch recipients joined with contact details
    const { data: recipients, error: recsError } = await supabaseAdmin
      .from('broadcast_recipients')
      .select('*, contact:contacts(*)')
      .eq('broadcast_id', broadcastId)
      .order('created_at', { ascending: false });

    if (recsError) {
      console.error('[GET /api/whatsapp/broadcasts/[id]] Recipient error:', recsError);
    }

    return NextResponse.json({
      broadcast,
      recipients: recipients ?? [],
    });
  } catch (err: any) {
    console.error('[GET /api/whatsapp/broadcasts/[id]] Error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: broadcastId } = await params;
    const accCtx = await getAccountContext(request as any);
    const accountId = accCtx?.accountId;

    if (!accCtx?.user || !accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();

    const { error: delErr } = await supabaseAdmin
      .from('broadcasts')
      .delete()
      .eq('id', broadcastId)
      .eq('account_id', accountId);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
