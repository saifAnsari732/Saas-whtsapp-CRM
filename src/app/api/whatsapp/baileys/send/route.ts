import { getCoexistenceUser } from '@/lib/whatsapp/coexistence-auth';
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTextMessage, sendTemplateMessage } from "@/lib/whatsapp/meta-api";
import { connectToWhatsApp } from "@/lib/whatsapp/baileys";

export async function POST(request: Request) {
  try {
    const { userId, accountId } = await getCoexistenceUser(request);
    const user = { id: userId };
    const effectiveAccountId = accountId || '61740bf8-b21e-42dd-9ab3-9118bca90bc6';
    const supabase = await createClient();

    const body = await request.json();
    const { to, message, mediaUrl, mediaType, templateName, templateLanguage, buttons } = body;

    if (!to || (!message && !mediaUrl && !templateName)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // -----------------------------------------------------
    // ROBUST JID NORMALIZATION
    // -----------------------------------------------------
    let jid = String(to).trim();
    if (jid.endsWith('@g.us') || jid.endsWith('@broadcast')) {
      // Keep group and broadcast JIDs untouched
    } else {
      let digits = jid.split('@')[0].replace(/\D/g, '');
      if (digits.startsWith('0') && digits.length === 11) {
        digits = digits.slice(1);
      }
      // If 10-digit number (standard Indian mobile), prepend India country code 91
      if (digits.length === 10) {
        digits = `91${digits}`;
      }
      jid = `${digits}@s.whatsapp.net`;
    }

    // Format interactive buttons if provided
    let finalMessage = message || '';
    if (buttons && Array.isArray(buttons) && buttons.length > 0) {
      const buttonLines = buttons.map((b: any) => {
        if (b.type === 'URL') return `🌐 ${b.text}: ${b.url}`;
        if (b.type === 'PHONE_NUMBER') return `📞 ${b.text}: ${b.phone_number}`;
        return `🔘 [${b.text}]`;
      }).join('\n');

      if (!finalMessage.includes('🔘 [') && !finalMessage.includes('🌐 ') && !finalMessage.includes('📞 ')) {
        finalMessage = finalMessage 
          ? `${finalMessage}\n\n────────────────\n${buttonLines}`
          : buttonLines;
      }
    }

    // Check socket availability (keyed by userId, accountId, or any active socket)
    let userSocket = global.waSockets?.[user.id] || (accountId ? global.waSockets?.[accountId] : null);
    if (!userSocket && global.waSockets) {
      userSocket = Object.values(global.waSockets)[0] || null;
    }

    // Auto-connect if socket is currently null
    if (!userSocket) {
      try {
        await connectToWhatsApp(user.id);
        userSocket = global.waSockets?.[user.id] || (accountId ? global.waSockets?.[accountId] : null);
        if (!userSocket && global.waSockets) {
          userSocket = Object.values(global.waSockets)[0] || null;
        }
      } catch (connErr) {
        console.warn("[Baileys Send] Auto-connect attempt warning:", connErr);
      }
    }

    if (userSocket) {
      // -----------------------------------------------------
      // BAILEYS NATIVE PHONE SEND
      // -----------------------------------------------------
      let sentResult: any = null;
      try {
        const lowerMediaType = mediaType?.toLowerCase();
        if (mediaUrl && ['image', 'video', 'document'].includes(lowerMediaType)) {
          if (lowerMediaType === 'image') {
            sentResult = await userSocket.sendMessage(jid, { image: { url: mediaUrl }, caption: finalMessage });
          } else if (lowerMediaType === 'video') {
            sentResult = await userSocket.sendMessage(jid, { video: { url: mediaUrl }, caption: finalMessage });
          } else if (lowerMediaType === 'document') {
            sentResult = await userSocket.sendMessage(jid, { document: { url: mediaUrl }, fileName: 'document', mimetype: 'application/octet-stream', caption: finalMessage });
          }
        } else {
          sentResult = await userSocket.sendMessage(jid, { text: finalMessage });
        }
      } catch (sockSendErr: any) {
        console.error(`[Baileys Send] Socket error sending to ${jid}:`, sockSendErr);
        const errMsg = sockSendErr?.message || String(sockSendErr);

        if (errMsg.includes('item-not-found') || errMsg.includes('404')) {
          return NextResponse.json({ 
            error: jid.endsWith('@g.us') 
              ? "Cannot send to group: The group no longer exists or your account is no longer a participant." 
              : "WhatsApp contact not found on WhatsApp servers." 
          }, { status: 404 });
        }
        if (errMsg.includes('forbidden') || errMsg.includes('403')) {
          return NextResponse.json({ 
            error: "Cannot send message: Only admins are allowed to send messages in this group, or access is restricted." 
          }, { status: 403 });
        }
        throw sockSendErr;
      }

      const msgId = sentResult?.key?.id || `msg-${Date.now()}`;

      // Record message into Baileys store for live conversation view
      const sentMsg = {
        key: {
          id: msgId,
          fromMe: true,
          remoteJid: jid,
        },
        message: {
          conversation: finalMessage || (mediaUrl ? `[Media: ${mediaType || 'file'}]` : ''),
        },
        buttons: Array.isArray(buttons) && buttons.length > 0 ? buttons : undefined,
        messageTimestamp: Math.floor(Date.now() / 1000),
        status: "SERVER_ACK",
      };

      if (!global.waStores) global.waStores = {};
      if (!global.waStores[user.id]) global.waStores[user.id] = { chats: {}, messages: {} };
      if (!global.waStores[user.id].messages) global.waStores[user.id].messages = {};
      if (!global.waStores[user.id].messages[jid]) global.waStores[user.id].messages[jid] = [];
      global.waStores[user.id].messages[jid].push(sentMsg);

      if (!global.waStores[user.id].chats) global.waStores[user.id].chats = {};
      if (global.waStores[user.id].chats[jid]) {
        global.waStores[user.id].chats[jid].conversationTimestamp = Math.floor(Date.now() / 1000);
      } else {
        global.waStores[user.id].chats[jid] = {
          id: jid,
          name: jid.endsWith('@g.us') ? 'WhatsApp Group' : jid.split('@')[0],
          conversationTimestamp: Math.floor(Date.now() / 1000),
          unreadCount: 0,
          type: jid.endsWith('@g.us') ? 'group' : 'direct',
        };
      }

      // Sync outbound message to Firestore for real-time CRM Inbox updates
      if (process.env.FIREBASE_ADMIN_PROJECT_ID && !jid.endsWith('@g.us')) {
        try {
          const { getAdminDb } = await import('@/lib/firebase/admin');
          const fDb = getAdminDb();
          if (fDb) {
            const cleanDigits = jid.split('@')[0].replace(/\D/g, '');
            const convRef = fDb.collection('accounts').doc(effectiveAccountId).collection('conversations').doc(`conv_c_${cleanDigits}`);
            await convRef.set({
              id: `conv_c_${cleanDigits}`,
              contact_phone: cleanDigits,
              last_message_at: new Date().toISOString(),
              last_message_text: finalMessage,
              status: 'open',
              updatedAt: new Date().toISOString(),
            }, { merge: true });

            await convRef.collection('messages').doc(msgId).set({
              id: msgId,
              content_text: finalMessage,
              sender_type: 'agent',
              direction: 'outbound',
              status: 'sent',
              created_at: new Date().toISOString(),
            }, { merge: true });
          }
        } catch (fsWriteErr) {
          console.warn('[Baileys Send] Firestore real-time sync warning:', fsWriteErr);
        }
      }

      // Invalidate cached chats so recent message surfaces immediately
      if (global.cachedBaileysChats) {
        delete global.cachedBaileysChats[user.id];
        if (accountId) delete global.cachedBaileysChats[accountId];
      }

      return NextResponse.json({
        success: true,
        messageId: msgId,
        jid,
        message: "Message sent successfully"
      });

    } else {
      // -----------------------------------------------------
      // CLOUD API FALLBACK (When phone is not linked)
      // -----------------------------------------------------
      const { data: profile } = await supabase.from('profiles').select('account_id').eq('user_id', user.id).single();
      if (!profile?.account_id) throw new Error("Account not found");

      const { data: config } = await supabase.from('whatsapp_configurations').select('phone_number_id, system_user_token').eq('account_id', profile.account_id).single();
      if (!config?.phone_number_id || !config?.system_user_token) {
        return NextResponse.json({ error: "WhatsApp not connected. Please scan QR in WhatsApp Coexistence or configure Cloud API." }, { status: 400 });
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

      return NextResponse.json({
        success: true,
        jid,
        message: "Message sent successfully via Meta Cloud API"
      });
    }

  } catch (error: any) {
    console.error("Native Baileys Send Error:", error);
    return NextResponse.json({ error: error.message || "Failed to dispatch message" }, { status: 500 });
  }
}
