"use client";

import { CheckCheck, CheckCircle2, Clock, AlertCircle, Send, ArrowUpRight, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export interface MessageAnalyticsStats {
  totalSent?: number;
  delivered: number;
  seen: number;
  failed: number;
  pending: number;
}

interface AnalyticsProps {
  stats?: MessageAnalyticsStats;
}

export function MessageAnalytics({
  stats = { totalSent: 1500, delivered: 1420, seen: 1250, failed: 12, pending: 45 }
}: AnalyticsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const totalSent = stats.totalSent !== undefined && stats.totalSent > 0
    ? stats.totalSent
    : Math.max(stats.delivered + stats.failed + stats.pending, stats.delivered, 0);

  const deliveryRate = totalSent > 0 
    ? Math.min(100, Math.round((stats.delivered / totalSent) * 100)) 
    : 100;

  const readRate = stats.delivered > 0 
    ? Math.min(100, Math.round((stats.seen / stats.delivered) * 100)) 
    : 100;

  const failureRate = totalSent > 0 
    ? ((stats.failed / totalSent) * 100).toFixed(1)
    : '0';

  useEffect(() => {
    const targets = containerRef.current?.querySelectorAll(".stat-card");
    if (targets && targets.length > 0) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          targets,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" }
        );
      }, containerRef);
      return () => ctx.revert();
    }
  }, [stats]);

  return (
    <div ref={containerRef} className="space-y-3.5 mb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Messaging Analytics
          </h2>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-3 w-3" /> Live Telemetry
          </span>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          Cumulative Outbound & Campaigns
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. All Total Sent Messages */}
        <div className="stat-card group relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-card p-5 shadow-xs hover:shadow-md hover:border-emerald-500/50 hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                All Total Sent
              </p>
              <h3 className="text-3xl font-black text-foreground mt-1 tabular-nums tracking-tight">
                {totalSent.toLocaleString()}
              </h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-200">
              <Send className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="h-3.5 w-3.5" /> All Outbound
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">All-time count</span>
          </div>
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
        </div>

        {/* 2. Delivered */}
        <div className="stat-card group relative overflow-hidden rounded-2xl border border-teal-500/25 bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-card p-5 shadow-xs hover:shadow-md hover:border-teal-500/40 hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                Delivered
              </p>
              <h3 className="text-3xl font-black text-foreground mt-1 tabular-nums tracking-tight">
                {stats.delivered.toLocaleString()}
              </h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20 group-hover:scale-110 transition-transform duration-200">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-teal-600 dark:text-teal-400">{deliveryRate}% Delivered</span>
              <span className="text-[11px] text-muted-foreground">to handsets</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div 
                className="h-full rounded-full bg-teal-500 transition-all duration-500" 
                style={{ width: `${deliveryRate}%` }} 
              />
            </div>
          </div>
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-teal-500/15 blur-2xl pointer-events-none" />
        </div>

        {/* 3. Read (Seen) */}
        <div className="stat-card group relative overflow-hidden rounded-2xl border border-blue-500/25 bg-gradient-to-br from-blue-500/10 via-sky-500/5 to-card p-5 shadow-xs hover:shadow-md hover:border-blue-500/40 hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                Read (Seen)
              </p>
              <h3 className="text-3xl font-black text-foreground mt-1 tabular-nums tracking-tight">
                {stats.seen.toLocaleString()}
              </h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform duration-200">
              <CheckCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-blue-600 dark:text-blue-400">{readRate}% Read Rate</span>
              <span className="text-[11px] text-muted-foreground">opened</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div 
                className="h-full rounded-full bg-blue-500 transition-all duration-500" 
                style={{ width: `${readRate}%` }} 
              />
            </div>
          </div>
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-blue-500/15 blur-2xl pointer-events-none" />
        </div>

        {/* 4. Pending / Queued */}
        <div className="stat-card group relative overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-card p-5 shadow-xs hover:shadow-md hover:border-amber-500/40 hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Pending / Queued
              </p>
              <h3 className="text-3xl font-black text-foreground mt-1 tabular-nums tracking-tight">
                {stats.pending.toLocaleString()}
              </h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform duration-200">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="font-medium text-amber-600 dark:text-amber-400">
              {stats.pending > 0 ? "Dispatching in background" : "Queue is clear"}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {stats.pending > 0 ? "In flight" : "Ready"}
            </span>
          </div>
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />
        </div>

        {/* 5. Failed */}
        <div className="stat-card group relative overflow-hidden rounded-2xl border border-rose-500/25 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-card p-5 shadow-xs hover:shadow-md hover:border-rose-500/40 hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Failed
              </p>
              <h3 className="text-3xl font-black text-foreground mt-1 tabular-nums tracking-tight">
                {stats.failed.toLocaleString()}
              </h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 group-hover:scale-110 transition-transform duration-200">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="font-medium text-rose-600 dark:text-rose-400">
              {stats.failed > 0 ? `${failureRate}% failure rate` : "Zero failures"}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {stats.failed > 0 ? "Check logs" : "Optimal"}
            </span>
          </div>
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-rose-500/15 blur-2xl pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
