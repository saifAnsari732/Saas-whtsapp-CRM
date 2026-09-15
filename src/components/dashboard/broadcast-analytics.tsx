"use client";

import { Card } from "@/components/ui/card";
import { BroadcastAnalyticsData } from "@/lib/dashboard/types";
import { Radio, Users, CheckCircle2, XCircle, CalendarClock, Activity } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Badge } from "@/components/ui/badge";

interface Props {
  data: BroadcastAnalyticsData;
}

export function BroadcastAnalytics({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".broadcast-anim",
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <Card ref={containerRef} className="p-6 flex flex-col h-full bg-gradient-to-bl from-card to-card/50 border-border/50 overflow-hidden relative">
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl -z-10" />
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-500" />
            Broadcast Analytics
          </h3>
          <p className="text-sm text-muted-foreground">Recent campaign performance</p>
        </div>
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 text-blue-600">
          <Activity className="w-6 h-6" />
        </div>
      </div>

      <div className="flex-1 space-y-4">
        {data.recentBroadcasts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-accent/30 rounded-xl border border-border/50">
            <Radio className="w-8 h-8 text-muted-foreground mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No recent broadcasts</p>
          </div>
        ) : (
          data.recentBroadcasts.map((broadcast) => {
            const deliveryRate = broadcast.totalRecipients 
              ? Math.round((broadcast.deliveredCount / broadcast.totalRecipients) * 100) 
              : 0;
            
            const isScheduled = broadcast.status.toLowerCase() === 'scheduled';
            
            return (
              <div key={broadcast.id} className="broadcast-anim p-4 rounded-xl bg-card border shadow-sm flex flex-col gap-3 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm truncate pr-4">{broadcast.name}</span>
                  <Badge variant={isScheduled ? "outline" : "default"} className={isScheduled ? "text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-900" : "bg-blue-500 hover:bg-blue-600"}>
                    {broadcast.status}
                  </Badge>
                </div>
                
                {isScheduled ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/50 p-2 rounded-md">
                    <CalendarClock className="w-4 h-4 text-yellow-500" />
                    <span>Scheduled for: {new Date(broadcast.scheduledAt!).toLocaleString()}</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs flex items-center gap-1"><Users className="w-3 h-3"/> Total</span>
                        <span className="font-medium">{broadcast.totalRecipients}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500"/> Delivered</span>
                        <span className="font-medium text-green-600">{broadcast.deliveredCount}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs flex items-center gap-1"><XCircle className="w-3 h-3 text-red-500"/> Failed</span>
                        <span className="font-medium text-red-600">{broadcast.failedCount}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Delivery Rate</span>
                        <span>{deliveryRate}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-1000" 
                          style={{ width: `${deliveryRate}%` }} 
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
