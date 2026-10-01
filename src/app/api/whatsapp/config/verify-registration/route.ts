import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/whatsapp/encryption'
import {
  getSubscribedApps,
  verifyPhoneNumber,
} from '@/lib/whatsapp/meta-api'
import { getAdminDb } from '@/lib/firebase/admin'
import { getAccountContext } from '@/lib/firebase/auth-helper'

/**
 * GET /api/whatsapp/config/verify-registration
 *
 * Diagnostic endpoint — confirms the user's saved phone number is
 * actually reachable on Meta's side.
 */
export async function GET(request: Request) {
  const accCtx = await getAccountContext(request as any)
  let user = accCtx?.user
  let accountId = accCtx?.accountId

  if (!user) {
    try {
      const supabase = await createClient()
      const { data: { user: sbUser } } = await supabase.auth.getUser()
      if (sbUser) {
        user = { uid: sbUser.id, email: sbUser.email || undefined }
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_id')
          .eq('user_id', sbUser.id)
          .maybeSingle()
        accountId = profile?.account_id || `acct-${sbUser.id}`
      }
    } catch (sbAuthErr) {
      console.warn('[verify-registration GET] Supabase auth fallback error:', sbAuthErr)
    }
  }

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!accountId) {
    return NextResponse.json({
      live: false,
      checks: { config_exists: false },
      message: 'Your profile is not linked to an account.',
    })
  }

  let config: any = null
  const db = getAdminDb()

  try {
    const fsDoc = await db.collection('whatsapp_configs').doc(accountId).get()
    if (fsDoc.exists) {
      config = fsDoc.data()
    } else {
      const nestedFsDoc = await db.doc(`accounts/${accountId}/whatsapp_config/config`).get()
      if (nestedFsDoc.exists) {
        config = nestedFsDoc.data()
      }
    }
  } catch (fsErr) {
    console.warn('[verify-registration GET] Firestore read warning:', fsErr)
  }

  if (!config) {
    try {
      const supabase = await createClient()
      const { data: sbConfig } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('account_id', accountId)
        .maybeSingle()
      if (sbConfig) {
        config = sbConfig
      }
    } catch (sbErr) {
      console.warn('[verify-registration GET] Supabase read warning:', sbErr)
    }
  }

  if (!config) {
    return NextResponse.json({
      live: false,
      checks: { config_exists: false },
      message: 'No WhatsApp configuration saved yet.',
    })
  }

  let accessToken: string
  try {
    const rawToken = config.access_token || config.accessToken || config.system_user_token || ''
    if (rawToken.startsWith('EAAG') || rawToken.startsWith('EAA')) {
      accessToken = rawToken
    } else {
      accessToken = decrypt(rawToken)
    }
  } catch {
    return NextResponse.json({
      live: false,
      checks: {
        config_exists: true,
        token_decryptable: false,
      },
      message:
        'Stored access token can\'t be decrypted — likely ENCRYPTION_KEY changed. Re-enter the token to repair.',
    })
  }

  const phoneNumberId = config.phone_number_id || config.phoneNumberId || ''
  const wabaId = config.waba_id || config.wabaId || ''
  const registeredAt = config.registered_at || config.registeredAt || null
  const lastRegistrationError = config.last_registration_error || config.lastRegistrationError || null
  const subscribedAppsAt = config.subscribed_apps_at || config.subscribedAppsAt || null

  const checks: {
    config_exists: boolean
    token_decryptable: boolean
    phone_metadata_ok: boolean
    waba_subscribed_to_app: boolean | null
    locally_marked_registered: boolean
  } = {
    config_exists: true,
    token_decryptable: true,
    phone_metadata_ok: false,
    waba_subscribed_to_app: null,
    locally_marked_registered: registeredAt != null,
  }
  const errors: string[] = []

  // 1. Phone metadata
  try {
    await verifyPhoneNumber({
      phoneNumberId,
      accessToken,
    })
    checks.phone_metadata_ok = true
  } catch (err) {
    errors.push(
      `Phone metadata check failed: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  // 2. WABA subscription
  if (wabaId) {
    try {
      const subs = await getSubscribedApps({
        wabaId,
        accessToken,
      })
      checks.waba_subscribed_to_app = subs.length > 0
      if (!checks.waba_subscribed_to_app) {
        errors.push(
          'WABA has no subscribed apps. Re-save the configuration to subscribe.',
        )
      }
    } catch (err) {
      errors.push(
        `WABA subscription check failed: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  } else {
    errors.push(
      'No WABA ID on file — webhooks can\'t be wired without it. Add it in the form and re-save.',
    )
  }

  const live =
    checks.phone_metadata_ok &&
    (checks.waba_subscribed_to_app ?? false) &&
    checks.locally_marked_registered

  return NextResponse.json({
    live,
    checks,
    errors,
    last_registration_error: lastRegistrationError,
    registered_at: registeredAt,
    subscribed_apps_at: subscribedAppsAt,
  })
}
