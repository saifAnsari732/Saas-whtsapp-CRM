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
function getCached<T>(key: string, userId?: string | null): T | null {
  if (typeof window === 'undefined' || !userId) return null
  try {
    const raw = sessionStorage.getItem(`${key}_${userId}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Helper to safely write JSON to sessionStorage
function setCache(key: string, val: any, userId?: string | null) {
  if (typeof window === 'undefined' || !userId) return
  try {
    sessionStorage.setItem(`${key}_${userId}`, JSON.stringify(val))
  } catch {}
}

export default function DashboardPage() {
  const t = useTranslations('Dashboard.page')
  const { user, profile, defaultCurrency } = useAuth()
  const userId = user?.id

  // 1. Instant Cache Hydration: Read previous metrics instantly (0ms latency, zero skeleton flash)
  const [metrics, setMetrics] = useState<MetricsBundle | null>(() => getCached<MetricsBundle>('wacrm_dash_metrics', userId))
  const [metricsLoading, setMetricsLoading] = useState(() => !getCached<MetricsBundle>('wacrm_dash_metrics', userId))

  const [range, setRange] = useState<RangeDays>(30)
  const [series, setSeries] = useState<Record<RangeDays, ConversationsSeriesPoint[] | null>>(() => {
    const cached30 = getCached<ConversationsSeriesPoint[]>('wacrm_dash_series_30', userId)
    return { 7: null, 30: cached30, 90: null }
  })
  const [seriesLoading, setSeriesLoading] = useState(() => !getCached<ConversationsSeriesPoint[]>('wacrm_dash_series_30', userId))

  const [pipeline, setPipeline] = useState<PipelineDonutData | null>(() => getCached<PipelineDonutData>('wacrm_dash_pipeline', userId))
  const [pipelineLoading, setPipelineLoading] = useState(() => !getCached<PipelineDonutData>('wacrm_dash_pipeline', userId))

  const [responseTime, setResponseTime] = useState<ResponseTimeSummary | null>(() => getCached<ResponseTimeSummary>('wacrm_dash_resptime', userId))
  const [responseTimeLoading, setResponseTimeLoading] = useState(() => !getCached<ResponseTimeSummary>('wacrm_dash_resptime', userId))

  const [activity, setActivity] = useState<ActivityItem[] | null>(() => getCached<ActivityItem[]>('wacrm_dash_activity', userId))
  const [activityLoading, setActivityLoading] = useState(() => !getCached<ActivityItem[]>('wacrm_dash_activity', userId))

  const [waConfig, setWaConfig] = useState<any>(() => getCached('wacrm_dash_waconfig', userId))
  const [coexStatus, setCoexStatus] = useState<any>(() => getCached('wacrm_dash_coexstatus', userId))
  const [msgAnalytics, setMsgAnalytics] = useState<any>(() => getCached('wacrm_dash_msganalytics', userId))

  const [templatePerf, setTemplatePerf] = useState<TemplatePerformanceData | null>(() => getCached('wacrm_dash_templateperf', userId))
  const [broadcastPerf, setBroadcastPerf] = useState<BroadcastAnalyticsData | null>(() => getCached('wacrm_dash_broadcastperf', userId))

  // Hydrate user-scoped cache when user ID changes
  useEffect(() => {
    if (!userId) {
      setMetrics(null)
      setSeries({ 7: null, 30: null, 90: null })
      setPipeline(null)
      setResponseTime(null)
      setActivity(null)
      setWaConfig(null)
      setCoexStatus(null)
      setMsgAnalytics(null)
      setTemplatePerf(null)
      setBroadcastPerf(null)
      return
    }

    const cachedMetrics = getCached<MetricsBundle>('wacrm_dash_metrics', userId)
    if (cachedMetrics) {
      setMetrics(cachedMetrics)
      setMetricsLoading(false)
    }

    const cachedSeries = getCached<ConversationsSeriesPoint[]>('wacrm_dash_series_30', userId)
    if (cachedSeries) {
      setSeries((prev) => ({ ...prev, 30: cachedSeries }))
      setSeriesLoading(false)
    }

    const cachedPipeline = getCached<PipelineDonutData>('wacrm_dash_pipeline', userId)
    if (cachedPipeline) {
      setPipeline(cachedPipeline)
      setPipelineLoading(false)
    }

    const cachedResp = getCached<ResponseTimeSummary>('wacrm_dash_resptime', userId)
    if (cachedResp) {
      setResponseTime(cachedResp)
      setResponseTimeLoading(false)
    }

    const cachedAct = getCached<ActivityItem[]>('wacrm_dash_activity', userId)
    if (cachedAct) {
      setActivity(cachedAct)
      setActivityLoading(false)
    }

    const cachedWa = getCached<any>('wacrm_dash_waconfig', userId)
    if (cachedWa) {
      setWaConfig(cachedWa)
    }

    const cachedCoex = getCached<any>('wacrm_dash_coexstatus', userId)
    if (cachedCoex) {
      setCoexStatus(cachedCoex)
    }

    const cachedMsg = getCached<any>('wacrm_dash_msganalytics', userId)
    if (cachedMsg) {
      setMsgAnalytics(cachedMsg)
    }

    const cachedTmpl = getCached<any>('wacrm_dash_templateperf', userId)
    if (cachedTmpl) {
      setTemplatePerf(cachedTmpl)
    }

    const cachedBcast = getCached<any>('wacrm_dash_broadcastperf', userId)
    if (cachedBcast) {
      setBroadcastPerf(cachedBcast)
    }
  }, [userId])

  // 2. Parallel One-Time Background Verification without UI Blocking
  const loadAll = useCallback(() => {
    if (!userId) return
    const db = createClient()

    // 1. One-time Cloud API config verification
    fetch('/api/whatsapp/config')
      .then((res) => res.json())
      .then((data) => {
        setWaConfig(data)
        setCache('wacrm_dash_waconfig', data, userId)
      })
      .catch(() => {})

    // 2. One-time Coexistence Phone QR connection verification
    fetch('/api/whatsapp/coexistence/status', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        const isCoexConn = data.state === 'open' || data.state === 'connected' || data.status === 'connected' || data.status === 'open'
        const statusPayload = { connected: isCoexConn, state: data.state, status: data.status }
        setCoexStatus(statusPayload)
        setCache('wacrm_dash_coexstatus', statusPayload, userId)
      })
      .catch(() => {})

    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.metrics) {
          setMetrics((prev) => ({ ...prev, ...data.metrics }));
          setCache('wacrm_dash_metrics', data.metrics, userId);
          setMetricsLoading(false);
        }
        if (data.msgAnalytics) {
          setMsgAnalytics(data.msgAnalytics);
          setCache('wacrm_dash_msganalytics', data.msgAnalytics, userId);
        }
        if (data.broadcastAnalytics) {
          setBroadcastPerf(data.broadcastAnalytics);
          setCache('wacrm_dash_broadcastperf', data.broadcastAnalytics, userId);
        }
        if (data.templatePerformance) {
          setTemplatePerf(data.templatePerformance);
          setCache('wacrm_dash_templateperf', data.templatePerformance, userId);
        }
      })
      .catch(() => {
        // Fallback to client queries only if stats endpoint fails
        loadMetrics(db).then((m) => {
          setMetrics(m);
          setCache('wacrm_dash_metrics', m, userId);
          setMetricsLoading(false);
        }).catch(() => {});
        loadMessageAnalytics(db).then((m) => {
          setMsgAnalytics(m);
          setCache('wacrm_dash_msganalytics', m, userId);
        }).catch(() => {});
        loadTemplatePerformance(db).then((tData) => {
          setTemplatePerf(tData);
          setCache('wacrm_dash_templateperf', tData, userId);
        }).catch(() => {});
      });

    // Concurrently fetch chart visuals only (broadcasts & templates handled above)
    Promise.allSettled([
      loadConversationsSeries(db, 30).then((s) => {
        setSeries((prev) => ({ ...prev, 30: s }))
        setCache('wacrm_dash_series_30', s, userId)
        setSeriesLoading(false)
      }),
      loadPipelineDonut(db).then((p) => {
        setPipeline(p)
        setCache('wacrm_dash_pipeline', p, userId)
        setPipelineLoading(false)
      }),
      loadResponseTime(db).then((r) => {
        setResponseTime(r)
        setCache('wacrm_dash_resptime', r, userId)
        setResponseTimeLoading(false)
      }),
      loadActivity(db, 30).then((a) => {
        setActivity(a)
        setCache('wacrm_dash_activity', a, userId)
        setActivityLoading(false)
      }),
    ]).catch((err) => console.error('[dashboard] loadAll background fetch:', err))
  }, [userId])

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
    setCoexStatus(null)
    if (typeof window !== 'undefined' && userId) {
      sessionStorage.removeItem(`wacrm_dash_waconfig_${userId}`)
      sessionStorage.removeItem(`wacrm_dash_coexstatus_${userId}`)
    }
    loadAll()
  }, [loadAll, userId])

  const isCloudConnected = Boolean(waConfig?.connected === true && waConfig?.phone_info?.id)
  const isCoexConnected = Boolean(coexStatus?.connected === true)
  const isConnected = isCloudConnected || isCoexConnected
  const hasNoData = !metrics && !waConfig && !coexStatus && metricsLoading

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Welcome back{user?.displayName || profile?.full_name ? `, ${user?.displayName || profile?.full_name}` : ''}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live System Active
          </span>
        </div>
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
          onRefresh={loadAll}
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
