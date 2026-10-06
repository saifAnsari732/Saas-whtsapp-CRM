'use client';

import { useState } from 'react';
import {
  Smartphone,
  Zap,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Users,
  Bot,
  Calendar,
  MessageSquare,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  QrCode,
  Send,
  AlertTriangle,
  Lock,
  Layers,
  ArrowRight,
  ShieldAlert,
  Clock,
  Radio
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function CoexistenceGuide() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is WhatsApp Coexistence and how does it differ from Meta Cloud API?',
      a: 'Meta Cloud API requires a separate virtual number or completely disconnects your number from the physical WhatsApp phone app. In contrast, Coexistence utilizes WhatsApp Multi-Device architecture to pair your real mobile phone with ChatFlyr CRM. You continue using WhatsApp on your phone normally, while the CRM automates 24/7 AI replies, group broadcasts, and multi-agent chats in the background.'
    },
    {
      q: 'Will my mobile WhatsApp app log out or get disconnected?',
      a: 'Not at all! Coexistence works exactly like WhatsApp Web / "Linked Devices". Your physical phone remains 100% operational — you can take voice/video calls, reply to family & friends, and check chats directly on your mobile anytime.'
    },
    {
      q: 'Does my phone need to stay connected to internet 24/7?',
      a: 'Thanks to WhatsApp Multi-Device infrastructure, once paired via QR code, the CRM session can stay connected for up to 14 days even if your phone is temporarily offline. For uninterrupted real-time sync, keeping your phone connected to Wi-Fi or mobile data is recommended.'
    },
    {
      q: 'Can I send broadcasts to WhatsApp Groups?',
      a: 'Yes! This is the single biggest advantage of Coexistence. While Meta Official Cloud API strictly prohibits group messaging, Coexistence allows you to sync all your WhatsApp groups, send 1-click bulk announcements, and schedule automated recurring reminders to groups.'
    },
    {
      q: 'How does ChatFlyr protect my WhatsApp account from bans?',
      a: 'ChatFlyr Coexistence engine features an automated Anti-Ban Protection Buffer with randomized 2–5 second human-like dispatch intervals. Simply avoid blast-messaging thousands of cold unfamiliar numbers in a single day, and your account will remain safe and healthy.'
    }
  ];

  return (
    <div className="space-y-8 mt-6">
      
      {/* SECTION 1: ARCHITECTURE OVERVIEW & 3-STEP ROADMAP */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 px-3 py-1 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Dual-Device Sync Architecture</span>
          </Badge>
          <Badge variant="outline" className="text-muted-foreground border-border text-xs font-semibold px-2.5 py-1">
            Phone App + Cloud CRM Simultaneous
          </Badge>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 text-xs font-bold px-2.5 py-1 ml-auto">
            100% Private Session
          </Badge>
        </div>

        <div className="space-y-2 max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            What is WhatsApp Coexistence & How Does It Work?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            <strong className="text-foreground font-semibold">Coexistence</strong> allows your physical WhatsApp phone app and ChatFlyr CRM to run in tandem. You never lose access to your personal mobile chats, while unlocking CRM multi-agent chat, AI smart bot auto-replies, and group broadcasts at <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">₹0 per-message cost</span>.
          </p>
        </div>

        {/* 3-STEP VISUAL WORKFLOW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="group rounded-2xl border border-border/80 bg-muted/20 p-5 shadow-2xs hover:border-emerald-500/40 hover:bg-card transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-sm border border-emerald-500/20">
                01
              </div>
              <QrCode className="h-5 w-5 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
              <span>1-Click QR Scan</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                &lt; 10s Setup
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Open WhatsApp on your mobile phone → tap <strong>Settings / Linked Devices</strong> → tap <strong>Link a Device</strong> and scan the QR code. Ready in seconds.
            </p>
          </div>

          <div className="group rounded-2xl border border-border/80 bg-muted/20 p-5 shadow-2xs hover:border-blue-500/40 hover:bg-card transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-sm border border-blue-500/20">
                02
              </div>
              <RefreshCw className="h-5 w-5 text-muted-foreground group-hover:text-blue-600 transition-colors" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
              <span>Real-Time 2-Way Sync</span>
              <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full">
                Bi-Directional
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              All incoming and outgoing conversations, media, and group messages sync instantaneously. Reply from your mobile phone or from CRM — both stay in sync.
            </p>
          </div>

          <div className="group rounded-2xl border border-border/80 bg-muted/20 p-5 shadow-2xs hover:border-indigo-500/40 hover:bg-card transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black text-sm border border-indigo-500/20">
                03
              </div>
              <Zap className="h-5 w-5 text-muted-foreground group-hover:text-indigo-600 transition-colors" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
              <span>Supercharged Automations</span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full">
                Zero Meta Fee
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Broadcast to WhatsApp groups, activate 24/7 AI smart auto-reply bots, and schedule personalized automated follow-ups with zero per-message charges.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: SIDE-BY-SIDE COMPARISON (COEXISTENCE VS META CLOUD API) */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  Coexistence QR vs Meta Official Cloud API
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Understand the key differences to choose the optimal connection for your business model.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border/80 shadow-2xs">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-muted/40 text-foreground font-bold border-b border-border/80">
              <tr>
                <th className="p-4 w-1/3 text-xs uppercase tracking-wider text-muted-foreground">Feature / Capability</th>
                <th className="p-4 w-1/3 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 border-x border-border/60">
                  <div className="flex items-center gap-1.5 font-extrabold text-sm">
                    <Smartphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Coexistence (Phone QR)</span>
                    <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold ml-1.5 shadow-2xs">
                      Recommended
                    </span>
                  </div>
                </th>
                <th className="p-4 w-1/3 text-blue-700 dark:text-blue-400">
                  <div className="flex items-center gap-1.5 font-extrabold text-sm">
                    <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>Meta Official Cloud API</span>
                    <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold ml-1.5 shadow-2xs">
                      Enterprise
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr className="hover:bg-muted/20 transition-colors">
                <td className="p-4 font-semibold text-foreground">
                  Physical Phone App Usage
                  <span className="block text-[11px] font-normal text-muted-foreground mt-0.5">Does your mobile WhatsApp app keep working?</span>
                </td>
                <td className="p-4 bg-emerald-500/5 border-x border-border/60 font-bold text-emerald-700 dark:text-emerald-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    100% Active (Normal phone usage continues)
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                    <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    Disconnected (Mobile app logs out)
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-muted/20 transition-colors">
                <td className="p-4 font-semibold text-foreground">
                  WhatsApp Groups Messaging
                  <span className="block text-[11px] font-normal text-muted-foreground mt-0.5">Broadcast and auto-reply inside WhatsApp groups</span>
                </td>
                <td className="p-4 bg-emerald-500/5 border-x border-border/60 font-bold text-emerald-700 dark:text-emerald-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    Full Support (Broadcast to all groups)
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <XCircle className="h-4 w-4 shrink-0 text-slate-400" />
                    Not Supported (1-to-1 chats only)
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-muted/20 transition-colors">
                <td className="p-4 font-semibold text-foreground">
                  Meta Template Approval
                  <span className="block text-[11px] font-normal text-muted-foreground mt-0.5">Pre-approval requirements before messaging</span>
                </td>
                <td className="p-4 bg-emerald-500/5 border-x border-border/60 font-bold text-emerald-700 dark:text-emerald-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    Zero Approval Needed (Send direct text)
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                    Mandatory 24h Meta Template Approval
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-muted/20 transition-colors">
                <td className="p-4 font-semibold text-foreground">
                  24-Hour Session Window
                  <span className="block text-[11px] font-normal text-muted-foreground mt-0.5">Messaging timeout restrictions</span>
                </td>
                <td className="p-4 bg-emerald-500/5 border-x border-border/60 font-bold text-emerald-700 dark:text-emerald-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    No Restrictions (Message anytime)
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                    Strict 24h Window (Paid templates required)
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-muted/20 transition-colors">
                <td className="p-4 font-semibold text-foreground">
                  Per-Message Charges
                  <span className="block text-[11px] font-normal text-muted-foreground mt-0.5">Messaging cost per conversation</span>
                </td>
                <td className="p-4 bg-emerald-500/5 border-x border-border/60 font-bold text-emerald-700 dark:text-emerald-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    ₹0 Free (Uses your phone SIM/data plan)
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-medium">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-blue-500" />
                    ₹0.13 - ₹0.72 Per Conversation (Billed by Meta)
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-muted/20 transition-colors">
                <td className="p-4 font-semibold text-foreground">
                  Green Tick & Enterprise Scale
                  <span className="block text-[11px] font-normal text-muted-foreground mt-0.5">Official WhatsApp business verification</span>
                </td>
                <td className="p-4 bg-emerald-500/5 border-x border-border/60 font-medium text-muted-foreground">
                  Standard Business / Mobile Number
                </td>
                <td className="p-4 font-bold text-blue-700 dark:text-blue-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-500" />
                    Official Meta Green Tick Eligible
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-muted/20 transition-colors">
                <td className="p-4 font-semibold text-foreground">
                  Best Suited For
                  <span className="block text-[11px] font-normal text-muted-foreground mt-0.5">Recommended use case</span>
                </td>
                <td className="p-4 bg-emerald-500/5 border-x border-border/60 font-bold text-emerald-800 dark:text-emerald-300">
                  Field Sales, WhatsApp Groups, Local Businesses, Personal Outreach
                </td>
                <td className="p-4 font-bold text-blue-800 dark:text-blue-300">
                  Large Enterprises (50k+ daily mass blasts), Corporate Branding
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: KEY POWER FEATURES */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Core Capabilities of Coexistence Engine
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Every feature unlocked automatically once your phone QR is paired.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-2xs space-y-3 hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20">
              <Users className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-sm sm:text-base text-foreground">WhatsApp Group Broadcaster</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Select multiple WhatsApp groups simultaneously and broadcast deals, meeting links, or announcements with a single click.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-2xs space-y-3 hover:border-purple-500/40 hover:-translate-y-0.5 transition-all">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold border border-purple-500/20">
              <Bot className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-sm sm:text-base text-foreground">24/7 AI Smart Bot</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Automate customer replies, qualify leads, and answer common questions instantly while you sleep or handle other business tasks.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-2xs space-y-3 hover:border-amber-500/40 hover:-translate-y-0.5 transition-all">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold border border-amber-500/20">
              <Calendar className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-sm sm:text-base text-foreground">Scheduled Group Reminders</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Schedule recurring morning notices, event alerts, or daily summaries to any WhatsApp group on preset dates and times.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-2xs space-y-3 hover:border-blue-500/40 hover:-translate-y-0.5 transition-all">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold border border-blue-500/20">
              <Send className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-sm sm:text-base text-foreground">Direct Number Bulk Dispatch</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Paste phone number lists and rapidly dispatch personalized messages without the need to save every contact into your phone book.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-2xs space-y-3 hover:border-teal-500/40 hover:-translate-y-0.5 transition-all">
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold border border-teal-500/20">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-sm sm:text-base text-foreground">Unified Team Inbox</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Allow multiple team agents to respond to incoming customer chats simultaneously using one single connected WhatsApp number.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-2xs space-y-3 hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-sm sm:text-base text-foreground">Anti-Ban Protection Buffer</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Equipped with natural human typing pacing and randomized delay intervals to protect your phone number reputation.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 4: SAFE USAGE TIPS */}
      <div className="rounded-3xl border border-border/80 bg-muted/20 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2.5 text-foreground font-bold text-sm sm:text-base">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="block font-black">WhatsApp Safety & Anti-Ban Best Practices</span>
            <span className="text-xs font-normal text-muted-foreground">Follow these simple guidelines to keep your account 100% compliant and healthy.</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground pt-1">
          <div className="space-y-1.5 p-4 rounded-2xl bg-card border border-border/70 shadow-2xs">
            <strong className="text-foreground block font-bold text-sm">1. Avoid Unsolicited Cold Spam</strong>
            <span className="leading-relaxed block">Only message opted-in leads, customers, and active groups. Unsolicited blast messages to strangers risk spam reports.</span>
          </div>
          <div className="space-y-1.5 p-4 rounded-2xl bg-card border border-border/70 shadow-2xs">
            <strong className="text-foreground block font-bold text-sm">2. Warm Up Newer Numbers</strong>
            <span className="leading-relaxed block">If your phone number is newly activated, start with 20–50 messages per day and gradually increase volume over 2 weeks.</span>
          </div>
          <div className="space-y-1.5 p-4 rounded-2xl bg-card border border-border/70 shadow-2xs">
            <strong className="text-foreground block font-bold text-sm">3. Maintain Regular Mobile Activity</strong>
            <span className="leading-relaxed block">Continue normal 1-on-1 chatting and calls from your physical phone. Organic human behavior ensures top-tier account health.</span>
          </div>
        </div>
      </div>

      {/* SECTION 5: INTERACTIVE FAQ */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Frequently Asked Questions
            </h3>
            <p className="text-xs text-muted-foreground">Everything you need to know about multi-device coexistence.</p>
          </div>
        </div>

        <div className="divide-y divide-border/60 pt-2">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className="py-4">
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 text-left font-bold text-sm sm:text-base text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="shrink-0 p-1.5 rounded-xl bg-muted text-muted-foreground">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </button>
                {isOpen && (
                  <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed pr-6 animate-in fade-in slide-in-from-top-1 duration-150">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
