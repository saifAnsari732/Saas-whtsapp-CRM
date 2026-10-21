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
          snap.forEach((doc) => {
            msgs.push({ id: doc.id, ...doc.data() });
          });

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

