"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, CheckCircle2, MessageCircle, Users, Send } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin } = useAuth();
  const { isActive, loading, status, plan, trialUsage } = useSubscription();

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verifying subscription & trial access...</p>
        </div>
      </div>
    );
  }

  // SuperAdmins bypass subscription gate with full platform access
  if (isSuperAdmin || isActive) {
    return <>{children}</>;
  }

  const isPaidExpired = plan && plan !== 'trial' && plan !== 'none';
  const title = isPaidExpired
    ? "Subscription Expired — Access Locked" 
    : "Your 5-Day Free Trial Has Expired";
    
  const description = isPaidExpired
    ? "Your subscription period has ended. Please renew your plan to continue using WhatsApp CRM features."
    : "Your 5-day free trial has ended and all dashboard actions, messaging, broadcasts & automations are now locked. Upgrade to a paid plan to unlock access.";

  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center bg-gradient-to-br from-background via-muted/30 to-muted/80 p-4">
      <Card className="mx-auto w-full max-w-3xl shadow-2xl border-red-500/30 overflow-hidden">
        <div className="bg-red-600 text-white px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2">
          <Lock className="h-3.5 w-3.5" />
          <span>Account Access Locked — Trial Period Ended</span>
        </div>
        <div className="grid md:grid-cols-2 gap-0">
          <div className="p-8 border-b md:border-b-0 md:border-r border-border/50 flex flex-col justify-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 shadow-inner"
            >
              <motion.div
                animate={{ rotate: [-10, 10, -10, 0] }}
                transition={{ delay: 0.5, duration: 0.5, repeat: 3, repeatType: "reverse" }}
              >
                <Lock className="h-10 w-10 text-red-600 dark:text-red-500" />
              </motion.div>
            </motion.div>
            
            <h2 className="text-2xl font-bold text-center tracking-tight mb-2">{title}</h2>
            <p className="text-center text-muted-foreground text-sm mb-8">
              {description}
            </p>

            <div className="space-y-3">
              <Link href="/billing" className="block w-full">
                <Button size="lg" className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                  View Plans & Upgrade Now
                </Button>
              </Link>
              <Link href="/profile" className="block w-full">
                <Button variant="outline" className="w-full">
                  View Account Profile
                </Button>
              </Link>
            </div>
          </div>

          <div className="p-8 bg-muted/20 flex flex-col">
            <h3 className="text-lg font-semibold mb-4">What you built during trial:</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Card className="bg-background/50 border-border/50">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <MessageCircle className="h-6 w-6 text-blue-500 mb-2" />
                  <span className="text-2xl font-bold">{trialUsage?.messagesSent || 0}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Messages</span>
                </CardContent>
              </Card>
              <Card className="bg-background/50 border-border/50">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <Users className="h-6 w-6 text-green-500 mb-2" />
                  <span className="text-2xl font-bold">{trialUsage?.contactsCreated || 0}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Contacts</span>
                </CardContent>
              </Card>
              <Card className="bg-background/50 border-border/50">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <Send className="h-6 w-6 text-purple-500 mb-2" />
                  <span className="text-2xl font-bold">{trialUsage?.broadcastsSent || 0}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Broadcasts</span>
                </CardContent>
              </Card>
              <Card className="bg-background/50 border-border/50">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="h-6 w-6 text-orange-500 mb-2" />
                  <span className="text-2xl font-bold">{trialUsage?.templatesUsed || 0}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Templates</span>
                </CardContent>
              </Card>
            </div>

            <div className="mt-auto">
              <p className="text-sm font-medium mb-3">Upgrade to keep access to:</p>
              <ul className="space-y-2">
                {[
                  "Unlimited WhatsApp messaging",
                  "Automated workflows and pipelines",
                  "Team collaboration and shared inboxes"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
