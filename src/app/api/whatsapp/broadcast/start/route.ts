import { NextResponse } from 'next/server';
import { getAdminDb, cleanForFirestore } from '@/lib/firebase/admin';
import { getAccountContext } from '@/lib/firebase/auth-helper';
import { sanitizePhoneForMeta } from '@/lib/whatsapp/phone-utils';
import { runBackgroundLoop } from '@/lib/whatsapp/broadcast-runner';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function toValidUUID(str: string): string {
  if (!str) return '00000000-0000-4000-a000-000000000000';
  const stripped = str.replace(/^acct-/, '');
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(stripped)) return stripped;
  if (uuidRegex.test(str)) return str;
  const hex = Array.from(new TextEncoder().encode(str))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .padEnd(32, '0')
    .slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export async function POST(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any);
    if (!accCtx?.user || !accCtx?.accountId) {
      return NextResponse.json({ error: 'Unauthorized: Please sign in first' }, { status: 401 });
    }

    const rawAccountId = accCtx.accountId;
    const rawUserId = accCtx.user.uid;
    const accountId = toValidUUID(rawAccountId);
    const userId = toValidUUID(rawUserId);
    const payload = await request.json();

    const {
      name,
      template,
      audience,
      variables,
      headerMediaUrl,
      scheduledAt,
      delaySeconds,
      autoReplyEnabled,
      autoReplyText,
    } = payload;

    if (!name || !template) {
      return NextResponse.json({ error: 'Campaign name and template are required' }, { status: 400 });
    }

    const fDb = getAdminDb();
    let contacts: any[] = [];

    // ── Step 1: Resolve Audience Contacts from Firebase Firestore ───
    if (fDb) {
      try {
        const contactsRef = fDb.collection('accounts').doc(rawAccountId).collection('contacts');

        if (audience.type === 'all') {
          const snap = await contactsRef.get();
          contacts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        } else if (audience.type === 'tags' && audience.tagIds?.length > 0) {
          const snap = await contactsRef.get();
          const allDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          contacts = allDocs.filter((c: any) => {
            const contactTags = c.tags || [];
            return contactTags.some((t: any) =>
              audience.tagIds.includes(typeof t === 'string' ? t : t?.id)
            );
          });
        } else if (audience.type === 'csv' && audience.csvContacts?.length > 0) {
          const uniqueByPhone = new Map<string, { phone: string; name?: string }>();
          for (const row of audience.csvContacts) {
            const clean = sanitizePhoneForMeta(row.phone);
            if (clean) uniqueByPhone.set(clean, { ...row, phone: clean });
          }

          const batch = fDb.batch();
          const newContacts: any[] = [];

          for (const [phone, row] of uniqueByPhone.entries()) {
            const contactId = `c_${phone.replace(/[^0-9]/g, '')}`;
            const cRef = contactsRef.doc(contactId);
            const contactObj = {
              id: contactId,
              phone,
              name: row.name ?? null,
              accountId: rawAccountId,
              userId: rawUserId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            batch.set(cRef, contactObj, { merge: true });
            newContacts.push(contactObj);
          }

          await batch.commit().catch((e) => console.warn('[broadcast/start] CSV batch commit warning:', e));
          contacts = newContacts;
        }
      } catch (fsContactsErr) {
        console.warn('[broadcast/start] Firestore contacts query warning:', fsContactsErr);
      }
    }

    // Fallback: If no contacts found in Firestore, check Supabase with timeout guard
    if (contacts.length === 0) {
      try {
        const supabaseAdmin = createAdminClient();
        if (audience.type === 'all') {
          const { data } = await supabaseAdmin.from('contacts').select('*').eq('account_id', accountId);
          contacts = data ?? [];
        } else if (audience.type === 'tags' && audience.tagIds?.length > 0) {
          const { data: contactTags } = await supabaseAdmin.from('contact_tags').select('contact_id').in('tag_id', audience.tagIds);
          if (contactTags && contactTags.length > 0) {
            const uniqueContactIds = [...new Set(contactTags.map((ct) => ct.contact_id))];
            const { data } = await supabaseAdmin.from('contacts').select('*').in('id', uniqueContactIds);
            contacts = data ?? [];
          }
        }
      } catch {}
    }

    if (contacts.length === 0) {
      return NextResponse.json({ error: 'No valid contacts found for this audience' }, { status: 400 });
    }

    // ── Step 2: Create Broadcast in Firebase Firestore ──────────────
    const broadcastId = `bc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const broadcastDocData = cleanForFirestore({
      id: broadcastId,
      broadcast_id: broadcastId,
      user_id: rawUserId,
      account_id: rawAccountId,
      name,
      template_name: template.name,
      template_language: template.language ?? 'en_US',
      template_variables: variables ?? {},
      audience_filter: {
        type: audience?.type || 'all',
        tagIds: audience?.tagIds || [],
        customField: audience?.customField || null,
        excludeTagIds: audience?.excludeTagIds || [],
      },
      status: scheduledAt ? 'scheduled' : 'sending',
      scheduled_at: scheduledAt || null,
      total_recipients: contacts.length,
      sent_count: 0,
      delivered_count: 0,
      read_count: 0,
      replied_count: 0,
      failed_count: 0,
      header_media_url: headerMediaUrl || null,
      delay_seconds: delaySeconds || 10,
      auto_reply_enabled: Boolean(autoReplyEnabled),
      auto_reply_text: autoReplyText || null,
      created_at: nowIso,
      updated_at: nowIso,
    });

    if (fDb) {
      try {
        // Save to accounts/{rawAccountId}/broadcasts/{broadcastId}
        await fDb
          .collection('accounts')
          .doc(rawAccountId)
          .collection('broadcasts')
          .doc(broadcastId)
          .set(broadcastDocData);

        // Also save to top-level broadcasts for index queries
        await fDb.collection('broadcasts').doc(broadcastId).set(broadcastDocData);

        // Save auto-reply config document
        const autoReplyDoc = cleanForFirestore({
          broadcast_id: broadcastId,
          name,
          account_id: rawAccountId,
          auto_reply_enabled: Boolean(autoReplyEnabled),
          auto_reply_text: autoReplyText || null,
          created_at: nowIso,
          updated_at: nowIso,
        });
        await fDb
          .collection('accounts')
          .doc(rawAccountId)
          .collection('broadcast_auto_replies')
          .doc(broadcastId)
          .set(autoReplyDoc);

        // Save recipients in Firestore subcollection
        const recCollection = fDb
          .collection('accounts')
          .doc(rawAccountId)
          .collection('broadcasts')
          .doc(broadcastId)
          .collection('recipients');

        const BATCH_SIZE = 400;
        for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
          const chunk = contacts.slice(i, i + BATCH_SIZE);
          const rBatch = fDb.batch();
          for (const c of chunk) {
            const recId = `rec_${c.id || c.phone.replace(/[^0-9]/g, '')}`;
            const rRef = recCollection.doc(recId);
            const rData = cleanForFirestore({
              id: recId,
              broadcast_id: broadcastId,
              contact_id: c.id || null,
              status: 'pending',
              contact: {
                id: c.id || null,
                name: c.name || null,
                phone: c.phone || '',
              },
              created_at: nowIso,
            });
            rBatch.set(rRef, rData);
          }
          await rBatch.commit().catch((e) => console.warn('[broadcast/start] recipient batch write warning:', e));
        }

        console.log(`[broadcast/start] Broadcast ${broadcastId} created in Firestore with ${contacts.length} recipients.`);
      } catch (fsWriteErr) {
        console.error('[broadcast/start] Firestore write error:', fsWriteErr);
        throw new Error('Failed to save broadcast to database');
      }
    }

    if (scheduledAt) {
      return NextResponse.json({ broadcastId, status: 'scheduled' });
    }

    // ── Step 3: Trigger Background Sending Loop ─────────────────────
    void runBackgroundLoop(broadcastId, { ...payload, accountId: rawAccountId }).catch((e) =>
      console.error('[POST /api/whatsapp/broadcast/start] Background run error:', e)
    );

    return NextResponse.json({ broadcastId, status: 'started' });
  } catch (err: any) {
    console.error('[POST /api/whatsapp/broadcast/start] Catch error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
