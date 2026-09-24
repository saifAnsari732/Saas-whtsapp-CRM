'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Bot, 
  Sparkles, 
  Zap, 
  Clock, 
  Smartphone, 
  Play, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  SlidersHorizontal, 
  MessageSquare, 
  UserCheck, 
  ShoppingCart, 
  Headphones, 
  RefreshCw,
  Eye,
  Check,
  Power
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { 
  ChatbotSettings, 
  BotMode, 
  BotPersona, 
  KeywordRule, 
  FollowUpStep, 
  PERSONA_PROMPTS, 
  DEFAULT_KEYWORD_RULES, 
  DEFAULT_FOLLOW_UP_STEPS,
  FollowUpQueueItem 
} from '@/lib/chatbot/types';
import { cn } from '@/lib/utils';

export function ChatbotStudio() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('bot_engine');

  // Chatbot Settings State
  const [isActive, setIsActive] = useState(true);
  const [botMode, setBotMode] = useState<BotMode>('hybrid');
  const [persona, setPersona] = useState<BotPersona>('sales');
  const [systemPrompt, setSystemPrompt] = useState(PERSONA_PROMPTS.sales.prompt);
  const [typingDelay, setTypingDelay] = useState(2);
  const [maxReplies, setMaxReplies] = useState(6);
  const [welcomeEnabled, setWelcomeEnabled] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState('Hi {name}! Welcome to our WhatsApp service. How can we assist you today?');
  const [fallbackMessage, setFallbackMessage] = useState('Thank you for your message! Our team has received your query and will reply shortly.');
  const [awayEnabled, setAwayEnabled] = useState(false);
  const [awayMessage, setAwayMessage] = useState('Thank you for reaching out! We are currently outside our business hours and will respond shortly.');

  // Keyword Rules State
  const [keywordRules, setKeywordRules] = useState<KeywordRule[]>(DEFAULT_KEYWORD_RULES);
  const [newKeywords, setNewKeywords] = useState('');
  const [newMatchType, setNewMatchType] = useState<'contains' | 'exact'>('contains');
  const [newReplyText, setNewReplyText] = useState('');

  // Follow-up Sequence State
  const [followUpActive, setFollowUpActive] = useState(true);
  const [followUpSteps, setFollowUpSteps] = useState<FollowUpStep[]>(DEFAULT_FOLLOW_UP_STEPS);
  const [followUpQueue, setFollowUpQueue] = useState<FollowUpQueueItem[]>([]);
  const [runningFollowUps, setRunningFollowUps] = useState(false);

  // Simulator / Test State
  const [simMessages, setSimMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string; tag?: string }>>([
    { sender: 'bot', text: 'Hello! I am your AI Auto-Reply Assistant. Type any question or keyword to test my responses in real-time!', time: '10:00 AM' }
  ]);
  const [simInput, setSimInput] = useState('');
  const [isSimTyping, setIsSimTyping] = useState(false);

  // Fetch initial config from backend
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/chatbot/config');
        const data = await res.json();
        if (data.success && data.config) {
          const c: ChatbotSettings = data.config;
          setIsActive(c.is_active ?? true);
          setBotMode(c.bot_mode || 'hybrid');
          setPersona(c.persona || 'sales');
          setSystemPrompt(c.system_prompt || PERSONA_PROMPTS.sales.prompt);
          setTypingDelay(c.typing_delay_seconds || 2);
          setMaxReplies(c.max_replies_per_conv || 6);
          setWelcomeEnabled(c.welcome_enabled ?? true);
          setWelcomeMessage(c.welcome_message || '');
          setFallbackMessage(c.fallback_message || '');
          setAwayEnabled(c.away_enabled || false);
          setAwayMessage(c.away_message || '');
          if (c.keyword_rules && c.keyword_rules.length > 0) setKeywordRules(c.keyword_rules);
          if (c.follow_up_sequence) {
            setFollowUpActive(c.follow_up_sequence.is_active ?? true);
            if (c.follow_up_sequence.steps) setFollowUpSteps(c.follow_up_sequence.steps);
          }
          if (data.queue) setFollowUpQueue(data.queue);
        }
      } catch (err) {
        console.error('Failed to load chatbot config:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // Save all settings
  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const payload: Partial<ChatbotSettings> = {
        is_active: isActive,
        bot_mode: botMode,
        persona,
        system_prompt: systemPrompt,
        typing_delay_seconds: typingDelay,
        max_replies_per_conv: maxReplies,
        welcome_enabled: welcomeEnabled,
        welcome_message: welcomeMessage,
        fallback_message: fallbackMessage,
        away_enabled: awayEnabled,
        away_message: awayMessage,
        keyword_rules: keywordRules,
        follow_up_sequence: {
          id: 'seq-default',
          name: 'Lead Re-engagement Follow-up',
          is_active: followUpActive,
          trigger_event: 'no_reply_inbound',
          cancel_on_reply: true,
          steps: followUpSteps,
        },
      };

      const res = await fetch('/api/chatbot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save settings');
      toast.success('Chatbot & Follow-up settings saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  // Persona select helper
  const handleSelectPersona = (p: BotPersona) => {
    setPersona(p);
    setSystemPrompt(PERSONA_PROMPTS[p].prompt);
    toast.info(`Switched persona to: ${PERSONA_PROMPTS[p].title}`);
  };

  // Keyword rules helpers
  const handleAddKeywordRule = () => {
    if (!newKeywords.trim() || !newReplyText.trim()) {
      toast.error('Please enter keywords and a reply message');
      return;
    }
    const keywordsList = newKeywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    const newRule: KeywordRule = {
      id: `rule-${Date.now()}`,
      keywords: keywordsList,
      match_type: newMatchType,
      reply_text: newReplyText.trim(),
      is_active: true,
    };

    setKeywordRules([...keywordRules, newRule]);
    setNewKeywords('');
    setNewReplyText('');
    toast.success('New keyword rule added!');
  };

  const handleDeleteKeywordRule = (id: string) => {
    setKeywordRules(keywordRules.filter((r) => r.id !== id));
    toast.success('Rule removed');
  };

  const handleToggleKeywordRule = (id: string) => {
    setKeywordRules(
      keywordRules.map((r) => (r.id === id ? { ...r, is_active: !r.is_active } : r))
    );
  };

  // Follow-up Steps helpers
  const handleAddFollowUpStep = () => {
    const nextStepNum = followUpSteps.length + 1;
    const newStep: FollowUpStep = {
      id: `step-${Date.now()}`,
      step_number: nextStepNum,
      delay_value: nextStepNum * 24,
      delay_unit: 'hours',
      message_text: `Hi {name}! Following up on our previous conversation. Let us know if you would like any further assistance!`,
      is_active: true,
    };
    setFollowUpSteps([...followUpSteps, newStep]);
  };

  const handleDeleteFollowUpStep = (id: string) => {
    const filtered = followUpSteps.filter((s) => s.id !== id);
    const reindexed = filtered.map((s, idx) => ({ ...s, step_number: idx + 1 }));
    setFollowUpSteps(reindexed);
  };

  const handleUpdateFollowUpStep = (id: string, updates: Partial<FollowUpStep>) => {
    setFollowUpSteps(followUpSteps.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleRunFollowUpsNow = async () => {
    setRunningFollowUps(true);
    try {
      const res = await fetch('/api/chatbot/followups/run', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(`Follow-up runner executed! Dispatched: ${data.sent} messages.`);
      }
    } catch (err: any) {
      toast.error('Failed to trigger follow-up runner');
    } finally {
      setRunningFollowUps(false);
    }
  };

  // Simulator message send
  const handleSendSimulator = async () => {
    if (!simInput.trim()) return;
    const userText = simInput.trim();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setSimMessages((prev) => [...prev, { sender: 'user', text: userText, time: timeNow }]);
    setSimInput('');
    setIsSimTyping(true);

    try {
      const res = await fetch('/api/chatbot/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, contactName: 'Alex' }),
      });
      const data = await res.json();

      setTimeout(() => {
        setIsSimTyping(false);
        const replyText = data.reply || 'No reply generated.';
        const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setSimMessages((prev) => [
          ...prev,
          { sender: 'bot', text: replyText, time: botTime, tag: data.source ? `[${data.source.toUpperCase()}]` : undefined }
        ]);
      }, (typingDelay || 2) * 600);
    } catch (err) {
      setIsSimTyping(false);
      setSimMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Sorry, I encountered an error while testing.', time: timeNow }
      ]);
    }
  };

  const handleSimulateFollowUp = () => {
    const firstStep = followUpSteps.find((s) => s.is_active);
    if (!firstStep) {
      toast.error('No active follow-up steps found');
      return;
    }
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formatted = firstStep.message_text.replace(/\{name\}/gi, 'Alex');

    setIsSimTyping(true);
    setTimeout(() => {
      setIsSimTyping(false);
      setSimMessages((prev) => [
        ...prev,
        { sender: 'bot', text: formatted, time: timeNow, tag: '[FOLLOW-UP #1]' }
      ]);
      toast.info('Simulated Follow-up #1 trigger after customer silence!');
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm font-semibold text-muted-foreground">Loading Chatbot & Follow-up Studio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Master Switch */}
      <Card className="border-border/80 bg-gradient-to-br from-card via-card to-emerald-500/5 shadow-xs overflow-hidden rounded-2xl">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-xs">
                <Bot className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-black text-foreground">AI Auto-Reply Chatbot & Follow-ups</h2>
                  <Badge variant="outline" className={cn(
                    "font-bold text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1.5",
                    isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-muted text-muted-foreground"
                  )}>
                    <span className={cn("h-2 w-2 rounded-full", isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground")} />
                    {isActive ? "ENGINE LIVE" : "ENGINE PAUSED"}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  Intelligent auto-responder with custom system prompts, persona presets, keyword rules, and multi-step lead follow-up sequences for WhatsApp.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 self-end lg:self-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/60 border border-border/80">
                <Power className={cn("h-4 w-4", isActive ? "text-emerald-500" : "text-muted-foreground")} />
                <span className="text-xs font-bold text-foreground">Auto-Reply Engine</span>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>

              <Button 
                onClick={handleSaveConfig} 
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs gap-2 px-5 h-10"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-border/60">
            <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">Bot Mode</span>
              <p className="text-sm font-black capitalize text-foreground mt-0.5">{botMode} Mode</p>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">Active Keywords</span>
              <p className="text-sm font-black text-foreground mt-0.5">{keywordRules.filter((r) => r.is_active).length} Rules</p>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">Follow-up Sequences</span>
              <p className="text-sm font-black text-foreground mt-0.5">{followUpActive ? `${followUpSteps.filter((s) => s.is_active).length} Active Steps` : 'Paused'}</p>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">Typing Delay</span>
              <p className="text-sm font-black text-foreground mt-0.5">{typingDelay}s Natural Delay</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Hub */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 !h-auto group-data-horizontal/tabs:!h-auto overflow-visible p-1.5 bg-muted/70 dark:bg-muted/30 border border-border/80 rounded-2xl shadow-inner">
          <TabsTrigger value="bot_engine" className="min-h-[48px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center justify-center gap-2">
            <Bot className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>AI Bot Engine</span>
          </TabsTrigger>

          <TabsTrigger value="keywords" className="min-h-[48px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center justify-center gap-2">
            <Zap className="h-4 w-4 shrink-0 text-amber-500" />
            <span>Keywords & Rules</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-600 border-amber-500/20 ml-1">
              {keywordRules.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="followups" className="min-h-[48px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center justify-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-blue-500" />
            <span>Automated Follow-ups</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-600 border-blue-500/20 ml-1">
              {followUpSteps.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="simulator" className="min-h-[48px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center justify-center gap-2">
            <Smartphone className="h-4 w-4 shrink-0 text-violet-500" />
            <span>Live WhatsApp Simulator</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: AI BOT ENGINE */}
        <TabsContent value="bot_engine" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Persona & System Prompt */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-2xl border-border/80 shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                    AI Persona Presets
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Choose a tailored business persona to automatically set optimal instructions for your WhatsApp chatbot.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0">
                  <div 
                    onClick={() => handleSelectPersona('sales')}
                    className={cn(
                      "p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between",
                      persona === 'sales' ? "bg-emerald-500/10 border-emerald-500/50 shadow-xs" : "bg-card border-border/70 hover:border-emerald-500/30"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <UserCheck className="h-4 w-4 text-emerald-500" />
                          Sales & Deal Closer
                        </span>
                        {persona === 'sales' && <Check className="h-4 w-4 text-emerald-600" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                        Converts prospects, handles objections, provides pricing, and books discovery calls.
                      </p>
                    </div>
                  </div>

                  <div 
                    onClick={() => handleSelectPersona('support')}
                    className={cn(
                      "p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between",
                      persona === 'support' ? "bg-blue-500/10 border-blue-500/50 shadow-xs" : "bg-card border-border/70 hover:border-blue-500/30"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Headphones className="h-4 w-4 text-blue-500" />
                          Support Specialist
                        </span>
                        {persona === 'support' && <Check className="h-4 w-4 text-blue-600" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                        Empathetic troubleshooting, answers FAQs, and provides step-by-step assistance.
                      </p>
                    </div>
                  </div>

                  <div 
                    onClick={() => handleSelectPersona('lead_gen')}
                    className={cn(
                      "p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between",
                      persona === 'lead_gen' ? "bg-amber-500/10 border-amber-500/50 shadow-xs" : "bg-card border-border/70 hover:border-amber-500/30"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Zap className="h-4 w-4 text-amber-500" />
                          Lead Qualification
                        </span>
                        {persona === 'lead_gen' && <Check className="h-4 w-4 text-amber-600" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                        Discovers customer requirements, budget, scale, and timeline before scheduling.
                      </p>
                    </div>
                  </div>

                  <div 
                    onClick={() => handleSelectPersona('ecommerce')}
                    className={cn(
                      "p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between",
                      persona === 'ecommerce' ? "bg-violet-500/10 border-violet-500/50 shadow-xs" : "bg-card border-border/70 hover:border-violet-500/30"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <ShoppingCart className="h-4 w-4 text-violet-500" />
                          E-Commerce & Orders
                        </span>
                        {persona === 'ecommerce' && <Check className="h-4 w-4 text-violet-600" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                        Recommends products, answers delivery & shipping questions, and shares discounts.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Prompt Customizer */}
              <Card className="rounded-2xl border-border/80 shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-emerald-500" />
                    System Prompt Instructions
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Fine-tune how your WhatsApp AI chatbot answers questions, speaks, and guides users.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <Textarea 
                    rows={7}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Enter instructions for how your AI agent should reply..."
                    className="rounded-xl text-xs font-mono bg-background border-border/80 leading-relaxed resize-none p-3.5"
                  />
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/50 p-2.5 rounded-xl border border-border/60">
                    <span className="font-bold text-foreground">💡 Pro-tip:</span>
                    <span>You can mention your business name, pricing tiers, and contact numbers in the prompt.</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Col: Engine Parameters & Welcome/Away */}
            <div className="space-y-6">
              <Card className="rounded-2xl border-border/80 shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Execution Controls</CardTitle>
                  <CardDescription className="text-xs">Response timing & fallback behavior</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground">Bot Operation Mode</label>
                    <Select value={botMode} onValueChange={(val) => setBotMode(val as BotMode)}>
                      <SelectTrigger className="w-full text-xs rounded-xl h-10 bg-background border-border/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="hybrid" className="text-xs">
                          🔀 Hybrid (Keywords First, AI Fallback)
                        </SelectItem>
                        <SelectItem value="ai" className="text-xs">
                          🧠 AI Only (GPT / Gemini natural replies)
                        </SelectItem>
                        <SelectItem value="keyword" className="text-xs">
                          ⚡ Keyword Only (Strict rules only)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground">Typing Delay (WhatsApp Realistic)</label>
                      <span className="text-xs font-bold text-emerald-600">{typingDelay} seconds</span>
                    </div>
                    <Input 
                      type="range" 
                      min="1" 
                      max="6" 
                      step="1"
                      value={typingDelay} 
                      onChange={(e) => setTypingDelay(parseInt(e.target.value, 10))}
                      className="cursor-pointer"
                    />
                    <p className="text-[11px] text-muted-foreground">Simulates natural human typing before dispatching message.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground">Max Auto-Replies Per Chat</label>
                    <Input 
                      type="number" 
                      min="1" 
                      max="20"
                      value={maxReplies} 
                      onChange={(e) => setMaxReplies(parseInt(e.target.value, 10) || 5)}
                      className="h-10 text-xs rounded-xl bg-background border-border/80"
                    />
                    <p className="text-[11px] text-muted-foreground">Limits bot turns to avoid infinite loops with other bots.</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground">Welcome / Greeting Message</label>
                      <Switch checked={welcomeEnabled} onCheckedChange={setWelcomeEnabled} />
                    </div>
                    {welcomeEnabled && (
                      <Textarea 
                        rows={2}
                        value={welcomeMessage}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
                        placeholder="Welcome message for new contacts..."
                        className="rounded-xl text-xs bg-background border-border/80 p-2.5 resize-none"
                      />
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <label className="text-xs font-bold text-foreground">Fallback Reply Message</label>
                    <Textarea 
                      rows={2}
                      value={fallbackMessage}
                      onChange={(e) => setFallbackMessage(e.target.value)}
                      placeholder="Sent when AI or keywords do not match..."
                      className="rounded-xl text-xs bg-background border-border/80 p-2.5 resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: KEYWORDS & RULES */}
        <TabsContent value="keywords" className="space-y-6">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Instant Keyword Auto-Reply Triggers
                </CardTitle>
                <CardDescription className="text-xs">
                  Respond immediately when incoming messages contain specific triggers or exact words.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
              {/* Add New Rule Form */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-4">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5 text-emerald-500" />
                  Create New Keyword Trigger Rule
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground">Trigger Keywords (comma separated)</label>
                    <Input 
                      placeholder="e.g. price, cost, rates, packages" 
                      value={newKeywords}
                      onChange={(e) => setNewKeywords(e.target.value)}
                      className="text-xs rounded-xl h-10 bg-background border-border/80"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground">Match Type</label>
                    <Select value={newMatchType} onValueChange={(val) => setNewMatchType(val as 'contains' | 'exact')}>
                      <SelectTrigger className="w-full text-xs rounded-xl h-10 bg-background border-border/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="contains" className="text-xs">Contains Keyword</SelectItem>
                        <SelectItem value="exact" className="text-xs">Exact Match Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground">Automated Reply Text (supports {'{name}'}, {'{phone}'}, {'{time}'})</label>
                  <Textarea 
                    rows={3}
                    placeholder="Enter the automated reply message to dispatch..."
                    value={newReplyText}
                    onChange={(e) => setNewReplyText(e.target.value)}
                    className="text-xs rounded-xl bg-background border-border/80 p-3 resize-none leading-relaxed"
                  />
                </div>

                <Button 
                  onClick={handleAddKeywordRule}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 h-9 px-4"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Keyword Rule
                </Button>
              </div>

              {/* Active Rules List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground">Active Keyword Rules ({keywordRules.length})</h4>
                <div className="divide-y divide-border/60 border border-border/70 rounded-2xl overflow-hidden bg-card">
                  {keywordRules.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      No keyword rules added yet. Create your first rule above!
                    </div>
                  ) : (
                    keywordRules.map((rule) => (
                      <div key={rule.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {rule.keywords.map((kw, i) => (
                              <Badge key={i} variant="outline" className="text-[11px] font-mono bg-muted/60 text-foreground border-border/80">
                                {kw}
                              </Badge>
                            ))}
                            <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
                              {rule.match_type}
                            </Badge>
                          </div>
                          <p className="text-xs text-foreground whitespace-pre-line leading-relaxed font-sans line-clamp-2">
                            {rule.reply_text}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-muted-foreground">{rule.is_active ? 'Active' : 'Disabled'}</span>
                            <Switch checked={rule.is_active} onCheckedChange={() => handleToggleKeywordRule(rule.id)} />
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteKeywordRule(rule.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-500 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: AUTOMATED FOLLOW-UPS ("and also set follow ups") */}
        <TabsContent value="followups" className="space-y-6">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    Automated Lead Follow-up Sequences
                  </CardTitle>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[11px] font-bold">
                    Multi-Step Cadence
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-1">
                  Automatically check in with leads if they don't reply within a set time. Automatically stops the instant the customer responds!
                </CardDescription>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleRunFollowUpsNow} 
                  disabled={runningFollowUps}
                  className="rounded-xl text-xs gap-1.5 font-bold border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", runningFollowUps && "animate-spin")} />
                  Dispatch Due Follow-ups
                </Button>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/60 rounded-xl border border-border/80">
                  <span className="text-xs font-bold text-foreground">Follow-ups Active</span>
                  <Switch checked={followUpActive} onCheckedChange={setFollowUpActive} />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-0">
              {/* Sequence Steps Timeline */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span>Follow-Up Step Cadence</span>
                    <span className="text-muted-foreground font-normal">({followUpSteps.length} Steps configured)</span>
                  </h4>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleAddFollowUpStep}
                    className="rounded-xl text-xs font-bold gap-1 border-border/80 h-8"
                  >
                    <Plus className="h-3.5 w-3.5 text-emerald-500" />
                    Add Follow-up Step
                  </Button>
                </div>

                <div className="space-y-4 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-border/60">
                  {followUpSteps.map((step, index) => (
                    <div key={step.id} className="relative flex items-start gap-4 p-4 bg-muted/30 border border-border/80 rounded-2xl">
                      <div className="h-10 w-10 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 z-10 shadow-xs border-2 border-background">
                        #{step.step_number}
                      </div>

                      <div className="flex-1 space-y-3 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-foreground">Trigger if NO REPLY after:</span>
                            <Input 
                              type="number" 
                              min="1"
                              value={step.delay_value} 
                              onChange={(e) => handleUpdateFollowUpStep(step.id, { delay_value: parseInt(e.target.value, 10) || 1 })}
                              className="w-16 h-8 text-xs rounded-lg bg-background border-border/80"
                            />
                            <Select 
                              value={step.delay_unit} 
                              onValueChange={(val) => handleUpdateFollowUpStep(step.id, { delay_unit: val as any })}
                            >
                              <SelectTrigger className="w-28 h-8 text-xs rounded-lg bg-background border-border/80">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="minutes" className="text-xs">Minutes</SelectItem>
                                <SelectItem value="hours" className="text-xs">Hours</SelectItem>
                                <SelectItem value="days" className="text-xs">Days</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-muted-foreground">{step.is_active ? 'Enabled' : 'Paused'}</span>
                              <Switch checked={step.is_active} onCheckedChange={(val) => handleUpdateFollowUpStep(step.id, { is_active: val })} />
                            </div>
                            {followUpSteps.length > 1 && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteFollowUpStep(step.id)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500 rounded-lg"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground">Follow-up Message Template:</label>
                          <Textarea 
                            rows={2}
                            value={step.message_text}
                            onChange={(e) => handleUpdateFollowUpStep(step.id, { message_text: e.target.value })}
                            className="text-xs rounded-xl bg-background border-border/80 p-2.5 resize-none leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Smart Auto-Cancel Guarantee Box */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Intelligent Reply Detection & Auto-Cancel</h5>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
                    Whenever a customer sends any reply back to your WhatsApp number, all subsequent follow-up steps for that lead are <strong>automatically cancelled</strong> so they never receive irrelevant follow-up messages!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: WHATSAPP LIVE SIMULATOR */}
        <TabsContent value="simulator" className="space-y-6">
          <div className="max-w-md mx-auto">
            {/* Phone Device Mockup */}
            <div className="rounded-3xl border-4 border-slate-800 bg-[#0b141a] shadow-2xl overflow-hidden flex flex-col h-[580px]">
              {/* WhatsApp Header */}
              <div className="bg-[#1f2c34] p-3.5 text-white flex items-center justify-between border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white leading-tight">WaCRM AI Assistant</h4>
                    <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      online
                    </p>
                  </div>
                </div>

                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleSimulateFollowUp}
                  className="text-[10px] h-7 px-2 font-bold bg-white/10 text-emerald-300 hover:bg-white/20 rounded-lg"
                >
                  Test Follow-Up
                </Button>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[radial-gradient(#12222a_1px,transparent_1px)] [background-size:16px_16px]">
                {simMessages.map((msg, i) => (
                  <div key={i} className={cn("flex flex-col max-w-[82%]", msg.sender === 'user' ? "ml-auto items-end" : "mr-auto items-start")}>
                    {msg.tag && (
                      <span className="text-[9px] font-bold text-emerald-400 mb-0.5 px-1">{msg.tag}</span>
                    )}
                    <div className={cn(
                      "p-3 rounded-2xl text-xs leading-relaxed shadow-sm break-words",
                      msg.sender === 'user' 
                        ? "bg-[#005c4b] text-white rounded-tr-none" 
                        : "bg-[#202c33] text-gray-100 rounded-tl-none border border-white/5"
                    )}>
                      {msg.text}
                      <span className="text-[9px] text-gray-400 float-right ml-2 mt-1 block">
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}

                {isSimTyping && (
                  <div className="mr-auto items-start max-w-[80%]">
                    <div className="p-3 rounded-2xl bg-[#202c33] text-gray-100 rounded-tl-none flex items-center gap-1.5">
                      <span className="text-xs text-emerald-400">typing</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input Bar */}
              <div className="bg-[#1f2c34] p-2.5 border-t border-white/10 flex items-center gap-2 shrink-0">
                <Input 
                  placeholder="Type a message (e.g. price, demo, hi)..." 
                  value={simInput}
                  onChange={(e) => setSimInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendSimulator()}
                  className="bg-[#2a3942] border-none text-white text-xs h-9 rounded-xl placeholder:text-gray-400 focus-visible:ring-emerald-500"
                />
                <Button 
                  size="sm" 
                  onClick={handleSendSimulator}
                  className="h-9 w-9 p-0 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
