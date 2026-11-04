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
    const cleanPhone = decodedJid.split('@')[0].replace(/\D/g, '');
    const shortPhone = cleanPhone.startsWith('91') && cleanPhone.length === 12 ? cleanPhone.slice(2) : cleanPhone;
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const altJid = decodedJid.endsWith('@s.whatsapp.net') 
      ? (cleanPhone.length === 10 ? `${fullPhone}@s.whatsapp.net` : `${shortPhone}@s.whatsapp.net`)
      : decodedJid;

    // 1. Check in-memory Baileys store (both primary JID and alternative JID format)
    const store = global.waStores?.[user.id];
    let messages: any[] = [];

    if (store?.messages?.[decodedJid] && Array.isArray(store.messages[decodedJid])) {
      messages = [...store.messages[decodedJid]];
    } else if (store?.messages?.[altJid] && Array.isArray(store.messages[altJid])) {
      messages = [...store.messages[altJid]];
    }

    // 2. Check disk file store if memory is empty
    if (messages.length === 0) {
      const storeFile = `baileys_store_${user.id}.json`;
      if (fs.existsSync(storeFile)) {
        try {
          const diskData = JSON.parse(fs.readFileSync(storeFile, 'utf-8'));
          if (diskData?.messages?.[decodedJid] && Array.isArray(diskData.messages[decodedJid])) {
            messages = [...diskData.messages[decodedJid]];
          } else if (diskData?.messages?.[altJid] && Array.isArray(diskData.messages[altJid])) {
            messages = [...diskData.messages[altJid]];
          }
        } catch {}
      }
    }

    // 3. Fallback to Firebase Firestore conversation messages
    if (messages.length === 0 && cleanPhone.length >= 7 && process.env.FIREBASE_ADMIN_PROJECT_ID) {
      try {
        const { getAdminDb } = await import('@/lib/firebase/admin');
        const fDb = getAdminDb();
        if (fDb) {
          // Look up conversation by standard id formats across full & short phone
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
              .limit(60)
              .get()
              .catch(() => null);

            if (msgsSnap && !msgsSnap.empty) {
              messages = msgsSnap.docs.map((doc: any) => {
                const m = doc.data();
                return {
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
                };
              });
            }
          }
        }
      } catch (fErr) {
        console.warn('[Baileys Chat Messages] Firestore lookup warning:', fErr);
      }
    }

    // 4. Fallback: Query Supabase messages table if still empty
    if (messages.length === 0 && cleanPhone.length >= 7) {
      try {
        const { data: contact } = await supabase
          .from('contacts')
          .select('id, name')
          .eq('account_id', effectiveAccountId)
          .or(`phone.eq.${cleanPhone},phone.eq.+${cleanPhone}`)
          .maybeSingle();

        if (contact?.id) {
          const { data: dbMessages } = await supabase
            .from('messages')
            .select('id, content, direction, status, created_at')
            .eq('account_id', effectiveAccountId)
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
