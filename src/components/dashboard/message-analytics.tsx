"use client";

import { Check, CheckCircle2, Clock, XCircle, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface AnalyticsProps {
  stats?: {
    delivered: number;
    seen: number;
    failed: number;
    pending: number;
  };
}

export function MessageAnalytics({
  stats = { delivered: 1420, seen: 1250, failed: 12, pending: 45 }
}: AnalyticsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [deviceStatus, setDeviceStatus] = useState<"checking" | "connected" | "disconnected">("checking");
  const [deviceUser, setDeviceUser] = useState<{ id?: string; name?: string } | null>(null);

  useEffect(() => {
    // Check real native socket connection status
    fetch("/api/whatsapp/coexistence/status", { method: "POST" })
      .then(res => res.json())
      .then(data => {
        if (data.state === "open") {
          setDeviceStatus("connected");
          if (data.user) setDeviceUser(data.user);
        } else {
          setDeviceStatus("disconnected");
        }
      })
      .catch(() => setDeviceStatus("disconnected"));

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".stat-card",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Messaging Analytics</h2>
        <div className="flex items-center gap-3">
          {deviceUser && (
            <div className="text-xs text-muted-foreground flex items-center gap-2 border-r pr-3">
              <span className="font-semibold text-foreground">{deviceUser.name || "WhatsApp User"}</span>
              <span>{deviceUser.id?.split(':')[0]}</span>
            </div>
          )}
          {deviceStatus === "checking" && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-500/10 text-gray-600 border border-gray-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-pulse"></span>
              Checking Status...
            </span>
          )}
          {deviceStatus === "connected" && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 border border-green-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Device Connected
            </span>
          )}
          {deviceStatus === "disconnected" && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 border border-red-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              Device Disconnected
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Seen / Read */}
        <div className="stat-card relative overflow-hidden rounded-2xl border border-[#3b82f6]/20 bg-gradient-to-br from-[#3b82f6]/5 to-transparent p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Read (Seen)</p>
              <h3 className="text-3xl font-bold text-foreground mt-1">{stats.seen.toLocaleString()}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3b82f6]/10 text-[#3b82f6]">
              <div className="relative flex">
                <Check className="h-5 w-5 absolute -left-1.5" />
                <Check className="h-5 w-5" />
              </div>
            </div>
          </div>
          <p className="text-xs text-[#3b82f6] font-medium mt-4">+12% from last week</p>
          <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-[#3b82f6]/10 blur-2xl pointer-events-none"></div>
        </div>

        {/* Delivered */}
        <div className="stat-card relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Delivered</p>
              <h3 className="text-3xl font-bold text-foreground mt-1">{stats.delivered.toLocaleString()}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-green-600 font-medium mt-4">+5% from last week</p>
          <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-green-500/10 blur-2xl pointer-events-none"></div>
        </div>

        {/* Pending */}
        <div className="stat-card relative overflow-hidden rounded-2xl border border-gray-500/20 bg-gradient-to-br from-gray-500/5 to-transparent p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending / Queued</p>
              <h3 className="text-3xl font-bold text-foreground mt-1">{stats.pending.toLocaleString()}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-500/10 text-gray-500">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-medium mt-4">Currently processing</p>
          <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-gray-500/10 blur-2xl pointer-events-none"></div>
        </div>

        {/* Failed */}
        <div className="stat-card relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Failed</p>
              <h3 className="text-3xl font-bold text-foreground mt-1">{stats.failed.toLocaleString()}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-red-500 font-medium mt-4">Check logs for details</p>
          <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-red-500/10 blur-2xl pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
}
