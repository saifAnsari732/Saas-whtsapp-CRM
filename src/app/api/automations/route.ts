import { NextResponse } from 'next/server'
import { getAdminDb, cleanForFirestore } from '@/lib/firebase/admin'
import { getAccountContext } from '@/lib/firebase/auth-helper'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { getTemplate } from '@/lib/automations/templates'
import { insertSteps, type BuilderStepInput } from '@/lib/automations/steps-tree'
import {
  validateStepsForActivation,
  validateTriggerForActivation,
} from '@/lib/automations/validate'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any)
    const accountId = accCtx?.accountId

    if (!accCtx?.user || !accountId) {
      return NextResponse.json({ automations: [] }, { status: 401 })
    }

    const fDb = getAdminDb()
    const autoMap = new Map<string, any>()

    if (fDb) {
      // 1. Nested: accounts/{accountId}/automations
      try {
        const snap = await fDb
          .collection('accounts')
          .doc(accountId)
          .collection('automations')
          .get()

        for (const doc of snap.docs) {
          const d = doc.data()
          autoMap.set(doc.id, {
            id: doc.id,
            ...d,
            created_at: d.created_at || d.createdAt || new Date().toISOString(),
          })
        }
      } catch (nestedErr) {
        console.warn('[automations GET] nested fetch warning:', nestedErr)
      }

      // 2. Top-level: automations
      try {
        const [top1, top2] = await Promise.all([
          fDb.collection('automations').where('account_id', '==', accountId).get(),
          fDb.collection('automations').where('accountId', '==', accountId).get(),
        ])

        const mergeDoc = (doc: any) => {
          if (!autoMap.has(doc.id)) {
            const d = doc.data()
            autoMap.set(doc.id, {
              id: doc.id,
              ...d,
              created_at: d.created_at || d.createdAt || new Date().toISOString(),
            })
          }
        }

        top1.docs.forEach(mergeDoc)
        top2.docs.forEach(mergeDoc)
      } catch (topErr) {
        console.warn('[automations GET] top fetch warning:', topErr)
      }
    }

    // 3. Fallback to Supabase
    if (autoMap.size === 0) {
      try {
        const admin = supabaseAdmin()
        const { data, error } = await admin
          .from('automations')
          .select('*')
          .eq('account_id', accountId)
          .order('created_at', { ascending: false })

        if (!error && data) {
          for (const item of data) {
            autoMap.set(item.id, item)
          }
        }
      } catch (sbErr) {
        console.warn('[automations GET] Supabase fallback error:', sbErr)
      }
    }

    const list = Array.from(autoMap.values()).sort((a, b) => {
      const tA = new Date(a.created_at || 0).getTime()
      const tB = new Date(b.created_at || 0).getTime()
      return tB - tA
    })

    return NextResponse.json({ automations: list })
  } catch (err: any) {
    console.error('[automations GET] Error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to load automations', automations: [] },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any)
    const accountId = accCtx?.accountId
    const user = accCtx?.user

    if (!user || !accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const { name, description, trigger_type, trigger_config, is_active, steps, template } = body

    let effectiveSteps: BuilderStepInput[] | undefined = steps
    let effectiveName = name
    let effectiveDescription = description
    let effectiveTriggerType = trigger_type
    let effectiveTriggerConfig = trigger_config

    if (template && (!steps || steps.length === 0)) {
      const t = getTemplate(template)
      if (t) {
        effectiveName = effectiveName ?? t.name
        effectiveDescription = effectiveDescription ?? t.description
        effectiveTriggerType = effectiveTriggerType ?? t.trigger_type
        effectiveTriggerConfig = effectiveTriggerConfig ?? t.trigger_config
        effectiveSteps = t.steps as unknown as BuilderStepInput[]
      }
    }

    if (!effectiveName || !effectiveTriggerType) {
      return NextResponse.json(
        { error: 'name and trigger_type are required' },
        { status: 400 },
      )
    }

    if (is_active) {
      const issues = [
        ...validateTriggerForActivation(effectiveTriggerType, effectiveTriggerConfig ?? {}),
        ...validateStepsForActivation(
          (effectiveSteps ?? []) as unknown as { step_type: string; step_config: Record<string, unknown> }[],
        ),
      ]
      if (issues.length > 0) {
        return NextResponse.json(
          { error: 'Cannot activate automation with invalid configuration', issues },
          { status: 400 },
        )
      }
    }

    const nowIso = new Date().toISOString()
    const automationId = `auto_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

    const autoRecord = cleanForFirestore({
      id: automationId,
      user_id: user.uid,
      account_id: accountId,
      accountId: accountId,
      name: effectiveName,
      description: effectiveDescription ?? null,
      trigger_type: effectiveTriggerType,
      trigger_config: effectiveTriggerConfig ?? {},
      is_active: !!is_active,
      steps: effectiveSteps ?? [],
      created_at: nowIso,
      updated_at: nowIso,
    })

    const fDb = getAdminDb()
    if (fDb) {
      await Promise.allSettled([
        fDb
          .collection('accounts')
          .doc(accountId)
          .collection('automations')
          .doc(automationId)
          .set(autoRecord),
        fDb.collection('automations').doc(automationId).set(autoRecord),
      ])
    }

    // Supabase dual-write (best-effort)
    try {
      const admin = supabaseAdmin()
      await admin.from('automations').insert({
        id: automationId,
        user_id: user.uid,
        account_id: accountId,
        name: effectiveName,
        description: effectiveDescription ?? null,
        trigger_type: effectiveTriggerType,
        trigger_config: effectiveTriggerConfig ?? {},
        is_active: !!is_active,
      })
      if (effectiveSteps && effectiveSteps.length > 0) {
        await insertSteps(automationId, effectiveSteps)
      }
    } catch (sbErr) {
      console.warn('[automations POST] Supabase dual-write warning:', sbErr)
    }

    return NextResponse.json({ automation: autoRecord }, { status: 201 })
  } catch (err: any) {
    console.error('[automations POST] Error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to create automation' },
      { status: 500 },
    )
  }
}
