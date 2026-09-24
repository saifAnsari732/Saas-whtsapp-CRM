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

    const userSocket = global.waSockets?.[user.id];

    // If socket is connected, actively fetch all participating groups from WhatsApp
    if (userSocket) {
      try {
        const participatingGroups = await userSocket.groupFetchAllParticipating();
        if (participatingGroups) {
          if (!global.waStores) global.waStores = {};
          if (!global.waStores[user.id]) global.waStores[user.id] = { chats: {}, messages: {} };
          const store = global.waStores[user.id];
          if (!store.chats) store.chats = {};

          for (const [gid, gdata] of Object.entries(participatingGroups as Record<string, any>)) {
            store.chats[gid] = {
              id: gid,
              name: gdata.subject || gid,
              conversationTimestamp: gdata.creation || Math.floor(Date.now() / 1000),
              unreadCount: 0,
              type: 'group'
            };
          }
        }
      } catch (groupErr) {
        console.warn("Could not fetch participating groups from WhatsApp socket:", groupErr);
      }
    }

    const store = global.waStores?.[user.id];
    let chats: any[] = [];

    if (store && store.chats && Object.keys(store.chats).length > 0) {
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
    }

    // Also merge DB contacts and conversations if available
    const { data: profile } = await supabase.from('profiles').select('account_id').eq('user_id', user.id).maybeSingle();
    if (profile?.account_id) {
      const { data: dbConversations } = await supabase
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

      if (dbConversations && dbConversations.length > 0) {
        const existingIds = new Set(chats.map(c => c.id));
        for (const conv of dbConversations as any[]) {
          const phone = conv.contacts?.phone;
          const jid = phone ? `${phone.replace(/\D/g, '')}@s.whatsapp.net` : null;
          if (jid && !existingIds.has(jid)) {
            existingIds.add(jid);
            chats.push({
              id: jid,
              name: conv.contacts?.name || phone,
              unreadCount: conv.unread_count || 0,
              conversationTimestamp: conv.last_message_at ? Math.floor(new Date(conv.last_message_at).getTime() / 1000) : Math.floor(Date.now() / 1000),
              type: 'direct'
            });
          }
        }
      }
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
