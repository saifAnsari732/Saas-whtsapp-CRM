"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageSquare, Smartphone, Users, Clock, Bot, BarChart3 } from "lucide-react";

const highlights = [
  {
    icon: Smartphone,
    title: "Fast Coexistence Dashboard",
    desc: "A dedicated, mobile-first dashboard for your linked device — live connection status, synced chats and groups at a glance.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    desc: "Every KPI is pulled from your live account — messages, contacts, deals and broadcasts. No dummy numbers, ever.",
  },
  {
    icon: Bot,
    title: "Smart Automation",
    desc: "Auto-replies, scheduled group broadcasts and AI drafts that keep your conversations moving while you sleep.",
  },
];

const kpiCards = [
  { icon: MessageSquare, label: "Synced chats", value: "1,240", tone: "bg-[var(--color-green-vivid)]/15 text-[var(--color-green-deep)]" },
  { icon: Users, label: "Active contacts", value: "8,512", tone: "bg-sky-500/10 text-sky-600" },
  { icon: Clock, label: "Scheduled sends", value: "96", tone: "bg-amber-500/10 text-amber-600" },
  { icon: Bot, label: "AI replies today", value: "312", tone: "bg-violet-500/10 text-violet-600" },
];

export function LiveDashboardSection() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-32 bg-[#fafcfa]">
      {/* Background décor */}
      <div className="absolute inset-0 bg-[radial-gradient(#075e5410_1px,transparent_1px)] bg-[size:26px_26px] opacity-60"></div>
      <div className="absolute top-20 right-0 h-[420px] w-[420px] rounded-full bg-[var(--color-green-vivid)]/10 blur-[120px] translate-x-1/3"></div>
      <div className="absolute bottom-20 left-0 h-[420px] w-[420px] rounded-full bg-[var(--color-green-deep)]/10 blur-[120px] -translate-x-1/3"></div>

      <div className="container relative z-10 mx-auto px-4 md:px-8 max-w-[1200px]">
        {/* Section header */}
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            className="text-sm font-bold uppercase tracking-widest text-[var(--color-green-deep)] font-heading mb-4"
          >
            Coexistence Dashboard
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-[52px] font-extrabold tracking-tight text-navy font-heading mb-6 leading-tight"
          >
            One dashboard.
            <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-green-deep)] to-[var(--color-green-vivid)]">
              Powered by live data.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-[19px] text-gray font-medium leading-relaxed"
          >
            Your WhatsApp device, supercharged in the background. Track everything in real time with a beautiful,
            phone-friendly interface that your whole team can use.
          </motion.p>
        </div>

        {/* Feature cards */}
        <div className="grid gap-5 md:grid-cols-3 mb-12">
          {highlights.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group rounded-[24px] bg-white/80 backdrop-blur-xl border border-border/70 p-7 shadow-[0_8px_32px_rgba(7,94,84,0.04)] hover:shadow-[0_16px_44px_rgba(7,94,84,0.1)] hover:border-[var(--color-green-vivid)]/40 transition-all"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-[16px] bg-gradient-to-br from-[var(--color-green-deep)] to-[var(--color-green-vivid)] shadow-md group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <f.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-navy font-heading group-hover:text-[var(--color-green-deep)] transition-colors">
                {f.title}
              </h3>
              <p className="text-gray leading-relaxed text-[15px]">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Dashboard mockup preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7 }}
          className="relative rounded-[28px] border border-border/70 bg-white p-4 sm:p-6 shadow-[0_24px_60px_rgba(7,94,84,0.10)]"
        >
          {/* Fake window chrome */}
          <div className="mb-5 flex items-center gap-2 px-1">
            <span className="h-3 w-3 rounded-full bg-red-400"></span>
            <span className="h-3 w-3 rounded-full bg-amber-400"></span>
            <span className="h-3 w-3 rounded-full bg-green-400"></span>
            <span className="ml-3 hidden sm:inline-block rounded-md bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              app.wacrm.tech/dashboard/coexistence
            </span>
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {kpiCards.map((k, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${k.tone}`}>
                  <k.icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-extrabold tracking-tight text-foreground">{k.value}</p>
                <p className="text-sm font-medium text-muted-foreground">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Fake chart row */}
          <div className="mt-4 grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">Conversations</p>
                <div className="flex gap-1 text-[11px] font-semibold text-muted-foreground">
                  <span className="rounded-md bg-primary/10 px-2 py-1 text-primary">30d</span>
                </div>
              </div>
              <div className="flex h-28 items-end gap-1.5">
                {[40, 62, 48, 75, 58, 82, 66, 90, 70, 84, 76, 95].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-[var(--color-green-deep)] to-[var(--color-green-vivid)] opacity-80" style={{ height: `${h}%` }}></div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
              <p className="mb-4 text-sm font-bold text-foreground">Pipeline</p>
              <div className="space-y-3">
                {[
                  { label: "New", pct: 70, color: "bg-[var(--color-green-deep)]" },
                  { label: "Contacted", pct: 52, color: "bg-[var(--color-green-vivid)]" },
                  { label: "Won", pct: 34, color: "bg-sky-500" },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="mb-1 flex items-center justify-between text-xs font-medium text-muted-foreground">
                      <span>{s.label}</span>
                      <span>{s.pct}%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col items-center justify-between gap-3 rounded-2xl border border-[var(--color-green-vivid)]/30 bg-[var(--color-green-vivid)]/5 p-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-green-deep)]" />
              <p className="text-sm text-foreground">
                <strong>Device connected.</strong> <span className="text-muted-foreground">Auto-reply active, 4 schedules running.</span>
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--color-green-deep)] px-5 py-2.5 text-sm font-bold text-white hover:bg-[var(--color-green-vivid)] hover:text-navy transition-colors"
            >
              Try it now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
