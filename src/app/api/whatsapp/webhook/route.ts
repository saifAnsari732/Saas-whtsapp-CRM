import { NextResponse, after } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminDb, cleanForFirestore } from '@/lib/firebase/admin'
import { decrypt, encrypt, isLegacyFormat } from '@/lib/whatsapp/encryption'
import { getMediaUrl, downloadMedia } from '@/lib/whatsapp/meta-api'
import { normalizePhone } from '@/lib/whatsapp/phone-utils'
import { findExistingContact, isUniqueViolation } from '@/lib/contacts/dedupe'
import { verifyMetaWebhookSignature } from '@/lib/whatsapp/webhook-signature'
import { runAutomationsForTrigger } from '@/lib/automations/engine'
import { dispatchInboundToFlows } from '@/lib/flows/engine'
import { dispatchKeywordFlow } from '@/lib/keyword-flows/engine'
import { dispatchInboundToAiReply } from '@/lib/ai/auto-reply'
import { dispatchWebhookEvent } from '@/lib/webhooks/deliver'
import {
  handleTemplateWebhookChange,
  isTemplateWebhookField,
} from '@/lib/whatsapp/template-webhook'
import { handleBroadcastAutoReplyIfEligible } from '@/lib/whatsapp/broadcast-auto-reply'

// The `after()` callback in POST runs within this route's max duration.
// Inbound processing can fan out to per-media Meta verification calls, so
// give it headroom beyond the platform default (Vercel clamps this to the
// plan's ceiling). Tune as needed.
export const maxDuration = 60

// Lazy-initialized to avoid build-time crash when env vars are missing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _adminClient: any = null
function supabaseAdmin() {
  if (!_adminClient) {
    _adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _adminClient
}

function resolveAccessToken(rawToken: string): string {
  if (!rawToken) return '';
  if (rawToken.startsWith('EAAG') || rawToken.startsWith('EAA')) return rawToken;
  try {
    return decrypt(rawToken);
  } catch {
    return rawToken;
  }
}

async function findWhatsAppConfigByPhoneNumberId(phoneNumberId: string) {
  const fDb = getAdminDb();
  if (fDb) {
    try {
      // 1. Direct query in whatsapp_configs
      const snap = await fDb
        .collection('whatsapp_configs')
        .where('phone_number_id', '==', phoneNumberId)
        .limit(1)
        .get();

      if (!snap.empty) {
        const d = snap.docs[0].data();
        return {
          id: snap.docs[0].id,
          account_id: d.account_id || snap.docs[0].id,
          user_id: d.user_id || 'system',
          phone_number_id: d.phone_number_id,
          access_token: d.access_token || d.system_user_token || '',
          verify_token: d.verify_token || null,
        };
      }

      // 1b. Scan all whatsapp_configs docs in case phone_number_id type or field casing differs
      const allConfigs = await fDb.collection('whatsapp_configs').get();
      for (const cDoc of allConfigs.docs) {
        const d = cDoc.data();
        const pId = String(d.phone_number_id || d.phoneNumberId || '');
        if (pId && (pId === String(phoneNumberId) || pId.replace(/\D/g, '') === String(phoneNumberId).replace(/\D/g, ''))) {
          return {
            id: cDoc.id,
            account_id: d.account_id || cDoc.id,
            user_id: d.user_id || 'system',
            phone_number_id: d.phone_number_id || d.phoneNumberId,
            access_token: d.access_token || d.system_user_token || '',
            verify_token: d.verify_token || null,
          };
        }
      }

      // 2. Scan accounts nested configs
      const accSnap = await fDb.collection('accounts').get();
      for (const aDoc of accSnap.docs) {
        const nested = await fDb.doc(`accounts/${aDoc.id}/whatsapp_config/config`).get();
        if (nested.exists) {
          const nData = nested.data();
          if (nData) {
            const pId = String(nData.phone_number_id || nData.phoneNumberId || '');
            if (pId && (pId === String(phoneNumberId) || pId.replace(/\D/g, '') === String(phoneNumberId).replace(/\D/g, ''))) {
              return {
                id: aDoc.id,
                account_id: aDoc.id,
                user_id: nData.user_id || 'system',
                phone_number_id: nData.phone_number_id || nData.phoneNumberId,
                access_token: nData.access_token || nData.system_user_token || '',
                verify_token: nData.verify_token || null,
              };
            }
          }
        }
      }
    } catch (err) {
      console.warn('[webhook] Firestore config lookup warning:', err);
    }
  }

  // 3. Fallback to Supabase
  try {
    const { data: configRows } = await supabaseAdmin()
      .from('whatsapp_config')
      .select('*')
      .eq('phone_number_id', phoneNumberId);

    if (configRows && configRows.length > 0) {
      return configRows[0];
    }
  } catch {}

  return null;
}

interface WhatsAppMessage {
  id: string
  from: string
  timestamp: string
  type: string
  text?: { body: string }
  image?: { id: string; mime_type: string; caption?: string }
  video?: { id: string; mime_type: string; caption?: string }
  document?: { id: string; mime_type: string; filename?: string; caption?: string }
  audio?: { id: string; mime_type: string }
  sticker?: { id: string; mime_type: string }
  location?: { latitude: number; longitude: number; name?: string; address?: string }
  reaction?: { message_id: string; emoji: string }
  /** Present when a customer taps a QUICK_REPLY button on a template message. */
  button?: { payload: string; text: string }
  /**
   * Set when the customer taps a button or list row on an interactive
   * message we sent. `button_reply.id` / `list_reply.id` is whatever id
   * we put on the button/row when sending — the Flows engine uses this
   * to advance the per-contact run.
   */
  interactive?: {
    type: 'button_reply' | 'list_reply'
    button_reply?: { id: string; title: string }
    list_reply?: { id: string; title: string; description?: string }
  }
  /** Present when the customer swipe-replies to one of our messages. */
  context?: { id: string }
}

interface WhatsAppWebhookEntry {
  id: string
  changes: Array<{
    value: {
      messaging_product: string
      metadata: {
        display_phone_number: string
        phone_number_id: string
      }
      contacts?: Array<{
        profile: { name: string }
        wa_id: string
      }>
      messages?: WhatsAppMessage[]
      statuses?: Array<{
        id: string
        status: string
        timestamp: string
        recipient_id: string
      }>
    }
    field: string
  }>
}

// GET - Webhook verification
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('hub.mode')
    const challenge = searchParams.get('hub.challenge')
    const verifyToken = searchParams.get('hub.verify_token')

    if (mode !== 'subscribe' || !challenge || !verifyToken) {
      return NextResponse.json(
        { error: 'Missing verification parameters' },
        { status: 400 }
      )
    }

    // Check against env token first (fallback / initial setup)
    const envVerifyToken = process.env.META_VERIFY_TOKEN || process.env.meta_verify_token || 'saifansari123'
    if (verifyToken === envVerifyToken) {
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    // Check Firestore configs
    const fDb = getAdminDb();
    if (fDb) {
      try {
        const topConfigs = await fDb.collection('whatsapp_configs').get();
        for (const doc of topConfigs.docs) {
          const d = doc.data();
          const vt = d.verify_token || d.verifyToken;
          if (vt) {
            let dec = vt;
            try { dec = decrypt(vt); } catch {}
            if (dec === verifyToken || vt === verifyToken) {
              return new Response(challenge, {
                status: 200,
                headers: { 'Content-Type': 'text/plain' },
              });
            }
          }
        }
      } catch (fErr) {
        console.warn('[webhook GET] Firestore verify check warning:', fErr);
      }
    }

    return NextResponse.json(
      { error: 'Verification token mismatch' },
      { status: 403 }
    )
  } catch (error) {
    console.error('Error in webhook GET verification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Receive messages
export async function POST(request: Request) {
  // Read raw body first so we can HMAC-verify the exact bytes Meta
  // signed. request.json() would re-encode and break the signature.
  const rawBody = await request.text()
  const signature = request.headers.get('x-hub-signature-256')

  const appSecret = process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET;
  if (appSecret) {
    if (!verifyMetaWebhookSignature(rawBody, signature)) {
      console.warn('[webhook] rejected request with invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  } else {
    console.warn('[webhook] META_APP_SECRET not configured — skipping HMAC signature verification');
  }

  let body: { entry?: WhatsAppWebhookEntry[] }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Process AFTER the response so we ack Meta within their ~20s timeout
  // (a slow ack triggers Meta retries + duplicate inserts), while still
  // guaranteeing the work runs to completion.
  //
  // This MUST use `after()` rather than a detached `processWebhook(body)`
  // promise: on serverless platforms (we run on Vercel) the function can
  // be frozen or terminated the moment the response is sent, so a floating
  // promise's DB writes are not guaranteed to finish. That dropped a
  // non-deterministic *subset* of inbound messages — contacts/conversations
  // were created but the message insert never landed, leaving conversations
  // that show in the inbox with an empty thread, and no logs to explain it
  // (see issue #301). `after()` hands the callback to the runtime, which
  // keeps the function alive until it resolves (within the route's
  // maxDuration).
  try {
    await processWebhook(body)
  } catch (error) {
    console.error('Error processing webhook:', error)
  }

  return NextResponse.json({ status: 'received' }, { status: 200 })
}

async function processWebhook(body: { entry?: WhatsAppWebhookEntry[] }) {
  if (!body.entry) return

  for (const entry of body.entry) {
    for (const change of entry.changes) {
      // Template-lifecycle events (status / quality / components
      // updates from Meta) come in on a different change.field and
      // have a different value shape — route them through the
      // dedicated handler. Skip the messaging branches below so we
      // don't try to read message-shaped fields off a template event.
      if (isTemplateWebhookField(change.field)) {
        await handleTemplateWebhookChange(
          { field: change.field, value: change.value as unknown },
          supabaseAdmin(),
        )
        continue
      }

      const value = change.value

      // Handle status updates
      if (value.statuses) {
        for (const status of value.statuses) {
          await handleStatusUpdate(status)
        }
      }

      // Handle incoming messages
      if (!value.messages || !value.contacts) continue

      const phoneNumberId = value.metadata.phone_number_id

      let config: any = await findWhatsAppConfigByPhoneNumberId(phoneNumberId)
      if (!config) {
        console.error('No config found for phone_number_id:', phoneNumberId)
        continue
      }

      const decryptedAccessToken = resolveAccessToken(config.access_token)

      for (let i = 0; i < value.messages.length; i++) {
        const message = value.messages[i]
        const contact = value.contacts[i] || value.contacts[0]

        await processMessage(
          message,
          contact,
          // Tenancy — drives every contact / conversation lookup
          // and the engines' active-row dispatch.
          config.account_id,
          // Audit / sender-of-record — used as the user_id on row
          // inserts that need it for NOT NULL FK compliance. Always
          // the admin who saved the WhatsApp config.
          config.user_id,
          decryptedAccessToken
        )
      }
    }
  }
}

// The happy-path status ladder — pending → sent → delivered → read →
// replied. Webhook replays must never regress a recipient back down
// this ladder.
//
// `failed` is NOT on this ladder. It's a terminal side branch that is
// only valid from the early states (pending / sent) — once Meta has
// delivered or the user has read or replied, a later "failed" status
// event is a bug in Meta's pipeline or a spoof attempt and must be
// ignored.
const RECIPIENT_STATUS_LADDER = [
  'pending',
  'sent',
  'delivered',
  'read',
  'replied',
] as const

function ladderLevel(s: string): number {
  const idx = (RECIPIENT_STATUS_LADDER as readonly string[]).indexOf(s)
  return idx < 0 ? -1 : idx
}

/**
 * Can a recipient transition from `current` to `incoming`?
 *   - Along the ladder, only forward moves are allowed.
 *   - `failed` is accepted only from `pending` or `sent`; it's refused
 *     once the recipient has reached any of the success states.
 */
function isValidStatusTransition(current: string, incoming: string): boolean {
  if (incoming === 'failed') {
    return current === 'pending' || current === 'sent'
  }
  if (current === 'failed') {
    return false // failed is terminal
  }
  const ci = ladderLevel(current)
  const ii = ladderLevel(incoming)
  if (ii < 0) return false // unknown incoming status
  if (ci < 0) return true // unknown current — accept anything on the ladder
  return ii > ci
}

async function handleFirestoreStatusUpdate(status: {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
}) {
  const fDb = getAdminDb();
  if (!fDb) return;
  try {
    const tsIso = new Date(parseInt(status.timestamp) * 1000).toISOString();

    // 1. Direct key-value lookup by Meta message ID (No index or collectionGroup required)
    let lookupData: any = null;
    try {
      const lookupDoc = await fDb.collection('whatsapp_message_lookups').doc(status.id).get();
      if (lookupDoc.exists) {
        lookupData = lookupDoc.data();
      }
    } catch (lErr) {
      console.warn('[webhook] message lookup warning:', lErr);
    }

    if (lookupData) {
      const { broadcast_id, recipient_id, account_id } = lookupData;
      if (broadcast_id && recipient_id && account_id) {
        const recRef = fDb
          .collection('accounts')
          .doc(account_id)
          .collection('broadcasts')
          .doc(broadcast_id)
          .collection('recipients')
          .doc(recipient_id);

        const recDoc = await recRef.get();
        if (recDoc.exists) {
          const recData = recDoc.data();
          if (isValidStatusTransition(recData?.status || 'pending', status.status)) {
            const updateData: Record<string, any> = {
              status: status.status,
              updated_at: tsIso,
            };
            if (status.status === 'delivered') updateData.delivered_at = tsIso;
            if (status.status === 'read') updateData.read_at = tsIso;
            if (status.status === 'failed') {
              updateData.error_message = (status as any).errors?.[0]?.message || 'Delivery failed';
            }

            await recRef.set(cleanForFirestore(updateData), { merge: true });

            // Update parent broadcast stats in Firestore
            const bcastRef = fDb.collection('accounts').doc(account_id).collection('broadcasts').doc(broadcast_id);
            const bDoc = await bcastRef.get();
            if (bDoc.exists) {
              const bData = bDoc.data();
              const updateBcast: Record<string, any> = { updated_at: tsIso };
              if (status.status === 'delivered') {
                updateBcast.delivered_count = (bData?.delivered_count || 0) + 1;
              } else if (status.status === 'read') {
                updateBcast.read_count = (bData?.read_count || 0) + 1;
              } else if (status.status === 'failed') {
                updateBcast.failed_count = (bData?.failed_count || 0) + 1;
              }
              await Promise.allSettled([
                bcastRef.set(cleanForFirestore(updateBcast), { merge: true }),
                fDb.collection('broadcasts').doc(broadcast_id).set(cleanForFirestore(updateBcast), { merge: true }),
              ]);
              console.log(`[webhook] Real-time status '${status.status}' updated for broadcast ${broadcast_id}, recipient ${recipient_id}`);
            }
          }
        }
        return;
      }
    }

    // Fallback: If not in lookup, check top-level broadcast_recipients
    try {
      const topRecSnap = await fDb
        .collection('broadcast_recipients')
        .where('whatsapp_message_id', '==', status.id)
        .limit(1)
        .get();

      if (!topRecSnap.empty) {
        const topDoc = topRecSnap.docs[0];
        const topData = topDoc.data();
        if (isValidStatusTransition(topData.status || 'pending', status.status)) {
          const updateData: Record<string, any> = {
            status: status.status,
            updated_at: tsIso,
          };
          if (status.status === 'delivered') updateData.delivered_at = tsIso;
          if (status.status === 'read') updateData.read_at = tsIso;
          await topDoc.ref.set(cleanForFirestore(updateData), { merge: true });
        }
      }
    } catch {}
  } catch (err) {
    console.warn('[webhook] Firestore status update warning:', err);
  }
}

async function handleStatusUpdate(status: {
  id: string
  status: string
  timestamp: string
  recipient_id: string
}) {
  await handleFirestoreStatusUpdate(status);

  try {
    await supabaseAdmin()
      .from('messages')
      .update({ status: status.status })
      .eq('message_id', status.id)
  } catch {}

  const tsIso = new Date(parseInt(status.timestamp) * 1000).toISOString()
  try {
    const { data: recipient } = await supabaseAdmin()
      .from('broadcast_recipients')
      .select('id, status')
      .eq('whatsapp_message_id', status.id)
      .maybeSingle()

    if (recipient && isValidStatusTransition(recipient.status, status.status)) {
      const update: Record<string, unknown> = { status: status.status }
      if (status.status === 'failed' && (status as any).errors && (status as any).errors.length > 0) {
        update.error_message = (status as any).errors[0].message || (status as any).errors[0].title || JSON.stringify((status as any).errors[0]);
      }
      if (status.status === 'sent' && !('sent_at' in update)) update.sent_at = tsIso
      if (status.status === 'delivered') update.delivered_at = tsIso
      if (status.status === 'read') update.read_at = tsIso

      await supabaseAdmin()
        .from('broadcast_recipients')
        .update(update)
        .eq('id', recipient.id)
    }
  } catch {}

  // 3) Webhook fan-out for messages we store (inbox / API sends).
  //    Runs last so a slow subscriber can't delay the mirrors above.
  //    Bounded to one row (message_id isn't unique) purely to resolve
  //    the owning account for delivery.
  const { data: msgRow } = await supabaseAdmin()
    .from('messages')
    .select('conversation_id, conversations(account_id)')
    .eq('message_id', status.id)
    .limit(1)
    .maybeSingle()

  if (msgRow) {
    const conv = msgRow.conversations as { account_id: string } | null
    const accountId = conv?.account_id
    if (accountId) {
      await dispatchWebhookEvent(
        supabaseAdmin(),
        accountId,
        'message.status_updated',
        {
          whatsapp_message_id: status.id,
          conversation_id: msgRow.conversation_id,
          status: status.status,
        }
      )
    }
  }
}

/**
 * Real-time reply tracking for broadcasts in Firebase Firestore.
 * When a customer texts back or swipe-replies to a broadcast, we find the matching
 * recipient record, transition their status to 'replied', and bump the broadcast's
 * `replied_count` in real-time.
 */
async function flagBroadcastReplyInFirestore(
  accountId: string,
  contactId: string,
  senderPhone: string,
  metaMessageId?: string,
  replyContextId?: string
) {
  const fDb = getAdminDb();
  if (!fDb) return;
  try {
    let matchedLookup: any = null;

    // 1. If customer swipe-replied directly to our message, context.id is our message_id
    if (replyContextId) {
      try {
        const snap = await fDb.collection('whatsapp_message_lookups').doc(replyContextId).get();
        if (snap.exists) {
          matchedLookup = snap.data();
        }
      } catch {}
    }

    // 2. Lookup by accountId + normalized phone
    const cleanPhone = senderPhone.replace(/[^0-9]/g, '');
    if (!matchedLookup && cleanPhone) {
      try {
        const snap = await fDb.collection('whatsapp_contact_last_broadcast').doc(`${accountId}_${cleanPhone}`).get();
        if (snap.exists) {
          matchedLookup = snap.data();
        }
      } catch {}
    }

    // 3. Lookup by accountId + contactId
    if (!matchedLookup && contactId) {
      try {
        const snap = await fDb.collection('whatsapp_contact_last_broadcast').doc(`${accountId}_${contactId}`).get();
        if (snap.exists) {
          matchedLookup = snap.data();
        }
      } catch {}
    }

    if (matchedLookup?.broadcast_id && matchedLookup?.recipient_id) {
      const { broadcast_id, recipient_id } = matchedLookup;
      const recRef = fDb
        .collection('accounts')
        .doc(accountId)
        .collection('broadcasts')
        .doc(broadcast_id)
        .collection('recipients')
        .doc(recipient_id);

      const recDoc = await recRef.get();
      if (recDoc.exists) {
        const recData = recDoc.data();
        if (recData?.status !== 'replied') {
          const nowIso = new Date().toISOString();
          await recRef.set(cleanForFirestore({
            status: 'replied',
            replied_at: nowIso,
            updated_at: nowIso,
          }), { merge: true });

          // Update broadcast replied count
          const bcastRef = fDb.collection('accounts').doc(accountId).collection('broadcasts').doc(broadcast_id);
          const bDoc = await bcastRef.get();
          if (bDoc.exists) {
            const bData = bDoc.data();
            const currentReplied = (bData?.replied_count || 0) + 1;
            const bcastUpdate = cleanForFirestore({
              replied_count: currentReplied,
              updated_at: nowIso,
            });
            await Promise.allSettled([
              bcastRef.set(bcastUpdate, { merge: true }),
              fDb.collection('broadcasts').doc(broadcast_id).set(bcastUpdate, { merge: true }),
            ]);
            console.log(`[webhook] Real-time customer REPLY recorded for broadcast ${broadcast_id}, recipient ${recipient_id}`);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[webhook] Error flagging broadcast reply in Firestore:', err);
  }
}

/**
 * If an inbound message's sender is on a still-unreplied
 * broadcast_recipients row, flip it to `replied` so the reply count
 * advances on the parent broadcast.
 *
 * Runs on a best-effort basis — failures here must not break the
 * main inbound-message flow, so errors are swallowed with a log.
 */
async function flagBroadcastReplyIfAny(
  accountId: string,
  contactId: string,
  senderPhone?: string,
  metaMessageId?: string,
  replyContextId?: string
) {
  // 1. Primary: Firestore real-time reply tracking
  await flagBroadcastReplyInFirestore(
    accountId,
    contactId,
    senderPhone || '',
    metaMessageId,
    replyContextId
  );

  // 2. Optional Supabase mirror
  try {
    const { data: recs, error } = await supabaseAdmin()
      .from('broadcast_recipients')
      .select('id, status, broadcast_id, broadcasts!inner(account_id)')
      .eq('contact_id', contactId)
      .eq('broadcasts.account_id', accountId)
      .in('status', ['sent', 'delivered', 'read'])
      .order('created_at', { ascending: false })
      .limit(1)

    if (error || !recs || recs.length === 0) return

    const row = recs[0]
    const { error: updErr } = await supabaseAdmin()
      .from('broadcast_recipients')
      .update({ status: 'replied', replied_at: new Date().toISOString() })
      .eq('id', row.id)

    if (updErr) {
      console.error('Error marking broadcast recipient replied in Supabase:', updErr)
    }
  } catch (err) {
    // Non-blocking
  }
}

/**
 * Resolve a Meta-side message_id into the matching internal UUID, scoped
 * to one conversation. Returns null when we never received the parent
 * (e.g. a swipe-reply to a message older than this CRM install).
 */
async function lookupInternalIdByMetaId(
  metaId: string,
  conversationId: string
): Promise<string | null> {
  const { data, error } = await supabaseAdmin()
    .from('messages')
    .select('id')
    .eq('message_id', metaId)
    .eq('conversation_id', conversationId)
    .maybeSingle()
  if (error) {
    console.error('[webhook] lookupInternalIdByMetaId failed:', error.message)
    return null
  }
  return data?.id ?? null
}

/**
 * Persist an inbound reaction. WhatsApp reactions are not new messages —
 * they're per-(target, actor) state. We upsert / delete on
 * `message_reactions`, never write a row into `messages`.
 *
 * Best-effort: a missing parent (we never received it) is logged and
 * skipped so the webhook still acks 200 to Meta.
 */
async function handleReaction(
  message: WhatsAppMessage,
  conversationId: string,
  contactId: string
) {
  const reaction = message.reaction
  if (!reaction?.message_id) return

  const targetInternalId = await lookupInternalIdByMetaId(
    reaction.message_id,
    conversationId
  )
  if (!targetInternalId) {
    console.warn(
      '[webhook] reaction target message not found; skipping',
      reaction.message_id
    )
    return
  }

  // Empty emoji = removal (per Meta's Cloud API spec).
  if (!reaction.emoji) {
    const { error: delError } = await supabaseAdmin()
      .from('message_reactions')
      .delete()
      .eq('message_id', targetInternalId)
      .eq('actor_type', 'customer')
      .eq('actor_id', contactId)
    if (delError) {
      console.error('[webhook] reaction delete failed:', delError.message)
    }
    return
  }

  const { error: upsertError } = await supabaseAdmin()
    .from('message_reactions')
    .upsert(
      {
        message_id: targetInternalId,
        conversation_id: conversationId,
        actor_type: 'customer',
        actor_id: contactId,
        emoji: reaction.emoji,
      },
      { onConflict: 'message_id,actor_type,actor_id' }
    )
  if (upsertError) {
    console.error('[webhook] reaction upsert failed:', upsertError.message)
  }
}

async function processMessage(
  message: WhatsAppMessage,
  contact: { profile: { name: string }; wa_id: string },
  // Tenancy. Resolved from the matched whatsapp_config row; every
  // contact / conversation / message row created downstream is
  // stamped with this so any member of the account can see it.
  accountId: string,
  // Sender-of-record for inserts that need a NOT NULL user_id FK
  // (contacts, conversations). Always the admin who saved the
  // WhatsApp config; the choice is arbitrary post-017 but stable.
  configOwnerUserId: string,
  accessToken: string
) {
  const senderPhone = normalizePhone(message.from)
  const contactName = contact.profile.name

  // Find or create contact
  const contactOutcome = await findOrCreateContact(
    accountId,
    configOwnerUserId,
    senderPhone,
    contactName
  )
  if (!contactOutcome) return
  const contactRecord = contactOutcome.contact

  // Find or create conversation
  const convResult = await findOrCreateConversation(
    accountId,
    configOwnerUserId,
    contactRecord.id
  )
  if (!convResult) return
  const conversation = convResult.conversation

  // Emit conversation.created as soon as the thread is opened — BEFORE
  // the reaction short-circuit below — so a conversation first opened by
  // a reaction still fires the event, and a subscriber always sees the
  // thread open before its first message.received.
  if (convResult.created) {
    await dispatchWebhookEvent(supabaseAdmin(), accountId, 'conversation.created', {
      conversation_id: conversation.id,
      contact_id: contactRecord.id,
    })
  }

  // Reactions short-circuit here — they aren't messages. We never insert
  // into `messages`, never bump unread_count, never update last_message_text.
  // Done before parseMessageContent so the media-URL fetch is skipped.
  if (message.type === 'reaction') {
    await handleReaction(message, conversation.id, contactRecord.id)
    return
  }

  // Parse message content based on type
  const { contentText, mediaUrl, mediaType, interactiveReplyId } =
    await parseMessageContent(message, accessToken)

  // Resolve swipe-reply context if present. A missing parent is fine —
  // we just store NULL and the UI renders the message without a quote.
  let replyToInternalId: string | null = null
  if (message.context?.id) {
    replyToInternalId = await lookupInternalIdByMetaId(
      message.context.id,
      conversation.id
    )
    if (!replyToInternalId) {
      console.warn(
        '[webhook] reply context parent not found:',
        message.context.id
      )
    }
  }

  // Insert message — field names MUST match the messages table schema
  // (see supabase/migrations/001_initial_schema.sql):
  //   conversation_id, sender_type, content_type, content_text,
  //   media_url, template_name, message_id, status, created_at
  // `mediaType` is intentionally unused — the schema has no media_type
  // column; the MIME type is only used to construct the proxy URL during
  // parseMessageContent. Silence the unused-var warning:
  void mediaType

  // The messages.content_type CHECK constraint (widened in migration 010
  // to add 'interactive' for button/list taps) allows:
  //   text, image, document, audio, video, location, template, interactive
  // Map incoming WhatsApp types that aren't in that list to the closest
  // allowed value so the INSERT doesn't fail with a constraint error.
  const ALLOWED_CONTENT_TYPES = new Set([
    'text', 'image', 'document', 'audio', 'video',
    'location', 'template', 'interactive',
  ])
  const contentType = ALLOWED_CONTENT_TYPES.has(message.type)
    ? message.type
    : message.type === 'sticker'
      ? 'image'   // stickers are images
      : 'text'    // reaction, unknown → text fallback

  // Determine whether this is the contact's very first inbound message
  // BEFORE we insert, so the count is accurate. Covers the case where
  // the contact row already exists (manual add / CSV import) but they've
  // never messaged us before — which new_contact_created wouldn't catch.
  let isFirstInboundMessage = false
  const fDb = getAdminDb()
  if (fDb) {
    try {
      const priorSnap = await fDb
        .collection('accounts')
        .doc(accountId)
        .collection('conversations')
        .doc(conversation.id)
        .collection('messages')
        .where('sender_type', '==', 'customer')
        .limit(1)
        .get()
      isFirstInboundMessage = priorSnap.empty
    } catch (fsErr) {
      console.warn('[webhook] Firestore prior customer msg check warning:', fsErr)
    }
  } else {
    try {
      const { count: priorCustomerMsgCount } = await supabaseAdmin()
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conversation.id)
        .eq('sender_type', 'customer')
      isFirstInboundMessage = (priorCustomerMsgCount ?? 0) === 0
    } catch {}
  }

  // Primary: Store message in Firebase Firestore
  if (fDb) {
    try {
      const convRef = fDb.collection('accounts').doc(accountId).collection('conversations').doc(conversation.id);
      const nowIso = new Date().toISOString();

      await convRef.collection('messages').add(cleanForFirestore({
        conversation_id: conversation.id,
        sender_type: 'customer',
        content_type: contentType,
        content_text: contentText,
        media_url: mediaUrl,
        message_id: message.id,
        status: 'delivered',
        created_at: nowIso,
      }));

      await convRef.set(cleanForFirestore({
        last_message_text: contentText || `[${message.type}]`,
        last_message_at: nowIso,
        unread_count: ((conversation.unread_count || 0) + 1),
        updatedAt: nowIso,
      }), { merge: true });
    } catch (fsMsgErr) {
      console.warn('[webhook] Firestore message write warning:', fsMsgErr);
    }
  }

  // Non-blocking mirror to Supabase if reachable
  try {
    await supabaseAdmin().from('messages').insert({
      conversation_id: conversation.id,
      sender_type: 'customer',
      content_type: contentType,
      content_text: contentText,
      media_url: mediaUrl,
      message_id: message.id,
      status: 'delivered',
      created_at: new Date(parseInt(message.timestamp) * 1000).toISOString(),
      reply_to_message_id: replyToInternalId,
      interactive_reply_id: interactiveReplyId,
    });

    await supabaseAdmin()
      .from('conversations')
      .update({
        last_message_text: contentText || `[${message.type}]`,
        last_message_at: new Date().toISOString(),
        unread_count: (conversation.unread_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversation.id);
  } catch {}

  // Real-time reply tracking: Mark broadcast recipient as 'replied' and bump replied_count
  await flagBroadcastReplyIfAny(
    accountId,
    contactRecord.id,
    senderPhone,
    message.id,
    message.context?.id
  );

  const inboundText = contentText ?? message.text?.body ?? ''
  let flowConsumed = false

  // ============================================================
  // 1. PRIMARY: Keyword Flow Dispatch (Firebase Firestore Native)
  //
  // Checked immediately so custom keyword triggers (e.g. "hii" -> "txxx")
  // execute instantly with zero delay and zero Supabase dependency.
  // ============================================================
  if (inboundText) {
    try {
      console.log(`[webhook] Checking keyword flow for text: "${inboundText}" on account: ${accountId}`);
      const kfResult = await dispatchKeywordFlow({
        accountId,
        configOwnerUserId,
        contactId: contactRecord.id,
        contactPhone: senderPhone,
        conversationId: conversation.id,
        inboundText,
      })
      if (kfResult.consumed) {
        flowConsumed = true;
        console.log(`[webhook] Keyword flow CONSUMED message with keyword: "${kfResult.matchedKeyword}"`);
      }
    } catch (kfErr) {
      console.error('[webhook] Error in dispatchKeywordFlow:', kfErr);
    }
  }

  // ============================================================
  // 2. Broadcast Auto-Reply
  // If contact was a recent broadcast recipient and broadcast has
  // an automated custom reply configured.
  // ============================================================
  if (!flowConsumed) {
    try {
      const broadcastAutoReplyResult = await handleBroadcastAutoReplyIfEligible({
        accountId,
        contactId: contactRecord.id,
        contactPhone: senderPhone,
        conversationId: conversation.id,
        configOwnerUserId,
        contactName,
        inboundText,
      })
      if (broadcastAutoReplyResult.replied) {
        flowConsumed = true
      }
    } catch (barErr) {
      console.warn('[webhook] Broadcast auto-reply warning:', barErr)
    }
  }

  // ============================================================
  // 3. Visual Flow Runner Dispatch (Secondary / fallback)
  // ============================================================
  if (!flowConsumed) {
    try {
      const flowResult = await dispatchInboundToFlows({
        accountId,
        userId: configOwnerUserId,
        contactId: contactRecord.id,
        conversationId: conversation.id,
        message:
          interactiveReplyId
            ? {
                kind: 'interactive_reply',
                reply_id: interactiveReplyId,
                reply_title: contentText ?? '',
                meta_message_id: message.id,
              }
            : {
                kind: 'text',
                text: inboundText,
                meta_message_id: message.id,
              },
        isFirstInboundMessage,
      })
      if (flowResult.consumed) {
        flowConsumed = true
      }
    } catch (flowErr) {
      console.warn('[webhook] Visual flow runner warning:', flowErr)
    }
  }

  // Fire any automations that react to this webhook event. All dispatches
  // run here (not earlier) so the contact, conversation, and inbound
  // message all exist before any step — including send_message — runs.
  // Fire-and-forget: a slow or failing automation must not block the
  // webhook's 200 OK response to Meta.
  // webhook's 200 OK response to Meta.
  const automationTriggers: (
    | 'new_contact_created'
    | 'first_inbound_message'
    | 'new_message_received'
    | 'keyword_match'
    | 'interactive_reply'
  )[] = []
  // Content-level triggers are suppressed when a flow consumed the
  // message — see the comment block above.
  if (!flowConsumed) {
    automationTriggers.push('new_message_received', 'keyword_match')
    // Interactive tap → fire the interactive_reply trigger too (only
    // meaningful when a button/list reply actually arrived). Enables
    // automation-only chained menus; when a Flow owns the menu it will
    // have consumed the reply and this is skipped.
    if (interactiveReplyId) {
      automationTriggers.push('interactive_reply')
    }
  }
  // new_contact_created fires only when the webhook just auto-created the
  // contact row. first_inbound_message fires whenever this is the contact's
  // first-ever customer-sent message — a superset that also catches
  // manually-imported contacts sending for the first time. We dispatch both
  // so users can pick whichever semantic they want; an automation that
  // listens to only one trigger runs only when that trigger matches.
  if (contactOutcome.wasCreated) automationTriggers.unshift('new_contact_created')
  if (isFirstInboundMessage) automationTriggers.unshift('first_inbound_message')
  for (const triggerType of automationTriggers) {
    runAutomationsForTrigger({
      accountId,
      triggerType,
      contactId: contactRecord.id,
      context: {
        message_text: inboundText,
        conversation_id: conversation.id,
        // Only set on interactive taps; drives the interactive_reply
        // trigger's exact-id match.
        interactive_reply_id: interactiveReplyId ?? undefined,
      },
    }).catch((err) => console.error('[automations] dispatch failed:', err))
  }

  // AI auto-reply. Runs only for plain-text inbound the deterministic
  // flow runner did NOT consume (flows win over the LLM), and only when
  // the account has enabled it. Awaited inside `after()` (same reason as
  // the webhook dispatch below); `dispatchInboundToAiReply` owns its
  // eligibility gates + try/catch and never throws.
  if (!flowConsumed && inboundText.trim()) {
    await dispatchInboundToAiReply({
      accountId,
      conversationId: conversation.id,
      contactId: contactRecord.id,
      configOwnerUserId,
    })
  }

  // message.received webhook (public API). Awaited — not fire-and-forget
  // — because we're inside the route's `after()` block, which only keeps
  // the function alive for promises it can see; a detached promise could
  // be frozen before it delivers. `dispatchWebhookEvent` early-exits
  // when the account has no matching endpoint and never throws.
  // (conversation.created is emitted earlier, right after the thread is
  // opened.)
  await dispatchWebhookEvent(supabaseAdmin(), accountId, 'message.received', {
    conversation_id: conversation.id,
    contact_id: contactRecord.id,
    whatsapp_message_id: message.id,
    content_type: contentType,
    text: contentText,
  })
}

async function parseMessageContent(
  message: WhatsAppMessage,
  accessToken: string
): Promise<{
  contentText: string | null
  mediaUrl: string | null
  mediaType: string | null
  /**
   * For interactive button / list replies: the stable id of the tapped
   * option (whatever we put on the button when sending). Used by the
   * Flows engine to advance the per-contact run; persisted to
   * `messages.interactive_reply_id` so the inbox bubble can render the
   * tap with the right affordance. Null for everything else.
   */
  interactiveReplyId: string | null
}> {
  // getMediaUrl signature is (mediaId, accessToken) — earlier code had
  // the args swapped, so every verification hit an invalid Meta URL and
  // fell through to the catch block, leaving mediaUrl as null. That's
  // why images showed up as empty bubbles in the inbox.
  const verifyAndBuildUrl = async (
    mediaId: string
  ): Promise<string | null> => {
    try {
      await getMediaUrl({ mediaId, accessToken })
      return `/api/whatsapp/media/${mediaId}`
    } catch (error) {
      console.error(
        `Failed to verify media ${mediaId} with Meta:`,
        error instanceof Error ? error.message : error
      )
      return null
    }
  }

  // Default shape — each case overrides only the fields it cares about.
  // Keeps the new `interactiveReplyId` field DRY across every return site.
  const empty = {
    contentText: null,
    mediaUrl: null,
    mediaType: null,
    interactiveReplyId: null,
  }

  switch (message.type) {
    case 'text':
      return { ...empty, contentText: message.text?.body || null }

    case 'image':
      if (message.image?.id) {
        return {
          ...empty,
          contentText: message.image.caption || null,
          mediaUrl: await verifyAndBuildUrl(message.image.id),
          mediaType: message.image.mime_type,
        }
      }
      return empty

    case 'video':
      if (message.video?.id) {
        return {
          ...empty,
          contentText: message.video.caption || null,
          mediaUrl: await verifyAndBuildUrl(message.video.id),
          mediaType: message.video.mime_type,
        }
      }
      return empty

    case 'document':
      if (message.document?.id) {
        return {
          ...empty,
          contentText:
            message.document.caption || message.document.filename || null,
          mediaUrl: await verifyAndBuildUrl(message.document.id),
          mediaType: message.document.mime_type,
        }
      }
      return empty

    case 'audio':
      if (message.audio?.id) {
        return {
          ...empty,
          mediaUrl: await verifyAndBuildUrl(message.audio.id),
          mediaType: message.audio.mime_type,
        }
      }
      return empty

    case 'sticker':
      // Stickers are images under the hood. Treat them as such so the
      // MessageBubble renders the <img>. The caller maps the DB
      // content_type to 'image' for the CHECK constraint.
      if (message.sticker?.id) {
        return {
          ...empty,
          mediaUrl: await verifyAndBuildUrl(message.sticker.id),
          mediaType: message.sticker.mime_type,
        }
      }
      return empty

    case 'location':
      if (message.location) {
        const loc = message.location
        const locationText = [loc.name, loc.address, `${loc.latitude},${loc.longitude}`]
          .filter(Boolean)
          .join(' - ')
        return { ...empty, contentText: locationText }
      }
      return empty

    case 'reaction':
      return { ...empty, contentText: message.reaction?.emoji || null }

    case 'interactive': {
      // The customer tapped a reply button or a list row on a message
      // we previously sent. Meta delivers `interactive.button_reply` for
      // 3-button messages and `interactive.list_reply` for list messages.
      // Use the human-readable title as contentText so the inbox bubble
      // renders the tap legibly ("Existing customer"), and stash the
      // stable id separately so the Flows engine can route on it.
      const reply =
        message.interactive?.button_reply ?? message.interactive?.list_reply
      if (reply?.id) {
        return {
          ...empty,
          contentText: reply.title || reply.id,
          interactiveReplyId: reply.id,
        }
      }
      return { ...empty, contentText: '[Interactive reply]' }
    }

    case 'button': {
      // Tapped a QUICK_REPLY button from a template message.
      if (message.button) {
        return {
          ...empty,
          contentText: message.button.text || message.button.payload || '[Button reply]',
          interactiveReplyId: message.button.payload,
        }
      }
      return { ...empty, contentText: '[Button reply]' }
    }

    default:
      return {
        ...empty,
        contentText: `[Unsupported message type: ${message.type}]`,
      }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ContactRow = any

interface ContactOutcome {
  contact: ContactRow
  /** True when this call created the row; drives new_contact_created
   *  automation dispatch in processMessage. */
  wasCreated: boolean
}

async function findOrCreateContact(
  accountId: string,
  configOwnerUserId: string,
  phone: string,
  name: string
): Promise<ContactOutcome | null> {
  const fDb = getAdminDb();
  if (fDb) {
    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const contactsRef = fDb.collection('accounts').doc(accountId).collection('contacts');

      // 1. Direct doc ID
      const directRef = contactsRef.doc(`c_${cleanPhone}`);
      const directDoc = await directRef.get();
      if (directDoc.exists) {
        const data = directDoc.data();
        if (name && name !== data?.name) {
          await directRef.set({ name, updatedAt: new Date().toISOString() }, { merge: true });
        }
        return { contact: { id: directDoc.id, ...data, name: name || data?.name }, wasCreated: false };
      }

      // 2. Query where phone == phone
      const qSnap = await contactsRef.where('phone', '==', phone).limit(1).get();
      if (!qSnap.empty) {
        const doc = qSnap.docs[0];
        const data = doc.data();
        if (name && name !== data?.name) {
          await doc.ref.set({ name, updatedAt: new Date().toISOString() }, { merge: true });
        }
        return { contact: { id: doc.id, ...data, name: name || data?.name }, wasCreated: false };
      }

      // 3. Query where phone == cleanPhone
      if (cleanPhone !== phone) {
        const qClean = await contactsRef.where('phone', '==', cleanPhone).limit(1).get();
        if (!qClean.empty) {
          const doc = qClean.docs[0];
          const data = doc.data();
          if (name && name !== data?.name) {
            await doc.ref.set({ name, updatedAt: new Date().toISOString() }, { merge: true });
          }
          return { contact: { id: doc.id, ...data, name: name || data?.name }, wasCreated: false };
        }
      }

      // 4. Create new contact
      const contactId = `c_${cleanPhone}`;
      const nowIso = new Date().toISOString();
      const contactObj = cleanForFirestore({
        id: contactId,
        phone,
        name: name || phone,
        accountId,
        userId: configOwnerUserId,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      await directRef.set(contactObj);
      return { contact: contactObj, wasCreated: true };
    } catch (fsErr) {
      console.warn('[webhook] Firestore findOrCreateContact warning:', fsErr);
    }
  }

  // Fallback to Supabase if reachable
  try {
    const existingContact = await findExistingContact(supabaseAdmin(), accountId, phone);
    if (existingContact) {
      return { contact: existingContact, wasCreated: false };
    }
    const { data: newContact } = await supabaseAdmin()
      .from('contacts')
      .insert({ account_id: accountId, user_id: configOwnerUserId, phone, name: name || phone })
      .select()
      .single();
    if (newContact) return { contact: newContact, wasCreated: true };
  } catch {}

  return { contact: { id: `c_${phone.replace(/[^0-9]/g, '')}`, phone, name: name || phone }, wasCreated: false };
}

async function findOrCreateConversation(
  accountId: string,
  configOwnerUserId: string,
  contactId: string,
) {
  const fDb = getAdminDb();
  if (fDb) {
    try {
      const convId = `conv_${contactId}`;
      const convRef = fDb.collection('accounts').doc(accountId).collection('conversations').doc(convId);
      const convDoc = await convRef.get();

      if (convDoc.exists) {
        return { conversation: { id: convDoc.id, ...convDoc.data() }, created: false };
      }

      const nowIso = new Date().toISOString();
      const newConv = cleanForFirestore({
        id: convId,
        account_id: accountId,
        user_id: configOwnerUserId,
        contact_id: contactId,
        unread_count: 0,
        status: 'open',
        created_at: nowIso,
        updatedAt: nowIso,
      });
      await convRef.set(newConv);
      return { conversation: newConv, created: true };
    } catch (fsErr) {
      console.warn('[webhook] Firestore findOrCreateConversation warning:', fsErr);
    }
  }

  // Fallback to Supabase
  try {
    const { data: existingRows } = await supabaseAdmin()
      .from('conversations')
      .select('*')
      .eq('account_id', accountId)
      .eq('contact_id', contactId)
      .limit(1);

    if (existingRows && existingRows.length > 0) {
      return { conversation: existingRows[0], created: false };
    }

    const { data: newConv } = await supabaseAdmin()
      .from('conversations')
      .insert({ account_id: accountId, user_id: configOwnerUserId, contact_id: contactId })
      .select()
      .single();

    if (newConv) return { conversation: newConv, created: true };
  } catch {}

  return {
    conversation: { id: `conv_${contactId}`, account_id: accountId, contact_id: contactId, unread_count: 0 },
    created: false,
  };
}
