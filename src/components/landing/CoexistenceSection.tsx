"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, QrCode, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function CoexistenceSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftContentRef = useRef<HTMLDivElement>(null);
  const rightMockupRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Reveal Animation
      gsap.fromTo(
        leftContentRef.current?.children || [],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
          },
        }
      );

      gsap.fromTo(
        rightMockupRef.current,
        { opacity: 0, x: 50, scale: 0.95 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
          },
        }
      );

      // Continuous Scanner Animation for QR
      gsap.fromTo(
        ".scanner-line",
        { top: "0%" },
        {
          top: "100%",
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: "linear",
        }
      );

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef} 
      className="relative overflow-hidden py-24 lg:py-32 bg-gradient-to-br from-[#0f172a] to-[var(--color-navy)] text-white"
    >
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 h-[800px] w-[800px] -translate-y-1/3 translate-x-1/3 rounded-full bg-[var(--color-green-vivid)] opacity-20 blur-[120px]"></div>
      <div className="absolute bottom-0 left-0 h-[600px] w-[600px] translate-y-1/3 -translate-x-1/3 rounded-full bg-[var(--color-green-deep)] opacity-20 blur-[100px]"></div>

      <div className="container relative z-10 mx-auto px-4 md:px-8 max-w-screen-2xl">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-12 items-center">
          
          {/* Left Content */}
          <div ref={leftContentRef} className="flex flex-col items-start max-w-xl">
            <p className="mb-3 text-sm font-bold tracking-widest text-[var(--color-green-vivid)] uppercase">
              Seamless Onboarding
            </p>
            <h2 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-[54px] font-heading">
              Fast Coexistence.
              <br />
              <span className="text-white/70">No API Skills Needed.</span>
            </h2>
            <p className="mb-8 text-lg text-gray-300 leading-relaxed">
              Keep using your standard WhatsApp Business App on your phone while our CRM supercharges it in the background. Scan and go—no complex developer setups required.
            </p>

            <ul className="mb-10 space-y-4">
              {[
                "Instant setup by scanning a simple QR code",
                "Keep using your phone's WA Business App normally",
                "Perfect for small and growing teams",
                "Zero developer involvement required",
              ].map((item, i) => (
                <li key={i} className="flex items-center text-gray-200">
                  <CheckCircle2 className="mr-3 h-5 w-5 text-[var(--color-green-vivid)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link href="/signup">
              <Button className="h-14 px-8 text-base font-bold bg-[var(--color-green-vivid)] hover:bg-[var(--color-green-vivid)]/90 text-navy rounded-xl shadow-lg hover:-translate-y-1 transition-all">
                Try Fast Coexistence <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Right Mockup */}
          <div ref={rightMockupRef} className="relative mx-auto w-full max-w-md lg:ml-auto">
            {/* The Floating UI Card */}
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl">
              
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#25D366] to-[#128C7E] shadow-lg">
                  <Smartphone className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Link Device</h3>
                <p className="mt-2 text-sm text-gray-400">Open WhatsApp on your phone to scan this code.</p>
              </div>

              {/* QR Code Mockup */}
              <div className="relative mx-auto mb-8 flex aspect-square w-48 items-center justify-center rounded-2xl bg-white p-4">
                <div ref={qrRef} className="relative h-full w-full rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                  <QrCode className="h-20 w-20 text-gray-400" />
                  {/* Scanner Line Animation */}
                  <div className="scanner-line absolute left-0 h-1 w-full bg-[var(--color-green-vivid)] shadow-[0_0_15px_var(--color-green-vivid)]"></div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-xl bg-white/5 p-4 border border-white/5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-green-vivid)]/20 text-[var(--color-green-vivid)] font-bold text-sm">1</div>
                  <p className="text-xs text-gray-300">Tap <strong>Linked Devices</strong> in WhatsApp settings</p>
                </div>
                <div className="flex items-center gap-4 rounded-xl bg-white/5 p-4 border border-white/5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-green-vivid)]/20 text-[var(--color-green-vivid)] font-bold text-sm">2</div>
                  <p className="text-xs text-gray-300">Point your phone to this screen to capture the code</p>
                </div>
              </div>

            </div>

            {/* Decorative dots */}
            <div className="absolute -right-8 -top-8 -z-10 h-32 w-32 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="absolute -bottom-8 -left-8 -z-10 h-32 w-32 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px]"></div>
          </div>

        </div>
      </div>
    </section>
  );
}
