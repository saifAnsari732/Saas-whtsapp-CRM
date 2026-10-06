'use client';

import { useState } from 'react';
import { Bot, Sparkles, Settings2, BarChart3, Zap, Smartphone, Cloud } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChatbotStudio } from '@/components/chatbot/chatbot-studio';
import { AiPlayground } from '@/components/agents/ai-playground';
import { AiUsageCard } from '@/components/agents/ai-usage';
import { AiConfig } from '@/components/settings/ai-config';
import { useAuth } from '@/hooks/use-auth';
import { canEditSettings } from '@/lib/auth/roles';
import { Badge } from '@/components/ui/badge';

type Tab = 'coex_bot' | 'cloud_bot' | 'setup' | 'playground' | 'usage';

export default function AgentsPage() {
  const { accountRole } = useAuth();
  const canViewUsage = accountRole ? canEditSettings(accountRole) : false;
  const [tab, setTab] = useState<Tab>('coex_bot');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20 shadow-2xs">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                  AI Chatbot & Smart Auto-Reply Hub
                </h1>
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold text-[10px] uppercase tracking-wider">
                  Independent Dual Channels
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure separate AI Auto-Reply bots for your Linked Phone (Coexistence) and Official Meta Cloud API.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as Tab)}
        className="w-full"
      >
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-5 gap-2 !h-auto group-data-horizontal/tabs:!h-auto overflow-visible p-1.5 bg-muted/70 dark:bg-muted/30 border border-border/80 rounded-2xl shadow-inner mb-6">
          {/* TAB 1: COEXISTENCE PHONE QR BOT */}
          <TabsTrigger 
            value="coex_bot" 
            className="min-h-[48px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center justify-center gap-2"
          >
            <Smartphone className="h-4 w-4 text-emerald-500 shrink-0" />
            <div className="text-left">
              <span className="block leading-none">Coexistence Bot</span>
              <span className="text-[10px] font-normal text-muted-foreground">Phone QR Engine</span>
            </div>
          </TabsTrigger>

          {/* TAB 2: META CLOUD API BOT */}
          <TabsTrigger 
            value="cloud_bot" 
            className="min-h-[48px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center justify-center gap-2"
          >
            <Cloud className="h-4 w-4 text-blue-500 shrink-0" />
            <div className="text-left">
              <span className="block leading-none">Cloud API Bot</span>
              <span className="text-[10px] font-normal text-muted-foreground">Official Meta WABA</span>
            </div>
          </TabsTrigger>

          {/* TAB 3: AI KEYS & MODEL CONFIG */}
          <TabsTrigger 
            value="setup" 
            className="min-h-[48px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center justify-center gap-2"
          >
            <Settings2 className="h-4 w-4 text-purple-500 shrink-0" />
            <div className="text-left">
              <span className="block leading-none">AI Provider & Keys</span>
              <span className="text-[10px] font-normal text-muted-foreground">LLM Models</span>
            </div>
          </TabsTrigger>

          {/* TAB 4: PLAYGROUND */}
          <TabsTrigger 
            value="playground" 
            className="min-h-[48px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
            <div className="text-left">
              <span className="block leading-none">AI Playground</span>
              <span className="text-[10px] font-normal text-muted-foreground">Live Simulation</span>
            </div>
          </TabsTrigger>

          {/* TAB 5: TOKEN USAGE */}
          {canViewUsage && (
            <TabsTrigger 
              value="usage" 
              className="min-h-[48px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center justify-center gap-2"
            >
              <BarChart3 className="h-4 w-4 text-teal-500 shrink-0" />
              <div className="text-left">
                <span className="block leading-none">Token Usage</span>
                <span className="text-[10px] font-normal text-muted-foreground">Analytics</span>
              </div>
            </TabsTrigger>
          )}
        </TabsList>

        {/* CONTENT 1: COEXISTENCE PHONE QR BOT */}
        <TabsContent value="coex_bot" className="mt-0 space-y-4">
          <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm sm:text-base font-black text-foreground">
                  Channel 1: WhatsApp Coexistence Auto-Reply (Phone QR Engine)
                </h3>
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                  Zero Meta Fees
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                This bot runs independently on your paired mobile device. Handles 24/7 AI replies, keyword matching, welcome greetings, and automated follow-ups directly on your personal/business phone number.
              </p>
            </div>
          </div>
          <ChatbotStudio />
        </TabsContent>

        {/* CONTENT 2: META CLOUD API BOT */}
        <TabsContent value="cloud_bot" className="mt-0 space-y-4">
          <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-transparent p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm sm:text-base font-black text-foreground">
                  Channel 2: Meta Official Cloud API Auto-Reply (WABA Webhook Engine)
                </h3>
                <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                  Official Webhook
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                This bot runs independently on your Meta WhatsApp Business API number. Powered by your AI Knowledge Base, template trigger filtering, 24-hour window compliance, and human agent handoff.
              </p>
            </div>
          </div>
          <AiConfig />
        </TabsContent>

        {/* CONTENT 3: AI KEYS & MODEL CONFIG */}
        <TabsContent value="setup" className="mt-0">
          <AiConfig />
        </TabsContent>

        {/* CONTENT 4: PLAYGROUND */}
        <TabsContent value="playground" className="mt-0">
          <AiPlayground onGoToSetup={() => setTab('setup')} />
        </TabsContent>

        {/* CONTENT 5: TOKEN USAGE */}
        {canViewUsage && (
          <TabsContent value="usage" className="mt-0">
            <AiUsageCard />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
