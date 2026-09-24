"use client";

import { useState, useEffect } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { X, Clock, AlertTriangle, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function TrialBanner() {
  const { status, trialEndsAt, daysRemaining, loading } = useSubscription();
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
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
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [trialEndsAt, status]);

  if (loading || dismissed || (status !== 'trial' && status !== 'expired')) {
    return null;
  }

  // If on the billing page, don't display banner
  if (pathname.startsWith('/billing')) {
    return null;
  }

  // Expired banner
  if (status === 'expired' || daysRemaining === 0) {
    return (
      <div className="flex items-center justify-between bg-red-600 px-4 py-3 text-white shadow-md z-40 border-b border-red-700">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
            <AlertTriangle className="h-4 w-4 text-white animate-bounce" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight">
              Trial Expired: All Actions Are Blocked
            </p>
            <p className="text-xs text-red-100 hidden sm:block">
              Your 5-day free trial period has ended. Please upgrade your plan to unlock messaging, broadcasts & automations.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/billing"
            className="inline-flex h-8 items-center justify-center rounded-md bg-white px-4 text-xs font-bold text-red-700 shadow-sm hover:bg-red-50 transition-colors"
          >
            Upgrade Plan Now
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

  // Active Trial Banner in RED UI with exact countdown timer
  return (
    <div className="flex items-center justify-between bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-4 py-2.5 text-white shadow-md z-40 border-b border-red-700/80">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
          <Clock className="h-4 w-4 text-white animate-spin" style={{ animationDuration: '4s' }} />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
          <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-white">
            5-Day Free Trial
          </span>
          <p className="text-sm font-semibold flex items-center gap-1.5">
            <span>Trial Expires In:</span>
            {timeLeft ? (
              <span className="font-mono font-bold bg-black/30 px-2 py-0.5 rounded text-yellow-300 text-xs sm:text-sm">
                {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
              </span>
            ) : (
              <span className="font-bold text-yellow-300">{daysRemaining} Days</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/billing"
          className="inline-flex h-8 items-center justify-center rounded-md bg-white px-3.5 text-xs font-extrabold text-red-700 shadow-sm hover:bg-red-50 transition-all hover:scale-105"
        >
          Upgrade Now →
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
