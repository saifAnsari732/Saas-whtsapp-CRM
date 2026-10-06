import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAccountContext } from '@/lib/firebase/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const contactId = url.searchParams.get('contactId');

    if (!contactId) {
      return NextResponse.json({ deals: [], notes: [], tags: [], allTags: [] });
    }

    const admin = createAdminClient();

    const [dealsRes, notesRes, tagsRes, allTagsRes] = await Promise.all([
      admin
        .from('deals')
        .select('*, stage:pipeline_stages(*)')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false }),
      admin
        .from('contact_notes')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false }),
      admin
        .from('contact_tags')
        .select('id, tag_id, tags(*)')
        .eq('contact_id', contactId),
      admin
        .from('tags')
        .select('*')
        .order('name'),
    ]);

    const mappedTags = (tagsRes.data || [])
      .filter((ct: any) => ct.tags)
      .map((ct: any) => ({
        ...ct.tags,
        contact_tag_id: ct.id,
      }));

    return NextResponse.json({
      deals: dealsRes.data || [],
      notes: notesRes.data || [],
      tags: mappedTags,
      allTags: allTagsRes.data || [],
    });
  } catch (err: any) {
    return NextResponse.json({ deals: [], notes: [], tags: [], allTags: [], error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const admin = createAdminClient();

    let accountId = body.account_id;
    if (!accountId) {
      try {
        const fbContext = await getAccountContext(request as any);
        if (fbContext?.accountId) accountId = fbContext.accountId;
      } catch {}
    }

    if (body.action === 'add_note') {
      const { data, error } = await admin
        .from('contact_notes')
        .insert({
          contact_id: body.contact_id,
          account_id: accountId || 'default',
          user_id: body.user_id || null,
          note_text: body.note_text,
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ note: data });
    }

    if (body.action === 'assign_tag') {
      const { data, error } = await admin
        .from('contact_tags')
        .insert({
          contact_id: body.contact_id,
          tag_id: body.tag_id,
        })
        .select('id')
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ tag: data });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
