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
  Radio
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
import { ConnectWhatsappBanner } from '@/components/dashboard/connect-whatsapp-banner'
import { MessageAnalytics } from '@/components/dashboard/message-analytics'
import { TemplatePerformance } from '@/components/dashboard/template-performance'
import { BroadcastAnalytics } from '@/components/dashboard/broadcast-analytics'
import { TeamActivityCard } from '@/components/dashboard/team-activity-card'
import { MetricCard } from '@/components/dashboard/metric-card'
import { Card } from '@/components/ui/card'

import { useTranslations } from 'next-intl'

type RangeDays = 7 | 30 | 90

export default function DashboardPage() {
  const t = useTranslations('Dashboard.page')
  const { defaultCurrency } = useAuth()
  const [metrics, setMetrics] = useState<MetricsBundle | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(true)

  const [range, setRange] = useState<RangeDays>(30)
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

  const [templatePerf, setTemplatePerf] = useState<TemplatePerformanceData | null>(null)
  const [broadcastPerf, setBroadcastPerf] = useState<BroadcastAnalyticsData | null>(null)

  const loadAll = useCallback(() => {
    const db = createClient()

    fetch('/api/whatsapp/config')
      .then((res) => res.json())
      .then((data) => setWaConfig(data))
      .catch((err) => console.error('[dashboard] wa_config failed:', err))

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

    void loadActivity(db, 50)
      .then((a) => setActivity(a))
      .catch((err) => console.error('[dashboard] activity failed:', err))
      .finally(() => setActivityLoading(false))

    void loadTemplatePerformance(db)
      .then((tData) => setTemplatePerf(tData))
      .catch((err) => console.error('[dashboard] template performance failed:', err))

    void loadBroadcastAnalytics(db)
      .then((bData) => setBroadcastPerf(bData))
      .catch((err) => console.error('[dashboard] broadcast analytics failed:', err))
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
        <div className="space-y-6">
          {/* Hero Welcome Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white shadow-lg">
            <div className="relative z-10 max-w-2xl space-y-3">
              <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                Getting Started
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight">Welcome to Botify.ai CRM</h2>
              <p className="text-emerald-100 text-base leading-relaxed">
                Connect your Meta WhatsApp Business API or Scan Coexistence QR to automate your sales, broadcast messages to thousands of customers, and manage chats effortlessly.
              </p>
              <div className="pt-2 flex flex-wrap gap-4">
                <Link
                  href="/settings?tab=whatsapp"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-800 shadow-md hover:bg-emerald-50 transition-all active:scale-95"
                >
                  <Smartphone className="h-4 w-4 text-emerald-600" />
                  Connect Cloud API
                </Link>
                <Link
                  href="/dashboard/coexistence"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-800/60 border border-white/20 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-800/80 transition-all active:scale-95"
                >
                  <Smartphone className="h-4 w-4 text-purple-300" />
                  Connect Coexistence QR
                </Link>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          </div>

          {/* Quick Metrics Placeholder */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Active Conversations"
              value="0"
              icon={MessageSquare}
              subtitle="Connect WhatsApp to start"
            />
            <MetricCard
              title="New Contacts Today"
              value="0"
              icon={Users}
              subtitle="Import or sync contacts"
            />
            <MetricCard
              title="Open Deals Value"
              value="0"
              icon={Send}
              subtitle="Track sales pipelines"
            />
            <MetricCard
              title="Messages Sent Today"
              value="0"
              icon={Zap}
              subtitle="Broadcasts & automations"
            />
          </div>

          {/* Quick Setup Checklist */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Setup Checklist</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/settings?tab=whatsapp" className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold group-hover:bg-emerald-600 group-hover:text-white transition-colors">1</div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Connect WhatsApp</h4>
                    <p className="text-xs text-slate-500">Official Meta API or QR Scan</p>
                  </div>
                </div>
              </Link>

              <Link href="/contacts" className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-blue-500 hover:bg-blue-50/50 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">2</div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Import Contacts</h4>
                    <p className="text-xs text-slate-500">Upload CSV or add manually</p>
                  </div>
                </div>
              </Link>

              <Link href="/broadcasts/new" className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-purple-500 hover:bg-purple-50/50 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700 font-bold group-hover:bg-purple-600 group-hover:text-white transition-colors">3</div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Send First Campaign</h4>
                    <p className="text-xs text-slate-500">Broadcast to your audience</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Quick Action Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Radio, label: 'Broadcasts', href: '/broadcasts', color: 'bg-emerald-600' },
              { icon: FileText, label: 'Templates', href: '/settings?tab=whatsapp', color: 'bg-teal-600' },
              { icon: Users, label: 'Contacts', href: '/contacts', color: 'bg-blue-600' },
              { icon: Smartphone, label: 'Coexistence QR', href: '/dashboard/coexistence', color: 'bg-purple-600' },
            ].map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white p-6 shadow-sm border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all h-36 group"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.color} text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-slate-800 text-center group-hover:text-emerald-700 transition-colors">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {isConnected && (
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

          {/* Action Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {/* Action Cards */}
            {[
              { icon: Radio, label: 'Broadcasts', href: '/broadcasts', color: 'bg-gradient-to-br from-[var(--color-green-deep)] to-[#094d45]' },
              { icon: FileText, label: 'Templates', href: '/settings?tab=whatsapp', color: 'bg-gradient-to-br from-emerald-500 to-teal-600' },
              { icon: Zap, label: 'Keyword Flow', href: '/keyword-flows', color: 'bg-gradient-to-br from-[#25D366] to-[#128C7E]' },
              { icon: Users, label: 'Contacts', href: '/contacts', color: 'bg-gradient-to-br from-sky-500 to-blue-600' },
              { icon: Send, label: 'Automations', href: '/automations', color: 'bg-gradient-to-br from-indigo-500 to-violet-600' },
              { icon: Smartphone, label: 'Connect Coexistence', href: '/dashboard/coexistence', color: 'bg-gradient-to-br from-slate-600 to-slate-800' },
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

          {/* Template & Broadcast Analytics */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mt-4">
            {templatePerf && <TemplatePerformance data={templatePerf} />}
            {broadcastPerf && <BroadcastAnalytics data={broadcastPerf} />}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 mt-4">
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
