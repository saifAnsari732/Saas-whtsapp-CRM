import { NextResponse } from 'next/server'
import { getAdminDb, cleanForFirestore } from '@/lib/firebase/admin'
import { getAccountContext } from '@/lib/firebase/auth-helper'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import {
  loadStepsTree,
  replaceSteps,
  seedsToTree,
  type BuilderStepInput,
} from '@/lib/automations/steps-tree'
import {
  validateStepsForActivation,
  validateTriggerForActivation,
} from '@/lib/automations/validate'

export const dynamic = 'force-dynamic'

async function resolveAutomation(id: string, accountId: string, userId?: string) {
  const fDb = getAdminDb()
  if (fDb) {
    try {
      const doc = await fDb
        .collection('accounts')
        .doc(accountId)
        .collection('automations')
        .doc(id)
        .get()
      if (doc.exists) {
        return { source: 'firestore-account' as const, doc }
      }
    } catch {}

    try {
      const doc = await fDb.collection('automations').doc(id).get()
      if (doc.exists) {
        const d = doc.data()
        if (d?.account_id === accountId || d?.accountId === accountId || (userId && d?.user_id === userId)) {
          return { source: 'firestore-top' as const, doc }
        }
      }
    } catch {}
  }

  return null
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const accCtx = await getAccountContext(_request as any)
    const accountId = accCtx?.accountId
    const user = accCtx?.user

    if (!user || !accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolved = await resolveAutomation(id, accountId, user.uid)
    if (resolved) {
      const data = resolved.doc.data() || {}
      let steps = data.steps || []
      if (!Array.isArray(steps) || steps.length === 0) {
        try {
          steps = await loadStepsTree(id)
        } catch {}
      } else if (steps.some((s: any) => s.branch !== undefined || s.parent_index !== undefined)) {
        steps = seedsToTree(steps)
      }
      return NextResponse.json({
        automation: { id: resolved.doc.id, ...data },
        steps,
      })
    }

    // Supabase fallback
    try {
      const admin = supabaseAdmin()
      const { data: automation, error } = await admin
        .from('automations')
        .select('*')
        .eq('id', id)
        .eq('account_id', accountId)
        .maybeSingle()

      if (automation && !error) {
        const steps = await loadStepsTree(id).catch(() => [])
        return NextResponse.json({ automation, steps })
      }
    } catch (sbErr) {
      console.warn('[automations/[id] GET] Supabase fallback error:', sbErr)
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (err: any) {
    console.error('[automations/[id] GET] Error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to load automation' },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const accCtx = await getAccountContext(request as any)
    const accountId = accCtx?.accountId

    if (!accCtx?.user || !accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const user = accCtx.user
    const resolved = await resolveAutomation(id, accountId, user.uid)
    let existingData: any = resolved?.doc?.data()

    if (!existingData) {
      // Supabase fallback lookup
      try {
        const admin = supabaseAdmin()
        const { data } = await admin
          .from('automations')
          .select('id, user_id, is_active, trigger_type, trigger_config, account_id')
          .eq('id', id)
          .maybeSingle()
        if (data && (data.account_id === accountId || data.user_id === user.uid)) {
          existingData = data
        }
      } catch {}
    }

    if (!existingData) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    for (const k of [
      'name',
      'description',
      'trigger_type',
      'trigger_config',
      'is_active',
      'steps',
    ] as const) {
      if (k in body) update[k] = body[k]
    }

    const willBeActive =
      typeof update.is_active === 'boolean' ? update.is_active : existingData.is_active
    if (willBeActive) {
      const mergedTriggerType = (update.trigger_type ?? existingData.trigger_type) as string
      const mergedTriggerConfig = update.trigger_config ?? existingData.trigger_config
      const rawSteps = Array.isArray(body.steps)
        ? (body.steps as { step_type: string; step_config: Record<string, unknown> }[])
        : Array.isArray(existingData.steps)
          ? existingData.steps
          : await loadStepsTree(id).catch(() => [])

      // Prune unconfigured dummy tag steps that have an empty tag_id
      const mergedSteps = (rawSteps || []).filter(
        (s: any) =>
          !(
            (s.step_type === 'add_tag' || s.step_type === 'remove_tag') &&
            (!s.step_config?.tag_id || String(s.step_config.tag_id).trim() === '')
          ),
      )

      if (Array.isArray(existingData.steps) && mergedSteps.length !== existingData.steps.length) {
        update.steps = mergedSteps
      }

      const issues = [
        ...validateTriggerForActivation(mergedTriggerType, mergedTriggerConfig),
        ...validateStepsForActivation(mergedSteps),
      ]
      if (issues.length > 0) {
        const detail = issues.map((i) => i.message).join(', ')
        return NextResponse.json(
          {
            error: `Cannot activate automation: ${detail}`,
            issues,
          },
          { status: 400 },
        )
      }
    }

    const fDb = getAdminDb()
    if (fDb) {
      const cleanUpdate = cleanForFirestore(update)
      await Promise.allSettled([
        fDb
          .collection('accounts')
          .doc(accountId)
          .collection('automations')
          .doc(id)
          .set(cleanUpdate, { merge: true }),
        fDb.collection('automations').doc(id).set(cleanUpdate, { merge: true }),
      ])
    }

    // Dual-write Supabase (best-effort)
    try {
      const admin = supabaseAdmin()
      const { steps: _s, ...sbUpdate } = update
      if (Object.keys(sbUpdate).length > 0) {
        await admin.from('automations').update(sbUpdate).eq('id', id)
      }
      if (Array.isArray(body.steps)) {
        await replaceSteps(id, body.steps as BuilderStepInput[])
      }
    } catch (sbErr) {
      console.warn('[automations/[id] PATCH] Supabase dual-write warning:', sbErr)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[automations/[id] PATCH] Error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to update automation' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const accCtx = await getAccountContext(_request as any)
    const accountId = accCtx?.accountId
    const user = accCtx?.user

    if (!user || !accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolved = await resolveAutomation(id, accountId, user.uid)
    if (!resolved) {
      try {
        const admin = supabaseAdmin()
        const { data: sf } = await admin
          .from('automations')
          .select('id, account_id, user_id')
          .eq('id', id)
          .maybeSingle()
        if (!sf || (sf.account_id !== accountId && sf.user_id !== user.uid)) {
          return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }
      } catch {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    }

    const fDb = getAdminDb()
    if (fDb) {
      await Promise.allSettled([
        fDb.collection('accounts').doc(accountId).collection('automations').doc(id).delete(),
        fDb.collection('automations').doc(id).delete(),
      ])
    }

    // Best-effort delete from Supabase
    try {
      await supabaseAdmin().from('automations').delete().eq('id', id)
    } catch {}

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[automations/[id] DELETE] Error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to delete automation' },
      { status: 500 },
    )
  }
}
