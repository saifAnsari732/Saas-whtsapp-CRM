"use client"

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { formatCurrency } from '@/lib/currency'
import {
  MessageSquare,
  Send,
  FileText,
  Zap,
  Users,
  Smartphone,
  PieChart,
} from 'lucide-react'
import Link from 'next/link'

import {
  loadActivity,
  loadConversationsSeries,
  loadMetrics,
  loadPipelineDonut,
  loadResponseTime,
} from '@/lib/dashboard/queries'
import type {
  ActivityItem,
  ConversationsSeriesPoint,
  MetricsBundle,
  PipelineDonutData,
  ResponseTimeSummary,
} from '@/lib/dashboard/types'

import { ConversationsChart } from '@/components/dashboard/conversations-chart'
import { PipelineDonut } from '@/components/dashboard/pipeline-donut'
import { ResponseTimeChart } from '@/components/dashboard/response-time-chart'
import { ActivityFeed } from '@/components/dashboard/activity-feed'

import { useTranslations } from 'next-intl'

type RangeDays = 7 | 30 | 90

export default function DashboardPage() {
  const t = useTranslations('Dashboard.page')
  const { defaultCurrency } = useAuth()
  const [metrics, setMetrics] = useState<MetricsBundle | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(true)

  const [range, setRange] = useState<RangeDays>(30)
  // Keep a cache per range so switching tabs doesn't re-fetch what we
  // already have. Ranges the user hasn't opened yet stay null and
  // trigger a fetch on first view.
  const [series, setSeries] = useState<Record<RangeDays, ConversationsSeriesPoint[] | null>>({
    7: null,
    30: null,
    90: null,
  })
  const [seriesLoading, setSeriesLoading] = useState(true)

  const [pipeline, setPipeline] = useState<PipelineDonutData | null>(null)
  const [pipelineLoading, setPipelineLoading] = useState(true)

  const [responseTime, setResponseTime] = useState<ResponseTimeSummary | null>(null)
  const [responseTimeLoading, setResponseTimeLoading] = useState(true)

  const [activity, setActivity] = useState<ActivityItem[] | null>(null)
  const [activityLoading, setActivityLoading] = useState(true)

  const loadAll = useCallback(() => {
    const db = createClient()

    // Kick everything off in parallel. Each block has its own
    // setState + finally so a slow query doesn't hold up faster
    // sections — each widget shows its own skeleton independently.
    void loadMetrics(db)
      .then((m) => setMetrics(m))
      .catch((err) => console.error('[dashboard] metrics failed:', err))
      .finally(() => setMetricsLoading(false))

    void loadConversationsSeries(db, 30)
      .then((s) => setSeries((prev) => ({ ...prev, 30: s })))
      .catch((err) => console.error('[dashboard] series failed:', err))
      .finally(() => setSeriesLoading(false))

    void loadPipelineDonut(db)
      .then((p) => setPipeline(p))
      .catch((err) => console.error('[dashboard] pipeline failed:', err))
      .finally(() => setPipelineLoading(false))

    void loadResponseTime(db)
      .then((r) => setResponseTime(r))
      .catch((err) => console.error('[dashboard] response time failed:', err))
      .finally(() => setResponseTimeLoading(false))

    // Fetch up to 50 so the biggest page-size option in the feed
    // (50 rows) is already in memory — switching sizes then becomes
    // a pure client-side slice with no extra round trip.
    void loadActivity(db, 50)
      .then((a) => setActivity(a))
      .catch((err) => console.error('[dashboard] activity failed:', err))
      .finally(() => setActivityLoading(false))
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // Range switch handler — kept in an event callback (not an effect)
  // so the setState calls stay out of the react-hooks/set-state-in-effect
  // rule's way. The cached bucket check means switching back to a
  // previously-viewed range is instant and doesn't re-fetch.
  const handleRangeChange = useCallback(
    (r: RangeDays) => {
      setRange(r)
      if (series[r] !== null) return
      setSeriesLoading(true)
      const db = createClient()
      loadConversationsSeries(db, r)
        .then((s) => setSeries((prev) => ({ ...prev, [r]: s })))
        .catch((err) => console.error('[dashboard] series failed:', err))
        .finally(() => setSeriesLoading(false))
    },
    [series],
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>

      {/* New Action Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Plan Card */}
        <div className="rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 p-5 text-white shadow-md relative overflow-hidden flex flex-col justify-between h-40">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-white/80 font-medium">Kisan Groups</p>
                <h3 className="text-2xl font-bold mt-1">Base</h3>
                <p className="text-xs text-white/70 mt-1">Expires: Jan 11, 2027</p>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-yellow-400 flex items-center justify-center bg-yellow-400 text-purple-900 font-bold text-xs">
                0%
                <br />
                <span className="text-[8px] leading-none">Used</span>
              </div>
            </div>
            <div className="flex gap-4 mt-3">
              <div>
                <p className="text-[10px] text-white/70 uppercase">Sent</p>
                <p className="font-semibold text-sm">498</p>
              </div>
              <div>
                <p className="text-[10px] text-white/70 uppercase">Remaining</p>
                <p className="font-semibold text-sm">999,502</p>
              </div>
            </div>
          </div>
          <button className="w-full mt-3 rounded-md bg-white/20 hover:bg-white/30 transition-colors py-1.5 text-xs font-semibold backdrop-blur-sm">
            View Plan
          </button>
        </div>

        {/* Action Cards */}
        {[
          { icon: Send, label: 'Send Message', href: '/broadcasts', color: 'bg-blue-500' },
          { icon: FileText, label: 'Templates', href: '/settings?tab=whatsapp', color: 'bg-purple-500' },
          { icon: Zap, label: 'Keyword Flow', href: '/keyword-flows', color: 'bg-green-500' },
          { icon: Users, label: 'WhatsApp Group', href: '/contacts', color: 'bg-pink-500' },
          { icon: PieChart, label: 'Reports', href: '/dashboard', color: 'bg-orange-500' },
          { icon: Smartphone, label: 'Devices', href: '/settings?tab=whatsapp', color: 'bg-teal-500' },
          { icon: Users, label: 'Contacts Group', href: '/contacts', color: 'bg-green-600' },
        ].map((action, i) => (
          <Link
            key={i}
            href={action.href}
            className="flex flex-col items-center justify-center gap-3 rounded-xl bg-card p-6 shadow-sm border border-border hover:border-primary/50 hover:shadow-md transition-all h-40 group"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${action.color} text-white shadow-sm group-hover:scale-105 transition-transform`}>
              <action.icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-foreground text-center">
              {action.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Charts row */}
      {/* items-stretch (the grid default) stretches the two columns to
          match the tallest sibling; adding h-full on each wrapper and
          on the inner panels makes both cards actually fill that
          stretched height so their rounded borders line up. Without
          this, the pipeline card rendered at its natural (shorter)
          height while the line chart drove the row height. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="h-full lg:col-span-3">
          <ConversationsChart
            series={series}
            loading={seriesLoading}
            range={range}
            onRangeChange={handleRangeChange}
          />
        </div>
        <div className="h-full lg:col-span-2">
          <PipelineDonut
            data={{
              totalValue: 236,
              stages: [
                { id: '1', name: 'Text', totalValue: 236, dealCount: 236, color: '#3b82f6' }
              ]
            }}
            loading={false}
            currency={defaultCurrency}
          />
        </div>
      </div>

      {/* Response time */}
      <ResponseTimeChart data={responseTime} loading={responseTimeLoading} />

      {/* Activity feed */}
      <ActivityFeed items={activity} loading={activityLoading} />
    </div>
  )
}

// ------------------------------------------------------------

function deltaLabel(delta: number, suffix: string, noChangeLabel: string): string {
  if (delta === 0) return noChangeLabel
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toLocaleString()} ${suffix}`
}
