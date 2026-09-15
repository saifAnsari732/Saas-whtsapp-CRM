import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Check, Clock, AlertTriangle } from "lucide-react";
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
  const isExpired = status === "expired";

  const getStatusColor = () => {
    if (isTrial) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    if (isActive) return "bg-green-500/10 text-green-500 border-green-500/20";
    return "bg-red-500/10 text-red-500 border-red-500/20";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div className="space-y-1">
          <CardTitle>Subscription Plan</CardTitle>
          <CardDescription>Manage your current subscription and limits</CardDescription>
        </div>
        <Badge variant="outline" className={cn("capitalize px-3 py-1 text-xs font-semibold", getStatusColor())}>
          {status}
        </Badge>
      </CardHeader>
      <CardContent className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <h3 className="text-2xl font-bold">{plan || "Free"}</h3>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isTrial && <Clock className="h-4 w-4" />}
              {isActive && <Calendar className="h-4 w-4" />}
              {isExpired && <AlertTriangle className="h-4 w-4 text-red-500" />}
              
              <span>
                {isTrial
                  ? `Trial ends in ${daysRemaining} days (${new Date(trialEndsAt!).toLocaleDateString()})`
                  : isActive
                  ? `Renews on ${new Date(expiresAt!).toLocaleDateString()}`
                  : "Your subscription has expired"}
              </span>
            </div>

            <Link href="/billing" className="inline-block">
              <Button className="w-full sm:w-auto">
                Change Plan
              </Button>
            </Link>
          </div>

          {limits && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold mb-2">Plan Limits</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  {limits.messages.toLocaleString()} messages/month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  {limits.contacts.toLocaleString()} contacts
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  {limits.users} team members
                </li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
