"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, QrCode, Smartphone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import gsap from "gsap";

export default function CoexistenceSetupPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance staggered animation
      gsap.fromTo(
        ".stagger-el",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }
      );

      // Scanner line animation
      gsap.fromTo(
        ".scanner-line",
        { top: "0%" },
        { top: "100%", duration: 2, repeat: -1, yoyo: true, ease: "linear" }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="mx-auto max-w-4xl space-y-8 p-4">
      {/* Back Button */}
      <div className="stagger-el">
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
          Keep using your standard WhatsApp Business app on your phone while syncing messages to the CRM. 
          Scan the code below to connect instantly.
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
                <p className="text-sm text-muted-foreground mt-1">Make sure you have the latest version of WhatsApp Business installed.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-600 font-bold">2</div>
              <div>
                <p className="font-semibold text-foreground">Tap Menu <span className="text-muted-foreground text-xs">(Android)</span> or Settings <span className="text-muted-foreground text-xs">(iOS)</span></p>
                <p className="text-sm text-muted-foreground mt-1">Select <strong>Linked Devices</strong> and then tap <strong>Link a Device</strong>.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-600 font-bold">3</div>
              <div>
                <p className="font-semibold text-foreground">Point your phone to this screen</p>
                <p className="text-sm text-muted-foreground mt-1">Capture the QR code to log in and sync your chats.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 rounded-xl bg-blue-500/10 p-4 border border-blue-500/20">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              Note: This is a frontend demo UI for the Fast Coexistence flow. 
              The backend logic for Web/QR pairing will be integrated in a future update.
            </p>
          </div>
        </div>

        {/* Right Side: QR Code Mockup */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-green-500/10 blur-[80px]" />
          
          <div className="relative mb-6 flex aspect-square w-64 items-center justify-center rounded-3xl bg-white p-4 shadow-xl border border-gray-100">
            <div className="relative h-full w-full rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200">
              <QrCode className="h-32 w-32 text-gray-300" />
              {/* Scanner Line Animation */}
              <div className="scanner-line absolute left-0 h-1 w-full bg-[#25D366] shadow-[0_0_20px_#25D366]" />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-green-500" />
            Waiting for connection...
          </div>
        </div>
      </div>
    </div>
  );
}
