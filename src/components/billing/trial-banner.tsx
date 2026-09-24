"use client";

import { useState, useEffect } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { X, Clock, AlertTriangle, ShieldAlert, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function TrialBanner() {
  const { isSuperAdmin } = useAuth();
  const { status, trialEndsAt, daysRemaining, loading } = useSubscription();
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const pathname = usePathname();

  // Reset dismissed state on route change
  useEffect(() => {
    setDismissed(false);
  }, [pathname]);

  // Live countdown timer for the trial period
  useEffect(() => {
    if (!trialEndsAt || status !== 'trial') return;

    const calculateTimeLeft = () => {
      const difference = new Date(trialEndsAt).getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [trialEndsAt, status]);

  if (loading || dismissed || isSuperAdmin || (status !== 'trial' && status !== 'expired')) {
    return null;
  }

  // If on the billing page, don't display banner
  if (pathname.startsWith('/billing')) {
    return null;
  }

  // Expired banner
  if (status === 'expired') {
    return (
      <div className="flex items-center justify-between bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-4 py-2.5 text-white shadow-md z-40 border-b border-red-700">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 shadow-inner">
            <AlertTriangle className="h-4 w-4 text-white animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded text-white">
                Access Blocked
              </span>
              <p className="text-sm font-bold tracking-tight">
                Trial Expired: All Actions Are Blocked
              </p>
            </div>
            <p className="text-xs text-red-100 hidden sm:block mt-0.5">
              Your 5-day free trial period has ended. Please upgrade your plan to unlock messaging, broadcasts & automations.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/billing"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-white px-4 text-xs font-bold text-red-700 shadow-sm hover:bg-red-50 transition-transform active:scale-95"
          >
            <span>Upgrade Plan Now</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-white hover:bg-white/20" 
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Active 5-Day Trial Banner in Sleek RED UI with Countdown Blocks
  return (
    <div className="flex items-center justify-between bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-4 py-2 text-white shadow-md z-40 border-b border-red-700/80">
      <div className="flex items-center gap-3">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/20 shadow-inner">
          <Clock className="h-4 w-4 text-white animate-spin" style={{ animationDuration: '6s' }} />
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400"></span>
          </span>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
          <span className="text-[11px] font-extrabold uppercase tracking-wider bg-black/25 px-2.5 py-0.5 rounded text-white border border-white/10 shadow-xs">
            5-Day Free Trial
          </span>
          
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <span className="text-white/90 font-medium hidden md:inline">Time Remaining:</span>
            
            {timeLeft ? (
              <div className="flex items-center gap-1 font-mono text-xs font-bold text-white">
                <div className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded border border-white/10 shadow-inner">
                  <span className="text-yellow-300 text-sm font-black">{timeLeft.days}</span>
                  <span className="text-[10px] text-white/70">d</span>
                </div>
                <span className="text-white/40">:</span>
                <div className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded border border-white/10 shadow-inner">
                  <span className="text-yellow-300 text-sm font-black">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="text-[10px] text-white/70">h</span>
                </div>
                <span className="text-white/40">:</span>
                <div className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded border border-white/10 shadow-inner">
                  <span className="text-yellow-300 text-sm font-black">{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="text-[10px] text-white/70">m</span>
                </div>
                <span className="text-white/40">:</span>
                <div className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded border border-white/10 shadow-inner">
                  <span className="text-yellow-300 text-sm font-black">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="text-[10px] text-white/70">s</span>
                </div>
              </div>
            ) : (
              <span className="font-bold text-yellow-300">{daysRemaining} Days Left</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-shrink-0">
        <Link
          href="/billing"
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-white px-3.5 text-xs font-extrabold text-red-700 shadow-sm hover:bg-yellow-50 transition-all active:scale-95"
        >
          <span>Upgrade Plan</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20" 
          onClick={() => setDismissed(true)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
