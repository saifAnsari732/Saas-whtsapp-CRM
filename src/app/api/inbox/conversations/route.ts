import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { getAccountContext } from '@/lib/firebase/auth-helper';
import { CONVERSATION_SELECT, normalizeConversations } from '@/lib/inbox/conversations';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any);
    let accountId = accCtx?.accountId || '61740bf8-b21e-42dd-9ab3-9118bca90bc6';

    const fDb = getAdminDb();
    if (fDb) {
      try {
        const convsRef = fDb.collection('accounts').doc(accountId).collection('conversations');
        const snap = await convsRef.get();

        if (!snap.empty) {
          // Pre-fetch contacts for this account in memory map
          const contactsRef = fDb.collection('accounts').doc(accountId).collection('contacts');
          const contactsSnap = await contactsRef.get();
          const contactsMap = new Map<string, any>();
          contactsSnap.forEach((doc) => {
            contactsMap.set(doc.id, { id: doc.id, ...doc.data() });
          });

          const rawList: any[] = [];
          for (const doc of snap.docs) {
            const data = doc.data();
            const contactId = data.contact_id || data.contactId;
            let contact = contactsMap.get(contactId);

            if (!contact && contactId) {
              const cleanDigits = String(contactId).replace(/\D/g, '');
              contact = contactsMap.get(`c_${cleanDigits}`) || {
                id: contactId,
                phone: cleanDigits || 'Unknown',
                name: data.contact_name || cleanDigits || 'Customer',
                tags: [],
              };
            }

            rawList.push({
              id: doc.id,
              account_id: accountId,
              contact_id: contactId,
              status: data.status || 'open',
              unread_count: data.unread_count || 0,
              last_message_text: data.last_message_text || null,
              last_message_at: data.last_message_at || data.updatedAt || doc.createTime?.toDate()?.toISOString(),
              last_sender_type: data.last_sender_type || (data.last_message_text ? 'agent' : undefined),
              has_customer_reply: Boolean(data.has_customer_reply || data.last_sender_type === 'customer'),
              contact: contact
                ? {
                    ...contact,
                    tags: Array.isArray(contact.tags) ? contact.tags : [],
                  }
                : null,
            });
          }

          // Sort by last_message_at descending
          rawList.sort((a, b) => {
            const tA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
            const tB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
            return tB - tA;
          });

          return NextResponse.json({ conversations: rawList });
        }
      } catch (fsErr) {
        console.warn('[api/inbox/conversations] Firestore query warning:', fsErr);
      }
    }

    // Optional fallback to Supabase if reachable
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const admin = createAdminClient();
      const { data, error } = await admin
        .from('conversations')
        .select(CONVERSATION_SELECT)
        .eq('account_id', accountId)
        .order('last_message_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        const normalized = normalizeConversations((data || []) as any);
        return NextResponse.json({ conversations: normalized });
      }
    } catch {}

    return NextResponse.json({ conversations: [] });
  } catch (err: any) {
    console.error('[api/inbox/conversations] error:', err);
    return NextResponse.json({ conversations: [] });
  }
}
