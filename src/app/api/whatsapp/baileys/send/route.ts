import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { to, message, mediaUrl, mediaType } = body;

    if (!to || !message) {
      return NextResponse.json({ error: "Missing 'to' or 'message' fields" }, { status: 400 });
    }

    const userSocket = global.waSockets?.[user.id];

    if (!userSocket) {
      return NextResponse.json({ error: "WhatsApp not connected. Please scan QR code in the Fast Coexistence dashboard." }, { status: 400 });
    }

    // Format the JID if needed (ensure it has @s.whatsapp.net or @g.us)
    let jid = to;
    if (!jid.includes('@')) {
      jid = `${jid}@s.whatsapp.net`;
    }

    // Send the message natively
    const lowerMediaType = mediaType?.toLowerCase();
    if (mediaUrl && ['image', 'video', 'document'].includes(lowerMediaType)) {
      if (lowerMediaType === 'image') {
        await userSocket.sendMessage(jid, { image: { url: mediaUrl }, caption: message });
      } else if (lowerMediaType === 'video') {
        await userSocket.sendMessage(jid, { video: { url: mediaUrl }, caption: message });
      } else if (lowerMediaType === 'document') {
        await userSocket.sendMessage(jid, { document: { url: mediaUrl }, fileName: 'document', mimetype: 'application/octet-stream', caption: message });
      }
    } else {
      await userSocket.sendMessage(jid, { text: message });
    }

    return NextResponse.json({
      success: true,
      message: "Message sent successfully"
    });

  } catch (error: any) {
    console.error("Native Baileys Send Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
