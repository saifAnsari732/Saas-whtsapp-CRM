import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTextMessage, sendTemplateMessage } from "@/lib/whatsapp/meta-api";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { to, message, mediaUrl, mediaType, templateName, templateLanguage } = body;

    if (!to || (!message && !mediaUrl && !templateName)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const userSocket = global.waSockets?.[user.id];

    // Format the JID if needed (ensure it has @s.whatsapp.net or @g.us)
    let jid = to;
    if (!jid.includes('@')) {
      jid = `${jid}@s.whatsapp.net`;
    }

    if (userSocket) {
      // Baileys mode
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
    } else {
      // Cloud API mode fallback
      const { data: profile } = await supabase.from('profiles').select('account_id').eq('user_id', user.id).single();
      if (!profile?.account_id) throw new Error("Account not found");

      const { data: config } = await supabase.from('whatsapp_configurations').select('phone_number_id, system_user_token').eq('account_id', profile.account_id).single();
      if (!config?.phone_number_id || !config?.system_user_token) {
        return NextResponse.json({ error: "WhatsApp not connected via either Baileys or Cloud API" }, { status: 400 });
      }

      // Format JID back to plain phone number for Meta API
      const metaPhone = jid.split('@')[0];

      if (templateName) {
        await sendTemplateMessage({
          phoneNumberId: config.phone_number_id,
          accessToken: config.system_user_token,
          to: metaPhone,
          templateName: templateName,
          language: templateLanguage || 'en_US',
        });
      } else {
        await sendTextMessage({
          phoneNumberId: config.phone_number_id,
          accessToken: config.system_user_token,
          to: metaPhone,
          text: message
        });
      }
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
