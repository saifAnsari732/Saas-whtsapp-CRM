import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import fs from 'fs';

export async function GET(req: Request, { params }: { params: Promise<{ jid: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jid } = await params;
    const decodedJid = decodeURIComponent(jid);
    const cleanPhone = decodedJid.split('@')[0].replace(/\D/g, '');

    // 1. Check in-memory store
    const store = global.waStores?.[user.id];
    let messages: any[] = [];

    if (store?.messages?.[decodedJid] && Array.isArray(store.messages[decodedJid])) {
      messages = [...store.messages[decodedJid]];
    }

    // 2. Check disk file store if memory is empty
    if (messages.length === 0) {
      const storeFile = `baileys_store_${user.id}.json`;
      if (fs.existsSync(storeFile)) {
        try {
          const diskData = JSON.parse(fs.readFileSync(storeFile, 'utf-8'));
          if (diskData?.messages?.[decodedJid] && Array.isArray(diskData.messages[decodedJid])) {
            messages = [...diskData.messages[decodedJid]];
          }
        } catch {}
      }
    }

    // 3. Query Supabase messages table if still empty
    if (messages.length === 0 && cleanPhone.length >= 7) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("account_id")
          .or(`user_id.eq.${user.id},id.eq.${user.id}`)
          .maybeSingle();
        const accountId = profile?.account_id;

        if (accountId) {
          const { data: contact } = await supabase
            .from('contacts')
            .select('id, name')
            .eq('account_id', accountId)
            .or(`phone.eq.${cleanPhone},phone.eq.+${cleanPhone}`)
            .maybeSingle();

          if (contact?.id) {
            const { data: dbMessages } = await supabase
              .from('messages')
              .select('id, content, direction, status, created_at')
              .eq('account_id', accountId)
              .eq('contact_id', contact.id)
              .order('created_at', { ascending: true })
              .limit(50);

            if (dbMessages && dbMessages.length > 0) {
              messages = dbMessages.map((m: any) => ({
                key: {
                  id: m.id,
                  fromMe: m.direction === 'outbound',
                  remoteJid: decodedJid,
                },
                message: {
                  conversation: m.content || '',
                },
                messageTimestamp: Math.floor(new Date(m.created_at).getTime() / 1000),
                status: m.status === 'read' ? 'READ' : m.status === 'delivered' ? 'DELIVERY_ACK' : 'SERVER_ACK',
              }));
            }
          }
        }
      } catch (dbErr) {
        console.warn('Could not query Supabase messages for jid:', dbErr);
      }
    }

    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    console.error('Failed to get chat messages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
