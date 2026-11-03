import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { getAccountContext } from '@/lib/firebase/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId required', messages: [] }, { status: 400 });
    }

    const accCtx = await getAccountContext(request as any);
    const accountId = accCtx?.accountId || '61740bf8-b21e-42dd-9ab3-9118bca90bc6';

    const fDb = getAdminDb();
    if (fDb) {
      try {
        const msgsRef = fDb
          .collection('accounts')
          .doc(accountId)
          .collection('conversations')
          .doc(conversationId)
          .collection('messages');

        const snap = await msgsRef.get();
        if (!snap.empty) {
          const msgs: any[] = [];
          const seenIds = new Set<string>();
          const seenKeyWindow = new Set<string>();
          const dupDocIds: string[] = [];

          snap.forEach((doc) => {
            const data = doc.data();
            const rawId = data.message_id || data.id;
            const timeMin = data.created_at ? Math.floor(new Date(data.created_at).getTime() / 60000) : 0;
            const contentKey = `${data.sender_type || ''}_${data.content_text || ''}_${timeMin}`;

            let isDup = false;
            if (rawId && seenIds.has(rawId)) {
              isDup = true;
            } else if (data.content_text && seenKeyWindow.has(contentKey)) {
              isDup = true;
            }

            if (isDup) {
              dupDocIds.push(doc.id);
            } else {
              if (rawId) seenIds.add(rawId);
              if (data.content_text) seenKeyWindow.add(contentKey);
              msgs.push({ id: doc.id, ...data });
            }
          });

          // Background self-healing cleanup of duplicate documents from Firestore
          if (dupDocIds.length > 0) {
            Promise.allSettled(dupDocIds.map((dId) => msgsRef.doc(dId).delete())).catch(() => {});
          }

          // Sort ascending by created_at
          msgs.sort((a, b) => {
            const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return tA - tB;
          });

          return NextResponse.json({ messages: msgs, data: msgs });
        }
      } catch (fsErr) {
        console.warn('[api/inbox/messages] Firestore messages query warning:', fsErr);
      }
    }

    // Optional Supabase fallback
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const admin = createAdminClient();
      const { data } = await admin
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (data) {
        return NextResponse.json({ messages: data, data });
      }
    } catch {}

    return NextResponse.json({ messages: [], data: [] });
  } catch (err: any) {
    console.error('[api/inbox/messages] error:', err);
    return NextResponse.json({ messages: [], data: [] });
  }
}

