import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAccountContext } from '@/lib/firebase/auth-helper';
import { sanitizePhoneForMeta } from '@/lib/whatsapp/phone-utils';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = toValidUUID(accCtx.accountId);
    const userId = toValidUUID(accCtx.user.uid);

    const body = await request.json();
    const csvContacts: { phone: string; name?: string }[] = body.csvContacts ?? [];

    if (csvContacts.length === 0) {
      return NextResponse.json({ contacts: [] });
    }

    const supabaseAdmin = createAdminClient();

    // De-duplicate phones
    const uniqueByPhone = new Map<string, { phone: string; name?: string }>();
    for (const row of csvContacts) {
      const clean = sanitizePhoneForMeta(row.phone);
      if (clean) uniqueByPhone.set(clean, { ...row, phone: clean });
    }
    const phones = [...uniqueByPhone.keys()];

    // 1. Lookup existing
    const { data: existing, error: lookupErr } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('account_id', accountId)
      .in('phone', phones);

    if (lookupErr) {
      console.error('[POST /api/whatsapp/contacts/upsert] Lookup error:', lookupErr);
      return NextResponse.json({ error: lookupErr.message }, { status: 500 });
    }

    const byPhone = new Map<string, any>();
    for (const c of (existing ?? [])) {
      if (c.phone) byPhone.set(c.phone, c);
    }

    // 2. Insert missing
    const missing = phones
      .filter((p) => !byPhone.has(p))
      .map((phone) => ({
        user_id: userId,
        account_id: accountId,
        phone,
        name: uniqueByPhone.get(phone)?.name ?? null,
      }));

    if (missing.length > 0) {
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('contacts')
        .insert(missing)
        .select();

      if (insertErr) {
        console.error('[POST /api/whatsapp/contacts/upsert] Insert error:', insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }

      for (const c of (inserted ?? [])) {
        if (c.phone) byPhone.set(c.phone, c);
      }
    }

    const resultContacts = phones
      .map((p) => byPhone.get(p))
      .filter(Boolean);

    return NextResponse.json({ contacts: resultContacts });
  } catch (err: any) {
    console.error('[POST /api/whatsapp/contacts/upsert] Catch:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
