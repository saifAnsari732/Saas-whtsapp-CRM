import { getChatbotConfig, cancelFollowUpForContact, queueFollowUp } from './storage';
import { ChatbotSettings, FollowUpQueueItem } from './types';
import { supabaseAdmin } from '@/lib/ai/admin-client';
import { loadAiConfig } from '@/lib/ai/config';
import { generateReply } from '@/lib/ai/generate';
import { buildSystemPrompt } from '@/lib/ai/defaults';
import { retrieveKnowledge } from '@/lib/ai/knowledge';

export interface ProcessMessageInput {
  accountId: string;
  userId?: string;
  senderJid: string;
  messageText: string;
  senderName?: string;
  isFirstMessage?: boolean;
}

export interface ProcessMessageResult {
  shouldReply: boolean;
  replyText: string | null;
  ruleMatched?: string;
  source?: 'broadcast' | 'keyword' | 'ai' | 'welcome' | 'away' | 'fallback';
  delayMs: number;
}

/**
 * Format dynamic variables like {name}, {phone}, {time} in template responses
 */
export function formatVariables(text: string, vars: { name?: string; phone?: string }): string {
  const name = vars.name || 'there';
  const phone = vars.phone || '';
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return text
    .replace(/\{name\}/gi, name)
    .replace(/\{phone\}/gi, phone)
    .replace(/\{time\}/gi, timeStr)
    .replace(/\{date\}/gi, dateStr);
}

/**
 * Core engine for processing an incoming customer message and generating an automated reply
 */
export async function processIncomingMessage(input: ProcessMessageInput): Promise<ProcessMessageResult> {
  const { accountId, userId, senderJid, messageText, senderName, isFirstMessage } = input;
  const cleanText = (messageText || '').trim();

  // 1. Any incoming message from this customer cancels their pending follow-ups
  cancelFollowUpForContact(accountId, senderJid);

  if (!cleanText) {
    return { shouldReply: false, replyText: null, delayMs: 0 };
  }

  // 1.1 Priority Broadcast Auto-Reply Check:
  // If this sender recently received a broadcast campaign that has an auto-reply configured,
  // reply with that message immediately and once-only.
  try {
    const phone = senderJid.split('@')[0];
    const { data: contacts } = await supabaseAdmin()
      .from('contacts')
      .select('id, name')
      .eq('phone', phone)
      .limit(1);

    if (contacts && contacts.length > 0) {
      const contact = contacts[0];
      const { data: bRecipients } = await supabaseAdmin()
        .from('broadcast_recipients')
        .select('id, status, auto_reply_sent_at, broadcast_id, broadcasts!inner(id, name, account_id)')
        .eq('contact_id', contact.id)
        .in('status', ['sent', 'delivered', 'read', 'replied'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (bRecipients && bRecipients.length > 0) {
        const row = bRecipients[0];
        const bcast: any = row.broadcasts;

        // Mark as replied in database if not yet
        if (row.status !== 'replied') {
          await supabaseAdmin()
            .from('broadcast_recipients')
            .update({ status: 'replied', replied_at: new Date().toISOString() })
            .eq('id', row.id);
        }

        // Check Firebase Firestore primary configuration
        let autoReplyEnabled = false;
        let autoReplyText = '';

        try {
          const { getAdminDb } = await import('@/lib/firebase/admin');
          const fDb = getAdminDb();
          if (fDb) {
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
        } catch {}

        if (!autoReplyEnabled && (bcast as any)?.auto_reply_enabled) {
          autoReplyEnabled = true;
          autoReplyText = (bcast as any)?.auto_reply_text || '';
        }

        // Check if broadcast auto reply is enabled and not yet sent
        if (autoReplyEnabled && autoReplyText.trim()) {
          // Check Firebase sent status
          let alreadySentOnFirebase = false;
          try {
            const { getAdminDb } = await import('@/lib/firebase/admin');
            const fDb = getAdminDb();
            if (fDb) {
              const sentRef = fDb
                .collection('accounts')
                .doc(accountId)
                .collection('broadcast_auto_replies')
                .doc(bcast.id)
                .collection('sent_recipients')
                .doc(contact.id);
              const sentSnap = await sentRef.get();
              if (sentSnap.exists) {
                alreadySentOnFirebase = true;
              } else {
                await sentRef.set({ contact_id: contact.id, sent_at: new Date().toISOString() });
              }
            }
          } catch {}

          if (!alreadySentOnFirebase && !row.auto_reply_sent_at) {
            const nowIso = new Date().toISOString();
            try {
              await supabaseAdmin()
                .from('broadcast_recipients')
                .update({
                  status: 'replied',
                  replied_at: nowIso,
                  auto_reply_sent_at: nowIso,
                })
                .eq('id', row.id);
            } catch {}

            const formattedText = formatVariables(autoReplyText.trim(), {
              name: senderName || contact.name || 'there',
              phone,
            });

            return {
              shouldReply: true,
              replyText: formattedText,
              ruleMatched: `Broadcast "${bcast.name}" Auto-Reply`,
              source: 'broadcast',
              delayMs: 300, // Instant
            };
          }
        }
      }
    }
  } catch (bcastErr) {
    console.warn('[chatbot/processor] broadcast auto-reply check failed:', bcastErr);
  }

  // 2. Load Chatbot configuration
  const config = await getChatbotConfig(accountId, userId);
  if (!config.is_active) {
    return { shouldReply: false, replyText: null, delayMs: 0 };
  }

  const delayMs = Math.max(500, (config.typing_delay_seconds || 2) * 1000);
  const vars = {
    name: senderName || senderJid.split('@')[0],
    phone: senderJid.split('@')[0],
  };

  // 3. Away / Out of Office check (if enabled)
  if (config.away_enabled && config.away_message) {
    // For away mode if toggled on
    // Check if away schedule or just master switch
  }

  // 4. Keyword Match Check (runs if mode is 'keyword' or 'hybrid')
  if (config.bot_mode === 'keyword' || config.bot_mode === 'hybrid') {
    const lower = cleanText.toLowerCase();
    for (const rule of config.keyword_rules || []) {
      if (!rule.is_active) continue;
      
      const isMatched = rule.keywords.some((kw) => {
        const cleanKw = kw.trim().toLowerCase();
        if (!cleanKw) return false;
        if (rule.match_type === 'exact') {
          return lower === cleanKw;
        }
        return lower.includes(cleanKw);
      });

      if (isMatched && rule.reply_text) {
        const formatted = formatVariables(rule.reply_text, vars);
        
        // Schedule follow-up step 1 if configured
        scheduleFirstFollowUp(config, accountId, senderJid, vars.name);

        return {
          shouldReply: true,
          replyText: formatted,
          ruleMatched: rule.keywords.join(', '),
          source: 'keyword',
          delayMs,
        };
      }
    }
  }

  // 5. If pure keyword mode and no keyword matched, check fallback
  if (config.bot_mode === 'keyword') {
    if (config.fallback_message) {
      return {
        shouldReply: true,
        replyText: formatVariables(config.fallback_message, vars),
        source: 'fallback',
        delayMs,
      };
    }
    return { shouldReply: false, replyText: null, delayMs: 0 };
  }

  // 6. AI Smart Agent Mode (runs if mode is 'ai' or 'hybrid' fallback)
  try {
    const db = supabaseAdmin();
    const aiConfig = await loadAiConfig(db, accountId, { requireActive: false });

    if (aiConfig && aiConfig.apiKey) {
      const messages = [
        { role: 'user' as const, content: cleanText }
      ];

      const knowledge = await retrieveKnowledge(db, accountId, aiConfig, cleanText).catch(() => []);
      const systemPrompt = buildSystemPrompt({
        userPrompt: config.system_prompt || aiConfig.systemPrompt,
        mode: 'auto_reply',
        knowledge,
      });

      const { text } = await generateReply({
        config: aiConfig,
        systemPrompt,
        messages,
      });

      if (text && text.trim()) {
        scheduleFirstFollowUp(config, accountId, senderJid, vars.name);

        return {
          shouldReply: true,
          replyText: text.trim(),
          source: 'ai',
          delayMs,
        };
      }
    }
  } catch (err: any) {
    console.warn('[chatbot/processor] AI generation failed or not configured, using fallback:', err?.message || err);
  }

  // 7. Fallback or Welcome message if AI could not generate
  if (isFirstMessage && config.welcome_enabled && config.welcome_message) {
    scheduleFirstFollowUp(config, accountId, senderJid, vars.name);
    return {
      shouldReply: true,
      replyText: formatVariables(config.welcome_message, vars),
      source: 'welcome',
      delayMs,
    };
  }

  if (config.fallback_message) {
    scheduleFirstFollowUp(config, accountId, senderJid, vars.name);
    return {
      shouldReply: true,
      replyText: formatVariables(config.fallback_message, vars),
      source: 'fallback',
      delayMs,
    };
  }

  return { shouldReply: false, replyText: null, delayMs: 0 };
}

/**
 * Helper to queue the first follow-up step for a contact after sending an automated reply
 */
function scheduleFirstFollowUp(config: ChatbotSettings, accountId: string, contactJid: string, contactName: string) {
  const seq = config.follow_up_sequence;
  if (!seq || !seq.is_active || !seq.steps || seq.steps.length === 0) return;

  const firstStep = seq.steps.find((s) => s.step_number === 1 && s.is_active);
  if (!firstStep) return;

  let delayMs = firstStep.delay_value * 60 * 1000; // default minutes
  if (firstStep.delay_unit === 'hours') {
    delayMs = firstStep.delay_value * 3600 * 1000;
  } else if (firstStep.delay_unit === 'days') {
    delayMs = firstStep.delay_value * 86400 * 1000;
  }

  const scheduledTime = new Date(Date.now() + delayMs).toISOString();

  const queueItem: FollowUpQueueItem = {
    id: `fq-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    contact_jid: contactJid,
    contact_name: contactName,
    step_number: 1,
    message_text: firstStep.message_text,
    scheduled_at: scheduledTime,
    status: 'pending',
    last_incoming_at: new Date().toISOString(),
  };

  queueFollowUp(accountId, queueItem);
}
