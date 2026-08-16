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

    if (!userSocket) {
      return NextResponse.json({ error: "WhatsApp not connected" }, { status: 400 });
    }

    let chats = [];

    if (store && store.chats) {
      // Fetch from in-memory store which contains both DMs and Groups
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
      // Fallback: If store fails or is not initialized, at least fetch groups
      const groups = await userSocket.groupFetchAllParticipating();
      chats = Object.values(groups).map((g: any) => ({
        id: g.id,
        name: g.subject,
        unreadCount: 0,
        conversationTimestamp: g.creation,
        type: 'group'
      }));
    }

    return NextResponse.json({
      success: true,
      data: chats
    });
  } catch (error: any) {
    console.error("Failed to fetch Baileys chats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
