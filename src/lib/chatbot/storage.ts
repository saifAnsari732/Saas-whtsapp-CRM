import { createClient as createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/ai/admin-client';
import { 
  ChatbotSettings, 
  DEFAULT_KEYWORD_RULES, 
  DEFAULT_FOLLOW_UP_STEPS, 
  PERSONA_PROMPTS,
  FollowUpQueueItem 
} from './types';

const DEFAULT_SETTINGS: ChatbotSettings = {
  is_active: true,
  bot_mode: 'hybrid',
  persona: 'sales',
  system_prompt: PERSONA_PROMPTS.sales.prompt,
  welcome_enabled: true,
  welcome_message: 'Hi {name}! Welcome to our WhatsApp service. How can we assist you today?',
  fallback_message: 'Thank you for your message! Our team has received your query and will reply shortly.',
  away_enabled: false,
  away_message: 'Thank you for reaching out! We are currently outside our standard business hours, but we have recorded your message and will get back to you first thing.',
  typing_delay_seconds: 2,
  max_replies_per_conv: 6,
  keyword_rules: DEFAULT_KEYWORD_RULES,
  follow_up_sequence: {
    id: 'seq-default',
    name: 'Lead Re-engagement Follow-up',
    is_active: true,
    trigger_event: 'no_reply_inbound',
    cancel_on_reply: true,
    steps: DEFAULT_FOLLOW_UP_STEPS,
  },
};

// Global in-memory cache to ensure instant retrieval and fast response during socket events
declare global {
  var globalChatbotSettings: Record<string, ChatbotSettings> | undefined;
  var globalFollowUpQueue: Record<string, FollowUpQueueItem[]> | undefined;
}

function getSettingsCache(): Record<string, ChatbotSettings> {
  if (!global.globalChatbotSettings) {
    global.globalChatbotSettings = {};
  }
  return global.globalChatbotSettings;
}

export function getFollowUpQueueCache(): Record<string, FollowUpQueueItem[]> {
  if (!global.globalFollowUpQueue) {
    global.globalFollowUpQueue = {};
  }
  return global.globalFollowUpQueue;
}

/**
 * Loads the chatbot configuration for a specific account or user
 */
export async function getChatbotConfig(accountId: string, userId?: string): Promise<ChatbotSettings> {
  const cacheKey = accountId || userId || 'default';
  const cache = getSettingsCache();
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  // 1. Try Firebase Firestore
  try {
    const { getAdminDb } = await import('@/lib/firebase/admin');
    const fDb = getAdminDb();
    const docRef = fDb.collection('chatbot_settings').doc(cacheKey);
    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data() as any;
      const merged: ChatbotSettings = {
        ...DEFAULT_SETTINGS,
        ...data,
      };
      cache[cacheKey] = merged;
      return merged;
    }
  } catch (fErr) {
    // Firestore lookup optional
  }

  // 2. Try Supabase baileys_settings
  try {
    const db = supabaseAdmin();
    const { data: bSettings } = await db
      .from('baileys_settings')
      .select('auto_reply_enabled, auto_reply_text')
      .eq('account_id', accountId)
      .maybeSingle();

    if (bSettings && bSettings.auto_reply_text) {
      try {
        const parsed = JSON.parse(bSettings.auto_reply_text);
        if (parsed && typeof parsed === 'object' && parsed.bot_mode) {
          const merged: ChatbotSettings = {
            ...DEFAULT_SETTINGS,
            ...parsed,
            is_active: bSettings.auto_reply_enabled ?? parsed.is_active ?? true,
          };
          cache[cacheKey] = merged;
          return merged;
        }
      } catch (parseErr) {
        // Plain text auto reply legacy string
        const merged: ChatbotSettings = {
          ...DEFAULT_SETTINGS,
          is_active: bSettings.auto_reply_enabled,
          welcome_message: bSettings.auto_reply_text,
          fallback_message: bSettings.auto_reply_text,
        };
        cache[cacheKey] = merged;
        return merged;
      }
    }
  } catch (err) {
    console.warn('[chatbot/storage] Could not fetch settings from db, using defaults:', err);
  }

  cache[cacheKey] = DEFAULT_SETTINGS;
  return DEFAULT_SETTINGS;
}

/**
 * Saves chatbot configuration to database and updates memory cache
 */
export async function saveChatbotConfig(
  accountId: string, 
  userId: string, 
  settings: Partial<ChatbotSettings>
): Promise<ChatbotSettings> {
  const current = await getChatbotConfig(accountId, userId);
  const updated: ChatbotSettings = {
    ...current,
    ...settings,
  };

  const cacheKey = accountId || userId || 'default';
  const cache = getSettingsCache();
  cache[cacheKey] = updated;

  // 1. Save to Firebase Firestore
  try {
    const { getAdminDb } = await import('@/lib/firebase/admin');
    const fDb = getAdminDb();
    await fDb.collection('chatbot_settings').doc(cacheKey).set({
      ...updated,
      account_id: accountId,
      user_id: userId,
      updated_at: new Date().toISOString(),
    }, { merge: true });
  } catch (fErr) {
    console.warn('[chatbot/storage] Could not save to Firestore:', fErr);
  }

  // 2. Also save to Supabase baileys_settings if available
  try {
    const db = supabaseAdmin();
    const jsonString = JSON.stringify(updated);

    await db
      .from('baileys_settings')
      .upsert({
        account_id: accountId,
        user_id: userId,
        auto_reply_enabled: updated.is_active,
        auto_reply_text: jsonString,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'account_id' });
  } catch (err) {
    // Supabase error tolerated
  }

  return updated;
}

/**
 * Follow-up Queue Management
 */
export function getFollowUpQueue(accountId: string): FollowUpQueueItem[] {
  return global.globalFollowUpQueue?.[accountId] || [];
}

export function queueFollowUp(accountId: string, item: FollowUpQueueItem) {
  if (!global.globalFollowUpQueue) global.globalFollowUpQueue = {};
  if (!global.globalFollowUpQueue[accountId]) {
    global.globalFollowUpQueue[accountId] = [];
  }
  // Remove existing pending items for same contact to avoid duplicate steps
  global.globalFollowUpQueue[accountId] = global.globalFollowUpQueue[accountId].filter(
    (q) => q.contact_jid !== item.contact_jid || q.status !== 'pending'
  );
  global.globalFollowUpQueue[accountId].push(item);
}

export function cancelFollowUpForContact(accountId: string, contactJid: string) {
  if (!global.globalFollowUpQueue || !global.globalFollowUpQueue[accountId]) return;
  global.globalFollowUpQueue[accountId] = global.globalFollowUpQueue[accountId].map((item) => {
    if (item.contact_jid === contactJid && item.status === 'pending') {
      return { ...item, status: 'cancelled' };
    }
    return item;
  });
}
