import { NextResponse } from 'next/server'
import { getAdminDb, cleanForFirestore } from '@/lib/firebase/admin'
import { getAccountContext } from '@/lib/firebase/auth-helper'
import { supabaseAdmin } from '@/lib/flows/admin-client'

export const dynamic = 'force-dynamic'

/**
 * GET   /api/flows/[id]  — fetch one flow with its nodes.
 * PUT   /api/flows/[id]  — replace name/trigger/entry/fallback + nodes.
 * DELETE /api/flows/[id] — delete flow and its nodes.
 */

async function resolveFlow(id: string, accountId: string, userId?: string) {
  const fDb = getAdminDb()
  if (fDb) {
    // 1. Direct in accounts/{accountId}/flows/{id}
    try {
      const doc = await fDb
        .collection('accounts')
        .doc(accountId)
        .collection('flows')
        .doc(id)
        .get()
      if (doc.exists) {
        return { source: 'firestore-account' as const, doc }
      }
    } catch (e) {
      console.warn('[flows/[id]] account doc read error:', e)
    }

    // 2. In top-level flows/{id}
    try {
      const doc = await fDb.collection('flows').doc(id).get()
      if (doc.exists) {
        const d = doc.data()
        if (d?.account_id === accountId || d?.accountId === accountId || (userId && d?.user_id === userId)) {
          return { source: 'firestore-top' as const, doc }
        }
      }
    } catch (e) {
      console.warn('[flows/[id]] top doc read error:', e)
    }
  }

  return null
}

export async function GET(
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

    const resolved = await resolveFlow(id, accountId, accCtx.user.uid)

    if (resolved) {
      const flowData = resolved.doc.data() || {}
      let nodes = flowData.nodes || []

      // If nodes not embedded, check subcollection
      if (!Array.isArray(nodes) || nodes.length === 0) {
        const fDb = getAdminDb()
        if (fDb) {
          try {
            const nodesSnap = await fDb
              .collection('accounts')
              .doc(accountId)
              .collection('flows')
              .doc(id)
              .collection('nodes')
              .get()
            if (!nodesSnap.empty) {
              nodes = nodesSnap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
              }))
            }
          } catch {}
        }
      }

      return NextResponse.json({
        flow: { id: resolved.doc.id, ...flowData },
        nodes,
      })
    }

    // Supabase fallback
    try {
      const admin = supabaseAdmin()
      const [{ data: flow }, { data: nodes }] = await Promise.all([
        admin.from('flows').select('*').eq('id', id).maybeSingle(),
        admin
          .from('flow_nodes')
          .select('*')
          .eq('flow_id', id)
          .order('created_at', { ascending: true }),
      ])

      if (flow) {
        return NextResponse.json({ flow, nodes: nodes ?? [] })
      }
    } catch (sbErr) {
      console.warn('[flows/[id] GET] Supabase fallback error:', sbErr)
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (err: any) {
    console.error('[flows/[id] GET] Error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch flow' },
      { status: 500 },
    )
  }
}

interface PutBody {
  name?: string
  description?: string | null
  trigger_type?: 'keyword' | 'first_inbound_message' | 'manual'
  trigger_config?: Record<string, unknown>
  entry_node_id?: string | null
  fallback_policy?: Record<string, unknown>
  nodes?: Array<{
    node_key: string
    node_type: string
    config: Record<string, unknown>
    position_x?: number
    position_y?: number
  }>
}

export async function PUT(
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

    const body = (await request.json().catch(() => null)) as PutBody | null
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    if (body.name !== undefined && !body.name.trim()) {
      return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 })
    }

    const existing = await resolveFlow(id, accountId, accCtx.user.uid)
    if (!existing) {
      try {
        const admin = supabaseAdmin()
        const { data: sf } = await admin.from('flows').select('id, account_id, user_id').eq('id', id).maybeSingle()
        if (!sf || (sf.account_id !== accountId && sf.user_id !== accCtx.user.uid)) {
          return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }
      } catch {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    }

    const nowIso = new Date().toISOString()
    const flowPatch: Record<string, unknown> = {
      updated_at: nowIso,
    }
    if (body.name !== undefined) flowPatch.name = body.name.trim()
    if (body.description !== undefined) flowPatch.description = body.description
    if (body.trigger_type !== undefined) flowPatch.trigger_type = body.trigger_type
    if (body.trigger_config !== undefined) flowPatch.trigger_config = body.trigger_config
    if (body.entry_node_id !== undefined) flowPatch.entry_node_id = body.entry_node_id
    if (body.fallback_policy !== undefined) flowPatch.fallback_policy = body.fallback_policy
    if (body.nodes !== undefined) flowPatch.nodes = body.nodes

    const cleanPatch = cleanForFirestore(flowPatch)
    const fDb = getAdminDb()

    if (fDb) {
      await Promise.allSettled([
        fDb
          .collection('accounts')
          .doc(accountId)
          .collection('flows')
          .doc(id)
          .set(cleanPatch, { merge: true }),
        fDb.collection('flows').doc(id).set(cleanPatch, { merge: true }),
      ])

      if (body.nodes !== undefined) {
        // Update nodes subcollection
        try {
          const nodesColl = fDb
            .collection('accounts')
            .doc(accountId)
            .collection('flows')
            .doc(id)
            .collection('nodes')
          const existingNodes = await nodesColl.get()
          const batch = fDb.batch()
          existingNodes.docs.forEach((d) => batch.delete(d.ref))
          body.nodes.forEach((n) => {
            const docRef = nodesColl.doc(n.node_key)
            batch.set(
              docRef,
              cleanForFirestore({
                ...n,
                flow_id: id,
                created_at: nowIso,
              }),
            )
          })
          await batch.commit()
        } catch (nodesErr) {
          console.warn('[flows/[id] PUT] subcollection write warning:', nodesErr)
        }
      }
    }

    // Dual-write to Supabase (best-effort)
    try {
      const admin = supabaseAdmin()
      const { nodes: _unused, ...headerPatch } = flowPatch
      await admin.from('flows').update(headerPatch).eq('id', id)
      if (body.nodes !== undefined) {
        await admin.from('flow_nodes').delete().eq('flow_id', id)
        if (body.nodes.length > 0) {
          await admin.from('flow_nodes').insert(
            body.nodes.map((n) => ({
              flow_id: id,
              node_key: n.node_key,
              node_type: n.node_type,
              config: n.config,
              position_x: n.position_x ?? 0,
              position_y: n.position_y ?? 0,
            })),
          )
        }
      }
    } catch (sbErr) {
      console.warn('[flows/[id] PUT] Supabase dual-write warning:', sbErr)
    }

    // Return updated state
    const resolved = await resolveFlow(id, accountId, accCtx.user.uid)
    const flowData = resolved?.doc?.data() || cleanPatch
    return NextResponse.json({
      flow: { id, ...flowData },
      nodes: body.nodes ?? (flowData as any)?.nodes ?? [],
    })
  } catch (err: any) {
    console.error('[flows/[id] PUT] Error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to update flow' },
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
    const accCtx = await getAccountContext(request as any)
    const accountId = accCtx?.accountId

    if (!accCtx?.user || !accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await resolveFlow(id, accountId, accCtx.user.uid)
    if (!existing) {
      try {
        const admin = supabaseAdmin()
        const { data: sf } = await admin.from('flows').select('id, account_id, user_id').eq('id', id).maybeSingle()
        if (!sf || (sf.account_id !== accountId && sf.user_id !== accCtx.user.uid)) {
          return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }
      } catch {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    }

    const fDb = getAdminDb()
    if (fDb) {
      await Promise.allSettled([
        fDb.collection('accounts').doc(accountId).collection('flows').doc(id).delete(),
        fDb.collection('flows').doc(id).delete(),
      ])
    }

    // Best-effort delete from Supabase
    try {
      await supabaseAdmin().from('flows').delete().eq('id', id)
    } catch {}

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[flows/[id] DELETE] Error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to delete flow' },
      { status: 500 },
    )
  }
}
