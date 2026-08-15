'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Smartphone, Cloud, Zap, ShieldCheck } from 'lucide-react'
import gsap from 'gsap'

export function ConnectWhatsappBanner() {
  const containerRef = useRef<HTMLDivElement>(null)
  const leftCardRef = useRef<HTMLDivElement>(null)
  const rightCardRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance animation
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      )

      gsap.fromTo(
        [leftCardRef.current, rightCardRef.current],
        { opacity: 0, y: 40, scale: 0.95 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.8, 
          stagger: 0.15, 
          ease: 'back.out(1.2)', 
          delay: 0.2 
        }
      )

      gsap.fromTo(
        badgeRef.current,
        { opacity: 0, scale: 0 },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)', delay: 0.6 }
      )
      
      // Floating animation for the background elements
      gsap.to('.float-el', {
        y: 'random(-15, 15)',
        x: 'random(-15, 15)',
        rotation: 'random(-5, 5)',
        duration: 'random(3, 5)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.2
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden rounded-3xl border border-border/50 bg-card p-1 shadow-sm mb-8"
    >
      {/* Background Gradients & Floating Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-blue-500/5 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-blue-500/10" />
      <div className="float-el absolute -top-24 -left-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="float-el absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="float-el absolute top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-2xl" />

      <div className="relative z-10 flex flex-col gap-6 rounded-2xl bg-background/40 p-6 backdrop-blur-xl sm:p-8 lg:p-10">
        
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-4">
          <div 
            ref={badgeRef}
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 mb-4 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            <span>Setup Required</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Connect Your WhatsApp
          </h2>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Choose how you want to connect your business to our CRM. Both methods take just a few minutes to complete.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          
          {/* Card 1: Fast Coexistence */}
          <div 
            ref={leftCardRef}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/50 p-6 transition-all duration-300 hover:border-green-500/30 hover:shadow-[0_8px_30px_rgba(34,197,94,0.12)] hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-green-500/10 blur-2xl transition-all duration-500 group-hover:bg-green-500/20" />
            
            <div className="relative z-10">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] shadow-lg shadow-green-500/20">
                <Smartphone className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Fast Coexistence</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Connect your existing WhatsApp Business app quickly. Perfect for small teams who want to keep using the mobile app alongside the CRM.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center text-xs text-muted-foreground">
                  <ShieldCheck className="mr-2 h-4 w-4 text-green-500" /> Use standard WA Business App
                </li>
                <li className="flex items-center text-xs text-muted-foreground">
                  <ShieldCheck className="mr-2 h-4 w-4 text-green-500" /> Easy QR/Phone setup
                </li>
              </ul>
            </div>
            
            <div className="relative z-10 mt-8">
              <Link href="/dashboard/coexistence" className="block">
                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500/10 py-3.5 text-sm font-semibold text-green-600 transition-all hover:bg-green-500 hover:text-white dark:text-green-400 dark:hover:text-white">
                  <span>Start Fast Setup</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
            </div>
          </div>

          {/* Card 2: Cloud API (Embedded Signup) */}
          <div 
            ref={rightCardRef}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/50 p-6 transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_8px_30px_rgba(59,130,246,0.12)] hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-blue-500/10 blur-2xl transition-all duration-500 group-hover:bg-blue-500/20" />
            
            <div className="relative z-10">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#1877F2] to-[#0A58CA] shadow-lg shadow-blue-500/20">
                <Cloud className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Cloud API Integration</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Connect directly via Meta's Official Cloud API. Best for high-volume messaging, advanced automations, and official business verification.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center text-xs text-muted-foreground">
                  <ShieldCheck className="mr-2 h-4 w-4 text-blue-500" /> Embedded Meta Signup
                </li>
                <li className="flex items-center text-xs text-muted-foreground">
                  <ShieldCheck className="mr-2 h-4 w-4 text-blue-500" /> Full API capabilities
                </li>
              </ul>
            </div>
            
            <div className="relative z-10 mt-8">
              <Link href="/settings?tab=whatsapp" className="block">
                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500/10 py-3.5 text-sm font-semibold text-blue-600 transition-all hover:bg-blue-500 hover:text-white dark:text-blue-400 dark:hover:text-white">
                  <span>Connect via Facebook</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
