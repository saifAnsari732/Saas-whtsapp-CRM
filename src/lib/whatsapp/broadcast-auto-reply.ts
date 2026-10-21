import { getAdminDb, cleanForFirestore } from '@/lib/firebase/admin';
import { getWhatsAppConfigForAccount } from '@/lib/whatsapp/get-config';
import { sendTextMessage } from '@/lib/whatsapp/meta-api';
import { sanitizePhoneForMeta, isValidE164 } from '@/lib/whatsapp/phone-utils';

export interface BroadcastAutoReplyCheckArgs {
  accountId: string;
  contactId: string;
  conversationId: string;
  configOwnerUserId?: string;
  contactName?: string;
  contactPhone?: string;
  inboundText?: string;
}

export interface BroadcastAutoReplyOutcome {
  replied: boolean;
  broadcastId?: string;
  replyText?: string;
}

/**
 * Checks if an inbound WhatsApp message is a customer reply to a recent broadcast campaign.
 * If the campaign has an automated custom reply enabled, and this contact hasn't received
 * it yet:
 *   1. Atomic deduplication stamp in Firestore (prevents duplicate sends).
 *   2. Updates recipient status = 'replied' in Firestore.
 *   3. Dispatches custom reply text instantly via Meta Cloud API.
 *   4. Records the outbound bot message in the Firestore conversation thread.
 *
 * Runs 100% on Firebase Firestore + Meta Cloud API without any Supabase dependency.
 */
export async function handleBroadcastAutoReplyIfEligible(
  args: BroadcastAutoReplyCheckArgs
): Promise<BroadcastAutoReplyOutcome> {
  const {
    accountId,
    contactId,
    conversationId,
    contactName,
    contactPhone,
    inboundText,
  } = args;

  try {
    const fDb = getAdminDb();
    if (!fDb) return { replied: false };

    // 1. Find recent broadcasts in this account with auto_reply_enabled === true
    let activeBroadcast: any = null;
    let autoReplyText = '';
    let matchedRecipientRef: any = null;
    let matchedRecipientData: any = null;

    // Check accounts/{accountId}/broadcast_auto_replies
    const candidateBcastIds: string[] = [];
    const autoReplyTextMap = new Map<string, string>();

    try {
      const autoRepliesSnap = await fDb
        .collection('accounts')
        .doc(accountId)
        .collection('broadcast_auto_replies')
        .where('auto_reply_enabled', '==', true)
        .get();

      autoRepliesSnap.forEach((doc) => {
        const d = doc.data();
        if (d.auto_reply_enabled && d.auto_reply_text?.trim()) {
          candidateBcastIds.push(doc.id);
          autoReplyTextMap.set(doc.id, d.auto_reply_text.trim());
        }
      });
    } catch (arErr) {
      console.warn('[broadcast-auto-reply] broadcast_auto_replies read warning:', arErr);
    }

    // Also check accounts/{accountId}/broadcasts
    if (candidateBcastIds.length === 0) {
      try {
        const bcSnap = await fDb
          .collection('accounts')
          .doc(accountId)
          .collection('broadcasts')
          .where('auto_reply_enabled', '==', true)
          .get();

        bcSnap.forEach((doc) => {
          const d = doc.data();
          if (d.auto_reply_enabled && d.auto_reply_text?.trim()) {
            candidateBcastIds.push(doc.id);
            autoReplyTextMap.set(doc.id, d.auto_reply_text.trim());
          }
        });
      } catch (bcErr) {
        console.warn('[broadcast-auto-reply] broadcasts read warning:', bcErr);
      }
    }

    if (candidateBcastIds.length === 0) {
      return { replied: false };
    }

    const rawCleanPhone = contactPhone ? contactPhone.replace(/[^0-9]/g, '') : '';

    // 2. Check if this contact received any of these broadcasts
    for (const bId of candidateBcastIds) {
      const recCollection = fDb
        .collection('accounts')
        .doc(accountId)
        .collection('broadcasts')
        .doc(bId)
        .collection('recipients');

      let rDoc: any = null;

      // Check by contactId
      if (contactId) {
        const byId = await recCollection.doc(`rec_${contactId}`).get();
        if (byId.exists) {
          rDoc = byId;
        } else {
          const qSnap = await recCollection.where('contact_id', '==', contactId).limit(1).get();
          if (!qSnap.empty) {
            rDoc = qSnap.docs[0];
          }
        }
      }

      // Check by clean phone
      if (!rDoc && rawCleanPhone) {
        const byPhoneId = await recCollection.doc(`rec_${rawCleanPhone}`).get();
        if (byPhoneId.exists) {
          rDoc = byPhoneId;
        } else {
          const qPhone = await recCollection.where('contact.phone', '==', rawCleanPhone).limit(1).get();
          if (!qPhone.empty) {
            rDoc = qPhone.docs[0];
          }
        }
      }

      if (rDoc) {
        const rData = rDoc.data();
        const lockKey = contactId || rawCleanPhone;

        const sentLogRef = fDb
          .collection('accounts')
          .doc(accountId)
          .collection('broadcast_auto_replies')
          .doc(bId)
          .collection('sent_recipients')
          .doc(lockKey);

        const sentSnap = await sentLogRef.get();
        if (!sentSnap.exists && !rData.auto_reply_sent_at) {
          activeBroadcast = { id: bId };
          autoReplyText = autoReplyTextMap.get(bId) || '';
          matchedRecipientRef = rDoc.ref;
          matchedRecipientData = rData;
          break;
        }
      }
    }

    if (!activeBroadcast || !autoReplyText || !matchedRecipientRef) {
      return { replied: false };
    }

    const bcastId = activeBroadcast.id;
    const nowIso = new Date().toISOString();

    // 3. Lock deduplication stamp in Firestore
    const lockKey = contactId || rawCleanPhone;
    await fDb
      .collection('accounts')
      .doc(accountId)
      .collection('broadcast_auto_replies')
      .doc(bcastId)
      .collection('sent_recipients')
      .doc(lockKey)
      .set(cleanForFirestore({
        contact_id: contactId || null,
        phone: rawCleanPhone || null,
        sent_at: nowIso,
      }));

    // 4. Update recipient status in Firestore
    await matchedRecipientRef.set(cleanForFirestore({
      status: 'replied',
      replied_at: nowIso,
      auto_reply_sent_at: nowIso,
    }), { merge: true }).catch(() => {});

    // 5. Update parent broadcast replied_count in Firestore
    try {
      const bcRef = fDb.collection('accounts').doc(accountId).collection('broadcasts').doc(bcastId);
      const bcDoc = await bcRef.get();
      if (bcDoc.exists) {
        const currentReplied = bcDoc.data()?.replied_count || 0;
        await bcRef.set(cleanForFirestore({
          replied_count: currentReplied + 1,
          updated_at: nowIso,
        }), { merge: true });
        await fDb.collection('broadcasts').doc(bcastId).set(cleanForFirestore({
          replied_count: currentReplied + 1,
          updated_at: nowIso,
        }), { merge: true }).catch(() => {});
      }
    } catch {}

    // 6. Personalize variables like {name}
    let replyText = autoReplyText.trim();
    const effectiveName = contactName || matchedRecipientData?.contact?.name;
    if (effectiveName) {
      replyText = replyText.replace(/\{name\}/gi, effectiveName);
    } else {
      replyText = replyText.replace(/\{name\}/gi, 'there');
    }

    // 7. Resolve destination phone number
    const targetPhone = matchedRecipientData?.contact?.phone || contactPhone;
    const sanitizedTo = sanitizePhoneForMeta(targetPhone);
    if (!sanitizedTo || !isValidE164(sanitizedTo)) {
      console.warn('[broadcast-auto-reply] Invalid phone for auto-reply:', targetPhone);
      return { replied: false };
    }

    // 8. Get WhatsApp config from Firestore and send via Meta Cloud API
    const config = await getWhatsAppConfigForAccount(accountId);
    if (!config || !config.phone_number_id || !config.decrypted_access_token) {
      console.error('[broadcast-auto-reply] WhatsApp config missing for account:', accountId);
      return { replied: false };
    }

    console.log(
      `[broadcast-auto-reply] Instantly dispatching auto-reply for broadcast "${bcastId}" to ${sanitizedTo}: "${replyText.slice(0, 50)}..."`
    );

    const sendResult = await sendTextMessage({
      phoneNumberId: config.phone_number_id,
      accessToken: config.decrypted_access_token,
      to: sanitizedTo,
      text: replyText,
    });

    // 9. Record sent auto-reply message in Firestore conversation
    if (conversationId) {
      try {
        const convRef = fDb.collection('accounts').doc(accountId).collection('conversations').doc(conversationId);
        await convRef.collection('messages').add(cleanForFirestore({
          conversation_id: conversationId,
          sender_type: 'bot',
          content_type: 'text',
          content_text: replyText,
          message_id: sendResult.messageId || null,
          status: 'sent',
          created_at: nowIso,
        }));

        await convRef.set(cleanForFirestore({
          last_message_text: replyText,
          last_message_at: nowIso,
          updatedAt: nowIso,
        }), { merge: true });
      } catch (convErr) {
        console.warn('[broadcast-auto-reply] Firestore conversation update warning:', convErr);
      }
    }

    return {
      replied: true,
      broadcastId: bcastId,
      replyText,
    };
  } catch (err: any) {
    console.error('[broadcast-auto-reply] Execution failed:', err?.message || err);
    return { replied: false };
  }
}
