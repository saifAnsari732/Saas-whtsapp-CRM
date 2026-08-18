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
  loadMessageAnalytics,
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
import { ConnectWhatsappBanner } from '@/components/dashboard/connect-whatsapp-banner'
import { MessageAnalytics } from '@/components/dashboard/message-analytics'
import { BillingCard } from '@/components/dashboard/billing-card'
import { Card } from '@/components/ui/card'

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

  const [waConfig, setWaConfig] = useState<{ connected?: boolean; reason?: string } | null>(null)
  
  const [msgAnalytics, setMsgAnalytics] = useState<{ delivered: number, seen: number, failed: number, pending: number } | null>(null)

  const loadAll = useCallback(() => {
    const db = createClient()

    // Fetch WhatsApp config status so we can show a CTA banner if disconnected
    fetch('/api/whatsapp/config')
      .then((res) => res.json())
      .then((data) => setWaConfig(data))
      .catch((err) => console.error('[dashboard] wa_config failed:', err))

    // Kick everything off in parallel. Each block has its own
    // setState + finally so a slow query doesn't hold up faster
    // sections — each widget shows its own skeleton independently.
    void loadMetrics(db)
      .then((m) => setMetrics(m))
      .catch((err) => console.error('[dashboard] metrics failed:', err))
      .finally(() => setMetricsLoading(false))

    void loadMessageAnalytics(db)
      .then((m) => setMsgAnalytics(m))
      .catch((err) => console.error('[dashboard] msg analytics failed:', err))

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

  const isConnected = waConfig?.connected === true
  const isLoadingConfig = waConfig === null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>

      {!isConnected && !isLoadingConfig && (
        <div className="py-4">
          <ConnectWhatsappBanner />
          <div className="mt-8 text-center p-12 border border-dashed rounded-xl border-border bg-card/50">
            <h2 className="text-xl font-semibold mb-2">Connect your WhatsApp to unlock the CRM</h2>
            <p className="text-muted-foreground mb-6">You need to connect your Meta WhatsApp Business API to view analytics, send messages, and manage contacts.</p>
            <Link href="/settings?tab=whatsapp" className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 transition-colors rounded-lg text-sm font-bold text-white shadow-md">
              Go to Settings
            </Link>
          </div>
        </div>
      )}

      {isConnected && (
        <>
          {msgAnalytics && <MessageAnalytics stats={msgAnalytics} />}

          {/* New Action Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <BillingCard />

        {/* Action Cards */}
        {[
          { icon: Send, label: 'Send Message', href: '/broadcasts', color: 'bg-gradient-to-br from-[var(--color-green-deep)] to-[#094d45]' },
          { icon: FileText, label: 'Templates', href: '/settings?tab=whatsapp', color: 'bg-gradient-to-br from-emerald-500 to-teal-600' },
          { icon: Zap, label: 'Keyword Flow', href: '/keyword-flows', color: 'bg-gradient-to-br from-[#25D366] to-[#128C7E]' },
          { icon: Users, label: 'WhatsApp Group', href: '/contacts', color: 'bg-gradient-to-br from-sky-500 to-blue-600' },
          { icon: PieChart, label: 'Reports', href: '/dashboard', color: 'bg-gradient-to-br from-indigo-500 to-violet-600' },
          { icon: Smartphone, label: 'Devices', href: '/dashboard/coexistence', color: 'bg-gradient-to-br from-slate-600 to-slate-800' },
          { icon: Users, label: 'Contacts Group', href: '/contacts', color: 'bg-gradient-to-br from-teal-500 to-emerald-600' },
        ].map((action, i) => (
          <Link
            key={i}
            href={action.href}
            className="flex flex-col items-center justify-center gap-3 rounded-xl bg-card p-6 shadow-sm border border-border hover:border-[var(--color-green-vivid)]/50 hover:shadow-md transition-all h-40 group"
          >
            <div className={`flex h-[52px] w-[52px] items-center justify-center rounded-[18px] ${action.color} text-white shadow-md group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}>
              <action.icon className="h-6 w-6" />
            </div>
            <span className="text-[13px] font-bold text-navy text-center group-hover:text-[var(--color-green-deep)] transition-colors">
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
          />
        </div>
      </div>

      {/* Response time */}
      <ResponseTimeChart data={responseTime} loading={responseTimeLoading} />

      {/* Activity feed */}
      <ActivityFeed items={activity} loading={activityLoading} />
        </>
      )}
    </div>
  )
}

// ------------------------------------------------------------

function deltaLabel(delta: number, suffix: string, noChangeLabel: string): string {
  if (delta === 0) return noChangeLabel
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toLocaleString()} ${suffix}`
}
