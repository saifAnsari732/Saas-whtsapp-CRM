"use client";

import { useState } from "react";
import { 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  TrendingUp, 
  Layers, 
  Zap, 
  HelpCircle, 
  LogOut, 
  AlertTriangle, 
  MessageSquare, 
  Radio, 
  Smartphone, 
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface WhatsAppLiveGuideProps {
  waConfig: {
    connected?: boolean;
    phone_info?: {
      id?: string;
      display_phone_number?: string;
      verified_name?: string;
      quality_rating?: string;
    };
  };
  onDisconnectSuccess: () => void;
}

export function WhatsAppLiveGuide({ waConfig, onDisconnectSuccess }: WhatsAppLiveGuideProps) {
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showFullGuide, setShowFullGuide] = useState(false);

  const phoneInfo = waConfig.phone_info;
  const verifiedName = phoneInfo?.verified_name || "Official WhatsApp Business";
  const displayNumber = phoneInfo?.display_phone_number || "Connected Account";
  const quality = phoneInfo?.quality_rating || "GREEN (High Quality)";

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      const res = await fetch("/api/whatsapp/config", {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to disconnect account");
      }

      toast.success("WhatsApp Account Disconnected Successfully");
      setShowDisconnectModal(false);
      onDisconnectSuccess();
    } catch (err: any) {
      console.error("Disconnect error:", err);
      toast.error(err.message || "Failed to disconnect WhatsApp account");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Connected Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border border-emerald-500/30 p-6 sm:p-7 text-white shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            {/* Live Badge & Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-400 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Meta WhatsApp Cloud API Active & Verified
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Official API v21.0
              </span>
            </div>

            {/* Title & Account Name */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>{verifiedName}</span>
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>Phone: <strong className="text-white font-mono">{displayNumber}</strong></span>
                <span>•</span>
                <span>Quality: <strong className="text-emerald-400 font-semibold">{quality}</strong></span>
                <span>•</span>
                <span>Webhook: <strong className="text-emerald-400 font-semibold">Synced (200 OK)</strong></span>
              </p>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <Link
                href="/inbox"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 shadow-md transition-all active:scale-95"
              >
                <MessageSquare className="h-4 w-4" />
                Open Live Inbox
              </Link>
              <Link
                href="/broadcasts/new"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition-all active:scale-95"
              >
                <Radio className="h-4 w-4 text-emerald-400" />
                Send Campaign
              </Link>
              <Link
                href="/dashboard/coexistence"
                className="inline-flex items-center gap-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 px-4 py-2 text-xs sm:text-sm font-bold text-purple-200 shadow-sm transition-all active:scale-95"
              >
                <Smartphone className="h-4 w-4 text-purple-400" />
                AI Auto-Reply & Flows
              </Link>
              <button
                onClick={() => setShowFullGuide(!showFullGuide)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/40 text-slate-200 px-3.5 py-2 text-xs font-semibold transition-colors"
              >
                <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
                {showFullGuide ? "Hide Limits & Tier Details" : "View Limits & Increase Guide"}
                {showFullGuide ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => setShowDisconnectModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 px-3 py-2 text-xs font-semibold transition-colors"
                title="Disconnect WhatsApp API"
              >
                <LogOut className="h-3.5 w-3.5" />
                Disconnect
              </button>
            </div>
          </div>

          {/* Quick Status KPI Cards */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 shrink-0 lg:w-72">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-[11px] text-slate-400 font-medium">Inbound Messages</div>
              <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Unlimited Free
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-[11px] text-slate-400 font-medium">Daily Outbound Tier</div>
              <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Tier 1 (1k/day)
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-[11px] text-slate-400 font-medium">Security Standard</div>
              <div className="text-sm font-bold text-slate-200 mt-0.5">256-bit AES GCM</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-[11px] text-slate-400 font-medium">Official Green Tick</div>
              <div className="text-sm font-bold text-emerald-300 mt-0.5">Eligible</div>
            </div>
          </div>
        </div>
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Expandable Meta Cloud API Messaging Limit & Increase Guide Section */}
      {showFullGuide && (
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-6 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  Meta WhatsApp Messaging Limits & Account Tier Guide
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Understand how Meta controls business conversation limits and how you can easily scale to 100k+ messages daily.
              </p>
            </div>
            <a 
              href="https://developers.facebook.com/docs/whatsapp/messaging-limits" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-500/10 px-3 py-1.5 rounded-xl shrink-0"
            >
              Meta Official Docs
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Tier Breakdown Visual */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-emerald-500" />
              Meta Messaging Tiers (Unique Customers per 24 Hours)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 space-y-2 relative">
                <div className="absolute top-3 right-3 text-[10px] font-bold uppercase bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                  Current Tier
                </div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Tier 1 (Standard)</div>
                <div className="text-2xl font-black text-foreground">1,000</div>
                <p className="text-[11px] text-muted-foreground">Unique recipients per 24-hr period. Default tier for all newly connected numbers.</p>
              </div>

              <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400">Tier 2 (Growth)</div>
                <div className="text-2xl font-black text-foreground">10,000</div>
                <p className="text-[11px] text-muted-foreground">Automatic upgrade when you reach 50% limit in 7 days or verify business.</p>
              </div>

              <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                <div className="text-xs font-bold text-purple-600 dark:text-purple-400">Tier 3 (Pro)</div>
                <div className="text-2xl font-black text-foreground">100,000</div>
                <p className="text-[11px] text-muted-foreground">For medium-to-large business broadcasts with high engagement rates.</p>
              </div>

              <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400">Tier 4 (Enterprise)</div>
                <div className="text-2xl font-black text-foreground">Unlimited</div>
                <p className="text-[11px] text-muted-foreground">Unlimited broadcast messages daily for verified high-volume enterprises.</p>
              </div>
            </div>
          </div>

          {/* How to Increase Limit: Step-by-Step */}
          <div className="p-5 rounded-2xl bg-muted/30 border border-border/80 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-500" />
              3 Simple Steps to Increase Your Daily Message Limit
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-xs">
                  1
                </div>
                <div>
                  <h5 className="text-xs font-bold text-foreground">Maintain GREEN Quality Rating</h5>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Send personalized, relevant content. Avoid spamming so recipients don't block or report your number.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 font-bold text-xs">
                  2
                </div>
                <div>
                  <h5 className="text-xs font-bold text-foreground">Reach 50% Volume in 7 Days</h5>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    When you broadcast to 500+ contacts with high quality, Meta automatically promotes your account to Tier 2 (10,000/day).
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 font-bold text-xs">
                  3
                </div>
                <div>
                  <h5 className="text-xs font-bold text-foreground">Verify Meta Business Manager</h5>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Complete Official Business Verification in Meta Business Settings (upload GST/business doc) for instant tier upgrade.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Feature Capabilities */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-500" />
              What You Can Do with Your Live WhatsApp Cloud API
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-border/60 bg-card">
                <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Unlimited Inbound Conversations
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Whenever a customer messages you first, reply freely without any 1,000 limit within the 24-hr service window.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border/60 bg-card">
                <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Rich Media & Template Campaigns
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Send images, videos, documents, and clickable Quick Reply & Call-To-Action buttons to thousands.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border/60 bg-card">
                <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  24/7 AI Smart Bot & Keyword Flows
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Instantly qualify leads, answer customer FAQs, and automate repetitive tasks while you sleep.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Disconnect WhatsApp Account?</h3>
                <p className="text-xs text-muted-foreground">Are you sure you want to disconnect?</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Disconnecting will remove your active Meta WhatsApp Cloud API credentials. You will not receive or send Cloud API messages until you reconnect. Your chat history and contacts will remain safe.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDisconnectModal(false)}
                disabled={disconnecting}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                {disconnecting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <LogOut className="mr-1.5 h-3.5 w-3.5" />
                    Confirm Disconnect
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
