import { NextResponse } from 'next/server'
import { getAccountContext } from '@/lib/firebase/auth-helper'
import { listFlowTemplates } from '@/lib/flows/templates'

export const dynamic = 'force-dynamic'

/**
 * GET /api/flows/templates
 *
 * Returns the static template gallery (slug + name + description +
 * icon hint + node_count) so the New-flow dialog can render cards
 * without bundling the full template payloads client-side.
 */
export async function GET(request: Request) {
  const accCtx = await getAccountContext(request as any)
  if (!accCtx?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const templates = listFlowTemplates().map((t) => ({
    slug: t.slug,
    name: t.name,
    description: t.description,
    icon: t.icon,
    trigger_type: t.trigger_type,
    node_count: t.nodes.length,
  }))
  return NextResponse.json({ templates })
}
