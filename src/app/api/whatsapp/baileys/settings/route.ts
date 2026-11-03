import { getCoexistenceUser } from '@/lib/whatsapp/coexistence-auth';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const { userId, accountId } = await getCoexistenceUser(req);
    const user = { id: userId };
    const profile = { account_id: accountId };
    const supabase = await createClient();

    const { data: settings } = await supabase
      .from('baileys_settings')
      .select('*')
      .eq('account_id', profile.account_id)
      .maybeSingle();

    return NextResponse.json({ settings: settings || { auto_reply_enabled: false, auto_reply_text: '' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, accountId } = await getCoexistenceUser(req);
    const user = { id: userId };
    const profile = { account_id: accountId };
    const supabase = await createClient();
    const { auto_reply_enabled, auto_reply_text } = await req.json();

    const { data, error } = await supabase
      .from('baileys_settings')
      .upsert({
        account_id: profile.account_id,
        user_id: user.id,
        auto_reply_enabled,
        auto_reply_text,
        updated_at: new Date().toISOString()
      }, { onConflict: 'account_id' })
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json({ success: true, settings: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
