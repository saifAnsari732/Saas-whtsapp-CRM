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

    if (!userSocket) {
      return NextResponse.json({ error: "WhatsApp not connected" }, { status: 400 });
    }

    // Since we don't use makeInMemoryStore due to Vercel memory constraints,
    // we fetch groups natively using Baileys API.
    const groups = await userSocket.groupFetchAllParticipating();
    
    // Convert object of groups to array
    const chats = Object.values(groups).map((g: any) => ({
      id: g.id,
      name: g.subject,
      unreadCount: 0,
      conversationTimestamp: g.creation
    }));

    return NextResponse.json({
      success: true,
      data: chats
    });
  } catch (error: any) {
    console.error("Failed to fetch Baileys chats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
