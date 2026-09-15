"use client";

import { useState, useEffect } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { X, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function TrialBanner() {
  const { status, daysRemaining, loading } = useSubscription();
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  // Reset dismissed state on route change (could also use localStorage if we want it truly dismissed)
  useEffect(() => {
    setDismissed(false);
  }, [pathname]);

  if (loading || dismissed || (status !== 'trial' && status !== 'expired')) {
    return null;
  }

  // If we are on the billing page, don't show the banner
  if (pathname.startsWith('/billing')) {
    return null;
  }

  if (status === 'expired' || daysRemaining === 0) {
    return (
      <div className="flex items-center justify-between bg-destructive px-4 py-3 text-destructive-foreground">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm font-medium">
            Your trial has expired. Purchase a plan to continue.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/billing"
            className="inline-flex h-8 items-center justify-center rounded-md bg-secondary px-3 text-xs font-medium text-secondary-foreground shadow-sm hover:bg-secondary/80"
          >
            View Plans
          </Link>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-destructive-foreground hover:bg-destructive-foreground/20 hover:text-destructive-foreground" 
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5" />
        <p className="text-sm font-medium">
          {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining in your free trial.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/billing"
          className="inline-flex h-8 items-center justify-center rounded-md bg-white px-3 text-xs font-medium text-blue-700 shadow-sm hover:bg-blue-50"
        >
          Upgrade Now
        </Link>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8 text-white hover:bg-white/20 hover:text-white" 
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
