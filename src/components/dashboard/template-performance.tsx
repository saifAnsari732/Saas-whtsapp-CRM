"use client";

import { Card } from "@/components/ui/card";
import { TemplatePerformanceData } from "@/lib/dashboard/types";
import { MessageSquareDashed, CheckCircle, Clock, XCircle, TrendingUp } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Badge } from "@/components/ui/badge";

interface Props {
  data: TemplatePerformanceData;
}

export function TemplatePerformance({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".template-anim",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const approvedPercent = data.total ? (data.approved / data.total) * 100 : 0;
  const pendingPercent = data.total ? (data.pending / data.total) * 100 : 0;
  const rejectedPercent = data.total ? (data.rejected / data.total) * 100 : 0;

  return (
    <Card ref={containerRef} className="p-6 flex flex-col h-full bg-gradient-to-br from-card to-card/50 border-border/50 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
            <MessageSquareDashed className="w-5 h-5 text-primary" />
            Template Performance
          </h3>
          <p className="text-sm text-muted-foreground">Status and usage of message templates</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{data.total}</div>
          <div className="text-xs text-muted-foreground">Total Templates</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="template-anim flex flex-col gap-1 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Approved</span>
          </div>
          <span className="text-xl font-bold text-green-700 dark:text-green-400">{data.approved}</span>
        </div>
        <div className="template-anim flex flex-col gap-1 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-center gap-2 text-yellow-600">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">Pending</span>
          </div>
          <span className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{data.pending}</span>
        </div>
        <div className="template-anim flex flex-col gap-1 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Rejected</span>
          </div>
          <span className="text-xl font-bold text-red-700 dark:text-red-400">{data.rejected}</span>
        </div>
      </div>

      <div className="mb-6 template-anim">
        <div className="flex h-2 w-full rounded-full overflow-hidden bg-muted">
          <div style={{ width: `${approvedPercent}%` }} className="bg-green-500 transition-all duration-1000" />
          <div style={{ width: `${pendingPercent}%` }} className="bg-yellow-500 transition-all duration-1000" />
          <div style={{ width: `${rejectedPercent}%` }} className="bg-red-500 transition-all duration-1000" />
        </div>
      </div>

      <div className="flex-1">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          Top Used Templates
        </h4>
        <div className="space-y-3">
          {data.topTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No templates found</p>
          ) : (
            data.topTemplates.map((template, idx) => (
              <div key={template.id} className="template-anim flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate max-w-[180px]">{template.name}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {template.status.toLowerCase() === 'approved' && <CheckCircle className="w-3 h-3 text-green-500" />}
                    {template.status.toLowerCase() === 'pending' && <Clock className="w-3 h-3 text-yellow-500" />}
                    {template.status.toLowerCase() === 'rejected' && <XCircle className="w-3 h-3 text-red-500" />}
                    {template.status}
                  </span>
                </div>
                <Badge variant="secondary" className="font-mono">
                  {template.sendCount.toLocaleString()}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
