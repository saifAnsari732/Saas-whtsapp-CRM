"use client";

import { useState } from "react";
import { 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  HelpCircle, 
  LogOut, 
  AlertTriangle, 
  MessageSquare, 
  Radio, 
  Smartphone, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  FileCheck, 
  Building2 
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BusinessKYCModal } from "@/components/dashboard/business-kyc-modal";

interface WhatsAppLiveGuideProps {
  waConfig: {
    connected?: boolean;
    config?: {
      waba_id?: string;
      phone_number_id?: string;
    };
    phone_info?: {
      id?: string;
      display_phone_number?: string;
      verified_name?: string;
      quality_rating?: string;
      messaging_limit_tier?: string;
      status?: string;
      throughput?: { level?: string };
    };
    waba_info?: {
      id?: string;
      name?: string;
      currency?: string;
      timezone_id?: string;
      message_template_namespace?: string;
      business_verification_status?: string;
      account_review_status?: string;
    };
    messaging_limit?: {
      current_limit?: number | string;
      current_tier_label?: string;
      rolling_period?: string;
      current_tier_index?: number;
      is_kyc_verified?: boolean;
      updated_at?: string;
      tiers?: Array<{ label: string; value: number | string; description: string; is_current?: boolean }>;
      upgrade_requirements?: {
        next_tier: number;
        target_conversations: number;
        current_conversations: number;
        timeframe: string;
        quality_required: string;
        upgrade_sla: string;
        description: string;
      };
    };
  };
  onDisconnectSuccess: () => void;
  onRefresh?: () => void;
}

export function WhatsAppLiveGuide({ waConfig, onDisconnectSuccess, onRefresh }: WhatsAppLiveGuideProps) {
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showFullGuide, setShowFullGuide] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);

  const phoneInfo = waConfig.phone_info;
  const verifiedName = phoneInfo?.verified_name || "Official WhatsApp Business";
  const displayNumber = phoneInfo?.display_phone_number || "";
  const quality = phoneInfo?.quality_rating || "GREEN";
  const throughputLevel = phoneInfo?.throughput?.level || "STANDARD (80 msg/sec)";

  // Official Meta WhatsApp Manager Live Limit Data
  const messagingLimit = waConfig.messaging_limit;
  const isKycVerified = messagingLimit?.is_kyc_verified ?? (waConfig?.waba_info?.business_verification_status?.toLowerCase() === "verified");
  const wabaId = waConfig?.config?.waba_id || waConfig?.waba_info?.id || "";

  const currentLimit = messagingLimit?.current_limit ?? (isKycVerified ? 2000 : 250);
  const currentLimitFormatted = typeof currentLimit === "number" ? currentLimit.toLocaleString() : String(currentLimit);
  const currentTierIndex = messagingLimit?.current_tier_index ?? (currentLimit === 250 ? 0 : 1);
  const current7dConvs = messagingLimit?.upgrade_requirements?.current_conversations ?? 0;
  const target7dConvs = messagingLimit?.upgrade_requirements?.target_conversations ?? (currentTierIndex === 0 ? 250 : 1000);
  const progressPercent = target7dConvs > 0 ? Math.min(100, Math.round((current7dConvs / target7dConvs) * 100)) : 100;
  const updatedAt = messagingLimit?.updated_at || "Live from Meta Cloud API";

  const tierList = messagingLimit?.tiers && messagingLimit.tiers.length > 0 ? messagingLimit.tiers : [
    { label: '250', value: 250, description: 'Default for unverified accounts before KYC' },
    { label: '2000', value: 2000, description: 'Business-initiated conversations in a rolling 24-hour period' },
    { label: '10000', value: 10000, description: 'Growth Tier' },
    { label: '100000', value: 100000, description: 'Scale Tier' },
    { label: 'Unlimited', value: 'unlimited', description: 'Enterprise Tier' }
  ];

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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-card border border-emerald-500/25 dark:from-emerald-950/70 dark:via-teal-950/50 dark:to-slate-900/90 p-6 sm:p-7 text-foreground shadow-md backdrop-blur-xs">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            {/* Live Badge & Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Meta WhatsApp Cloud API Active & Verified
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Official API v21.0
              </span>
              {isKycVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                  <FileCheck className="h-3.5 w-3.5" />
                  Meta KYC Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  KYC Pending (250 Limit)
                </span>
              )}
            </div>

            {/* Title & Account Name */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                <span>{verifiedName}</span>
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>Phone: <strong className="text-foreground font-mono">{displayNumber}</strong></span>
                <span>•</span>
                <span>Quality: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{quality.includes("GREEN") ? "GREEN (High Quality)" : quality}</strong></span>
                <span>•</span>
                <span>Current Limit: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{currentLimitFormatted} / rolling 24-hr</strong></span>
                <span>•</span>
                <span>Speed: <strong className="text-foreground font-semibold">{throughputLevel}</strong></span>
              </p>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <Link
                href="/inbox"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition-all active:scale-95"
              >
                <MessageSquare className="h-4 w-4" />
                Open Live Inbox
              </Link>
              <Link
                href="/broadcasts/new"
                className="inline-flex items-center gap-2 rounded-xl bg-card hover:bg-accent border border-border px-4 py-2 text-xs sm:text-sm font-bold text-foreground shadow-xs transition-all active:scale-95"
              >
                <Radio className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Send Campaign
              </Link>
              <button
                onClick={() => setShowKycModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs transition-all active:scale-95"
              >
                <Building2 className="h-4 w-4" />
                Business KYC & Limits
              </button>
              <Link
                href="/dashboard/coexistence"
                className="inline-flex items-center gap-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 px-4 py-2 text-xs sm:text-sm font-bold text-purple-700 dark:text-purple-300 shadow-xs transition-all active:scale-95"
              >
                <Smartphone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                AI Auto-Reply & Flows
              </Link>
              <button
                onClick={() => setShowFullGuide(!showFullGuide)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-muted hover:bg-muted/80 border border-border text-foreground px-3.5 py-2 text-xs font-semibold transition-colors"
              >
                <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
                {showFullGuide ? "Hide Messaging Limits View" : "View Meta Messaging Limits"}
                {showFullGuide ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => setShowDisconnectModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 dark:text-rose-400 dark:hover:text-rose-200 px-3 py-2 text-xs font-semibold transition-colors"
                title="Disconnect WhatsApp API"
              >
                <LogOut className="h-3.5 w-3.5" />
                Disconnect
              </button>
            </div>
          </div>

          {/* Quick Status KPI Cards */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 shrink-0 lg:w-72">
            <div className="p-3 rounded-xl bg-card/80 border border-border/70 shadow-2xs backdrop-blur-xs">
              <div className="text-[11px] text-muted-foreground font-medium">Inbound Messages</div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Unlimited Free
              </div>
            </div>
            <div className="p-3 rounded-xl bg-card/80 border border-border/70 shadow-2xs backdrop-blur-xs">
              <div className="text-[11px] text-muted-foreground font-medium">Daily Outbound Limit</div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {currentLimitFormatted} / 24h
              </div>
            </div>
            <div className="p-3 rounded-xl bg-card/80 border border-border/70 shadow-2xs backdrop-blur-xs">
              <div className="text-[11px] text-muted-foreground font-medium">Quality Rating</div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                {quality.includes("GREEN") ? "HIGH (Green)" : quality}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-card/80 border border-border/70 shadow-2xs backdrop-blur-xs">
              <div className="text-[11px] text-muted-foreground font-medium">Throughput Speed</div>
              <div className="text-sm font-bold text-foreground mt-0.5">80 msg/sec</div>
            </div>
          </div>
        </div>
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Meta WhatsApp Manager Official Messaging Limits View */}
      {showFullGuide && (
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-6 animate-in fade-in slide-in-from-top-3 duration-300">
          {/* Header matching Meta Manager */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span>Messaging limits</span>
                  <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-muted text-[11px] font-semibold text-muted-foreground" title="Limits control how many unique customers you can message in a rolling 24-hr period.">
                    ⓘ
                  </span>
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Updated on {updatedAt}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a 
                href={`https://business.facebook.com/latest/whatsapp_manager/messaging_limits?business_id=${wabaId}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:bg-accent border border-border px-3.5 py-1.5 rounded-xl shrink-0 transition-colors"
              >
                View history
              </a>
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
          </div>

          {/* Meta WhatsApp Manager Official Scale Bar */}
          <div className="relative rounded-2xl bg-muted/20 border border-border/60 p-4 sm:p-8 overflow-x-auto">
            <div className="min-w-[680px]">
              {/* Dynamic Segmented Columns matching Meta WhatsApp Manager */}
              <div className="grid grid-cols-5 gap-0 items-center border border-border/70 rounded-xl bg-card overflow-hidden">
                {tierList.map((tier, idx) => {
                  const isCurrent = idx === currentTierIndex;
                  const isCompleted = idx < currentTierIndex;
                  const isNext = idx === currentTierIndex + 1;

                  if (isCurrent) {
                    return (
                      <div
                        key={tier.label}
                        className="py-6 px-3 text-center border-r last:border-r-0 border-border/60 bg-emerald-500/5 relative flex flex-col items-center justify-center"
                      >
                        <div className="w-full rounded-xl bg-card border-2 border-emerald-500/50 shadow-md p-4 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 mb-2">
                            Current
                          </span>
                          <div className="text-2xl font-black text-foreground tracking-tight">
                            {tier.label}
                          </div>
                          <p className="text-[11px] font-medium text-muted-foreground leading-tight mt-1.5">
                            {tier.description || "Business-initiated conversations in a rolling 24-hour period"}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={tier.label}
                      className="py-12 px-4 text-center border-r last:border-r-0 border-border/60 flex flex-col items-center justify-center"
                    >
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                          <CheckCircle2 className="h-3 w-3" /> Done
                        </span>
                      )}
                      {isNext && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 mb-1">
                          <Sparkles className="h-3 w-3" /> Next Goal
                        </span>
                      )}
                      <span className={`text-sm font-bold ${isCompleted ? "text-foreground/80" : "text-muted-foreground"}`}>
                        {tier.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground/75 mt-1">
                        {idx === 0 ? "Unverified Tier" : idx === 1 ? "Verified Tier" : idx === 2 ? "Growth Tier" : idx === 3 ? "Scale Tier" : "Enterprise"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Increase Your Messaging Limit: Dynamic Meta Manager Layout */}
          <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6 space-y-4">
            <div>
              <h4 className="text-sm sm:text-base font-bold text-foreground">
                {currentTierIndex === 0
                  ? "Increase your messaging limit to 2,000 / day"
                  : `Increase your messaging limit to ${typeof messagingLimit?.upgrade_requirements?.next_tier === "number" ? messagingLimit.upgrade_requirements.next_tier.toLocaleString() : "Next Tier"}`}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {messagingLimit?.upgrade_requirements?.upgrade_sla ||
                  "Once you meet all requirements, your messaging limit increases automatically within 24 hours."}
              </p>
            </div>

            {/* Requirement Row: Before KYC (Tier 0) vs After KYC (Tier 1+) */}
            {currentTierIndex === 0 ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center mt-0.5 shrink-0">
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </div>
                  <div className="space-y-1.5 w-full">
                    <div className="text-xs sm:text-sm font-bold text-foreground">
                      Requirement: Submit Business Verification (KYC)
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your connected WhatsApp Business Account is in Meta&apos;s unverified tier with a limit of <strong>250 conversations / 24-hr</strong>. Complete business verification by submitting your official documents (GST Certificate, MSME Udyam, Trade License, or Certificate of Incorporation) to instantly unlock <strong>2,000 conversations/day</strong>.
                    </p>
                    <div className="pt-2 flex flex-wrap items-center gap-2.5">
                      <Button
                        onClick={() => setShowKycModal(true)}
                        className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                      >
                        <FileCheck className="mr-1.5 h-3.5 w-3.5" />
                        Upload KYC Documents Now
                      </Button>
                      <a
                        href="https://business.facebook.com/settings/security"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
                      >
                        Meta Security Center
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border/80 p-4 bg-muted/20 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground mt-0.5 shrink-0" />
                  <div className="space-y-1 w-full">
                    <div className="text-xs sm:text-sm font-semibold text-foreground">
                      {messagingLimit?.upgrade_requirements?.description ||
                        `Start high quality business-initiated conversations with ${(target7dConvs).toLocaleString()} unique customers in a rolling 7-day period`}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      You started <strong className="text-foreground font-semibold">{current7dConvs}</strong> conversations with unique customers in the last 7 days.
                    </p>

                    {/* Visual Progress Bar */}
                    <div className="mt-2.5 max-w-md space-y-1">
                      <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                        <span>Live 7-Day Progress: {current7dConvs} / {target7dConvs} unique customers</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{progressPercent}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-1.5">
                      <a
                        href="https://developers.facebook.com/docs/whatsapp/messaging-limits#quality-rating"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                      >
                        What are high quality messages
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Business KYC Document Verification Banner */}
          <div className="rounded-2xl border border-blue-500/25 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
                  <Building2 className="h-4 w-4" />
                </span>
                <h4 className="text-sm font-bold text-foreground">
                  In-Platform Business KYC & Verification Documents
                </h4>
                {isKycVerified ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Meta Verified
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Pending Verification
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                Meta requires official business documents (GST Certificate, MSME Udyam, Incorporation, or Trade License) for verified accounts. Submit or update your documents directly here to ensure uninterrupted high-tier delivery.
              </p>
            </div>
            <Button
              onClick={() => setShowKycModal(true)}
              className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-xs"
            >
              <FileCheck className="mr-1.5 h-3.5 w-3.5" />
              {isKycVerified ? "Manage KYC Documents" : "Upload KYC Documents"}
            </Button>
          </div>

          {/* How to Increase Limit: Step-by-Step */}
          <div className="p-5 rounded-2xl bg-muted/30 border border-border/80 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-500" />
              Meta Official Guidelines to Upgrade Your Limits
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 font-bold text-xs">
                  1
                </div>
                <div>
                  <h5 className="text-xs font-bold text-foreground">Submit Business KYC (250 → 1,000)</h5>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Upload official proof (GST, MSME, Trade License, or CIN) in our KYC portal or Meta Security Center to unlock Tier 1 instantly.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-xs">
                  2
                </div>
                <div>
                  <h5 className="text-xs font-bold text-foreground">Maintain GREEN Quality Rating</h5>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Send opt-in, highly targeted messages. Avoid bulk cold messaging to prevent recipient blocks and spam reports.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 font-bold text-xs">
                  3
                </div>
                <div>
                  <h5 className="text-xs font-bold text-foreground">Reach 50% Limit over 7 Days</h5>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    When you send at least 50% of your daily limit (e.g., 500+ on Tier 1) in a 7-day period with Green quality, Meta automatically doubles/scales your tier!
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

      {/* Business KYC Document Submission Modal */}
      <BusinessKYCModal
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        metaVerificationStatus={isKycVerified ? 'verified' : 'not_verified'}
        wabaId={wabaId}
        verifiedName={verifiedName}
        displayPhone={displayNumber}
        qualityRating={quality}
        onRefresh={onRefresh}
      />
    </div>
  );
}
