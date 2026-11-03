import { getCoexistenceUser } from '@/lib/whatsapp/coexistence-auth';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStatus } from '@/lib/whatsapp/baileys';

export async function GET(req: Request) {
  try {
    const { userId } = await getCoexistenceUser(req);
    const user = { id: userId };

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
