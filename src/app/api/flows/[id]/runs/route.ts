import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { getAccountContext } from '@/lib/firebase/auth-helper'
import { supabaseAdmin } from '@/lib/flows/admin-client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/flows/[id]/runs
 *
 * Newest-first list of flow runs for a single flow, with the latest
 * event timeline embedded for each.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const accCtx = await getAccountContext(request as any)
    const accountId = accCtx?.accountId
    const user = accCtx?.user

    if (!user || !accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fDb = getAdminDb()
    let flow: any = null
    let runs: any[] = []
    let events: any[] = []

    if (fDb) {
      try {
        const flowDoc = await fDb
          .collection('accounts')
          .doc(accountId)
          .collection('flows')
          .doc(id)
          .get()
        if (flowDoc.exists) {
          flow = { id: flowDoc.id, name: flowDoc.data()?.name || '' }
        } else {
          const topDoc = await fDb.collection('flows').doc(id).get()
          if (topDoc.exists) {
            const d = topDoc.data()
            if (d?.account_id === accountId || d?.accountId === accountId || d?.user_id === user.uid) {
              flow = { id: topDoc.id, name: d?.name || '' }
            }
          }
        }
      } catch {}

      try {
        const runsSnap = await fDb
          .collection('accounts')
          .doc(accountId)
          .collection('flows')
          .doc(id)
          .collection('runs')
          .orderBy('started_at', 'desc')
          .limit(50)
          .get()
        runs = runsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
      } catch {}
    }

    // Supabase fallback if empty
    if (!flow || runs.length === 0) {
      try {
        const admin = supabaseAdmin()
        if (!flow) {
          const { data: sf } = await admin
            .from('flows')
            .select('id, name, account_id, user_id')
            .eq('id', id)
            .maybeSingle()
          if (sf && (sf.account_id === accountId || sf.user_id === user.uid)) {
            flow = sf
          }
        }
        if (runs.length === 0) {
          const { data: sRuns } = await admin
            .from('flow_runs')
            .select(
              'id, status, current_node_key, started_at, last_advanced_at, ended_at, end_reason, vars, reprompt_count, contact:contacts(id, name, phone)',
            )
            .eq('flow_id', id)
            .order('started_at', { ascending: false })
            .limit(50)
          if (sRuns) runs = sRuns

          const runIds = runs.map((r: any) => r.id)
          if (runIds.length > 0) {
            const { data: evs } = await admin
              .from('flow_run_events')
              .select('flow_run_id, event_type, node_key, payload, created_at')
              .in('flow_run_id', runIds)
              .order('created_at', { ascending: true })
            if (evs) events = evs
          }
        }
      } catch {}
    }

    if (!flow) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({
      flow,
      runs: runs ?? [],
      events: events ?? [],
    })
  } catch (err: any) {
    console.error('[flows/[id]/runs GET] Error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to load flow runs' },
      { status: 500 },
    )
  }
}
