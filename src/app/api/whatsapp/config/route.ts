import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import {
  registerPhoneNumber,
  subscribeWabaToApp,
  verifyPhoneNumber,
} from '@/lib/whatsapp/meta-api'
import { encrypt, decrypt } from '@/lib/whatsapp/encryption'
import { getAdminDb } from '@/lib/firebase/admin'
import { getFirebaseUser, getAccountContext } from '@/lib/firebase/auth-helper'

let _adminClient: any = null
function supabaseAdmin() {
  if (!_adminClient) {
    _adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _adminClient
}

/**
 * GET /api/whatsapp/config
 *
 * Reads WhatsApp Cloud API configuration for the authenticated user/account.
 * Uses Firebase Auth (and Supabase Auth fallback) to authenticate the request,
 * then checks Firestore (enterprise store) and Supabase database.
 */
export async function GET(request: Request) {
  try {
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
        console.warn('[whatsapp/config GET] Supabase auth fallback error:', sbAuthErr)
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!accountId) {
      return NextResponse.json(
        {
          connected: false,
          reason: 'no_account',
          message: 'Your profile is not linked to an account.',
        },
        { status: 200 }
      )
    }

    const db = getAdminDb()
    let config: any = null

    // 1. Check Firestore top-level whatsapp_configs doc
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
      console.warn('[whatsapp/config GET] Firestore read warning:', fsErr)
    }

    // 2. Fallback to Supabase whatsapp_config table
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
        console.warn('[whatsapp/config GET] Supabase read warning:', sbErr)
      }
    }

    if (!config) {
      return NextResponse.json(
        {
          connected: false,
          reason: 'no_config',
          message: 'No WhatsApp configuration saved yet. Fill in the form and click Save Configuration.',
        },
        { status: 200 }
      )
    }

    const mappedConfig = {
      account_id: accountId,
      phone_number_id: config.phone_number_id || config.phoneNumberId || '',
      waba_id: config.waba_id || config.wabaId || '',
      access_token: config.access_token || config.accessToken || config.system_user_token || '',
      verify_token: config.verify_token || config.verifyToken || '',
      status: config.status || 'connected',
      verified_name: config.verified_name || config.verifiedName || null,
      display_phone_number: config.display_phone_number || config.displayPhoneNumber || null,
      quality_rating: config.quality_rating || config.qualityRating || null,
      registered_at: config.registered_at || config.registeredAt || null,
      subscribed_apps_at: config.subscribed_apps_at || config.subscribedAppsAt || null,
      last_registration_error: config.last_registration_error || config.lastRegistrationError || null,
    }

    let accessToken: string | null = null
    if (mappedConfig.access_token) {
      try {
        accessToken = decrypt(mappedConfig.access_token)
      } catch (err) {
        if (mappedConfig.access_token.startsWith('EAAG') || mappedConfig.access_token.startsWith('EAA')) {
          accessToken = mappedConfig.access_token
        } else {
          console.error('[whatsapp/config GET] Token decryption failed:', err)
        }
      }
    }

    const envPermanentToken = process.env.PERMANENT_TOKEN || process.env.permanent_token || process.env.WHATSAPP_ACCESS_TOKEN

    const dbPhoneInfo = {
      id: mappedConfig.phone_number_id,
      display_phone_number: mappedConfig.display_phone_number || 'Connected WhatsApp',
      verified_name: mappedConfig.verified_name || 'Official WhatsApp Business',
      quality_rating: mappedConfig.quality_rating || 'GREEN (High Quality)',
    }

    if (accessToken && mappedConfig.phone_number_id) {
      try {
        const phoneInfo = await verifyPhoneNumber({
          phoneNumberId: mappedConfig.phone_number_id,
          accessToken,
        })
        return NextResponse.json({ connected: true, config: mappedConfig, phone_info: phoneInfo })
      } catch (err) {
        console.warn('[whatsapp/config GET] Stored access token verify failed:', err)
      }
    }

    if (envPermanentToken && mappedConfig.phone_number_id) {
      try {
        const permPhoneInfo = await verifyPhoneNumber({
          phoneNumberId: mappedConfig.phone_number_id,
          accessToken: envPermanentToken,
        })
        return NextResponse.json({ connected: true, config: mappedConfig, phone_info: permPhoneInfo })
      } catch (permErr) {
        console.warn('[whatsapp/config GET] Permanent token check failed:', permErr)
      }
    }

    if (mappedConfig.status === 'connected' || mappedConfig.phone_number_id) {
      return NextResponse.json({ connected: true, config: mappedConfig, phone_info: dbPhoneInfo })
    }

    return NextResponse.json(
      {
        connected: false,
        config: mappedConfig,
        reason: 'meta_api_error',
        message: 'Could not verify WhatsApp connection with Meta.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in WhatsApp config GET:', error)
    return NextResponse.json(
      { connected: false, reason: 'unknown', message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/whatsapp/config
 *
 * Saves or updates the WhatsApp config for the authenticated user.
 * Dual-writes to Firestore and Supabase.
 */
export async function POST(request: Request) {
  try {
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
        console.warn('[whatsapp/config POST] Supabase auth fallback error:', sbAuthErr)
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!accountId) {
      return NextResponse.json(
        { error: 'Your profile is not linked to an account.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { phone_number_id, waba_id, access_token, verify_token, pin } = body

    if (!access_token || !phone_number_id) {
      return NextResponse.json(
        { error: 'access_token and phone_number_id are required' },
        { status: 400 }
      )
    }

    if (pin !== undefined && pin !== null && pin !== '') {
      if (typeof pin !== 'string' || !/^\d{6}$/.test(pin)) {
        return NextResponse.json(
          { error: 'PIN must be exactly 6 digits.' },
          { status: 400 }
        )
      }
    }

    let phoneInfo
    try {
      phoneInfo = await verifyPhoneNumber({
        phoneNumberId: phone_number_id,
        accessToken: access_token,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown Meta API error'
      console.error('Meta API verification failed during save:', message)
      return NextResponse.json(
        { error: `Meta API error: ${message}` },
        { status: 400 }
      )
    }

    let encryptedAccessToken: string
    let encryptedVerifyToken: string | null
    try {
      encryptedAccessToken = encrypt(access_token)
      encryptedVerifyToken = verify_token ? encrypt(verify_token) : null
    } catch (err) {
      encryptedAccessToken = access_token
      encryptedVerifyToken = verify_token || null
    }

    let registeredAt: string | null = new Date().toISOString()
    let registrationError: string | null = null
    let registrationSkipped = false

    if (pin) {
      try {
        await registerPhoneNumber({
          phoneNumberId: phone_number_id,
          accessToken: access_token,
          pin,
        })
      } catch (err) {
        registrationError = err instanceof Error ? err.message : 'Unknown Meta API error'
        console.error('Phone number /register failed:', registrationError)
      }
    } else {
      registrationSkipped = true
    }

    let subscribedAppsAt: string | null = null
    if (waba_id) {
      try {
        await subscribeWabaToApp({
          wabaId: waba_id,
          accessToken: access_token,
        })
        subscribedAppsAt = new Date().toISOString()
      } catch (err) {
        console.warn('WABA subscribed_apps failed (non-fatal):', err)
      }
    }

    const baseRow: Record<string, any> = {
      account_id: accountId,
      user_id: user.uid,
      phone_number_id,
      waba_id: waba_id || null,
      access_token: encryptedAccessToken,
      verify_token: encryptedVerifyToken,
      status: registrationError ? 'disconnected' : 'connected',
      connected_at: registrationError ? null : new Date().toISOString(),
      registered_at: registrationError ? null : registeredAt,
      subscribed_apps_at: subscribedAppsAt ?? null,
      last_registration_error: registrationError,
      verified_name: phoneInfo?.verified_name || null,
      display_phone_number: phoneInfo?.display_phone_number || null,
      quality_rating: phoneInfo?.quality_rating || null,
      updated_at: new Date().toISOString(),
    }

    // Firestore persistence (primary)
    try {
      const firestore = getAdminDb()
      await firestore.collection('whatsapp_configs').doc(accountId).set(baseRow, { merge: true })
      await firestore.doc(`accounts/${accountId}/whatsapp_config/config`).set(baseRow, { merge: true })
      console.log('[whatsapp/config POST] Successfully persisted WhatsApp config in Firestore')
    } catch (fsErr) {
      console.warn('[whatsapp/config POST] Firestore write error:', fsErr)
    }

    // Supabase persistence (dual-write fallback)
    try {
      const supabase = await createClient()
      const { data: existing } = await supabase
        .from('whatsapp_config')
        .select('id')
        .eq('account_id', accountId)
        .maybeSingle()

      if (existing) {
        await supabase.from('whatsapp_config').update(baseRow).eq('account_id', accountId)
      } else {
        await supabase.from('whatsapp_config').insert(baseRow)
      }
    } catch (sbErr) {
      console.warn('[whatsapp/config POST] Supabase write error:', sbErr)
    }

    return NextResponse.json({
      success: true,
      saved: true,
      registered: registeredAt != null,
      registration_skipped: registrationSkipped,
      phone_info: phoneInfo,
      config: baseRow,
    })
  } catch (error) {
    console.error('Error in WhatsApp config POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/whatsapp/config
 *
 * Deletes the WhatsApp config for the authenticated account.
 */
export async function DELETE(request: Request) {
  try {
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
        console.warn('[whatsapp/config DELETE] Supabase auth fallback error:', sbAuthErr)
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!accountId) {
      return NextResponse.json(
        { error: 'Your profile is not linked to an account.' },
        { status: 403 }
      )
    }

    try {
      const firestore = getAdminDb()
      await firestore.collection('whatsapp_configs').doc(accountId).delete()
      await firestore.doc(`accounts/${accountId}/whatsapp_config/config`).delete().catch(() => {})
    } catch (fsErr) {
      console.warn('[whatsapp/config DELETE] Firestore cleanup warning:', fsErr)
    }

    try {
      const supabase = await createClient()
      await supabase.from('whatsapp_config').delete().eq('account_id', accountId)
    } catch (sbErr) {
      console.warn('[whatsapp/config DELETE] Supabase cleanup warning:', sbErr)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in WhatsApp config DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
