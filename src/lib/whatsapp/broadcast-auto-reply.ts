import { supabaseAdmin } from '@/lib/ai/admin-client';
import { engineSendText } from '@/lib/flows/meta-send';

interface BroadcastAutoReplyCheckArgs {
  accountId: string;
  contactId: string;
  conversationId: string;
  configOwnerUserId: string;
  contactName?: string;
  inboundText?: string;
}

export interface BroadcastAutoReplyOutcome {
  replied: boolean;
  broadcastId?: string;
  replyText?: string;
}

/**
 * Checks if the incoming message is a response to a recent broadcast campaign.
 * If the broadcast has an auto-reply configured and enabled, and this recipient
 * has NOT received an auto-reply for this broadcast campaign yet, it immediately:
 *   1. Updates `broadcast_recipients.status = 'replied'`
 *   2. Sets `auto_reply_sent_at` timestamp (locking against duplicate sends)
 *   3. Dispatches the custom reply text back to the customer instantly via Meta Cloud API
 *
 * Runs non-blocking / safe: any error is logged and returns replied: false.
 */
export async function handleBroadcastAutoReplyIfEligible(
  args: BroadcastAutoReplyCheckArgs
): Promise<BroadcastAutoReplyOutcome> {
  const {
    accountId,
    contactId,
    conversationId,
    configOwnerUserId,
    contactName,
  } = args;

  try {
    const db = supabaseAdmin();

    // 1. Look for the most recent outbound broadcast recipient row for this contact
    // that was sent or delivered or read or just replied, within this account.
    const { data: recipients, error } = await db
      .from('broadcast_recipients')
      .select('id, status, auto_reply_sent_at, broadcast_id, broadcasts!inner(id, name, account_id)')
      .eq('contact_id', contactId)
      .eq('broadcasts.account_id', accountId)
      .in('status', ['sent', 'delivered', 'read', 'replied'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.warn('[broadcast-auto-reply] lookup error:', error.message);
      return { replied: false };
    }

    if (!recipients || recipients.length === 0) {
      return { replied: false };
    }

    const recipientRow = recipients[0];
    const bcast: any = recipientRow.broadcasts;

    // Flip recipient status to 'replied' if it's not already replied
    if (recipientRow.status !== 'replied') {
      await db
        .from('broadcast_recipients')
        .update({
          status: 'replied',
          replied_at: new Date().toISOString(),
        })
        .eq('id', recipientRow.id);
    }

    // 2. Resolve auto-reply configuration (Firebase Firestore Primary)
    let autoReplyEnabled = false;
    let autoReplyText = '';

    try {
      const { getAdminDb } = await import('@/lib/firebase/admin');
      const fDb = getAdminDb();
      if (fDb) {
        // Check broadcast_auto_replies collection
        const docSnap = await fDb
          .collection('accounts')
          .doc(accountId)
          .collection('broadcast_auto_replies')
          .doc(bcast.id)
          .get();

        if (docSnap.exists) {
          const fbData = docSnap.data();
          autoReplyEnabled = Boolean(fbData?.auto_reply_enabled);
          autoReplyText = fbData?.auto_reply_text || '';
        }
      }
    } catch (fbErr) {
      console.warn('[broadcast-auto-reply] Firestore lookup warning:', fbErr);
    }

    // Fallback: check broadcasts row if present
    if (!autoReplyEnabled && (bcast as any)?.auto_reply_enabled) {
      autoReplyEnabled = true;
      autoReplyText = (bcast as any)?.auto_reply_text || '';
    }

    // 3. Eligibility checks:
    if (!autoReplyEnabled || !autoReplyText.trim()) {
      return { replied: false };
    }

    // Check Firebase deduplication stamp so customer is never spammed
    let alreadyRepliedOnFirebase = false;
    try {
      const { getAdminDb } = await import('@/lib/firebase/admin');
      const fDb = getAdminDb();
      if (fDb) {
        const sentLogRef = fDb
          .collection('accounts')
          .doc(accountId)
          .collection('broadcast_auto_replies')
          .doc(bcast.id)
          .collection('sent_recipients')
          .doc(contactId);

        const sentSnap = await sentLogRef.get();
        if (sentSnap.exists) {
          alreadyRepliedOnFirebase = true;
        } else {
          await sentLogRef.set({
            contact_id: contactId,
            sent_at: new Date().toISOString(),
          });
        }
      }
    } catch {}

    if (alreadyRepliedOnFirebase || recipientRow.auto_reply_sent_at) {
      return { replied: false };
    }

    // Mark auto_reply_sent_at on recipient row if column exists
    try {
      await db
        .from('broadcast_recipients')
        .update({
          status: 'replied',
          replied_at: new Date().toISOString(),
          auto_reply_sent_at: new Date().toISOString(),
        })
        .eq('id', recipientRow.id);
    } catch {}

    // 4. Personalize variables like {name}
    let replyText = autoReplyText.trim();
    if (contactName) {
      replyText = replyText.replace(/\{name\}/gi, contactName);
    } else {
      replyText = replyText.replace(/\{name\}/gi, 'there');
    }

    console.log(
      `[broadcast-auto-reply] Instantly dispatching auto-reply for broadcast "${bcast.name}" to contact ${contactId}: "${replyText.slice(0, 50)}..."`
    );

    // 5. Send message via Meta Cloud API engineSendText
    await engineSendText({
      accountId,
      userId: configOwnerUserId,
      contactId,
      conversationId,
      text: replyText,
    });

    return {
      replied: true,
      broadcastId: bcast.id,
      replyText,
    };
  } catch (err: any) {
    console.error('[broadcast-auto-reply] Execution failed:', err?.message || err);
    return { replied: false };
  }
}
