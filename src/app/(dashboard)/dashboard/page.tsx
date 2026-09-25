"use client"

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import {
  MessageSquare,
  Send,
  FileText,
  Zap,
  Users,
  Smartphone,
  PieChart,
  Radio,
  Loader2
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
import {
  loadTemplatePerformance,
  loadBroadcastAnalytics
} from '@/lib/dashboard/template-queries'
import type {
  ActivityItem,
  ConversationsSeriesPoint,
  MetricsBundle,
  PipelineDonutData,
  ResponseTimeSummary,
  TemplatePerformanceData,
  BroadcastAnalyticsData
} from '@/lib/dashboard/types'

import { ConversationsChart } from '@/components/dashboard/conversations-chart'
import { PipelineDonut } from '@/components/dashboard/pipeline-donut'
import { ResponseTimeChart } from '@/components/dashboard/response-time-chart'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { MessageAnalytics } from '@/components/dashboard/message-analytics'
import { TemplatePerformance } from '@/components/dashboard/template-performance'
import { BroadcastAnalytics } from '@/components/dashboard/broadcast-analytics'
import { TeamActivityCard } from '@/components/dashboard/team-activity-card'
import { MetricCard } from '@/components/dashboard/metric-card'
import { WhatsAppLiveGuide } from '@/components/dashboard/whatsapp-live-guide'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslations } from 'next-intl'

type RangeDays = 7 | 30 | 90

// Helper to safely read cached JSON from sessionStorage
function getCached<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Helper to safely write JSON to sessionStorage
function setCache(key: string, val: any) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(key, JSON.stringify(val))
  } catch {}
}

export default function DashboardPage() {
  const t = useTranslations('Dashboard.page')
  const { defaultCurrency } = useAuth()

  // 1. Instant Cache Hydration: Read previous metrics instantly (0ms latency)
  const [metrics, setMetrics] = useState<MetricsBundle | null>(() => getCached('wacrm_dash_metrics'))
  const [metricsLoading, setMetricsLoading] = useState(() => !getCached('wacrm_dash_metrics'))

  const [range, setRange] = useState<RangeDays>(30)
  const [series, setSeries] = useState<Record<RangeDays, ConversationsSeriesPoint[] | null>>(() => ({
    7: null,
    30: getCached('wacrm_dash_series_30'),
    90: null,
  }))
  const [seriesLoading, setSeriesLoading] = useState(() => !getCached('wacrm_dash_series_30'))

  const [pipeline, setPipeline] = useState<PipelineDonutData | null>(() => getCached('wacrm_dash_pipeline'))
  const [pipelineLoading, setPipelineLoading] = useState(() => !getCached('wacrm_dash_pipeline'))

  const [responseTime, setResponseTime] = useState<ResponseTimeSummary | null>(() => getCached('wacrm_dash_resptime'))
  const [responseTimeLoading, setResponseTimeLoading] = useState(() => !getCached('wacrm_dash_resptime'))

  const [activity, setActivity] = useState<ActivityItem[] | null>(() => getCached('wacrm_dash_activity'))
  const [activityLoading, setActivityLoading] = useState(() => !getCached('wacrm_dash_activity'))

  const [waConfig, setWaConfig] = useState<{ 
    connected?: boolean; 
    reason?: string;
    phone_info?: {
      id?: string;
      display_phone_number?: string;
      verified_name?: string;
      quality_rating?: string;
    }
  } | null>(() => getCached('wacrm_dash_waconfig'))
  const [msgAnalytics, setMsgAnalytics] = useState<{ delivered: number, seen: number, failed: number, pending: number } | null>(() => getCached('wacrm_dash_msganalytics'))

  const [templatePerf, setTemplatePerf] = useState<TemplatePerformanceData | null>(() => getCached('wacrm_dash_templateperf'))
  const [broadcastPerf, setBroadcastPerf] = useState<BroadcastAnalyticsData | null>(() => getCached('wacrm_dash_broadcastperf'))

  // 2. Parallel Background Revalidation without UI Blocking
  const loadAll = useCallback(() => {
    const db = createClient()

    // Config fetch
    fetch('/api/whatsapp/config')
      .then((res) => res.json())
      .then((data) => {
        setWaConfig(data)
        setCache('wacrm_dash_waconfig', data)
      })
      .catch(() => {})

    // Concurrently fetch all metrics
    Promise.allSettled([
      loadMetrics(db).then((m) => {
        setMetrics(m)
        setCache('wacrm_dash_metrics', m)
        setMetricsLoading(false)
      }),
      loadMessageAnalytics(db).then((m) => {
        setMsgAnalytics(m)
        setCache('wacrm_dash_msganalytics', m)
      }),
      loadConversationsSeries(db, 30).then((s) => {
        setSeries((prev) => ({ ...prev, 30: s }))
        setCache('wacrm_dash_series_30', s)
        setSeriesLoading(false)
      }),
      loadPipelineDonut(db).then((p) => {
        setPipeline(p)
        setCache('wacrm_dash_pipeline', p)
        setPipelineLoading(false)
      }),
      loadResponseTime(db).then((r) => {
        setResponseTime(r)
        setCache('wacrm_dash_resptime', r)
        setResponseTimeLoading(false)
      }),
      loadActivity(db, 30).then((a) => {
        setActivity(a)
        setCache('wacrm_dash_activity', a)
        setActivityLoading(false)
      }),
      loadTemplatePerformance(db).then((tData) => {
        setTemplatePerf(tData)
        setCache('wacrm_dash_templateperf', tData)
      }),
      loadBroadcastAnalytics(db).then((bData) => {
        setBroadcastPerf(bData)
        setCache('wacrm_dash_broadcastperf', bData)
      }),
    ]).catch((err) => console.error('[dashboard] loadAll background fetch:', err))
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

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

  const handleDisconnectSuccess = useCallback(() => {
    setWaConfig(null)
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('wacrm_dash_waconfig')
    }
    loadAll()
  }, [loadAll])

  const isConnected = waConfig?.connected === true || (metrics && metrics.activeConversations.current > 0)
  const hasNoData = !metrics && !waConfig && metricsLoading

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground">{t('title')}</h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>

      {/* First-visit Skeleton when zero cache is available */}
      {hasNoData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 rounded-2xl border border-border/70 bg-card space-y-3 shadow-xs">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
                <Skeleton className="h-7 w-16 rounded-md" />
                <Skeleton className="h-3 w-32 rounded-md" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <Skeleton className="h-80 rounded-2xl lg:col-span-3" />
            <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
          </div>
        </div>
      )}

      {/* WhatsApp Connected Live Status & Tier Limit Guide Banner */}
      {isConnected && !hasNoData && waConfig?.connected && (
        <WhatsAppLiveGuide
          waConfig={waConfig}
          onDisconnectSuccess={handleDisconnectSuccess}
        />
      )}

      {/* Welcome Setup Checklist when not connected */}
      {!isConnected && !hasNoData && waConfig && (
        <div className="space-y-6">
          {/* Hero Welcome Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-8 text-white shadow-lg">
            <div className="relative z-10 max-w-2xl space-y-3">
              <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                Getting Started
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight">Welcome to ChatFlyr CRM</h2>
              <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
                Connect your Meta WhatsApp Business API or Scan Coexistence QR to automate your sales, broadcast messages to thousands of customers, and manage chats effortlessly.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  href="/settings?tab=whatsapp"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-emerald-800 shadow-md hover:bg-emerald-50 transition-all active:scale-95"
                >
                  <Smartphone className="h-4 w-4 text-emerald-600" />
                  Connect Cloud API
                </Link>
                <Link
                  href="/dashboard/coexistence"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-900/60 border border-white/20 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-emerald-900/80 transition-all active:scale-95"
                >
                  <Smartphone className="h-4 w-4 text-purple-300" />
                  Connect Coexistence QR
                </Link>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          </div>

          {/* Quick Setup Checklist */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-foreground">Quick Launch Checklist</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/settings?tab=whatsapp" className="p-4 rounded-xl border border-border/60 bg-muted/30 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 font-bold group-hover:bg-emerald-600 group-hover:text-white transition-colors">1</div>
                  <div>
                    <h4 className="font-bold text-foreground text-xs sm:text-sm">Connect WhatsApp</h4>
                    <p className="text-[11px] text-muted-foreground">Official Meta API or QR Scan</p>
                  </div>
                </div>
              </Link>

              <Link href="/contacts" className="p-4 rounded-xl border border-border/60 bg-muted/30 hover:border-blue-500 hover:bg-blue-50/20 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">2</div>
                  <div>
                    <h4 className="font-bold text-foreground text-xs sm:text-sm">Import Contacts</h4>
                    <p className="text-[11px] text-muted-foreground">Upload CSV or sync directory</p>
                  </div>
                </div>
              </Link>

              <Link href="/broadcasts/new" className="p-4 rounded-xl border border-border/60 bg-muted/30 hover:border-purple-500 hover:bg-purple-50/20 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 font-bold group-hover:bg-purple-600 group-hover:text-white transition-colors">3</div>
                  <div>
                    <h4 className="font-bold text-foreground text-xs sm:text-sm">Send First Campaign</h4>
                    <p className="text-[11px] text-muted-foreground">Broadcast to your audience</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Primary KPI & Analytics Section */}
      {!hasNoData && (
        <>
          {msgAnalytics && <MessageAnalytics stats={msgAnalytics} />}

          {/* Real-data KPI summary */}
          {metrics && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title={t('activeConversations')}
                value={String(metrics.activeConversations.current)}
                icon={MessageSquare}
                delta={{
                  sign: Math.sign(metrics.activeConversations.current - metrics.activeConversations.previous),
                  label: `${metrics.activeConversations.current - metrics.activeConversations.previous >= 0 ? '+' : ''}${metrics.activeConversations.current - metrics.activeConversations.previous} vs prev. period`,
                }}
              />
              <MetricCard
                title={t('newContactsToday')}
                value={String(metrics.newContactsToday.current)}
                icon={Users}
                delta={{
                  sign: Math.sign(metrics.newContactsToday.current - metrics.newContactsToday.previous),
                  label: `${metrics.newContactsToday.current - metrics.newContactsToday.previous >= 0 ? '+' : ''}${metrics.newContactsToday.current - metrics.newContactsToday.previous} ${t('newTodayVsYesterday')}`,
                }}
              />
              <MetricCard
                title={t('openDeals', { count: metrics.openDealsCount })}
                value={String(metrics.openDealsCount)}
                icon={Send}
                subtitle={`${defaultCurrency} ${metrics.openDealsValue.toLocaleString()}`}
              />
              <MetricCard
                title={t('messagesSentToday')}
                value={String(metrics.messagesSentToday.current)}
                icon={Zap}
                delta={{
                  sign: Math.sign(metrics.messagesSentToday.current - metrics.messagesSentToday.previous),
                  label: `${metrics.messagesSentToday.current - metrics.messagesSentToday.previous >= 0 ? '+' : ''}${metrics.messagesSentToday.current - metrics.messagesSentToday.previous} ${t('vsYesterday')}`,
                }}
              />
            </div>
          )}

          {/* Quick Action Navigation Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { icon: Radio, label: 'Broadcasts', href: '/broadcasts', color: 'bg-emerald-600' },
              { icon: FileText, label: 'Templates', href: '/settings?tab=whatsapp', color: 'bg-teal-600' },
              { icon: Zap, label: 'Keyword Flow', href: '/keyword-flows', color: 'bg-emerald-500' },
              { icon: Users, label: 'Contacts', href: '/contacts', color: 'bg-sky-600' },
              { icon: Send, label: 'Automations', href: '/automations', color: 'bg-indigo-600' },
              { icon: Smartphone, label: 'Coexistence QR', href: '/dashboard/coexistence', color: 'bg-purple-600' },
            ].map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className="flex flex-col items-center justify-center gap-2.5 rounded-2xl bg-card p-4 shadow-xs border border-border/80 hover:border-emerald-500 hover:shadow-md transition-all h-32 group"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${action.color} text-white shadow-xs group-hover:scale-110 transition-transform duration-200`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-foreground text-center group-hover:text-emerald-600 transition-colors">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>

          {/* Template & Broadcast Analytics */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {templatePerf && <TemplatePerformance data={templatePerf} />}
            {broadcastPerf && <BroadcastAnalytics data={broadcastPerf} />}
          </div>

          {/* Charts row */}
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
                data={pipeline}
                loading={pipelineLoading}
              />
            </div>
          </div>

          {/* Response time */}
          <ResponseTimeChart data={responseTime} loading={responseTimeLoading} />

          {/* Activity feed */}
          <ActivityFeed items={activity} loading={activityLoading} />
          
          {/* Admin Team Management view */}
          <TeamActivityCard />
        </>
      )}
    </div>
  )
}
