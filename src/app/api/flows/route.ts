import { NextResponse } from 'next/server'
import { getAdminDb, cleanForFirestore } from '@/lib/firebase/admin'
import { getAccountContext } from '@/lib/firebase/auth-helper'
import { supabaseAdmin } from '@/lib/flows/admin-client'
import { getFlowTemplate } from '@/lib/flows/templates'

export const dynamic = 'force-dynamic'

/**
 * GET /api/flows — list the caller's flows.
 * POST /api/flows — create a new (draft) flow.
 *
 * Uses Firebase Auth and Firestore for primary storage.
 * Dual-writes to Supabase (best-effort) for runner compatibility.
 */

export async function GET(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any)
    const accountId = accCtx?.accountId

    if (!accCtx?.user || !accountId) {
      return NextResponse.json({ flows: [] }, { status: 401 })
    }

    const fDb = getAdminDb()
    const flowsMap = new Map<string, any>()

    if (fDb) {
      // 1. Nested collection: accounts/{accountId}/flows
      try {
        const snap = await fDb
          .collection('accounts')
          .doc(accountId)
          .collection('flows')
          .get()

        for (const doc of snap.docs) {
          const d = doc.data()
          flowsMap.set(doc.id, {
            id: doc.id,
            ...d,
            created_at: d.created_at || d.createdAt || new Date().toISOString(),
          })
        }
      } catch (nestedErr) {
        console.warn('[flows GET] nested fetch error:', nestedErr)
      }

      // 2. Top-level collection: flows
      try {
        const [top1, top2] = await Promise.all([
          fDb.collection('flows').where('account_id', '==', accountId).get(),
          fDb.collection('flows').where('accountId', '==', accountId).get(),
        ])

        const mergeDoc = (doc: any) => {
          if (!flowsMap.has(doc.id)) {
            const d = doc.data()
            flowsMap.set(doc.id, {
              id: doc.id,
              ...d,
              created_at: d.created_at || d.createdAt || new Date().toISOString(),
            })
          }
        }

        top1.docs.forEach(mergeDoc)
        top2.docs.forEach(mergeDoc)
      } catch (topErr) {
        console.warn('[flows GET] top fetch error:', topErr)
      }
    }

    // 3. Fallback to Supabase if Firestore returned empty
    if (flowsMap.size === 0) {
      try {
        const admin = supabaseAdmin()
        const { data, error } = await admin
          .from('flows')
          .select('*')
          .eq('account_id', accountId)
          .order('created_at', { ascending: false })

        if (!error && data) {
          for (const item of data) {
            flowsMap.set(item.id, item)
          }
        }
      } catch (sbErr) {
        console.warn('[flows GET] Supabase fallback error:', sbErr)
      }
    }

    const list = Array.from(flowsMap.values()).sort((a, b) => {
      const tA = new Date(a.created_at || 0).getTime()
      const tB = new Date(b.created_at || 0).getTime()
      return tB - tA
    })

    return NextResponse.json({ flows: list })
  } catch (err: any) {
    console.error('[flows GET] Error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to load flows', flows: [] },
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

    const body = (await request.json().catch(() => null)) as {
      name?: string
      description?: string | null
      trigger_type?: 'keyword' | 'first_inbound_message' | 'manual'
      trigger_config?: Record<string, unknown>
      template_slug?: string
    } | null

    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const nowIso = new Date().toISOString()
    const flowId = `flow_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

    let flowName: string
    let description: string | null = null
    let trigger_type: 'keyword' | 'first_inbound_message' | 'manual' =
      body.trigger_type ?? 'keyword'
    let trigger_config: Record<string, unknown> = body.trigger_config ?? {}
    let entry_node_id: string | null = null
    let nodes: Array<{
      id: string
      node_key: string
      node_type: string
      config: Record<string, unknown>
      position_x?: number
      position_y?: number
    }> = []

    if (body.template_slug) {
      const template = getFlowTemplate(body.template_slug)
      if (!template) {
        return NextResponse.json(
          { error: `Unknown template_slug "${body.template_slug}"` },
          { status: 400 },
        )
      }
      flowName = body.name?.trim() || template.name
      description = template.description
      trigger_type = template.trigger_type
      trigger_config = template.trigger_config as unknown as Record<string, unknown>
      entry_node_id = template.entry_node_id
      nodes = template.nodes.map((n, idx) => ({
        id: `node_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        node_key: n.node_key,
        node_type: n.node_type,
        config: n.config as unknown as Record<string, unknown>,
        position_x: 250,
        position_y: 50 + idx * 120,
      }))
    } else {
      if (!body.name?.trim()) {
        return NextResponse.json({ error: 'name is required' }, { status: 400 })
      }
      flowName = body.name.trim()
      description = body.description ?? null
      entry_node_id = 'start_1'
      nodes = [
        {
          id: 'start_1',
          node_key: 'start_1',
          node_type: 'start',
          config: {},
          position_x: 250,
          position_y: 50,
        },
      ]
    }

    const fallbackPolicy = {
      on_invalid_reply: 'reprompt',
      reprompt_template: 'Please choose one of the options below:',
      on_timeout_hours: 24,
      on_agent_handoff: 'end',
    }

    const flowData = cleanForFirestore({
      id: flowId,
      account_id: accountId,
      accountId: accountId,
      user_id: user.uid,
      name: flowName,
      description,
      status: 'draft',
      trigger_type,
      trigger_config,
      entry_node_id,
      fallback_policy: fallbackPolicy,
      execution_count: 0,
      last_executed_at: null,
      nodes,
      created_at: nowIso,
      updated_at: nowIso,
    })

    const fDb = getAdminDb()
    if (fDb) {
      await Promise.allSettled([
        fDb
          .collection('accounts')
          .doc(accountId)
          .collection('flows')
          .doc(flowId)
          .set(flowData),
        fDb.collection('flows').doc(flowId).set(flowData),
      ])

      // Also persist nodes to subcollection
      if (nodes.length > 0) {
        const batch = fDb.batch()
        for (const n of nodes) {
          const nodeDoc = fDb
            .collection('accounts')
            .doc(accountId)
            .collection('flows')
            .doc(flowId)
            .collection('nodes')
            .doc(n.node_key)
          batch.set(
            nodeDoc,
            cleanForFirestore({
              ...n,
              flow_id: flowId,
              created_at: nowIso,
            }),
          )
        }
        await batch.commit().catch(() => {})
      }
    }

    // Dual-write to Supabase (best-effort)
    try {
      const admin = supabaseAdmin()
      await admin.from('flows').insert({
        id: flowId,
        user_id: user.uid,
        account_id: accountId,
        name: flowName,
        description,
        status: 'draft',
        trigger_type,
        trigger_config,
        entry_node_id,
      })
      if (nodes.length > 0) {
        await admin.from('flow_nodes').insert(
          nodes.map((n) => ({
            flow_id: flowId,
            node_key: n.node_key,
            node_type: n.node_type,
            config: n.config,
            position_x: n.position_x ?? 0,
            position_y: n.position_y ?? 0,
          })),
        )
      }
    } catch (sbErr) {
      console.warn('[flows POST] Supabase dual-write warning:', sbErr)
    }

    return NextResponse.json({ flow: flowData }, { status: 201 })
  } catch (err: any) {
    console.error('[flows POST] Error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to create flow' },
      { status: 500 },
    )
  }
}
