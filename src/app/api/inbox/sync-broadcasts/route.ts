import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAccountContext } from '@/lib/firebase/auth-helper';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any);
    const accountId = accCtx?.accountId || '61740bf8-b21e-42dd-9ab3-9118bca90bc6';

    const admin = createAdminClient();

    // 1. Fetch recent sent broadcast recipients
    const { data: recipients, error } = await admin
      .from('broadcast_recipients')
      .select('*, contact:contacts(*), broadcast:broadcasts(*)')
      .in('status', ['sent', 'delivered', 'read', 'replied'])
      .not('contact_id', 'is', null)
      .order('sent_at', { ascending: false })
      .limit(200);

    if (error || !recipients) {
      return NextResponse.json({ error: error?.message || 'No recipients found' }, { status: 400 });
    }

    let syncedCount = 0;

    for (const r of recipients) {
      if (!r.contact_id) continue;

      // Check if conversation exists
      let { data: conv } = await admin
        .from('conversations')
        .select('id')
        .eq('account_id', accountId)
        .eq('contact_id', r.contact_id)
        .maybeSingle();

      const templateName = r.broadcast?.template_name || 'Campaign Message';
      const sentTime = r.sent_at || r.created_at || new Date().toISOString();

      if (!conv) {
        const { data: newConv } = await admin
          .from('conversations')
          .insert({
            account_id: accountId,
            user_id: r.broadcast?.user_id || '833e936e-29ff-4fb3-82e0-1c35cb6216f6',
            contact_id: r.contact_id,
            last_message_text: templateName,
            last_message_at: sentTime,
            status: 'open',
            unread_count: r.status === 'replied' ? 1 : 0,
          })
          .select('id')
          .single();

        conv = newConv;
        syncedCount++;
      }

      if (conv && r.whatsapp_message_id) {
        const { data: existingMsg } = await admin
          .from('messages')
          .select('id')
          .eq('message_id', r.whatsapp_message_id)
          .maybeSingle();

        if (!existingMsg) {
          await admin
            .from('messages')
            .insert({
              conversation_id: conv.id,
              sender_type: 'agent',
              content_type: 'template',
              content_text: `Template: ${templateName}`,
              template_name: templateName,
              message_id: r.whatsapp_message_id,
              status: r.status || 'sent',
              created_at: sentTime,
            });
        }
      }
    }

    return NextResponse.json({ success: true, synced: syncedCount });
  } catch (err: any) {
    console.error('[sync-broadcasts] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
