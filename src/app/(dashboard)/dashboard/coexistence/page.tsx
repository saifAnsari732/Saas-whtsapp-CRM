"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, QrCode, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import gsap from "gsap";

export default function CoexistenceSetupPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  // QR State
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("disconnected");

  useEffect(() => {
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
    return () => ctx.revert();
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
      // Start polling regardless, as QR might take a few more seconds to generate on the backend
      startPolling();
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

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
    <div ref={containerRef} className="mx-auto max-w-4xl space-y-8 p-4">
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Link Your Device (Fast Coexistence)
        </h1>
        <p className="mt-3 text-base text-muted-foreground max-w-2xl">
          Keep using your standard WhatsApp app while syncing messages to the CRM.
        </p>
      </div>

      <div className="stagger-el grid gap-8 md:grid-cols-2">
        {/* Left Side: Instructions */}
        <div className="flex flex-col justify-center rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h3 className="mb-6 text-xl font-bold text-foreground">How to connect:</h3>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-600 font-bold">1</div>
              <div>
                <p className="font-semibold text-foreground">Open WhatsApp on your phone</p>
                <p className="text-sm text-muted-foreground mt-1">Ensure you have the latest version installed.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-600 font-bold">2</div>
              <div>
                <p className="font-semibold text-foreground">Tap Menu or Settings</p>
                <p className="text-sm text-muted-foreground mt-1">Select <strong>Linked Devices</strong> and tap <strong>Link a Device</strong>.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-600 font-bold">3</div>
              <div>
                <p className="font-semibold text-foreground">Point your phone to this screen</p>
                <p className="text-sm text-muted-foreground mt-1">Capture the real QR code to log in.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-border">
            <Button onClick={generateQR} disabled={loading} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate New QR Code"}
            </Button>
          </div>
        </div>

        {/* Right Side: QR Code Area */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 shadow-sm relative overflow-hidden min-h-[400px]">
          <div className="absolute top-0 right-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-green-500/10 blur-[80px]" />
          
          <div className="relative mb-6 flex aspect-square w-64 items-center justify-center rounded-3xl bg-white p-4 shadow-xl border border-gray-100">
            <div className="relative h-full w-full rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200">
              {status === "connected" ? (
                <div className="text-center text-green-600 font-bold">
                  <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  Connected!
                </div>
              ) : qrCodeBase64 ? (
                <>
                  <img src={qrCodeBase64} alt="QR Code" className="h-full w-full object-contain mix-blend-multiply p-2" />
                  {status === "waiting_scan" && (
                    <div className="scanner-line absolute left-0 h-1 w-full bg-[#25D366] shadow-[0_0_20px_#25D366]" />
                  )}
                </>
              ) : (
                <QrCode className="h-20 w-20 text-gray-300" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
            {status === "waiting_scan" && <Loader2 className="h-4 w-4 animate-spin text-green-500" />}
            
            {status === "disconnected" && "Click Generate to start."}
            {status === "generating" && "Generating QR Code..."}
            {status === "waiting_scan" && "Waiting for you to scan..."}
            {status === "connected" && "Device successfully linked!"}
            {status === "error" && "Connection failed."}
          </div>
        </div>
      </div>
    </div>
  );
}
