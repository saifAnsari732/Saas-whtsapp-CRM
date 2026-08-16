"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, QrCode, Loader2, CheckCircle2, Smartphone, ShieldCheck, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import gsap from "gsap";

export default function CoexistenceSetupPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  // QR State
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("disconnected");

  useEffect(() => {
    let cleanupPolling: (() => void) | undefined;

    // Check initial status to see if we are already connected
    fetch("/api/whatsapp/coexistence/status", { method: "POST" })
      .then(res => res.json())
      .then(data => {
        if (data.state === "open" || data.state === "connected") {
          setStatus("connected");
        } else if (data.state === "checking" || data.state === "generating" || data.state === "waiting_scan") {
          setStatus(data.state);
          if (data.qr) setQrCodeBase64(data.qr);
          cleanupPolling = startPolling();
        }
      })
      .catch(console.error);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".stagger-el",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }
      );
      gsap.fromTo(
        ".scanner-line",
        { top: "0%" },
        { top: "100%", duration: 2, repeat: -1, yoyo: true, ease: "linear" }
      );
    }, containerRef);
    
    return () => {
      ctx.revert();
      if (cleanupPolling) cleanupPolling();
    };
  }, []);

  const generateQR = async () => {
    setLoading(true);
    setStatus("generating");

    try {
      const res = await fetch("/api/whatsapp/coexistence/create-instance", { method: "POST" });
      const data = await res.json();
      
      if (data.data?.qrcode?.base64) {
        setQrCodeBase64(data.data.qrcode.base64);
        setStatus("waiting_scan");
      }
      startPolling();
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const disconnectDevice = () => {
    // Mock disconnect logic for UI
    setStatus("disconnected");
    setQrCodeBase64(null);
  }

  const startPolling = () => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/whatsapp/coexistence/status", { method: "POST" });
        const data = await res.json();
        
        if (data.qr && data.state !== "open") {
          setQrCodeBase64(data.qr);
          setStatus("waiting_scan");
        }
        
        if (data.state === "open") {
          setStatus("connected");
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 3000);
    return () => clearInterval(interval);
  };

  return (
    <div ref={containerRef} className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="stagger-el flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="stagger-el flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-green-vivid)]/10 text-[var(--color-green-deep)]">
          <Smartphone className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Fast Coexistence
        </h1>
        <p className="mt-3 text-base text-muted-foreground max-w-2xl">
          Connect your device directly to the CRM to automate messaging while continuing to use your phone normally.
        </p>
      </div>

      <div className="stagger-el grid gap-8 lg:grid-cols-2 mt-8">
        {/* Left Side: Features / Instructions */}
        <div className="flex flex-col justify-center rounded-3xl border border-border bg-card/50 backdrop-blur-sm p-8 shadow-sm">
          <h3 className="mb-6 text-xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[var(--color-green-vivid)]" />
            Simple 3-Step Setup
          </h3>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-green-vivid)]/10 text-[var(--color-green-deep)] font-bold text-lg shadow-sm border border-[var(--color-green-vivid)]/20">1</div>
              <div>
                <p className="font-bold text-foreground text-base">Open WhatsApp on your phone</p>
                <p className="text-sm text-muted-foreground mt-1">Navigate to your standard WhatsApp application.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-green-vivid)]/10 text-[var(--color-green-deep)] font-bold text-lg shadow-sm border border-[var(--color-green-vivid)]/20">2</div>
              <div>
                <p className="font-bold text-foreground text-base">Tap Linked Devices</p>
                <p className="text-sm text-muted-foreground mt-1">Open the menu and select "Linked Devices", then "Link a Device".</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-green-vivid)]/10 text-[var(--color-green-deep)] font-bold text-lg shadow-sm border border-[var(--color-green-vivid)]/20">3</div>
              <div>
                <p className="font-bold text-foreground text-base">Point your phone to this screen</p>
                <p className="text-sm text-muted-foreground mt-1">Scan the QR code to instantly connect the CRM.</p>
              </div>
            </div>
          </div>
          
          {status !== "connected" && (
            <div className="mt-10">
              <Button onClick={generateQR} disabled={loading} className="w-full h-12 text-base font-bold bg-[var(--color-green-deep)] hover:bg-[var(--color-green-deep)]/90 text-white rounded-xl shadow-lg shadow-green-900/20 transition-all hover:-translate-y-1">
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <QrCode className="mr-2 h-5 w-5" />}
                {loading ? "Generating Connection..." : "Generate New QR Code"}
              </Button>
            </div>
          )}
        </div>

        {/* Right Side: Scanner / Status Area */}
        <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-gradient-to-br from-card to-card/50 p-8 shadow-sm relative overflow-hidden min-h-[450px]">
          {/* Dynamic Background Glow */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full blur-[100px] transition-colors duration-1000 -z-10 ${status === 'connected' ? 'bg-green-500/20' : 'bg-blue-500/10'}`} />
          
          <div className="relative mb-8 flex aspect-square w-72 items-center justify-center rounded-[2.5rem] bg-white p-6 shadow-2xl border border-gray-100 ring-4 ring-black/5">
            <div className="relative h-full w-full rounded-3xl bg-gray-50 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200">
              {status === "connected" ? (
                <div className="text-center text-green-600 font-bold flex flex-col items-center">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 shadow-inner">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <span className="text-xl text-[var(--color-navy)]">Device Connected</span>
                  <span className="text-sm font-medium text-green-500 mt-1">Syncing Active</span>
                </div>
              ) : qrCodeBase64 ? (
                <>
                  <img src={qrCodeBase64} alt="QR Code" className="h-full w-full object-contain mix-blend-multiply p-1" />
                  {status === "waiting_scan" && (
                    <div className="scanner-line absolute left-0 h-1.5 w-full bg-[#25D366] shadow-[0_0_30px_#25D366]" />
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center opacity-40">
                  <QrCode className="h-20 w-20 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-500">Awaiting Generation</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm font-semibold text-[var(--color-navy)] bg-white/50 px-5 py-2.5 rounded-full border border-border shadow-sm backdrop-blur-md">
            {(loading || status === "checking") && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
            {status === "waiting_scan" && <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>}
            
            {status === "disconnected" && "Ready to Connect"}
            {status === "checking" && "Reconnecting to device..."}
            {status === "generating" && "Generating Secure QR Code..."}
            {status === "waiting_scan" && "Waiting for your phone to scan..."}
            {status === "connected" && "Ready to automate messages!"}
            {status === "error" && <span className="text-red-500">Connection Failed</span>}
          </div>

          {status === "connected" && (
            <Button variant="outline" onClick={disconnectDevice} className="mt-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect Device
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
