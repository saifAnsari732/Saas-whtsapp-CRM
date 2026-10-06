import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAccountContext } from '@/lib/firebase/auth-helper';
import { sanitizePhoneForMeta } from '@/lib/whatsapp/phone-utils';
import { runBackgroundLoop } from '@/lib/whatsapp/broadcast-runner';

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

    const accountId = toValidUUID(accCtx.accountId);
    const userId = toValidUUID(accCtx.user.uid);
    const payload = await request.json();

    const {
      name,
      template,
      audience,
      variables,
      headerMediaUrl,
      scheduledAt,
      delaySeconds,
    } = payload;

    if (!name || !template) {
      return NextResponse.json({ error: 'Campaign name and template are required' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // ── Step 1: Resolve Audience Contacts ───────────────────────────
    let contacts: any[] = [];

    if (audience.type === 'all') {
      const { data, error } = await supabaseAdmin
        .from('contacts')
        .select('*')
        .eq('account_id', accountId);
      if (error) throw new Error(`Failed to fetch contacts: ${error.message}`);
      contacts = data ?? [];
    } else if (audience.type === 'tags' && audience.tagIds?.length > 0) {
      const { data: contactTags, error: tagErr } = await supabaseAdmin
        .from('contact_tags')
        .select('contact_id')
        .in('tag_id', audience.tagIds);
      if (tagErr) throw new Error(`Failed to fetch tag contacts: ${tagErr.message}`);

      if (contactTags && contactTags.length > 0) {
        const uniqueContactIds = [...new Set(contactTags.map((ct) => ct.contact_id))];
        const { data, error } = await supabaseAdmin
          .from('contacts')
          .select('*')
          .in('id', uniqueContactIds);
        if (error) throw new Error(`Failed to fetch tag contacts: ${error.message}`);
        contacts = data ?? [];
      }
    } else if (audience.type === 'csv' && audience.csvContacts?.length > 0) {
      // Upsert CSV contacts using Admin client
      const uniqueByPhone = new Map<string, { phone: string; name?: string }>();
      for (const row of audience.csvContacts) {
        const clean = sanitizePhoneForMeta(row.phone);
        if (clean) uniqueByPhone.set(clean, { ...row, phone: clean });
      }
      const phones = [...uniqueByPhone.keys()];

      const { data: existing } = await supabaseAdmin
        .from('contacts')
        .select('*')
        .eq('account_id', accountId)
        .in('phone', phones);

      const byPhone = new Map<string, any>();
      for (const c of (existing ?? [])) {
        if (c.phone) byPhone.set(c.phone, c);
      }

      const missing = phones
        .filter((p) => !byPhone.has(p))
        .map((phone) => ({
          user_id: userId,
          account_id: accountId,
          phone,
          name: uniqueByPhone.get(phone)?.name ?? null,
        }));

      if (missing.length > 0) {
        const { data: inserted, error: insErr } = await supabaseAdmin
          .from('contacts')
          .insert(missing)
          .select();
        if (insErr) throw new Error(`Failed to insert CSV contacts: ${insErr.message}`);
        for (const c of (inserted ?? [])) {
          if (c.phone) byPhone.set(c.phone, c);
        }
      }

      contacts = phones.map((p) => byPhone.get(p)).filter(Boolean);
    }

    if (contacts.length === 0) {
      return NextResponse.json({ error: 'No valid contacts found for this audience' }, { status: 400 });
    }

    // ── Step 2: Create Broadcast Row ────────────────────────────────
    const { data: broadcast, error: broadcastError } = await supabaseAdmin
      .from('broadcasts')
      .insert({
        user_id: userId,
        account_id: accountId,
        name,
        template_name: template.name,
        template_language: template.language ?? 'en_US',
        template_variables: variables ?? {},
        audience_filter: {
          type: audience.type,
          tagIds: audience.tagIds,
          customField: audience.customField,
          excludeTagIds: audience.excludeTagIds,
        },
        status: scheduledAt ? 'scheduled' : 'sending',
        scheduled_at: scheduledAt || null,
        total_recipients: contacts.length,
        sent_count: 0,
        delivered_count: 0,
        read_count: 0,
        replied_count: 0,
        failed_count: 0,
      })
      .select()
      .single();

    if (broadcastError || !broadcast) {
      throw new Error(`Failed to create broadcast campaign: ${broadcastError?.message ?? 'unknown error'}`);
    }

    // ── Step 3: Insert Recipient Rows ───────────────────────────────
    const recipientRows = contacts.map((contact) => ({
      broadcast_id: broadcast.id,
      contact_id: contact.id,
      status: 'pending' as const,
    }));

    const INSERT_CHUNK = 200;
    for (let i = 0; i < recipientRows.length; i += INSERT_CHUNK) {
      const batch = recipientRows.slice(i, i + INSERT_CHUNK);
      const { error: recipientError } = await supabaseAdmin
        .from('broadcast_recipients')
        .insert(batch);
      if (recipientError) {
        await supabaseAdmin
          .from('broadcasts')
          .update({ status: 'failed', failed_count: contacts.length })
          .eq('id', broadcast.id);
        throw new Error(`Failed to insert recipient batch: ${recipientError.message}`);
      }
    }

    if (scheduledAt) {
      return NextResponse.json({ broadcastId: broadcast.id, status: 'scheduled' });
    }

    // ── Step 4: Background the Sending Loop ─────────────────────────
    void runBackgroundLoop(broadcast.id, payload).catch((e) =>
      console.error('[POST /api/whatsapp/broadcast/start] Background run error:', e)
    );

    return NextResponse.json({ broadcastId: broadcast.id, status: 'started' });
  } catch (err: any) {
    console.error('[POST /api/whatsapp/broadcast/start] Catch error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
