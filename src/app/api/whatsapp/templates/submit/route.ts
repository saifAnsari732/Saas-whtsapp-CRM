import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/whatsapp/encryption'
import { submitMessageTemplate } from '@/lib/whatsapp/meta-api'
import { getAdminDb, cleanForFirestore } from '@/lib/firebase/admin'
import { getAccountContext } from '@/lib/firebase/auth-helper'
import { getWhatsAppConfigForAccount } from '@/lib/whatsapp/get-config'
import {
  validateTemplatePayload,
  type TemplatePayload,
} from '@/lib/whatsapp/template-validators'
import { buildMetaTemplatePayload } from '@/lib/whatsapp/template-components'
import { ensureImageHeaderHandle } from '@/lib/whatsapp/template-header-handle'
import { normalizeStatus } from '@/lib/whatsapp/template-status-normalize'
import { sanitizeTemplatePhoneNumber } from '@/lib/whatsapp/phone-utils'

/**
 * Shared upsert payload builder for Supabase.
 */
function buildUpsertRow(
  accountId: string,
  userId: string,
  payload: TemplatePayload,
  extras: {
    status: 'DRAFT' | string
    metaTemplateId: string | null
    submissionError: string | null
  },
) {
  return {
    account_id: accountId,
    user_id: userId,
    name: payload.name,
    category: payload.category,
    language: payload.language,
    header_type: payload.header_type ?? null,
    header_content: payload.header_content ?? null,
    header_media_url: payload.header_media_url ?? null,
    header_handle: payload.header_handle ?? null,
    body_text: payload.body_text,
    footer_text: payload.footer_text ?? null,
    buttons: payload.buttons ?? null,
    sample_values: payload.sample_values ?? null,
    status: extras.status,
    meta_template_id: extras.metaTemplateId,
    submission_error: extras.submissionError,
    rejection_reason: null,
    last_submitted_at: new Date().toISOString(),
  }
}

async function upsertTemplateRow(
  supabase: SupabaseClient,
  row: ReturnType<typeof buildUpsertRow>,
) {
  try {
    return await supabase
      .from('message_templates')
      .upsert(row, { onConflict: 'user_id,name,language' })
      .select()
      .single()
  } catch (err) {
    return { data: null, error: err as any }
  }
}

/**
 * Submit a template to Meta for approval AND persist it locally.
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
        console.warn('[whatsapp/templates/submit] Supabase auth fallback error:', sbAuthErr)
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!accountId) {
      accountId = `acct-${user.uid}`
    }

    const supabase = await createClient()

    let payload: TemplatePayload
    try {
      payload = (await request.json()) as TemplatePayload
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    // Sanitize any toll-free or regular phone numbers in buttons
    if (payload.buttons && Array.isArray(payload.buttons)) {
      payload.buttons = payload.buttons.map((b) => {
        if (b.type === 'PHONE_NUMBER' && b.phone_number) {
          return {
            ...b,
            phone_number: sanitizeTemplatePhoneNumber(b.phone_number),
          }
        }
        return b
      })
    }

    if (payload.category === 'Authentication') {
      return NextResponse.json(
        {
          error:
            'AUTHENTICATION templates are not yet supported here — create them in Meta WhatsApp Manager and use "Sync from Meta".',
        },
        { status: 400 },
      )
    }

    try {
      validateTemplatePayload(payload)
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Validation failed.' },
        { status: 400 },
      )
    }

    const dryRun =
      process.env.WHATSAPP_TEMPLATES_DRY_RUN === 'true' ||
      process.env.WHATSAPP_TEMPLATES_DRY_RUN === '1'

    let metaTemplateId: string
    let metaStatus: string

    if (dryRun) {
      metaTemplateId = `dry-run-${crypto.randomUUID()}`
      metaStatus = 'PENDING'
    } else {
      let config = await getWhatsAppConfigForAccount(accountId)
      if (!config) {
        try {
          const { data: sbConfig } = await supabase
            .from('whatsapp_config')
            .select('*')
            .eq('account_id', accountId)
            .maybeSingle()
          if (sbConfig) {
            config = {
              account_id: accountId,
              phone_number_id: sbConfig.phone_number_id,
              waba_id: sbConfig.waba_id,
              access_token: sbConfig.access_token,
              decrypted_access_token: decrypt(sbConfig.access_token),
              verify_token: sbConfig.verify_token,
              status: sbConfig.status || 'connected',
            }
          }
        } catch {}
      }

      if (!config || !config.waba_id || !config.decrypted_access_token) {
        // Fallback for native connection without Cloud API credentials
        metaTemplateId = `native-${crypto.randomUUID()}`
        metaStatus = 'APPROVED'
      } else {
        const accessToken = config.decrypted_access_token

        // Image headers need a Resumable-Upload handle
        try {
          await ensureImageHeaderHandle(payload, accessToken)
        } catch (e) {
          return NextResponse.json(
            { error: e instanceof Error ? e.message : 'Header image upload failed.' },
            { status: 400 },
          )
        }

        const metaPayload = buildMetaTemplatePayload(payload)
        try {
          const meta = await submitMessageTemplate({
            wabaId: config.waba_id,
            accessToken,
            payload: metaPayload,
          })
          metaTemplateId = meta.id
          metaStatus = meta.status
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Meta submit failed.'
          // Persist the failure as DRAFT in Supabase
          await upsertTemplateRow(
            supabase,
            buildUpsertRow(accountId, user.uid, payload, {
              status: 'DRAFT',
              metaTemplateId: null,
              submissionError: message,
            }),
          )
          const isRateLimit = /\b429\b/.test(message)
          return NextResponse.json(
            {
              error: isRateLimit
                ? 'Meta rate limit hit (100 template creates per hour). Try again later.'
                : message,
            },
            { status: isRateLimit ? 429 : 502 },
          )
        }
      }
    }

    // Save to Firestore
    const cleanName = payload.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    const docId = `${accountId}_${cleanName}_${payload.language || 'en_US'}`.replace(/[^a-zA-Z0-9_-]/g, '_')
    const nowIso = new Date().toISOString()
    const fsRecord = cleanForFirestore({
      id: docId,
      name: cleanName,
      category: payload.category,
      language: payload.language || 'en_US',
      header_type: payload.header_type ?? null,
      header_content: payload.header_content ?? null,
      header_media_url: payload.header_media_url ?? null,
      header_handle: payload.header_handle ?? null,
      body_text: payload.body_text,
      footer_text: payload.footer_text ?? null,
      buttons: payload.buttons ?? null,
      sample_values: payload.sample_values ?? null,
      status: normalizeStatus(metaStatus),
      meta_template_id: metaTemplateId,
      submission_error: null,
      rejection_reason: null,
      account_id: accountId,
      accountId: accountId,
      user_id: user.uid,
      created_at: nowIso,
      updated_at: nowIso,
      last_submitted_at: nowIso,
    })

    const db = getAdminDb()
    if (db) {
      await Promise.allSettled([
        db.collection('message_templates').doc(docId).set(fsRecord, { merge: true }),
        db.collection('accounts').doc(accountId).collection('templates').doc(docId).set(fsRecord, { merge: true }),
      ])
    }

    // Supabase best-effort write
    const { data: row } = await upsertTemplateRow(
      supabase,
      buildUpsertRow(accountId, user.uid, payload, {
        status: normalizeStatus(metaStatus),
        metaTemplateId,
        submissionError: null,
      }),
    )

    return NextResponse.json({
      success: true,
      template: fsRecord || row,
      dry_run: dryRun,
    })
  } catch (error) {
    console.error('Error submitting template:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to submit template.',
      },
      { status: 500 },
    )
  }
}
