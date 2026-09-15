import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('profiles').select('account_id').eq('id', user.id).single();
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { auto_reply_enabled, auto_reply_text } = await req.json();
    const { data: profile } = await supabase.from('profiles').select('account_id').eq('user_id', user.id).single();
    
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

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
