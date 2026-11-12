import { NextResponse } from 'next/server'
import { getAdminDb, cleanForFirestore } from '@/lib/firebase/admin'
import { getAccountContext } from '@/lib/firebase/auth-helper'
import { supabaseAdmin } from '@/lib/flows/admin-client'
import { validateFlowForActivation } from '@/lib/flows/validate'

export const dynamic = 'force-dynamic'

/**
 * POST /api/flows/[id]/activate
 *
 * Body: { status: 'draft' | 'active' | 'archived' }
 */

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const accCtx = await getAccountContext(request as any)
    const accountId = accCtx?.accountId

    if (!accCtx?.user || !accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json().catch(() => null)) as
      | { status?: 'draft' | 'active' | 'archived' }
      | null
    const status = body?.status
    if (!status || !['draft', 'active', 'archived'].includes(status)) {
      return NextResponse.json(
        { error: "status must be one of 'draft' | 'active' | 'archived'" },
        { status: 400 },
      )
    }

    const fDb = getAdminDb()
    let existingFlow: any = null

    if (fDb) {
      try {
        const doc = await fDb
          .collection('accounts')
          .doc(accountId)
          .collection('flows')
          .doc(id)
          .get()
        if (doc.exists) {
          existingFlow = { id: doc.id, ...doc.data() }
        } else {
          const topDoc = await fDb.collection('flows').doc(id).get()
          if (topDoc.exists) {
            existingFlow = { id: topDoc.id, ...topDoc.data() }
          }
        }
      } catch (e) {
        console.warn('[flows/activate] doc read error:', e)
      }
    }

    if (!existingFlow) {
      // Supabase fallback
      try {
        const { data } = await supabaseAdmin()
          .from('flows')
          .select('*')
          .eq('id', id)
          .maybeSingle()
        if (data) {
          existingFlow = data
        }
      } catch {}
    }

    if (!existingFlow) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (status === 'active') {
      const nodes = existingFlow.nodes || []
      const issues = validateFlowForActivation(
        existingFlow as {
          name: string
          trigger_type: 'keyword' | 'first_inbound_message' | 'manual'
          trigger_config: Record<string, unknown>
          entry_node_id: string | null
        },
        nodes as Array<{
          node_key: string
          node_type: string
          config: Record<string, unknown>
        }>,
      )
      const blockers = issues.filter((i) => i.severity === 'error')
      if (blockers.length > 0) {
        return NextResponse.json(
          {
            error: 'Cannot activate flow — fix the issues below first.',
            issues,
          },
          { status: 422 },
        )
      }
    }

    const nowIso = new Date().toISOString()
    const update = { status, updated_at: nowIso }

    if (fDb) {
      await Promise.allSettled([
        fDb
          .collection('accounts')
          .doc(accountId)
          .collection('flows')
          .doc(id)
          .set(cleanForFirestore(update), { merge: true }),
        fDb
          .collection('flows')
          .doc(id)
          .set(cleanForFirestore(update), { merge: true }),
      ])
    }

    // Dual-write Supabase
    try {
      await supabaseAdmin().from('flows').update(update).eq('id', id)
    } catch {}

    return NextResponse.json({ flow: { ...existingFlow, ...update } })
  } catch (err: any) {
    console.error('[flows/[id]/activate POST] Error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to update flow status' },
      { status: 500 },
    )
  }
}
