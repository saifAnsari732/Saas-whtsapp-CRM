import { getAdminDb, cleanForFirestore } from '@/lib/firebase/admin';
import { getWhatsAppConfigForAccount } from '@/lib/whatsapp/get-config';
import { sendTextMessage, sendTemplateMessage } from '@/lib/whatsapp/meta-api';
import { sanitizePhoneForMeta, isValidE164 } from '@/lib/whatsapp/phone-utils';

export interface DispatchKeywordFlowArgs {
  accountId: string;
  configOwnerUserId?: string;
  contactId: string;
  contactPhone?: string;
  conversationId: string;
  inboundText: string;
}

export async function dispatchKeywordFlow({
  accountId,
  contactId,
  contactPhone,
  conversationId,
  inboundText,
}: DispatchKeywordFlowArgs): Promise<{ consumed: boolean; matchedKeyword?: string }> {
  const text = inboundText?.trim().toLowerCase();
  if (!text) return { consumed: false };

  const fDb = getAdminDb();
  let flows: any[] = [];

  // 1. Primary: Fetch active keyword flows from Firebase Firestore
  if (fDb) {
    try {
      // Check accounts/{accountId}/keyword_flows
      const snap = await fDb
        .collection('accounts')
        .doc(accountId)
        .collection('keyword_flows')
        .where('is_active', '==', true)
        .get();

      snap.forEach((doc) => {
        flows.push({ id: doc.id, ...doc.data() });
      });

      // Also check top-level keyword_flows
      if (flows.length === 0) {
        let topSnap = await fDb
          .collection('keyword_flows')
          .where('account_id', '==', accountId)
          .where('is_active', '==', true)
          .get();

        if (topSnap.empty) {
          topSnap = await fDb
            .collection('keyword_flows')
            .where('accountId', '==', accountId)
            .where('is_active', '==', true)
            .get();
        }

        topSnap.forEach((doc) => {
          flows.push({ id: doc.id, ...doc.data() });
        });
      }
    } catch (fsErr) {
      console.warn('[keyword-flow] Firestore keyword flows fetch warning:', fsErr);
    }
  }

  // 2. Safe optional fallback to Supabase if Firestore returned nothing
  if (flows.length === 0) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (sbUrl && sbKey) {
        const sb = createClient(sbUrl, sbKey);
        const { data: sbFlows } = await sb
          .from('keyword_flows')
          .select('*')
          .eq('is_active', true);
        if (sbFlows) {
          flows = sbFlows;
        }
      }
    } catch {}
  }

  if (flows.length === 0) {
    return { consumed: false };
  }

  // 3. Match inbound text against keywords
  // A flow matches if any of its trigger keywords matches the user's text
  // Supports exact match, word match, or punctuation-stripped match
  let matchedKeyword = '';
  const strippedText = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?!]/g, ' ').replace(/\s+/g, ' ').trim();
  const textWords = strippedText.split(' ').filter(Boolean);

  const matchedFlow = flows.find((flow) => {
    if (!Array.isArray(flow.keywords)) return false;
    for (const kw of flow.keywords) {
      const cleanKw = String(kw).trim().toLowerCase();
      if (!cleanKw) continue;
      // Exact match
      if (text === cleanKw || strippedText === cleanKw) {
        matchedKeyword = cleanKw;
        return true;
      }
      // Contained word match
      if (textWords.includes(cleanKw)) {
        matchedKeyword = cleanKw;
        return true;
      }
      // Word boundary regex match (e.g. "hi" matches "hi" or "hi there")
      const escaped = cleanKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i');
      if (regex.test(text) || regex.test(strippedText)) {
        matchedKeyword = cleanKw;
        return true;
      }
    }
    return false;
  });

  if (!matchedFlow) {
    console.log(`[keyword-flow] No flow matched text "${text}". Active flows: ${flows.map(f => f.name || f.id).join(', ')}`);
    return { consumed: false };
  }

  console.log(`[keyword-flow] Matched keyword '${matchedKeyword}' on flow '${matchedFlow.name || matchedFlow.id}'`);

  // 4. Resolve destination phone number
  let rawPhone = contactPhone || '';
  if (!rawPhone && fDb && contactId) {
    try {
      const cDoc = await fDb.collection('accounts').doc(accountId).collection('contacts').doc(contactId).get();
      if (cDoc.exists) {
        rawPhone = cDoc.data()?.phone || '';
      }
    } catch {}
  }

  const phone = sanitizePhoneForMeta(rawPhone);
  if (!phone || !isValidE164(phone)) {
    console.warn('[keyword-flow] Invalid destination phone:', rawPhone);
    return { consumed: false };
  }

  // 5. Fetch WhatsApp configuration
  const config = await getWhatsAppConfigForAccount(accountId);
  if (!config || !config.phone_number_id || !config.decrypted_access_token) {
    console.error('[keyword-flow] WhatsApp config missing or unconfigured for account:', accountId);
    return { consumed: false };
  }

  const accessToken = config.decrypted_access_token;
  const phoneNumberId = config.phone_number_id;

  // Guard against sending to bot's own number (Meta rejects with #100 Invalid parameter)
  const botPhoneDigits = (config.display_phone_number || '').replace(/\D/g, '');
  if (botPhoneDigits && phone === botPhoneDigits) {
    console.warn(`[keyword-flow] Destination phone ${phone} is the bot's own registered number. Meta rejects sending message to self.`);
    return { consumed: true, matchedKeyword };
  }

  try {
    const isTextResponse =
      matchedFlow.response_type === 'text' ||
      (!matchedFlow.template_id && !matchedFlow.template_name && Boolean(matchedFlow.text_message));

    if (isTextResponse && matchedFlow.text_message) {
      const textBody = matchedFlow.text_message.trim();
      const sendRes = await sendTextMessage({
        phoneNumberId,
        accessToken,
        to: phone,
        text: textBody,
      });

      console.log(`[keyword-flow] Sent text auto-reply to ${phone}, wamid: ${sendRes?.messageId}`);

      // Record outbound bot message in Firestore conversation thread
      if (fDb && conversationId) {
        try {
          const nowIso = new Date().toISOString();
          const convRef = fDb.collection('accounts').doc(accountId).collection('conversations').doc(conversationId);
          await convRef.collection('messages').add(cleanForFirestore({
            conversation_id: conversationId,
            sender_type: 'bot',
            content_type: 'text',
            content_text: textBody,
            message_id: sendRes?.messageId || null,
            status: 'delivered',
            created_at: nowIso,
          }));

          await convRef.set(cleanForFirestore({
            last_message_text: textBody,
            last_message_at: nowIso,
            last_sender_type: 'bot',
            updatedAt: nowIso,
          }), { merge: true });
        } catch (msgLogErr) {
          console.warn('[keyword-flow] Conversation sync warning:', msgLogErr);
        }
      }

      return { consumed: true, matchedKeyword };
    }

    // Template response
    const templateName = matchedFlow.template_name || matchedFlow.template_id;
    if (templateName) {
      let templateObj: any = null;
      if (fDb) {
        try {
          const tDoc = await fDb.collection('message_templates').where('name', '==', templateName).limit(1).get();
          if (!tDoc.empty) {
            templateObj = tDoc.docs[0].data();
          }
        } catch {}
      }

      const sendRes = await sendTemplateMessage({
        phoneNumberId,
        accessToken,
        to: phone,
        templateName,
        language: templateObj?.language || 'en_US',
        template: templateObj || { name: templateName, language: 'en_US' },
        messageParams: {},
      });

      console.log(`[keyword-flow] Sent template '${templateName}' auto-reply to ${phone}, wamid: ${sendRes?.messageId}`);

      // Record outbound bot message in Firestore conversation thread
      if (fDb && conversationId) {
        try {
          const nowIso = new Date().toISOString();
          const convRef = fDb.collection('accounts').doc(accountId).collection('conversations').doc(conversationId);
          await convRef.collection('messages').add(cleanForFirestore({
            conversation_id: conversationId,
            sender_type: 'bot',
            content_type: 'template',
            content_text: `Template: ${templateName}`,
            template_name: templateName,
            message_id: sendRes?.messageId || null,
            status: 'delivered',
            created_at: nowIso,
          }));

          await convRef.set(cleanForFirestore({
            last_message_text: `Template: ${templateName}`,
            last_message_at: nowIso,
            last_sender_type: 'bot',
            updatedAt: nowIso,
          }), { merge: true });
        } catch (msgLogErr) {
          console.warn('[keyword-flow] Conversation sync warning:', msgLogErr);
        }
      }

      return { consumed: true, matchedKeyword };
    }

    return { consumed: false };
  } catch (err: any) {
    console.error('[keyword-flow] Failed to dispatch keyword flow reply:', err?.message || err);
    return { consumed: false };
  }
}
