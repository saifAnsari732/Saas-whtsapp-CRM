import { createAdminClient } from '@/lib/supabase/admin';
import { getWhatsAppConfigForAccount } from '@/lib/whatsapp/get-config';
import { sendTemplateMessage } from '@/lib/whatsapp/meta-api';
import { sanitizePhoneForMeta, isValidE164 } from '@/lib/whatsapp/phone-utils';

const SEND_BATCH_SIZE = 10;
const SEND_BATCH_DELAY_MS = 10000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Deduplication locks to prevent multiple polling loops from running concurrently
const activeBroadcastLocks = new Set<string>();

function resolveVariables(
  variables: Record<string, any> | undefined | null,
  contact: any,
  customValues?: Map<string, string>
): string[] {
  if (!variables) return [];
  const keys = Object.keys(variables).sort((a, b) => {
    const an = Number(a);
    const bn = Number(b);
    if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
    return a.localeCompare(b);
  });
  return keys.map((key) => {
    const v = variables[key];
    if (!v) return 'Customer';
    let val = '';
    if (typeof v === 'string') {
      val = v.trim();
    } else if (v.type === 'static') {
      val = (v.value ?? '').toString().trim();
    } else if (v.type === 'field') {
      const fieldMap: Record<string, string | undefined> = {
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        company: contact.company,
      };
      val = (fieldMap[v.value] ?? '').toString().trim();
    } else {
      val = (customValues?.get(v.value) ?? '').toString().trim();
    }
    // Meta Cloud API strictly rejects empty strings ("") with error 131008 (Required parameter is missing).
    // Ensure every parameter is a non-empty string! Fallback to "Customer" if name/field is empty.
    return val || 'Customer';
  });
}

/**
 * Executes a broadcast sending loop in the background.
 * Safe to call directly inside API handlers without network loopback fetch.
 */
export async function runBackgroundLoop(broadcastId: string, payload?: any) {
  if (activeBroadcastLocks.has(broadcastId)) {
    console.log(`[runBackgroundLoop] Broadcast ${broadcastId} is already running in background, skipping duplicate.`);
    return;
  }
  activeBroadcastLocks.add(broadcastId);

  const supabase = createAdminClient();

  try {
    console.log(`[runBackgroundLoop] Starting dispatch for broadcastId: ${broadcastId}`);

    // 1. Fetch broadcast record
    const { data: broadcast, error: bcErr } = await supabase
      .from('broadcasts')
      .select('*')
      .eq('id', broadcastId)
      .single();

    if (bcErr || !broadcast) {
      console.error('[runBackgroundLoop] Broadcast record not found:', broadcastId, bcErr);
      return;
    }

    // 2. Fetch WhatsApp Meta Configuration for account
    const config = await getWhatsAppConfigForAccount(broadcast.account_id);
    if (!config || !config.phone_number_id || !config.decrypted_access_token) {
      console.error('[runBackgroundLoop] WhatsApp config missing for account:', broadcast.account_id);
      await supabase
        .from('broadcasts')
        .update({ status: 'failed', failed_count: broadcast.total_recipients || 1 })
        .eq('id', broadcastId);
      return;
    }

    // 3. Resolve template if not provided in payload
    let template = payload?.template;
    if (!template) {
      let query = supabase
        .from('message_templates')
        .select('*')
        .eq('name', broadcast.template_name);

      if (broadcast.account_id) {
        query = query.eq('account_id', broadcast.account_id);
      }
      if (broadcast.template_language) {
        query = query.eq('language', broadcast.template_language);
      }

      const { data: tplData } = await query.limit(1);
      template = tplData?.[0];

      if (!template) {
        // Fallback search by template name only
        const { data: fallbackTpl } = await supabase
          .from('message_templates')
          .select('*')
          .eq('name', broadcast.template_name)
          .limit(1);
        template = fallbackTpl?.[0];
      }
    }

    if (!template) {
      console.error('[runBackgroundLoop] Template not found for broadcast:', broadcast.template_name);
      await supabase
        .from('broadcasts')
        .update({ status: 'failed', failed_count: broadcast.total_recipients || 1 })
        .eq('id', broadcastId);
      return;
    }

    // 4. Fetch recipients joined with contact details
    const { data: recipients, error: recipientsFetchError } = await supabase
      .from('broadcast_recipients')
      .select('*, contact:contacts(*)')
      .eq('broadcast_id', broadcastId);

    if (recipientsFetchError || !recipients || recipients.length === 0) {
      console.error('[runBackgroundLoop] Recipients fetch error or empty:', recipientsFetchError);
      await supabase
        .from('broadcasts')
        .update({ status: 'failed' })
        .eq('id', broadcastId);
      return;
    }

    // Filter recipients that need sending (status === 'pending' or 'failed' if retrying)
    const pendingRecipients = recipients.filter((r: any) => r.status === 'pending');
    if (pendingRecipients.length === 0) {
      console.log(`[runBackgroundLoop] No pending recipients for broadcast ${broadcastId}. Marking finished.`);
      const currentSent = recipients.filter((r: any) => r.status === 'sent').length;
      const currentFailed = recipients.filter((r: any) => r.status === 'failed').length;
      const finalStatus = currentFailed === recipients.length ? 'failed' : 'sent';
      await supabase
        .from('broadcasts')
        .update({
          status: finalStatus,
          sent_count: currentSent,
          delivered_count: currentSent,
          failed_count: currentFailed,
        })
        .eq('id', broadcastId);
      return;
    }

    // 5. Preload custom field values
    const contactIds = pendingRecipients.map((r: any) => r.contact?.id).filter(Boolean);
    const customValueIndex = new Map<string, Map<string, string>>();

    if (contactIds.length > 0) {
      const { data: cvData } = await supabase
        .from('contact_custom_values')
        .select('*')
        .in('contact_id', contactIds);
      if (cvData) {
        for (const row of cvData) {
          if (!customValueIndex.has(row.contact_id)) {
            customValueIndex.set(row.contact_id, new Map());
          }
          customValueIndex.get(row.contact_id)!.set(row.custom_field_id, row.value ?? '');
        }
      }
    }

    let sentCount = recipients.filter((r: any) => r.status === 'sent').length;
    let failedCount = recipients.filter((r: any) => r.status === 'failed').length;

    const headerType = template?.header_type;
    const isMediaHeader =
      headerType === 'image' || headerType === 'video' || headerType === 'document';
    const headerMediaUrl = (payload?.headerMediaUrl || template?.header_media_url)?.trim();
    const messageParams = isMediaHeader && headerMediaUrl ? { headerMediaUrl } : undefined;
    const variables = payload?.variables ?? broadcast.template_variables ?? {};

    for (let i = 0; i < pendingRecipients.length; i += SEND_BATCH_SIZE) {
      const batch = pendingRecipients.slice(i, i + SEND_BATCH_SIZE);

      for (const recipient of batch) {
        const rawPhone = recipient.contact?.phone || '';
        const sanitized = sanitizePhoneForMeta(rawPhone);

        if (!sanitized || !isValidE164(sanitized)) {
          failedCount++;
          await supabase
            .from('broadcast_recipients')
            .update({
              status: 'failed',
              error_message: 'Invalid phone number format',
            })
            .eq('id', recipient.id);
          continue;
        }

        const params = resolveVariables(
          variables,
          recipient.contact ?? {},
          customValueIndex.get(recipient.contact?.id)
        );

        try {
          const result = await sendTemplateMessage({
            phoneNumberId: config.phone_number_id,
            accessToken: config.decrypted_access_token,
            to: sanitized,
            templateName: template.name,
            language: template.language ?? 'en_US',
            template,
            messageParams,
            params,
          });

          sentCount++;
          await supabase
            .from('broadcast_recipients')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              whatsapp_message_id: result.messageId,
              error_message: null,
            })
            .eq('id', recipient.id);

          // Auto-sync into Inbox: ensure a conversation and message thread exists
          if (recipient.contact?.id && broadcast.account_id) {
            try {
              let { data: convRow } = await supabase
                .from('conversations')
                .select('id')
                .eq('account_id', broadcast.account_id)
                .eq('contact_id', recipient.contact.id)
                .maybeSingle();

              const nowIso = new Date().toISOString();
              if (!convRow) {
                const { data: newC } = await supabase
                  .from('conversations')
                  .insert({
                    account_id: broadcast.account_id,
                    user_id: broadcast.user_id || (config as any).user_id || broadcast.account_id,
                    contact_id: recipient.contact.id,
                    last_message_text: template.name,
                    last_message_at: nowIso,
                    status: 'open',
                    unread_count: 0,
                  })
                  .select('id')
                  .maybeSingle();
                convRow = newC;
              } else {
                await supabase
                  .from('conversations')
                  .update({
                    last_message_text: template.name,
                    last_message_at: nowIso,
                  })
                  .eq('id', convRow.id);
              }

              if (convRow && result.messageId) {
                await supabase
                  .from('messages')
                  .insert({
                    conversation_id: convRow.id,
                    sender_type: 'agent',
                    content_type: 'template',
                    content_text: `Template: ${template.name}`,
                    template_name: template.name,
                    message_id: result.messageId,
                    status: 'sent',
                    created_at: nowIso,
                  });
              }
            } catch (syncErr) {
              console.warn('[runBackgroundLoop] conv sync error:', syncErr);
            }
          }

          console.log(`[runBackgroundLoop] Sent to ${sanitized}, wamid: ${result.messageId}`);
        } catch (sendErr: any) {
          failedCount++;
          const errMsg = sendErr?.message || 'Meta API error';
          console.error(`[runBackgroundLoop] Send failed for ${sanitized}:`, errMsg);

          await supabase
            .from('broadcast_recipients')
            .update({
              status: 'failed',
              error_message: errMsg,
            })
            .eq('id', recipient.id);
        }

        // Safe Anti-Ban & Rate-Limit Staggering between individual messages (Default 10 seconds)
        const perMsgDelay = payload?.delaySeconds 
          ? payload.delaySeconds * 1000 
          : 10000;
        await sleep(perMsgDelay);
      }

      // Update broadcast aggregate counts
      await supabase
        .from('broadcasts')
        .update({
          sent_count: sentCount,
          delivered_count: sentCount,
          failed_count: failedCount,
        })
        .eq('id', broadcastId);

      if (i + SEND_BATCH_SIZE < pendingRecipients.length) {
        await sleep(payload?.batchDelayMs ?? SEND_BATCH_DELAY_MS);
      }
    }

    const finalStatus = failedCount === recipients.length ? 'failed' : 'sent';
    await supabase
      .from('broadcasts')
      .update({
        status: finalStatus,
        sent_count: sentCount,
        delivered_count: sentCount,
        failed_count: failedCount,
      })
      .eq('id', broadcastId);

    console.log(`[runBackgroundLoop] Finished broadcast ${broadcastId}. Sent: ${sentCount}, Failed: ${failedCount}`);
  } catch (e: any) {
    console.error('[runBackgroundLoop] Fatal loop exception:', e);
    await supabase.from('broadcasts').update({ status: 'failed' }).eq('id', broadcastId);
  } finally {
    activeBroadcastLocks.delete(broadcastId);
  }
}
