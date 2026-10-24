import { getAdminDb, cleanForFirestore } from '@/lib/firebase/admin';
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
    return val || 'Customer';
  });
}

/**
 * Executes a broadcast sending loop in the background.
 * Primary Datastore: Firebase Firestore.
 */
export async function runBackgroundLoop(broadcastId: string, payload?: any) {
  if (activeBroadcastLocks.has(broadcastId)) {
    console.log(`[runBackgroundLoop] Broadcast ${broadcastId} is already running in background, skipping duplicate.`);
    return;
  }
  activeBroadcastLocks.add(broadcastId);

  const fDb = getAdminDb();

  try {
    console.log(`[runBackgroundLoop] Starting dispatch for broadcastId: ${broadcastId}`);

    let broadcast: any = null;
    let accountId = payload?.accountId || '';

    // 1. Fetch broadcast record from Firebase Firestore
    if (fDb) {
      try {
        if (accountId) {
          const nestedDoc = await fDb
            .collection('accounts')
            .doc(accountId)
            .collection('broadcasts')
            .doc(broadcastId)
            .get();
          if (nestedDoc.exists) {
            broadcast = { id: nestedDoc.id, ...nestedDoc.data() };
          }
        }

        if (!broadcast) {
          const topDoc = await fDb.collection('broadcasts').doc(broadcastId).get();
          if (topDoc.exists) {
            broadcast = { id: topDoc.id, ...topDoc.data() };
            accountId = accountId || broadcast.account_id || broadcast.accountId || '';
          }
        }
      } catch (fsErr) {
        console.warn('[runBackgroundLoop] Firestore broadcast read warning:', fsErr);
      }
    }

    if (!broadcast) {
      console.error('[runBackgroundLoop] Broadcast record not found in Firestore:', broadcastId);
      return;
    }

    accountId = accountId || broadcast.account_id || broadcast.accountId || '';

    // 2. Fetch WhatsApp Meta Configuration for account
    const config = await getWhatsAppConfigForAccount(accountId);
    if (!config || !config.phone_number_id || !config.decrypted_access_token) {
      console.error('[runBackgroundLoop] WhatsApp config missing for account:', accountId);
      if (fDb) {
        await fDb
          .collection('accounts')
          .doc(accountId)
          .collection('broadcasts')
          .doc(broadcastId)
          .set({ status: 'failed', failed_count: broadcast.total_recipients || 1 }, { merge: true })
          .catch(() => {});
        await fDb.collection('broadcasts').doc(broadcastId).set({ status: 'failed' }, { merge: true }).catch(() => {});
      }
      return;
    }

    // 3. Resolve template if not provided in payload
    let template = payload?.template;
    if (!template && fDb) {
      try {
        const tmplSnap = await fDb
          .collection('message_templates')
          .where('name', '==', broadcast.template_name)
          .limit(1)
          .get();
        if (!tmplSnap.empty) {
          template = tmplSnap.docs[0].data();
        }
      } catch {}
    }

    if (!template) {
      console.error('[runBackgroundLoop] Template not found for broadcast:', broadcast.template_name);
      if (fDb) {
        await fDb
          .collection('accounts')
          .doc(accountId)
          .collection('broadcasts')
          .doc(broadcastId)
          .set({ status: 'failed', failed_count: broadcast.total_recipients || 1 }, { merge: true })
          .catch(() => {});
      }
      return;
    }

    // 4. Fetch recipients from Firestore subcollection
    let recipients: any[] = [];
    let recDocsMap = new Map<string, any>();

    if (fDb) {
      try {
        const recSnap = await fDb
          .collection('accounts')
          .doc(accountId)
          .collection('broadcasts')
          .doc(broadcastId)
          .collection('recipients')
          .get();

        if (!recSnap.empty) {
          recipients = recSnap.docs.map((d) => {
            const data = d.data();
            recDocsMap.set(d.id, d.ref);
            return { id: d.id, ...data };
          });
        }
      } catch (fsRecErr) {
        console.warn('[runBackgroundLoop] Firestore recipients read warning:', fsRecErr);
      }
    }

    if (recipients.length === 0) {
      console.error('[runBackgroundLoop] Recipients list empty for broadcast:', broadcastId);
      if (fDb) {
        await fDb.collection('accounts').doc(accountId).collection('broadcasts').doc(broadcastId).set(cleanForFirestore({ status: 'failed' }), { merge: true }).catch(() => {});
      }
      return;
    }

    // Filter recipients that need sending
    const pendingRecipients = recipients.filter((r: any) => r.status === 'pending');
    if (pendingRecipients.length === 0) {
      console.log(`[runBackgroundLoop] No pending recipients for broadcast ${broadcastId}. Marking finished.`);
      const currentSent = recipients.filter((r: any) => r.status === 'sent').length;
      const currentFailed = recipients.filter((r: any) => r.status === 'failed').length;
      const finalStatus = currentFailed === recipients.length ? 'failed' : 'sent';
      if (fDb) {
        await fDb.collection('accounts').doc(accountId).collection('broadcasts').doc(broadcastId).set(cleanForFirestore({
          status: finalStatus,
          sent_count: currentSent,
          delivered_count: currentSent,
          failed_count: currentFailed,
        }), { merge: true }).catch(() => {});
      }
      return;
    }

    let sentCount = recipients.filter((r: any) => r.status === 'sent').length;
    let failedCount = recipients.filter((r: any) => r.status === 'failed').length;

    let headerType = template?.header_type;
    const headerMediaUrl = (payload?.headerMediaUrl || template?.header_media_url || broadcast.header_media_url)?.trim();
    const isVideoUrl = /\.(mp4|mov|webm|mkv|3gp)($|\?)/i.test(headerMediaUrl || '');
    if (isVideoUrl && headerType !== 'video') {
      headerType = 'video';
    }
    const isMediaHeader =
      headerType === 'image' || headerType === 'video' || headerType === 'document' || Boolean(headerMediaUrl);
    const messageParams = isMediaHeader && headerMediaUrl ? { headerMediaUrl } : undefined;
    const activeTemplate = template
      ? { ...template, header_type: headerType || (isVideoUrl ? 'video' : 'image') }
      : undefined;
    const variables = payload?.variables ?? broadcast.template_variables ?? {};

    for (let i = 0; i < pendingRecipients.length; i += SEND_BATCH_SIZE) {
      const batch = pendingRecipients.slice(i, i + SEND_BATCH_SIZE);

      for (const recipient of batch) {
        const rawPhone = recipient.contact?.phone || recipient.phone || '';
        const sanitized = sanitizePhoneForMeta(rawPhone);

        if (!sanitized || !isValidE164(sanitized)) {
          failedCount++;
          const recRef = recDocsMap.get(recipient.id);
          if (recRef) {
            await recRef.set({
              status: 'failed',
              error_message: 'Invalid phone number format',
              updated_at: new Date().toISOString(),
            }, { merge: true }).catch(() => {});
          }
          continue;
        }

        const params = resolveVariables(
          variables,
          recipient.contact ?? {}
        );

        try {
          const result = await sendTemplateMessage({
            phoneNumberId: config.phone_number_id,
            accessToken: config.decrypted_access_token,
            to: sanitized,
            templateName: template.name,
            language: template.language ?? 'en_US',
            template: activeTemplate,
            messageParams,
            params,
          });

          sentCount++;
          const recRef = recDocsMap.get(recipient.id);
          if (recRef) {
            await recRef.set(cleanForFirestore({
              status: 'sent',
              sent_at: new Date().toISOString(),
              whatsapp_message_id: result.messageId || null,
              error_message: null,
            }), { merge: true }).catch(() => {});
          }

          // Save direct message-to-recipient lookup for 100% reliable instant webhook delivery/read/reply tracking
          if (fDb && result.messageId) {
            const lookupPayload = cleanForFirestore({
              message_id: result.messageId,
              broadcast_id: broadcastId,
              recipient_id: recipient.id,
              account_id: accountId,
              contact_id: recipient.contact?.id || null,
              phone: sanitized,
              created_at: new Date().toISOString(),
            });
            await Promise.allSettled([
              fDb.collection('whatsapp_message_lookups').doc(result.messageId).set(lookupPayload),
              fDb.collection('whatsapp_contact_last_broadcast').doc(`${accountId}_${sanitized}`).set(lookupPayload),
              recipient.contact?.id
                ? fDb.collection('whatsapp_contact_last_broadcast').doc(`${accountId}_${recipient.contact.id}`).set(lookupPayload)
                : Promise.resolve(),
            ]).catch(() => {});
          }

          // Update real-time live counts in Firestore after each message send
          if (fDb) {
            const liveProgress = cleanForFirestore({
              sent_count: sentCount,
              failed_count: failedCount,
              updated_at: new Date().toISOString(),
            });
            void Promise.allSettled([
              fDb.collection('accounts').doc(accountId).collection('broadcasts').doc(broadcastId).set(liveProgress, { merge: true }),
              fDb.collection('broadcasts').doc(broadcastId).set(liveProgress, { merge: true }),
            ]);
          }

          // Auto-sync into Inbox in Firestore
          if (fDb && accountId && recipient.contact?.id) {
            try {
              const contactId = recipient.contact.id;
              const convId = `conv_${contactId}`;
              const convRef = fDb.collection('accounts').doc(accountId).collection('conversations').doc(convId);
              const nowIso = new Date().toISOString();

              await convRef.set(cleanForFirestore({
                id: convId,
                account_id: accountId,
                contact_id: contactId,
                last_message_text: `Template: ${template.name}`,
                last_message_at: nowIso,
                status: 'open',
                unread_count: 0,
                updatedAt: nowIso,
              }), { merge: true });

              await convRef.collection('messages').add(cleanForFirestore({
                conversation_id: convId,
                sender_type: 'agent',
                content_type: 'template',
                content_text: `Template: ${template.name}`,
                template_name: template.name,
                message_id: result.messageId || null,
                status: 'sent',
                created_at: nowIso,
              }));
            } catch (syncErr) {
              console.warn('[runBackgroundLoop] Inbox sync warning:', syncErr);
            }
          }

          console.log(`[runBackgroundLoop] Sent to ${sanitized}, wamid: ${result.messageId}`);
        } catch (sendErr: any) {
          failedCount++;
          const errMsg = sendErr?.message || 'Meta API error';
          console.error(`[runBackgroundLoop] Send failed for ${sanitized}:`, errMsg);

          const recRef = recDocsMap.get(recipient.id);
          if (recRef) {
            await recRef.set(cleanForFirestore({
              status: 'failed',
              error_message: errMsg,
              updated_at: new Date().toISOString(),
            }), { merge: true }).catch(() => {});
          }

          // Update real-time live counts on failure as well
          if (fDb) {
            const liveProgress = cleanForFirestore({
              sent_count: sentCount,
              failed_count: failedCount,
              updated_at: new Date().toISOString(),
            });
            void Promise.allSettled([
              fDb.collection('accounts').doc(accountId).collection('broadcasts').doc(broadcastId).set(liveProgress, { merge: true }),
              fDb.collection('broadcasts').doc(broadcastId).set(liveProgress, { merge: true }),
            ]);
          }
        }

        // Delay between individual messages
        const perMsgDelay = payload?.delaySeconds
          ? payload.delaySeconds * 1000
          : (broadcast.delay_seconds ? broadcast.delay_seconds * 1000 : 10000);
        await sleep(perMsgDelay);
      }

      // Update broadcast aggregate counts in Firestore
      if (fDb) {
        await fDb.collection('accounts').doc(accountId).collection('broadcasts').doc(broadcastId).set(cleanForFirestore({
          sent_count: sentCount,
          failed_count: failedCount,
          updated_at: new Date().toISOString(),
        }), { merge: true }).catch(() => {});
      }

      if (i + SEND_BATCH_SIZE < pendingRecipients.length) {
        await sleep(payload?.batchDelayMs ?? SEND_BATCH_DELAY_MS);
      }
    }

    const finalStatus = failedCount === recipients.length ? 'failed' : 'sent';
    if (fDb) {
      const finalUpdate = cleanForFirestore({
        status: finalStatus,
        sent_count: sentCount,
        failed_count: failedCount,
        updated_at: new Date().toISOString(),
      });
      await fDb.collection('accounts').doc(accountId).collection('broadcasts').doc(broadcastId).set(finalUpdate, { merge: true }).catch(() => {});
      await fDb.collection('broadcasts').doc(broadcastId).set(finalUpdate, { merge: true }).catch(() => {});
    }

    console.log(`[runBackgroundLoop] Finished broadcast ${broadcastId}. Sent: ${sentCount}, Failed: ${failedCount}`);
  } catch (e: any) {
    console.error('[runBackgroundLoop] Fatal loop exception:', e);
    if (fDb) {
      await fDb.collection('broadcasts').doc(broadcastId).set(cleanForFirestore({ status: 'failed' }), { merge: true }).catch(() => {});
    }
  } finally {
    activeBroadcastLocks.delete(broadcastId);
  }
}
