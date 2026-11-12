import { NextResponse } from 'next/server'
import { getAdminDb, cleanForFirestore } from '@/lib/firebase/admin'
import { getAccountContext } from '@/lib/firebase/auth-helper'
import { supabaseAdmin } from '@/lib/automations/admin-client'

export const dynamic = 'force-dynamic'

export async function POST(
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

    const fDb = getAdminDb()
    let original: any = null

    if (fDb) {
      try {
        const doc = await fDb
          .collection('accounts')
          .doc(accountId)
          .collection('automations')
          .doc(id)
          .get()
        if (doc.exists) {
          original = { id: doc.id, ...doc.data() }
        } else {
          const topDoc = await fDb.collection('automations').doc(id).get()
          if (topDoc.exists) {
            original = { id: topDoc.id, ...topDoc.data() }
          }
        }
      } catch {}
    }

    if (!original) {
      try {
        const { data } = await supabaseAdmin()
          .from('automations')
          .select('*')
          .eq('id', id)
          .maybeSingle()
        if (data) original = data
      } catch {}
    }

    if (!original) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const nowIso = new Date().toISOString()
    const copyId = `auto_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

    const copyData = cleanForFirestore({
      id: copyId,
      account_id: accountId,
      accountId: accountId,
      user_id: user.uid,
      name: `${original.name} (Copy)`,
      description: original.description ?? null,
      trigger_type: original.trigger_type,
      trigger_config: original.trigger_config ?? {},
      is_active: false,
      steps: original.steps ?? [],
      created_at: nowIso,
      updated_at: nowIso,
    })

    if (fDb) {
      await Promise.allSettled([
        fDb
          .collection('accounts')
          .doc(accountId)
          .collection('automations')
          .doc(copyId)
          .set(copyData),
        fDb.collection('automations').doc(copyId).set(copyData),
      ])
    }

    // Dual-write Supabase
    try {
      const admin = supabaseAdmin()
      await admin.from('automations').insert({
        id: copyId,
        account_id: accountId,
        user_id: user.uid,
        name: `${original.name} (Copy)`,
        description: original.description ?? null,
        trigger_type: original.trigger_type,
        trigger_config: original.trigger_config ?? {},
        is_active: false,
      })

      const { data: steps } = await admin
        .from('automation_steps')
        .select('id, parent_step_id, branch, step_type, step_config, position')
        .eq('automation_id', id)
        .order('position', { ascending: true })

      if (steps && steps.length > 0) {
        const idMap = new Map<string, string>()
        const uid = () =>
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2) + Date.now().toString(36)
        for (const row of steps) idMap.set(row.id as string, uid())

        const rows = steps.map((row) => ({
          id: idMap.get(row.id as string)!,
          automation_id: copyId,
          parent_step_id: row.parent_step_id ? idMap.get(row.parent_step_id as string) : null,
          branch: row.branch,
          step_type: row.step_type,
          step_config: row.step_config,
          position: row.position,
        }))
        await admin.from('automation_steps').insert(rows)
      }
    } catch (sbErr) {
      console.warn('[automations/[id]/duplicate] Supabase dual-write warning:', sbErr)
    }

    return NextResponse.json({ automation: copyData }, { status: 201 })
  } catch (err: any) {
    console.error('[automations/[id]/duplicate POST] Error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to duplicate automation' },
      { status: 500 },
    )
  }
}
