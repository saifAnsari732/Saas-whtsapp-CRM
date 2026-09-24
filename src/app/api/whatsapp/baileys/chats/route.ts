import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import fs from "fs";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userSocket = global.waSockets?.[user.id] || Object.values(global.waSockets || {})[0];

    // If socket is connected, actively fetch all participating groups from WhatsApp
    if (userSocket && typeof userSocket.groupFetchAllParticipating === 'function') {
      try {
        const fetchPromise = userSocket.groupFetchAllParticipating();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('group_fetch_timeout')), 6000));
        
        const participatingGroups = await Promise.race([fetchPromise, timeoutPromise]) as Record<string, any>;
        if (participatingGroups && typeof participatingGroups === 'object') {
          if (!global.waStores) global.waStores = {};
          if (!global.waStores[user.id]) global.waStores[user.id] = { chats: {}, messages: {} };
          const store = global.waStores[user.id];
          if (!store.chats) store.chats = {};

          for (const [gid, gdata] of Object.entries(participatingGroups)) {
            store.chats[gid] = {
              id: gid,
              name: (gdata as any).subject || gid,
              conversationTimestamp: (gdata as any).creation || Math.floor(Date.now() / 1000),
              unreadCount: 0,
              type: 'group'
            };
          }
        }
      } catch (groupErr) {
        console.warn("Could not fetch participating groups from WhatsApp socket:", groupErr);
      }
    }

    const store = global.waStores?.[user.id] || Object.values(global.waStores || {})[0];
    let rawStoreChats: Record<string, any> = store?.chats || {};

    // Check disk store file if memory store has no chats yet
    if (Object.keys(rawStoreChats).length === 0) {
      const storeFile = `baileys_store_${user.id}.json`;
      if (fs.existsSync(storeFile)) {
        try {
          const diskData = JSON.parse(fs.readFileSync(storeFile, 'utf-8'));
          if (diskData?.chats) rawStoreChats = diskData.chats;
        } catch {}
      }
    }

    let chats: any[] = [];
    if (rawStoreChats && Object.keys(rawStoreChats).length > 0) {
      const allChats = Object.values(rawStoreChats);
      chats = allChats
        .filter((c: any) => c.id && (c.id.endsWith('@s.whatsapp.net') || c.id.endsWith('@g.us')))
        .map((c: any) => {
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

    const existingIds = new Set(chats.map(c => c.id));

    // Also merge DB contacts and conversations so direct phone numbers are fetched
    const { data: profile } = await supabase.from('profiles').select('account_id').or(`user_id.eq.${user.id},id.eq.${user.id}`).maybeSingle();
    const accountId = profile?.account_id;

    if (accountId) {
      const { data: dbConversations } = await supabase
        .from('conversations')
        .select(`
          id,
          contact_id,
          unread_count,
          last_message_at,
          contacts ( phone, name )
        `)
        .eq('account_id', accountId)
        .order('last_message_at', { ascending: false })
        .limit(100);

      if (dbConversations && dbConversations.length > 0) {
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

    // Fetch and merge direct contacts from CRM contacts table so ALL saved phone numbers are available
    let dbContacts: any[] = [];
    if (accountId) {
      const { data } = await supabase
        .from('contacts')
        .select('id, phone, name, updated_at, created_at')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(200);
      if (data && data.length > 0) dbContacts = data;
    }
    
    // Fetch contacts from Firebase Firestore (primary active database)
    try {
      const { getAdminDb } = await import('@/lib/firebase/admin');
      const fDb = getAdminDb();
      const contactsSnap = await fDb.collection('contacts').limit(300).get();
      if (!contactsSnap.empty) {
        contactsSnap.forEach((doc) => {
          const c = doc.data();
          if (c && c.phone) {
            const cleanPhone = String(c.phone).replace(/\D/g, '');
            if (cleanPhone.length >= 7) {
              const jid = `${cleanPhone}@s.whatsapp.net`;
              if (!existingIds.has(jid)) {
                existingIds.add(jid);
                chats.push({
                  id: jid,
                  name: c.name || `+${cleanPhone}`,
                  unreadCount: 0,
                  conversationTimestamp: c.updated_at 
                    ? Math.floor(new Date(c.updated_at).getTime() / 1000) 
                    : c.created_at 
                      ? Math.floor(new Date(c.created_at).getTime() / 1000) 
                      : Math.floor(Date.now() / 1000),
                  type: 'direct'
                });
              }
            }
          }
        });
      }
    } catch (fErr) {
      console.warn("Could not fetch contacts from Firestore:", fErr);
    }

    // Fallback: If no contacts found for account_id or account_id is null, query contacts table directly
    if (dbContacts.length === 0) {
      const { data } = await supabase
        .from('contacts')
        .select('id, phone, name, updated_at, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (data) dbContacts = data;
    }

    if (dbContacts && dbContacts.length > 0) {
      for (const c of dbContacts) {
        if (c.phone) {
          const cleanPhone = c.phone.replace(/\D/g, '');
          if (cleanPhone.length >= 7) {
            const jid = `${cleanPhone}@s.whatsapp.net`;
            if (!existingIds.has(jid)) {
              existingIds.add(jid);
              chats.push({
                id: jid,
                name: c.name || `+${cleanPhone}`,
                unreadCount: 0,
                conversationTimestamp: c.updated_at 
                  ? Math.floor(new Date(c.updated_at).getTime() / 1000) 
                  : c.created_at 
                    ? Math.floor(new Date(c.created_at).getTime() / 1000) 
                    : Math.floor(Date.now() / 1000),
                type: 'direct'
              });
            }
          }
        }
      }
    }

    // Sort all chats by timestamp descending
    chats.sort((a, b) => (b.conversationTimestamp || 0) - (a.conversationTimestamp || 0));

    return NextResponse.json({
      success: true,
      data: chats
    });
  } catch (error: any) {
    console.error("Failed to fetch chats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
