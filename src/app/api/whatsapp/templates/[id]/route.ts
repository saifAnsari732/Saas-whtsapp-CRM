import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminDb, cleanForFirestore } from '@/lib/firebase/admin'
import { getAccountContext } from '@/lib/firebase/auth-helper'
import { getWhatsAppConfigForAccount } from '@/lib/whatsapp/get-config'
import {
  submitMessageTemplate,
  deleteMessageTemplate,
  editMessageTemplate,
} from '@/lib/whatsapp/meta-api'
import {
  validateTemplatePayload,
  type TemplatePayload,
} from '@/lib/whatsapp/template-validators'
import { buildMetaTemplatePayload } from '@/lib/whatsapp/template-components'
import { ensureImageHeaderHandle } from '@/lib/whatsapp/template-header-handle'
import { sanitizeTemplatePhoneNumber } from '@/lib/whatsapp/phone-utils'

export const dynamic = 'force-dynamic'

/**
 * Per-template lifecycle endpoint (PATCH edit, DELETE).
 * Supports both Firestore (primary) and Supabase (fallback).
 * Accepts UUIDs, Meta numeric template IDs, and compound Firestore IDs.
 */

const EDITABLE_STATUSES = new Set(['APPROVED', 'REJECTED', 'PAUSED'])

function isDryRun(): boolean {
  return (
    process.env.WHATSAPP_TEMPLATES_DRY_RUN === 'true' ||
    process.env.WHATSAPP_TEMPLATES_DRY_RUN === '1'
  )
}

interface ResolvedTemplate {
  id: string
  name: string
  category?: string
  language?: string
  status?: string
  meta_template_id?: string | null
  account_id?: string
  docId?: string
  [key: string]: any
}

async function resolveExistingTemplate(
  id: string,
  accountId: string,
  payloadName?: string,
  payloadLanguage?: string,
): Promise<ResolvedTemplate | null> {
  const db = getAdminDb()
  const searchTerms = Array.from(
    new Set(
      [
        id,
        id.toLowerCase(),
        payloadName,
        payloadName?.toLowerCase(),
      ].filter((s): s is string => Boolean(s && s !== 'undefined' && s !== 'null')),
    ),
  )

  if (db) {
    for (const term of searchTerms) {
      // 1. Direct doc in accounts/{accountId}/templates/{term}
      try {
        const acctDoc = await db
          .collection('accounts')
          .doc(accountId)
          .collection('templates')
          .doc(term)
          .get()
        if (acctDoc.exists) {
          return { id: acctDoc.id, docId: acctDoc.id, ...acctDoc.data() } as ResolvedTemplate
        }
      } catch (e) {
        console.warn('[resolveExistingTemplate] acctDoc warning:', e)
      }

      // 2. Direct doc in message_templates/{term}
      try {
        const mtDoc = await db.collection('message_templates').doc(term).get()
        if (mtDoc.exists) {
          return { id: mtDoc.id, docId: mtDoc.id, ...mtDoc.data() } as ResolvedTemplate
        }
      } catch (e) {
        console.warn('[resolveExistingTemplate] mtDoc warning:', e)
      }

      // 3. Composite docId check
      const compositeId = `${accountId}_${term}_${payloadLanguage || 'en_US'}`.replace(/[^a-zA-Z0-9_-]/g, '_')
      try {
        const [c1, c2] = await Promise.all([
          db.collection('accounts').doc(accountId).collection('templates').doc(compositeId).get(),
          db.collection('message_templates').doc(compositeId).get(),
        ])
        if (c1.exists) return { id: c1.id, docId: c1.id, ...c1.data() } as ResolvedTemplate
        if (c2.exists) return { id: c2.id, docId: c2.id, ...c2.data() } as ResolvedTemplate
      } catch {}

      // 4. Query accounts/{accountId}/templates by meta_template_id or name
      try {
        const [byMeta, byName] = await Promise.all([
          db.collection('accounts').doc(accountId).collection('templates').where('meta_template_id', '==', term).limit(1).get(),
          db.collection('accounts').doc(accountId).collection('templates').where('name', '==', term).limit(1).get(),
        ])
        const match = byMeta.docs[0] || byName.docs[0]
        if (match) {
          return { id: match.id, docId: match.id, ...match.data() } as ResolvedTemplate
        }
      } catch (e) {
        console.warn('[resolveExistingTemplate] acct query warning:', e)
      }

      // 5. Query message_templates by meta_template_id or name
      try {
        const [byMeta, byName] = await Promise.all([
          db.collection('message_templates').where('meta_template_id', '==', term).limit(1).get(),
          db.collection('message_templates').where('name', '==', term).limit(1).get(),
        ])
        const match = byMeta.docs[0] || byName.docs[0]
        if (match) {
          return { id: match.id, docId: match.id, ...match.data() } as ResolvedTemplate
        }
      } catch (e) {
        console.warn('[resolveExistingTemplate] query warning:', e)
      }
    }

    // 6. Look up by collectionGroup for numeric Meta IDs
    if (/^\d{10,25}$/.test(id)) {
      try {
        const groupSnap = await db
          .collectionGroup('templates')
          .where('meta_template_id', '==', id)
          .limit(1)
          .get()
        if (!groupSnap.empty) {
          const doc = groupSnap.docs[0]
          return { id: doc.id, docId: doc.id, ...doc.data() } as ResolvedTemplate
        }
      } catch {}
    }
  }

  // 7. Supabase fallback
  try {
    const supabase = await createClient()
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    for (const term of searchTerms) {
      let query = supabase.from('message_templates').select('*')
      if (UUID_RE.test(term)) {
        query = query.eq('id', term)
      } else {
        query = query.or(`meta_template_id.eq.${term},name.eq.${term}`)
      }
      const { data } = await query.maybeSingle()
      if (data) {
        return data as ResolvedTemplate
      }
    }
  } catch (sbErr) {
    console.warn('[resolveExistingTemplate] Supabase fallback error:', sbErr)
  }

  return null
}

async function resolveWhatsAppConfig(accountId: string, templateAccountId?: string) {
  // 1. Check caller's account
  let cfg = await getWhatsAppConfigForAccount(accountId)
  if (cfg && cfg.decrypted_access_token) return cfg

  // 2. Check template's owning account if different
  if (templateAccountId && templateAccountId !== accountId) {
    cfg = await getWhatsAppConfigForAccount(templateAccountId)
    if (cfg && cfg.decrypted_access_token) return cfg
  }

  // 3. Fallback: check all whatsapp_configs in Firestore
  const db = getAdminDb()
  if (db) {
    try {
      const snap = await db.collection('whatsapp_configs').get()
      for (const doc of snap.docs) {
        const d = doc.data()
        if ((d.waba_id || d.wabaId) && (d.access_token || d.accessToken)) {
          const candidate = await getWhatsAppConfigForAccount(doc.id)
          if (candidate && candidate.decrypted_access_token) return candidate
        }
      }
    } catch {}
  }

  return null
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const rawId = decodeURIComponent(id || '').trim()

    let payload: TemplatePayload
    try {
      payload = (await request.json()) as TemplatePayload
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const targetId =
      (rawId && rawId !== 'undefined' && rawId !== 'null' ? rawId : '') ||
      (payload as any)?.id ||
      payload?.name

    if (!targetId) {
      return NextResponse.json(
        { error: 'Invalid template id.' },
        { status: 400 },
      )
    }

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
        console.warn('[whatsapp/templates/[id] PATCH] Supabase auth fallback error:', sbAuthErr)
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!accountId) {
      accountId = `acct-${user.uid}`
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

    // Lookup existing template from Firestore / Supabase
    const existing = await resolveExistingTemplate(targetId, accountId, payload.name, payload.language)
    if (!existing) {
      return NextResponse.json({ error: 'Template not found.' }, { status: 404 })
    }

    // If meta_template_id not explicitly set but id is numeric (Meta template ID)
    let effectiveMetaTemplateId =
      existing.meta_template_id || (/^\d{10,25}$/.test(targetId) ? targetId : null)

    const isNative =
      effectiveMetaTemplateId?.startsWith('native-') ||
      effectiveMetaTemplateId?.startsWith('baileys-') ||
      effectiveMetaTemplateId?.startsWith('local-')

    const currentStatus = (existing.status || 'APPROVED').toUpperCase()
    if (!EDITABLE_STATUSES.has(currentStatus) && currentStatus !== 'PENDING' && currentStatus !== 'DRAFT') {
      return NextResponse.json(
        {
          error: `Templates in status ${currentStatus} cannot be edited. Allowed: APPROVED, REJECTED, PAUSED.`,
        },
        { status: 400 },
      )
    }

    if (payload.category === 'Authentication') {
      return NextResponse.json(
        {
          error:
            'AUTHENTICATION templates are not editable here — manage them in Meta WhatsApp Manager.',
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

    // If template has not yet been submitted to Meta or has no meta_template_id
    if (!effectiveMetaTemplateId && !isNative) {
      if (isDryRun()) {
        effectiveMetaTemplateId = `dry-run-${crypto.randomUUID()}`
      } else {
        const config = await resolveWhatsAppConfig(accountId, existing.account_id)
        if (config && config.waba_id && config.decrypted_access_token) {
          const accessToken = config.decrypted_access_token
          try {
            await ensureImageHeaderHandle(payload, accessToken)
            const metaPayload = buildMetaTemplatePayload(payload)
            const created = await submitMessageTemplate({
              wabaId: config.waba_id,
              accessToken,
              payload: metaPayload,
            })
            effectiveMetaTemplateId = created.id
          } catch (createErr: any) {
            console.warn('[whatsapp/templates/[id] PATCH] Initial submit on Meta warning:', createErr)
          }
        } else {
          // If WhatsApp isn't fully configured, treat as local template
          effectiveMetaTemplateId = `local-${Date.now()}`
        }
      }
    } else if (!isDryRun() && !isNative && effectiveMetaTemplateId) {
      const config = await resolveWhatsAppConfig(accountId, existing.account_id)
      if (config && config.decrypted_access_token) {
        const accessToken = config.decrypted_access_token

        // Image headers need a fresh Resumable-Upload handle on every edit
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
          await editMessageTemplate({
            metaTemplateId: effectiveMetaTemplateId,
            accessToken,
            components: metaPayload.components,
          })
        } catch (e: any) {
          const message = e instanceof Error ? e.message : 'Meta edit failed.'
          // If Meta says template does not exist on Meta, try initial submission
          if (config.waba_id && (message.toLowerCase().includes('does not exist') || message.toLowerCase().includes('not found'))) {
            try {
              const created = await submitMessageTemplate({
                wabaId: config.waba_id,
                accessToken,
                payload: metaPayload,
              })
              effectiveMetaTemplateId = created.id
            } catch (subErr: any) {
              return NextResponse.json({ error: subErr.message || message }, { status: 502 })
            }
          } else {
            const db = getAdminDb()
            if (db) {
              const docId = existing.docId || existing.id || targetId
              await db
                .collection('message_templates')
                .doc(docId)
                .set(
                  cleanForFirestore({
                    submission_error: message,
                    last_submitted_at: new Date().toISOString(),
                  }),
                  { merge: true },
                )
                .catch(() => {})
            }
            return NextResponse.json({ error: message }, { status: 502 })
          }
        }
      }
    }

    // Meta accepted the edit or local template updated — update both Firestore and Supabase
    const docId = existing.docId || existing.id || targetId
    const nowIso = new Date().toISOString()
    const updateRecord = cleanForFirestore({
      name: payload.name || existing.name,
      category: payload.category,
      language: payload.language || existing.language || 'en_US',
      header_type: payload.header_type ?? null,
      header_content: payload.header_content ?? null,
      header_media_url: payload.header_media_url ?? null,
      header_handle: payload.header_handle ?? null,
      body_text: payload.body_text,
      footer_text: payload.footer_text ?? null,
      buttons: payload.buttons ?? null,
      sample_values: payload.sample_values ?? null,
      status: 'PENDING',
      meta_template_id: effectiveMetaTemplateId,
      submission_error: null,
      rejection_reason: null,
      last_submitted_at: nowIso,
      updated_at: nowIso,
    })

    const db = getAdminDb()
    if (db) {
      const writes = [
        db.collection('message_templates').doc(docId).set(updateRecord, { merge: true }),
        db.collection('accounts').doc(accountId).collection('templates').doc(docId).set(updateRecord, { merge: true }),
      ]
      if (existing.account_id && existing.account_id !== accountId) {
        writes.push(
          db.collection('accounts').doc(existing.account_id).collection('templates').doc(docId).set(updateRecord, { merge: true }),
        )
      }
      await Promise.allSettled(writes)
    }

    // Supabase update fallback (best effort)
    try {
      const supabase = await createClient()
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (UUID_RE.test(existing.id)) {
        await supabase
          .from('message_templates')
          .update(updateRecord)
          .eq('id', existing.id)
      }
    } catch {}

    return NextResponse.json({
      success: true,
      template: { ...existing, ...updateRecord, id: docId },
      dry_run: isDryRun(),
    })
  } catch (error) {
    console.error('Error editing template:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to edit template.',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const rawId = decodeURIComponent(id || '').trim()
    if (!rawId || rawId === 'undefined' || rawId === 'null') {
      return NextResponse.json(
        { error: 'Invalid template id.' },
        { status: 400 },
      )
    }

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
        console.warn('[whatsapp/templates/[id] DELETE] Supabase auth fallback error:', sbAuthErr)
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!accountId) {
      accountId = `acct-${user.uid}`
    }

    const existing = await resolveExistingTemplate(rawId, accountId)
    if (!existing) {
      return NextResponse.json({ error: 'Template not found.' }, { status: 404 })
    }

    const effectiveMetaTemplateId =
      existing.meta_template_id || (/^\d{10,25}$/.test(rawId) ? rawId : null)

    const isNative =
      effectiveMetaTemplateId?.startsWith('native-') ||
      effectiveMetaTemplateId?.startsWith('baileys-') ||
      effectiveMetaTemplateId?.startsWith('local-')

    if (effectiveMetaTemplateId && !isDryRun() && !isNative) {
      const config = await resolveWhatsAppConfig(accountId, existing.account_id)
      if (config && config.waba_id) {
        const accessToken = config.decrypted_access_token
        try {
          await deleteMessageTemplate({
            wabaId: config.waba_id,
            accessToken,
            name: existing.name,
            metaTemplateId: effectiveMetaTemplateId,
          })
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Meta delete failed.'
          const lowerMsg = message.toLowerCase()
          if (
            lowerMsg.includes('invalid parameter') ||
            lowerMsg.includes('does not exist') ||
            lowerMsg.includes('not found')
          ) {
            console.warn(
              `Template delete on Meta failed (likely already deleted). Proceeding to local delete. Reason: ${message}`,
            )
          } else {
            return NextResponse.json({ error: message }, { status: 502 })
          }
        }
      }
    }

    // Delete locally from Firestore
    const db = getAdminDb()
    if (db) {
      const docId = existing.docId || existing.id || rawId
      const deletes = [
        db.collection('message_templates').doc(docId).delete(),
        db.collection('accounts').doc(accountId).collection('templates').doc(docId).delete(),
      ]
      if (existing.account_id && existing.account_id !== accountId) {
        deletes.push(
          db.collection('accounts').doc(existing.account_id).collection('templates').doc(docId).delete(),
        )
      }
      await Promise.allSettled(deletes)
    }

    // Delete from Supabase fallback (best effort)
    try {
      const supabase = await createClient()
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (UUID_RE.test(existing.id)) {
        await supabase.from('message_templates').delete().eq('id', existing.id)
      }
    } catch {}

    return NextResponse.json({ success: true, dry_run: isDryRun() })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to delete template.',
      },
      { status: 500 },
    )
  }
}
