import { NextResponse } from 'next/server';
import { getAdminDb, cleanForFirestore } from '@/lib/firebase/admin';
import { getAccountContext } from '@/lib/firebase/auth-helper';
import { CONVERSATION_SELECT, normalizeConversation } from '@/lib/inbox/conversations';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const accCtx = await getAccountContext(request as any);
    const accountId = accCtx?.accountId || '61740bf8-b21e-42dd-9ab3-9118bca90bc6';

    const fDb = getAdminDb();
    if (fDb) {
      try {
        const convRef = fDb.collection('accounts').doc(accountId).collection('conversations').doc(id);
        const convDoc = await convRef.get();
        if (convDoc.exists) {
          const data = convDoc.data() || {};
          let contact: any = null;
          const contactId = data.contact_id || data.contactId;
          if (contactId) {
            const cDoc = await fDb.collection('accounts').doc(accountId).collection('contacts').doc(contactId).get();
            if (cDoc.exists) {
              contact = { id: cDoc.id, ...cDoc.data() };
            } else {
              const cleanDigits = String(contactId).replace(/\D/g, '');
              contact = { id: contactId, phone: cleanDigits, name: cleanDigits, tags: [] };
            }
          }

          return NextResponse.json({
            conversation: {
              id: convDoc.id,
              account_id: accountId,
              contact_id: contactId,
              status: data.status || 'open',
              unread_count: data.unread_count || 0,
              last_message_text: data.last_message_text || null,
              last_message_at: data.last_message_at || data.updatedAt || convDoc.createTime?.toDate()?.toISOString(),
              contact: contact ? { ...contact, tags: Array.isArray(contact.tags) ? contact.tags : [] } : null,
            },
          });
        }
      } catch (fsErr) {
        console.warn('[api/inbox/conversations/[id]] Firestore get warning:', fsErr);
      }
    }

    // Optional Supabase fallback
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const admin = createAdminClient();
      const { data } = await admin
        .from('conversations')
        .select(CONVERSATION_SELECT)
        .eq('id', id)
        .maybeSingle();

      if (data) {
        return NextResponse.json({ conversation: normalizeConversation(data as any) });
      }
    } catch {}

    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const accCtx = await getAccountContext(request as any);
    const accountId = accCtx?.accountId || '61740bf8-b21e-42dd-9ab3-9118bca90bc6';

    const allowedUpdates: Record<string, any> = {};
    if (body.status !== undefined) allowedUpdates.status = body.status;
    if (body.unread_count !== undefined) allowedUpdates.unread_count = body.unread_count;
    if (body.assigned_agent_id !== undefined) allowedUpdates.assigned_agent_id = body.assigned_agent_id;
    allowedUpdates.updatedAt = new Date().toISOString();

    const fDb = getAdminDb();
    if (fDb) {
      try {
        const convRef = fDb.collection('accounts').doc(accountId).collection('conversations').doc(id);
        await convRef.set(cleanForFirestore(allowedUpdates), { merge: true });
        const updated = await convRef.get();
        return NextResponse.json({ conversation: { id: updated.id, ...updated.data() } });
      } catch (fsErr) {
        console.warn('[api/inbox/conversations/[id]] Firestore patch warning:', fsErr);
      }
    }

    // Optional Supabase fallback
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const admin = createAdminClient();
      const { data } = await admin
        .from('conversations')
        .update(allowedUpdates)
        .eq('id', id)
        .select(CONVERSATION_SELECT)
        .maybeSingle();

      if (data) {
        return NextResponse.json({ conversation: normalizeConversation(data as any) });
      }
    } catch {}

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

