import { SupabaseClient } from '@supabase/supabase-js'
import { TemplatePerformanceData, BroadcastAnalyticsData } from './types'

export async function loadTemplatePerformance(db: SupabaseClient): Promise<TemplatePerformanceData> {
  let templates: any[] | null = null
  let error: any = null

  // 1. Primary: message_templates table (standard table)
  const res1 = await db
    .from('message_templates')
    .select('id, name, status, usage_count, send_count')
    .order('created_at', { ascending: false })

  if (!res1.error && res1.data && res1.data.length > 0) {
    templates = res1.data
  } else {
    // 2. Fallback: whatsapp_templates
    const res2 = await db
      .from('whatsapp_templates')
      .select('id, name, status, send_count')
      .order('created_at', { ascending: false })
    if (!res2.error && res2.data) {
      templates = res2.data
    }
  }

  if (!templates || templates.length === 0) {
    return {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      topTemplates: []
    }
  }

  const approved = templates.filter(t => (t.status || '').toUpperCase() === 'APPROVED').length
  const pending = templates.filter(t => (t.status || '').toUpperCase() === 'PENDING').length
  const rejected = templates.filter(t => (t.status || '').toUpperCase() === 'REJECTED').length

  const topTemplates = templates.slice(0, 5).map(t => ({
    id: t.id,
    name: t.name,
    status: t.status,
    sendCount: t.usage_count || t.send_count || 0
  }))

  return {
    total: templates.length,
    approved,
    pending,
    rejected,
    topTemplates
  }
}

export async function loadBroadcastAnalytics(db: SupabaseClient): Promise<BroadcastAnalyticsData> {
  const { data: broadcasts, error } = await db
    .from('broadcasts')
    .select('id, name, status, total_recipients, delivered_count, failed_count, created_at, scheduled_at')
    .order('created_at', { ascending: false })

  if (error || !broadcasts) {
    return {
      totalBroadcasts: 0,
      recentBroadcasts: []
    }
  }

  const recentBroadcasts = broadcasts.slice(0, 5).map(b => ({
    id: b.id,
    name: b.name,
    status: b.status,
    totalRecipients: b.total_recipients || 0,
    deliveredCount: b.delivered_count || 0,
    failedCount: b.failed_count || 0,
    createdAt: b.created_at,
    scheduledAt: b.scheduled_at
  }))

  return {
    totalBroadcasts: broadcasts.length,
    recentBroadcasts
  }
}
