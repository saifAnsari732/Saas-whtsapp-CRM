"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Smartphone, QrCode, CheckCircle2, Cloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import gsap from "gsap";

export function ConnectWhatsappBanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance animation for the banner
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 30, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }
      );

      gsap.fromTo(
        ".banner-text",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, delay: 0.3, ease: "power2.out" }
      );
      
      gsap.fromTo(
        mockupRef.current,
        { opacity: 0, x: 40 },
        { opacity: 1, x: 0, duration: 0.8, delay: 0.4, ease: "power3.out" }
      );

      // Continuous Scanner Animation for QR in modal (runs when modal opens)
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Use a separate effect to trigger the scanner animation when the modal opens
  useEffect(() => {
    if (open) {
      const scannerCtx = gsap.context(() => {
        gsap.fromTo(
          ".scanner-line",
          { top: "0%" },
          { top: "100%", duration: 2, repeat: -1, yoyo: true, ease: "linear" }
        );
      });
      return () => scannerCtx.revert();
    }
  }, [open]);

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f172a] to-[var(--color-navy)] mb-8 shadow-2xl"
    >
      {/* Background Decor */}
      <div className="absolute top-0 right-0 h-[600px] w-[600px] -translate-y-1/2 translate-x-1/3 rounded-full bg-[var(--color-green-vivid)] opacity-20 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 h-[400px] w-[400px] translate-y-1/3 -translate-x-1/3 rounded-full bg-[var(--color-green-deep)] opacity-20 blur-[80px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between p-8 sm:p-12 gap-10">
        
        {/* Left Side: Text */}
        <div className="flex-1 max-w-xl">
          <p className="banner-text mb-3 text-xs font-bold tracking-widest text-[var(--color-green-vivid)] uppercase">
            Seamless Onboarding
          </p>
          <h2 className="banner-text text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl font-heading leading-tight mb-4">
            Connect in 1-Click. <br/>
            <span className="text-white/70">No Tech Skills Needed.</span>
          </h2>
          <p className="banner-text text-gray-300 text-lg mb-8 leading-relaxed">
            Link your existing WhatsApp Business app using our Fast Coexistence flow. 
            No complex APIs, no Facebook App IDs, and zero developer configurations required.
          </p>
          
          <ul className="banner-text space-y-4 mb-8">
            <li className="flex items-center text-gray-200">
              <CheckCircle2 className="mr-3 h-5 w-5 text-[var(--color-green-vivid)]" />
              Keep using your phone normally
            </li>
            <li className="flex items-center text-gray-200">
              <CheckCircle2 className="mr-3 h-5 w-5 text-[var(--color-green-vivid)]" />
              Instant setup via QR code
            </li>
            <li className="flex items-center text-gray-200">
              <CheckCircle2 className="mr-3 h-5 w-5 text-[var(--color-green-vivid)]" />
              Automate directly from the CRM
            </li>
          </ul>

          <div className="banner-text flex flex-wrap gap-4">
            <Dialog open={open} onOpenChange={setOpen}>
              <Button onClick={() => setOpen(true)} className="h-14 px-8 text-base font-bold bg-[var(--color-green-vivid)] hover:bg-[var(--color-green-vivid)]/90 text-navy rounded-xl shadow-lg hover:-translate-y-1 transition-all">
                Start Fast Coexistence <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <DialogContent className="sm:max-w-md md:max-w-2xl bg-card border-border/50 p-0 overflow-hidden rounded-2xl">
                <div className="grid md:grid-cols-2">
                  {/* Modal Left: Instructions */}
                  <div className="p-8 bg-muted/30">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold">Link Device</DialogTitle>
                      <DialogDescription className="text-sm mt-2">
                        Scan this QR code to connect your WhatsApp Business app instantly.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-8 space-y-6">
                      <div className="flex gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-600 font-bold">1</div>
                        <p className="text-sm font-medium text-foreground mt-1">Open WhatsApp on your phone</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-600 font-bold">2</div>
                        <p className="text-sm font-medium text-foreground mt-1">Go to <strong>Settings</strong> &gt; <strong>Linked Devices</strong></p>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-600 font-bold">3</div>
                        <p className="text-sm font-medium text-foreground mt-1">Point your phone to capture the code</p>
                      </div>
                    </div>
                  </div>
                  {/* Modal Right: QR Code Mockup */}
                  <div className="p-8 bg-gradient-to-br from-card to-muted/20 flex flex-col items-center justify-center relative">
                    <div className="absolute inset-0 bg-[var(--color-green-vivid)]/5" />
                    <div className="relative mb-6 flex aspect-square w-56 items-center justify-center rounded-3xl bg-white p-4 shadow-xl border border-border">
                      <div className="relative h-full w-full rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200">
                        <QrCode className="h-28 w-28 text-gray-300" />
                        {/* Scanner Line */}
                        <div className="scanner-line absolute left-0 h-1 w-full bg-[#25D366] shadow-[0_0_20px_#25D366]" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground relative z-10">
                      <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                      Waiting for connection...
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Link href="/settings?tab=whatsapp" className="block w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-14 px-8 text-base font-bold bg-[#1877F2] hover:bg-[#1877F2]/90 text-white rounded-xl hover:-translate-y-1 transition-all shadow-lg shadow-blue-500/20">
                <svg viewBox="0 0 24 24" className="mr-2 h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Connect Facebook (Cloud API)
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Side: Visual Mockup */}
        <div ref={mockupRef} className="hidden lg:block w-full max-w-sm">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#25D366] to-[#128C7E] shadow-lg">
                <Smartphone className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Device Status</h3>
              <p className="mt-1 text-xs text-gray-400">Ready to pair</p>
            </div>
            
            <div className="space-y-4">
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full w-1/3 rounded-full bg-[var(--color-green-vivid)] animate-pulse" />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Waiting for QR Scan...</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
