import { getCoexistenceUser } from '@/lib/whatsapp/coexistence-auth';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ jid: string }> }) {
  try {
    const { userId, accountId } = await getCoexistenceUser(req);
    const user = { id: userId };
    const effectiveAccountId = accountId || '61740bf8-b21e-42dd-9ab3-9118bca90bc6';
    const supabase = await createClient();

    const { jid } = await params;
    const decodedJid = decodeURIComponent(jid);
    const isGroup = decodedJid.endsWith('@g.us');
    const cleanPhone = decodedJid.split('@')[0].replace(/\D/g, '');
    const shortPhone = cleanPhone.startsWith('91') && cleanPhone.length === 12 ? cleanPhone.slice(2) : cleanPhone;
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    // List of candidate JIDs to check so replies with/without country code always merge
    const candidateJids = isGroup
      ? [decodedJid]
      : Array.from(new Set([
          decodedJid,
          `${fullPhone}@s.whatsapp.net`,
          `${shortPhone}@s.whatsapp.net`,
          `${cleanPhone}@s.whatsapp.net`,
        ]));

    const msgMap = new Map<string, any>();

    // 1. Gather all messages across candidate JIDs in memory store
    const store = global.waStores?.[user.id];
    if (store?.messages) {
      for (const candidate of candidateJids) {
        const list = store.messages[candidate];
        if (Array.isArray(list)) {
          for (const m of list) {
            const id = m?.key?.id || `${m.messageTimestamp}-${Math.random()}`;
            msgMap.set(id, m);
          }
        }
      }
    }

    // 2. Check disk file store if memory is empty
    if (msgMap.size === 0) {
      const storeFile = `baileys_store_${user.id}.json`;
      if (fs.existsSync(storeFile)) {
        try {
          const diskData = JSON.parse(fs.readFileSync(storeFile, 'utf-8'));
          if (diskData?.messages) {
            for (const candidate of candidateJids) {
              const list = diskData.messages[candidate];
              if (Array.isArray(list)) {
                for (const m of list) {
                  const id = m?.key?.id || `${m.messageTimestamp}-${Math.random()}`;
                  msgMap.set(id, m);
                }
              }
            }
          }
        } catch {}
      }
    }

    // 3. Fallback to Firebase Firestore conversation messages if store has no messages
    if (msgMap.size === 0 && cleanPhone.length >= 7 && process.env.FIREBASE_ADMIN_PROJECT_ID) {
      try {
        const { getAdminDb } = await import('@/lib/firebase/admin');
        const fDb = getAdminDb();
        if (fDb) {
          const possibleConvIds = [
            `conv_c_${cleanPhone}`,
            `conv_c_${fullPhone}`,
            `conv_c_${shortPhone}`,
            `c_${cleanPhone}`,
            `c_${fullPhone}`,
            `conv_${cleanPhone}`,
            cleanPhone,
            fullPhone
          ];

          let convDoc: any = null;
          for (const cid of possibleConvIds) {
            const doc = await fDb
              .collection('accounts')
              .doc(effectiveAccountId)
              .collection('conversations')
              .doc(cid)
              .get()
              .catch(() => null);
            if (doc && doc.exists) {
              convDoc = doc;
              break;
            }
          }

          if (convDoc && convDoc.exists) {
            const msgsSnap = await convDoc.ref
              .collection('messages')
              .orderBy('created_at', 'asc')
              .limit(80)
              .get()
              .catch(() => null);

            if (msgsSnap && !msgsSnap.empty) {
              msgsSnap.docs.forEach((doc: any) => {
                const m = doc.data();
                msgMap.set(doc.id, {
                  key: {
                    id: doc.id,
                    fromMe: m.sender_type === 'agent' || m.direction === 'outbound',
                    remoteJid: decodedJid,
                  },
                  message: {
                    conversation: m.content_text || m.content || '',
                  },
                  messageTimestamp: m.created_at
                    ? Math.floor(new Date(m.created_at).getTime() / 1000)
                    : Math.floor(Date.now() / 1000),
                  status: m.status === 'read' ? 'READ' : m.status === 'delivered' ? 'DELIVERY_ACK' : 'SERVER_ACK',
                });
              });
            }
          }
        }
      } catch (fErr) {
        console.warn('[Baileys Chat Messages] Firestore lookup warning:', fErr);
      }
    }

    // 4. Fallback to Supabase messages
    if (msgMap.size === 0 && cleanPhone.length >= 7) {
      try {
        const { data: conv } = await supabase
          .from('conversations')
          .select('id')
          .eq('account_id', effectiveAccountId)
          .or(`contact_phone.eq.${cleanPhone},contact_phone.eq.${fullPhone}`)
          .maybeSingle();

        if (conv?.id) {
          const { data: dbMessages } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: true })
            .limit(80);

          if (dbMessages && dbMessages.length > 0) {
            for (const m of dbMessages) {
              msgMap.set(m.id, {
                key: {
                  id: m.id,
                  fromMe: m.sender_type === 'agent',
                  remoteJid: decodedJid,
                },
                message: {
                  conversation: m.content_text || '',
                },
                messageTimestamp: m.created_at
                  ? Math.floor(new Date(m.created_at).getTime() / 1000)
                  : Math.floor(Date.now() / 1000),
                status: m.status === 'read' ? 'READ' : m.status === 'delivered' ? 'DELIVERY_ACK' : 'SERVER_ACK',
              });
            }
          }
        }
      } catch {}
    }

    const messages = Array.from(msgMap.values()).sort((a, b) => {
      const tsA = typeof a.messageTimestamp === 'number' ? a.messageTimestamp : (a.messageTimestamp?.low || 0);
      const tsB = typeof b.messageTimestamp === 'number' ? b.messageTimestamp : (b.messageTimestamp?.low || 0);
      return tsA - tsB;
    });

    return NextResponse.json({
      success: true,
      jid: decodedJid,
      count: messages.length,
      messages,
    });
  } catch (err: any) {
    console.error('Error in Baileys chat messages GET:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
