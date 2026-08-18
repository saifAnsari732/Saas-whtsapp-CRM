import { NextResponse } from "next/server";
import { getStatus } from "@/lib/whatsapp/baileys";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const store = global.waStores?.[user.id];
    const userSocket = global.waSockets?.[user.id];

    let chats = [];

    if (userSocket && store && store.chats) {
      // Baileys Connection Active: Fetch from in-memory store which contains both DMs and Groups
      const allChats = Object.values(store.chats) as any[];
      chats = allChats
        .filter(c => c.id && (c.id.endsWith('@s.whatsapp.net') || c.id.endsWith('@g.us')))
        .map(c => {
          const isGroup = c.id.endsWith('@g.us');
          let ts = c.conversationTimestamp;
          if (ts && typeof ts === 'object' && 'low' in ts) {
            ts = ts.low;
          } else if (typeof ts === 'string') {
            ts = parseInt(ts, 10);
          }
          
          return {
            id: c.id,
            name: c.name || c.id.split('@')[0],
            unreadCount: c.unreadCount || 0,
            conversationTimestamp: typeof ts === 'number' && !isNaN(ts) ? ts : Math.floor(Date.now() / 1000),
            type: isGroup ? 'group' : 'direct',
          };
        });
    } else {
      // Fallback: Cloud API Mode. Fetch from Supabase `conversations` table
      const { data: profile } = await supabase.from('profiles').select('account_id').eq('user_id', user.id).single();
      if (!profile?.account_id) {
        return NextResponse.json({ error: "WhatsApp not connected" }, { status: 400 });
      }

      // Check if Cloud API is actually connected for this account
      const { data: config } = await supabase.from('whatsapp_configurations').select('phone_number_id').eq('account_id', profile.account_id).single();
      if (!config?.phone_number_id) {
        return NextResponse.json({ error: "WhatsApp not connected" }, { status: 400 });
      }

      const { data: dbConversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          contact_id,
          unread_count,
          last_message_at,
          contacts ( phone, name )
        `)
        .eq('account_id', profile.account_id)
        .order('last_message_at', { ascending: false })
        .limit(100);
        
      if (error) throw error;

      chats = (dbConversations || []).map((conv: any) => ({
        id: conv.contacts?.phone ? `${conv.contacts.phone}@s.whatsapp.net` : conv.id,
        name: conv.contacts?.name || conv.contacts?.phone || 'Unknown',
        unreadCount: conv.unread_count || 0,
        conversationTimestamp: conv.last_message_at ? Math.floor(new Date(conv.last_message_at).getTime() / 1000) : Math.floor(Date.now() / 1000),
        type: 'direct' // Cloud API typically only handles direct messages
      }));
    }

    return NextResponse.json({
      success: true,
      data: chats
    });
  } catch (error: any) {
    console.error("Failed to fetch chats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
