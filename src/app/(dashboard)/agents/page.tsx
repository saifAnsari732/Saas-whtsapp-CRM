'use client';

import { useState } from 'react';
import { Bot, Sparkles, Settings2, BarChart3, Clock, Zap } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChatbotStudio } from '@/components/chatbot/chatbot-studio';
import { AiPlayground } from '@/components/agents/ai-playground';
import { AiUsageCard } from '@/components/agents/ai-usage';
import { AiConfig } from '@/components/settings/ai-config';
import { useAuth } from '@/hooks/use-auth';
import { canEditSettings } from '@/lib/auth/roles';

type Tab = 'chatbot' | 'setup' | 'playground' | 'usage';

export default function AgentsPage() {
  const { accountRole } = useAuth();
  const canViewUsage = accountRole ? canEditSettings(accountRole) : false;
  const [tab, setTab] = useState<Tab>('chatbot');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                AI Chatbot & Follow-ups
              </h1>
              <p className="text-xs text-muted-foreground">
                Smart automated replies, custom persona prompts, keyword triggers, and multi-step lead follow-up sequences.
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
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 !h-auto group-data-horizontal/tabs:!h-auto overflow-visible p-1.5 bg-muted/70 dark:bg-muted/30 border border-border/80 rounded-2xl shadow-inner mb-6">
          <TabsTrigger value="chatbot" className="min-h-[46px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center justify-center gap-2">
            <Zap className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Chatbot & Follow-ups</span>
          </TabsTrigger>

          <TabsTrigger value="setup" className="min-h-[46px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center justify-center gap-2">
            <Settings2 className="h-4 w-4 text-blue-500 shrink-0" />
            <span>AI Provider & Keys</span>
          </TabsTrigger>

          <TabsTrigger value="playground" className="min-h-[46px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500 shrink-0" />
            <span>AI Raw Playground</span>
          </TabsTrigger>

          {canViewUsage && (
            <TabsTrigger value="usage" className="min-h-[46px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center justify-center gap-2">
              <BarChart3 className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Token Usage</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="chatbot" className="mt-0">
          <ChatbotStudio />
        </TabsContent>

        <TabsContent value="setup" className="mt-0">
          <AiConfig />
        </TabsContent>

        <TabsContent value="playground" className="mt-0">
          <AiPlayground onGoToSetup={() => setTab('setup')} />
        </TabsContent>

        {canViewUsage && (
          <TabsContent value="usage" className="mt-0">
            <AiUsageCard />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
