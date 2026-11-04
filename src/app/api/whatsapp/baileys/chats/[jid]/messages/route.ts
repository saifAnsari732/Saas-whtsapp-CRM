import { getCoexistenceUser } from '@/lib/whatsapp/coexistence-auth';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { jidNormalizedUser } from '@whiskeysockets/baileys';
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
    const normalizedTargetJid = jidNormalizedUser(decodedJid);
    const isGroup = normalizedTargetJid.endsWith('@g.us');
    const cleanPhone = normalizedTargetJid.split('@')[0].replace(/\D/g, '');
    const shortPhone = cleanPhone.startsWith('91') && cleanPhone.length === 12 ? cleanPhone.slice(2) : cleanPhone;
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    // List of candidate JIDs to check so replies with/without country code always merge
    const candidateJids = isGroup
      ? [decodedJid, normalizedTargetJid]
      : Array.from(new Set([
          decodedJid,
          normalizedTargetJid,
          `${fullPhone}@s.whatsapp.net`,
          `${shortPhone}@s.whatsapp.net`,
          `${cleanPhone}@s.whatsapp.net`,
        ]));

    const msgMap = new Map<string, any>();

    // 1. Gather all messages across candidate JIDs in ALL available memory stores
    if (global.waStores) {
      for (const s of Object.values(global.waStores)) {
        if (s?.messages) {
          for (const [storeJid, list] of Object.entries(s.messages)) {
            if (!Array.isArray(list)) continue;
            const normStoreJid = jidNormalizedUser(storeJid);
            const isMatch = candidateJids.includes(storeJid) ||
                            candidateJids.includes(normStoreJid) ||
                            (!isGroup && (normStoreJid === `${fullPhone}@s.whatsapp.net` || normStoreJid === `${shortPhone}@s.whatsapp.net`));
            if (isMatch) {
              for (const m of list) {
                const id = m?.key?.id || `${m.messageTimestamp}-${Math.random()}`;
                msgMap.set(id, m);
              }
            }
          }
        }
      }
    }

    // 2. Check disk file stores across all possible session keys
    const candidateFiles = [
      `baileys_store_${user.id}.json`,
      `baileys_store_833e936e-29ff-4fb3-82e0-1c35cb6216f6.json`,
      `baileys_store_${effectiveAccountId}.json`,
      'baileys_store_61740bf8-b21e-42dd-9ab3-9118bca90bc6.json',
    ];
    try {
      const files = fs.readdirSync(process.cwd()).filter(f => f.startsWith('baileys_store_') && f.endsWith('.json'));
      candidateFiles.push(...files);
    } catch {}

    for (const storeFile of Array.from(new Set(candidateFiles))) {
      if (fs.existsSync(storeFile)) {
        try {
          const diskData = JSON.parse(fs.readFileSync(storeFile, 'utf-8'));
          if (diskData?.messages) {
            for (const [storeJid, list] of Object.entries(diskData.messages)) {
              if (!Array.isArray(list)) continue;
              const normStoreJid = jidNormalizedUser(storeJid);
              const isMatch = candidateJids.includes(storeJid) ||
                              candidateJids.includes(normStoreJid) ||
                              (!isGroup && (normStoreJid === `${fullPhone}@s.whatsapp.net` || normStoreJid === `${shortPhone}@s.whatsapp.net`));
              if (isMatch) {
                for (const m of list) {
                  const id = m?.key?.id || `${m.messageTimestamp}-${Math.random()}`;
                  if (!msgMap.has(id)) msgMap.set(id, m);
                }
              }
            }
          }
        } catch {}
      }
    }

    // 3. Fallback to Firebase Firestore conversation messages (merge any missing messages)
    if (cleanPhone.length >= 7 && process.env.FIREBASE_ADMIN_PROJECT_ID) {
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
                if (!msgMap.has(doc.id)) {
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
                }
              });
            }
          }
        }
      } catch (fErr) {
        console.warn('[Baileys Chat Messages] Firestore lookup warning:', fErr);
      }
    }

    // 4. Fallback to Supabase messages (merge missing)
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
              if (!msgMap.has(m.id)) {
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
