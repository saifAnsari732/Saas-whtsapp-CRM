import { NextResponse } from "next/server";
import { getStatus } from "@/lib/whatsapp/baileys";

export async function GET() {
  try {
    if (!global.waSocket) {
      return NextResponse.json({ error: "WhatsApp not connected" }, { status: 400 });
    }

    // Since we don't use makeInMemoryStore due to Vercel memory constraints,
    // we fetch groups natively using Baileys API.
    const groups = await global.waSocket.groupFetchAllParticipating();
    
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
