import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Check, Clock, AlertTriangle, Lock, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SubscriptionDetailsProps {
  status: string;
  plan: string | null;
  daysRemaining: number;
  trialEndsAt: string | null;
  expiresAt: string | null;
  limits: { messages: number; contacts: number; users: number } | null;
}

export function SubscriptionDetails({
  status,
  plan,
  daysRemaining,
  trialEndsAt,
  expiresAt,
  limits,
}: SubscriptionDetailsProps) {
  const isActive = status === "active";
  const isTrial = status === "trial";
  const isExpired = status === "expired" || status === "blocked";

  const getStatusColor = () => {
    if (isTrial) return "bg-amber-500/10 text-amber-600 border-amber-500/30";
    if (isActive) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";
    return "bg-red-500/10 text-red-600 border-red-500/30";
  };

  const planDisplayName = isExpired
    ? "5-Day Free Trial (Expired)"
    : isTrial
    ? "5-Day Full Access Trial"
    : plan && plan !== "none"
    ? `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`
    : "No Active Plan";

  const formatLimit = (val: number) => {
    if (isExpired || val === 0) return "0 (Locked)";
    if (val === -1) return "Unlimited";
    return val.toLocaleString();
  };

  return (
    <Card className={cn(isExpired && "border-red-500/30")}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div className="space-y-1">
          <CardTitle>Subscription Plan</CardTitle>
          <CardDescription>Manage your current subscription and limits</CardDescription>
        </div>
        <Badge variant="outline" className={cn("capitalize px-3 py-1 text-xs font-bold", getStatusColor())}>
          {isExpired ? "Trial Expired — Locked" : isTrial ? "5-Day Free Trial" : "Active"}
        </Badge>
      </CardHeader>
      <CardContent className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <h3 className={cn("text-2xl font-bold", isExpired && "text-red-600 dark:text-red-400")}>
                {planDisplayName}
              </h3>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isTrial && <Clock className="h-4 w-4 text-amber-500 shrink-0" />}
              {isActive && <Calendar className="h-4 w-4 text-emerald-500 shrink-0" />}
              {isExpired && <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />}
              
              <span>
                {isTrial && trialEndsAt
                  ? `Trial ends in ${daysRemaining} days (${new Date(trialEndsAt).toLocaleDateString()})`
                  : isActive && expiresAt
                  ? `Renews on ${new Date(expiresAt).toLocaleDateString()}`
                  : isActive
                  ? "Active paid subscription"
                  : trialEndsAt
                  ? `Trial expired on ${new Date(trialEndsAt).toLocaleDateString()} — Upgrade required`
                  : "Your 5-day free trial has expired — Upgrade required"}
              </span>
            </div>

            <Link href="/billing" className="inline-block">
              <Button className={cn("w-full sm:w-auto font-bold", isExpired && "bg-red-600 hover:bg-red-700 text-white")}>
                {isExpired ? "Upgrade Plan Now" : "Change Plan"}
              </Button>
            </Link>
          </div>

          {limits && (
            <div className={cn("rounded-xl p-4 space-y-3 border", isExpired ? "bg-red-500/5 border-red-500/20" : "bg-muted/50 border-border/50")}>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                {isExpired && <Lock className="h-3.5 w-3.5 text-red-500" />}
                <span>Plan Limits</span>
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  {isExpired ? <X className="h-4 w-4 text-red-500 shrink-0" /> : <Check className="h-4 w-4 text-emerald-500 shrink-0" />}
                  <span>{formatLimit(limits.messages)} messages/month</span>
                </li>
                <li className="flex items-center gap-2">
                  {isExpired ? <X className="h-4 w-4 text-red-500 shrink-0" /> : <Check className="h-4 w-4 text-emerald-500 shrink-0" />}
                  <span>{formatLimit(limits.contacts)} contacts</span>
                </li>
                <li className="flex items-center gap-2">
                  {isExpired ? <X className="h-4 w-4 text-red-500 shrink-0" /> : <Check className="h-4 w-4 text-emerald-500 shrink-0" />}
                  <span>{formatLimit(limits.users)} team members</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
