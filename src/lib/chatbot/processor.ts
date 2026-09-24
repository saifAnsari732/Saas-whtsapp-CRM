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
  source?: 'keyword' | 'ai' | 'welcome' | 'away' | 'fallback';
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
