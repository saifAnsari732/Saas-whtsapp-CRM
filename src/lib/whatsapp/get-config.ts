import { getAdminDb } from '@/lib/firebase/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { decrypt } from '@/lib/whatsapp/encryption';

export interface WhatsAppConfigRecord {
  id?: string;
  account_id: string;
  phone_number_id: string;
  waba_id: string | null;
  access_token: string;
  decrypted_access_token: string;
  verify_token: string | null;
  status: string;
  verified_name?: string | null;
  display_phone_number?: string | null;
  quality_rating?: string | null;
  registered_at?: string | null;
  subscribed_apps_at?: string | null;
  last_registration_error?: string | null;
}

/**
 * Fetch WhatsApp configuration for an account from Firestore (primary)
 * or Supabase (fallback), decrypting access token safely.
 */
export async function getWhatsAppConfigForAccount(
  accountId: string
): Promise<WhatsAppConfigRecord | null> {
  let raw: any = null;

  // 1. Check Firestore enterprise store (guarded against missing admin credentials in tests)
  if (process.env.NODE_ENV !== 'test') {
    try {
      const fDb = getAdminDb();
      if (fDb) {
        const fsDoc = await fDb.collection('whatsapp_configs').doc(accountId).get();
        if (fsDoc.exists) {
          raw = fsDoc.data();
        } else {
          const nestedDoc = await fDb.doc(`accounts/${accountId}/whatsapp_config/config`).get();
          if (nestedDoc.exists) {
            raw = nestedDoc.data();
          }
        }
      }
    } catch (fsErr) {
      console.warn('[getWhatsAppConfigForAccount] Firestore fetch warning:', fsErr);
    }
  }

  // 2. Check Supabase database (or fallback in tests)
  if (!raw) {
    try {
      const supabaseAdmin = createAdminClient();
      const { data: sbConfig } = await supabaseAdmin
        .from('whatsapp_config')
        .select('*')
        .eq('account_id', accountId)
        .maybeSingle();
      if (sbConfig) {
        raw = sbConfig;
      }
    } catch (sbErr) {
      console.warn('[getWhatsAppConfigForAccount] Supabase fetch warning:', sbErr);
    }
  }

  if (!raw) return null;

  const phone_number_id = raw.phone_number_id || raw.phoneNumberId || '';
  const waba_id = raw.waba_id || raw.wabaId || null;
  const access_token = raw.access_token || raw.accessToken || raw.system_user_token || '';
  const verify_token = raw.verify_token || raw.verifyToken || null;
  const status = raw.status || 'connected';

  if (!phone_number_id || !access_token) return null;

  let decrypted_access_token = '';
  if (access_token.startsWith('EAAG') || access_token.startsWith('EAA')) {
    decrypted_access_token = access_token;
  } else {
    try {
      decrypted_access_token = decrypt(access_token);
    } catch (err) {
      console.error('[getWhatsAppConfigForAccount] Decryption error:', err);
    }
  }

  if (!decrypted_access_token) {
    const envToken = process.env.PERMANENT_TOKEN || process.env.permanent_token || process.env.WHATSAPP_ACCESS_TOKEN;
    if (envToken) {
      decrypted_access_token = envToken;
    }
  }

  return {
    id: raw.id || accountId,
    account_id: accountId,
    phone_number_id,
    waba_id,
    access_token,
    decrypted_access_token,
    verify_token,
    status,
    verified_name: raw.verified_name || raw.verifiedName || null,
    display_phone_number: raw.display_phone_number || raw.displayPhoneNumber || null,
    quality_rating: raw.quality_rating || raw.qualityRating || null,
    registered_at: raw.registered_at || raw.registeredAt || null,
    subscribed_apps_at: raw.subscribed_apps_at || raw.subscribedAppsAt || null,
    last_registration_error: raw.last_registration_error || raw.lastRegistrationError || null,
  };
}
