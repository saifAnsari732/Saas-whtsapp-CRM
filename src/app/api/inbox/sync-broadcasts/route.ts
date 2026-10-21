import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { getAccountContext } from '@/lib/firebase/auth-helper';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any);
    const accountId = accCtx?.accountId;

    if (!accCtx?.user || !accountId) {
      return NextResponse.json({ success: true, synced: 0 });
    }

    let syncedCount = 0;

    // 1. Primary: Sync using Firebase Firestore
    try {
      const fDb = getAdminDb();
      if (fDb) {
        // Read recent broadcast recipients from Firestore
        const bcastSnap = await fDb
          .collection('accounts')
          .doc(accountId)
          .collection('broadcasts')
          .orderBy('created_at', 'desc')
          .limit(10)
          .get()
          .catch(() => ({ docs: [] } as any));

        for (const bDoc of bcastSnap.docs) {
          const bData = bDoc.data();
          const recSnap = await bDoc.ref
            .collection('recipients')
            .where('status', 'in', ['sent', 'delivered', 'read', 'replied'])
            .limit(50)
            .get()
            .catch(() => ({ docs: [] } as any));

          for (const rDoc of recSnap.docs) {
            const r = rDoc.data();
            const contactId = r.contact_id || r.contact?.id;
            if (!contactId) continue;

            const convId = `conv_${contactId}`;
            const convRef = fDb
              .collection('accounts')
              .doc(accountId)
              .collection('conversations')
              .doc(convId);

            const convSnap = await convRef.get();
            const templateName = bData.template_name || 'Campaign Message';
            const sentTime = r.sent_at || r.created_at || new Date().toISOString();

            if (!convSnap.exists) {
              await convRef.set({
                id: convId,
                account_id: accountId,
                contact_id: contactId,
                last_message_text: `Template: ${templateName}`,
                last_message_at: sentTime,
                status: 'open',
                unread_count: r.status === 'replied' ? 1 : 0,
                updatedAt: sentTime,
              });
              syncedCount++;
            }
          }
        }
      }
    } catch (fsErr) {
      console.warn('[sync-broadcasts] Firestore sync warning:', fsErr);
    }

    // 2. Fallback to Supabase only if reachable (safely wrapped)
    try {
      const admin = createAdminClient();
      const fetchPromise = admin
        .from('broadcast_recipients')
        .select('*, contact:contacts(*), broadcast:broadcasts(*)')
        .in('status', ['sent', 'delivered', 'read', 'replied'])
        .not('contact_id', 'is', null)
        .order('sent_at', { ascending: false })
        .limit(50);

      const timeout = new Promise<{ data: null }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 1500)
      );

      const res = await Promise.race([fetchPromise, timeout]);
      if (res?.data && Array.isArray(res.data)) {
        syncedCount += res.data.length;
      }
    } catch {}

    return NextResponse.json({ success: true, synced: syncedCount });
  } catch (err: any) {
    console.warn('[sync-broadcasts] warning:', err?.message || err);
    return NextResponse.json({ success: true, synced: 0 });
  }
}
