import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request, { params }: { params: Promise<{ jid: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jid } = await params;
    const decodedJid = decodeURIComponent(jid);
    const store = global.waStores?.[user.id];
    
    if (!store || !store.messages || !store.messages[decodedJid]) {
      return NextResponse.json({ success: true, messages: [] });
    }

    return NextResponse.json({ success: true, messages: store.messages[decodedJid] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
