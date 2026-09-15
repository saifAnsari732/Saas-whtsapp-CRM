import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStatus } from '@/lib/whatsapp/baileys';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentStatus = getStatus(user.id);
    
    // Get stats from memory
    const store = global.waStores?.[user.id];
    let chatCount = 0;
    
    if (store && store.chats) {
      chatCount = Object.keys(store.chats).length;
    }

    return NextResponse.json({
      success: true,
      status: currentStatus.status,
      chatCount: chatCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
