"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  QrCode, 
  Loader2, 
  CheckCircle2, 
  Smartphone, 
  LogOut, 
  Clock, 
  MessageSquare, 
  Users, 
  Send, 
  Settings, 
  Calendar, 
  Search,
  Zap,
  ShieldCheck,
  RefreshCw,
  Info,
  Filter,
  AlertCircle,
  Bot,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ChatbotStudio } from "@/components/chatbot/chatbot-studio";

type Schedule = { id: string; group_jid: string; group_name: string; message_text: string; schedule_time: string; is_active: boolean; last_sent_at: string | null; created_at: string };
type BaileysChat = { id: string; name?: string; type?: string; unreadCount?: number; conversationTimestamp?: number };

interface Template {
  id: string;
  name: string;
  body_text: string;
  header_media_url?: string | null;
  header_format?: string | null;
  header_content?: string | null;
  footer_text?: string | null;
  buttons?: any;
  language?: string;
}

export default function CoexistenceSetupPage() {
  const [activeTab, setActiveTab] = useState<string>("chats");
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("wacrm_coex_status") || "checking";
    }
    return "checking";
  });
  
  // Chats & Groups State with sessionStorage cache to prevent 0 chat flashes
  const [chats, setChats] = useState<BaileysChat[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("wacrm_cached_chats");
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return [];
  });
  const [fetchingChats, setFetchingChats] = useState(false);
  const [searchChat, setSearchChat] = useState("");
  const [chatFilter, setChatFilter] = useState<"all" | "direct" | "groups">("all");

  // Auto Reply State
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplyText, setAutoReplyText] = useState("");
  const [savingAutoReply, setSavingAutoReply] = useState(false);

  // Bulk Dispatch State
  const [dispatchMode, setDispatchMode] = useState<"groups" | "numbers">("numbers");
  const [pastedNumbers, setPastedNumbers] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [searchGroupQuery, setSearchGroupQuery] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [sendingBulk, setSendingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);

  // Schedules State
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [newScheduleGroupJid, setNewScheduleGroupJid] = useState("");
  const [newScheduleGroupName, setNewScheduleGroupName] = useState("");
  const [newScheduleMessage, setNewScheduleMessage] = useState("");
  const [newScheduleTime, setNewScheduleTime] = useState("");
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Send Message Modal State
  const [selectedChat, setSelectedChat] = useState<BaileysChat | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [quickMessageText, setQuickMessageText] = useState("");
  const [sendingQuick, setSendingQuick] = useState(false);

  const disconnectCounterRef = useRef(0);

  const isConnected = status === "connected" || status === "open" || status === "PAIRED";
  const isChecking = status === "checking" || status === "connecting" || status === "reconnecting";

  const detectedNumbersList = useMemo(() => {
    return pastedNumbers
      .split(/[\n,]+/)
      .map((n) => n.trim().replace(/\D/g, ""))
      .filter((n) => n.length >= 8);
  }, [pastedNumbers]);
  const detectedNumbersCount = detectedNumbersList.length;

  const groups = chats.filter((c) => c.type === "group" || c.id.includes("@g.us"));
  const filteredGroups = groups.filter((g) => (g.name || "").toLowerCase().includes(searchGroupQuery.toLowerCase()) || g.id.toLowerCase().includes(searchGroupQuery.toLowerCase()));

  const filteredChats = chats.filter((c) => {
    const isGroup = c.type === "group" || c.id.includes("@g.us");
    if (chatFilter === "groups" && !isGroup) return false;
    if (chatFilter === "direct" && isGroup) return false;

    if (searchChat.trim()) {
      const q = searchChat.toLowerCase();
      const name = (c.name || "").toLowerCase();
      const id = c.id.toLowerCase();
      return name.includes(q) || id.includes(q);
    }
    return true;
  }).sort((a, b) => (b.conversationTimestamp || 0) - (a.conversationTimestamp || 0));

  // Poll connection status with debounce
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/whatsapp/coexistence/status", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          const currentStatus = data.state || data.status || "disconnected";
          
          if (currentStatus === "connected" || currentStatus === "open" || currentStatus === "PAIRED") {
            disconnectCounterRef.current = 0;
            setStatus("open");
            if (typeof window !== "undefined") {
              localStorage.setItem("wacrm_coex_status", "connected");
            }
            setQrCodeBase64(null);
          } else if (currentStatus === "connecting" || currentStatus === "reconnecting") {
            setStatus("connecting");
          } else if (currentStatus === "disconnected") {
            // Require 3 consecutive polls to confirm actual disconnect before swapping UI
            disconnectCounterRef.current += 1;
            const wasConnected = typeof window !== "undefined" && localStorage.getItem("wacrm_coex_status") === "connected";
            if (!wasConnected || disconnectCounterRef.current >= 3) {
              setStatus("disconnected");
              if (typeof window !== "undefined") {
                localStorage.removeItem("wacrm_coex_status");
              }
            }
          }
          
          if (data.qr) {
            setQrCodeBase64(data.qr);
          }
        }
      } catch (error) { 
        console.error("Status fetch error:", error); 
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchChatsAndGroups = useCallback(async (notify = false) => {
    setFetchingChats(true);
    try {
      const res = await fetch("/api/whatsapp/baileys/chats");
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        setChats(data.data);
        if (typeof window !== "undefined") {
          try { sessionStorage.setItem("wacrm_cached_chats", JSON.stringify(data.data)); } catch {}
        }
        if (notify) toast.success(`Synced ${data.data.length} chats & groups from WhatsApp!`);
      }
    } catch (error) { 
      if (notify) toast.error("Failed to fetch chats");
    } finally {
      setFetchingChats(false);
    }
  }, []);

  useEffect(() => { 
    if (isConnected) {
      fetchChatsAndGroups();
    }
  }, [isConnected, fetchChatsAndGroups]);

  useEffect(() => {
    if (!isConnected) return;
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/whatsapp/baileys/settings");
        const data = await res.json();
        if (data.settings) { 
          setAutoReplyEnabled(data.settings.auto_reply_enabled); 
          setAutoReplyText(data.settings.auto_reply_text || ""); 
        }
      } catch (error) { 
        console.error("Settings fetch error:", error); 
      }
    };
    fetchSettings();
  }, [isConnected]);

  const handleCreateInstance = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/coexistence/create-instance", { method: "POST" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `API error: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.data?.qrcode?.base64 || data.qr) {
        setQrCodeBase64(data.data?.qrcode?.base64 || data.qr);
        toast.success("QR Code generated! Scan with your WhatsApp app.");
        if (data.state) setStatus(data.state);
      } else {
        toast.error("QR code not generated. Please try again.");
      }
    } catch (error: any) { 
      toast.error(error.message || "Failed to create instance"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Coexistence?")) return;
    try {
      const res = await fetch("/api/whatsapp/coexistence/disconnect", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setStatus("disconnected");
        setQrCodeBase64(null);
        setChats([]);
        setSchedules([]);
        toast.success("Disconnected successfully");
      } else {
        toast.error("Failed to disconnect");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to disconnect");
    }
  };

  const handleToggleAutoReply = async () => {
    setSavingAutoReply(true);
    try {
      const res = await fetch("/api/whatsapp/baileys/settings", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ auto_reply_enabled: !autoReplyEnabled, auto_reply_text: autoReplyText }) 
      });
      const data = await res.json();
      if (data.success) { 
        setAutoReplyEnabled(!autoReplyEnabled); 
        toast.success("Auto-reply preference updated"); 
      }
    } catch (error: any) { 
      toast.error(error.message); 
    } finally { 
      setSavingAutoReply(false); 
    }
  };

  const handleSaveAutoReply = async () => {
    setSavingAutoReply(true);
    try {
      const res = await fetch("/api/whatsapp/baileys/settings", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ auto_reply_enabled: autoReplyEnabled, auto_reply_text: autoReplyText }) 
      });
      const data = await res.json();
      if (data.success) toast.success("Auto-reply message saved");
    } catch (error: any) { 
      toast.error(error.message); 
    } finally { 
      setSavingAutoReply(false); 
    }
  };

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/baileys/schedules");
      const data = await res.json();
      if (data.schedules) setSchedules(data.schedules);
    } catch (error) { 
      console.error("Schedules error:", error); 
    }
  }, []);

  useEffect(() => {
    if (isConnected) {
      fetchSchedules();
      const interval = setInterval(fetchSchedules, 10000);
      return () => clearInterval(interval);
    }
  }, [isConnected, fetchSchedules]);

  const handleCreateSchedule = async () => {
    if (!newScheduleGroupJid || !newScheduleMessage || !newScheduleTime) { 
      toast.error("Please fill all required fields"); 
      return; 
    }
    setSavingSchedule(true);
    try {
      const res = await fetch("/api/whatsapp/baileys/schedules", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ 
          group_jid: newScheduleGroupJid, 
          group_name: newScheduleGroupName, 
          message_text: newScheduleMessage, 
          schedule_time: newScheduleTime 
        }) 
      });
      const data = await res.json();
      if (data.success) { 
        toast.success("Schedule created successfully"); 
        setNewScheduleGroupJid(""); 
        setNewScheduleGroupName(""); 
        setNewScheduleMessage(""); 
        setNewScheduleTime(""); 
        await fetchSchedules(); 
      }
    } catch (error: any) { 
      toast.error(error.message); 
    } finally { 
      setSavingSchedule(false); 
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm("Delete schedule?")) return;
    try {
      const res = await fetch("/api/whatsapp/baileys/schedules", { 
        method: "DELETE", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ schedule_id: scheduleId }) 
      });
      const data = await res.json();
      if (data.success) { 
        toast.success("Schedule deleted"); 
        await fetchSchedules(); 
      }
    } catch (error: any) { 
      toast.error(error.message); 
    }
  };

  // Bulk Dispatch Handler (Supports both Direct Numbers and Groups)
  const handleSendBulk = async () => {
    if (!bulkMessage.trim()) { 
      toast.error("Please enter a message to send"); 
      return; 
    }

    let targetRecipients: string[] = [];

    if (dispatchMode === "numbers") {
      const numbers = pastedNumbers
        .split(/[\n,]+/)
        .map((n) => n.trim().replace(/\D/g, ""))
        .filter((n) => n.length >= 8);

      if (numbers.length === 0) {
        toast.error("Please paste at least one valid phone number (e.g. 919876543210)");
        return;
      }
      targetRecipients = numbers.map((n) => `${n}@s.whatsapp.net`);
    } else {
      if (selectedGroups.length === 0) {
        toast.error("Please select at least one WhatsApp group");
        return;
      }
      targetRecipients = selectedGroups;
    }

    setSendingBulk(true);
    setBulkProgress(0);
    setBulkTotal(targetRecipients.length);
    let successCount = 0;

    try {
      for (let i = 0; i < targetRecipients.length; i++) {
        try {
          const res = await fetch("/api/whatsapp/baileys/send", { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ to: targetRecipients[i], message: bulkMessage }) 
          });
          if (res.ok) successCount++;
        } catch (err) { 
          console.error("Send error", targetRecipients[i]); 
        }
        setBulkProgress(i + 1);
        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      if (successCount > 0) { 
        toast.success(`Successfully dispatched to ${successCount}/${targetRecipients.length} recipients!`); 
        setBulkMessage(""); 
        if (dispatchMode === "numbers") setPastedNumbers("");
        else setSelectedGroups([]); 
      }
    } catch (error: any) { 
      toast.error(error.message); 
    } finally { 
      setSendingBulk(false); 
    }
  };

  const toggleGroupSelection = (groupId: string) => setSelectedGroups((prev) => prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]);
  const selectAllGroups = () => setSelectedGroups(filteredGroups.map((g) => g.id));
  const deselectAllGroups = () => setSelectedGroups([]);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const openSendModal = async (chat: BaileysChat) => {
    setSelectedChat(chat);
    setQuickMessageText("");
    setSelectedTemplateId("");
    if (templates.length === 0) {
      try {
        const res = await fetch("/api/whatsapp/templates?status=all");
        const data = await res.json();
        if (data.templates) setTemplates(data.templates);
      } catch (err) {
        console.error("Failed to load templates", err);
      }
    }
  };

  const handleSendQuickMessage = async () => {
    if (!selectedChat || (!quickMessageText.trim() && !selectedTemplateId)) return;
    setSendingQuick(true);
    try {
      const tmpl = templates.find((t) => t.id === selectedTemplateId);
      const res = await fetch("/api/whatsapp/baileys/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedChat.id,
          message: quickMessageText,
          mediaUrl: tmpl?.header_media_url || null,
          mediaType: tmpl?.header_format || null,
          templateName: tmpl?.name || null,
          templateLanguage: tmpl?.language || "en_US"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");
      
      toast.success("Message dispatched via Coexistence!");
      setSelectedChat(null);
      setQuickMessageText("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setSendingQuick(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-card border border-border/80 rounded-2xl shadow-xs">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="rounded-xl border-border/80">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                  <span>Fast Coexistence</span>
                  <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-[10px] uppercase font-bold">
                    QR Sync Engine
                  </Badge>
                </h1>
                <p className="text-xs text-muted-foreground">
                  Run WhatsApp directly on your physical mobile phone while automating replies & bulk broadcasts.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isConnected && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchChatsAndGroups(true)} 
                disabled={fetchingChats}
                className="rounded-xl text-xs font-semibold gap-1.5 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", fetchingChats && "animate-spin")} />
                <span>Fetch Groups & Chats</span>
              </Button>
            )}

            <Badge className={cn("px-4 py-2 border text-xs font-bold rounded-xl flex items-center gap-2", 
              isConnected 
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" 
                : isChecking 
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/30" 
                  : "bg-rose-500/10 text-rose-600 border-rose-500/30"
            )}>
              <span className={cn("h-2.5 w-2.5 rounded-full animate-pulse", 
                isConnected ? "bg-emerald-500" : isChecking ? "bg-amber-500" : "bg-rose-500"
              )} />
              {isConnected ? "Connected & Active" : isChecking ? "Syncing Connection..." : "Disconnected"}
            </Badge>
          </div>
        </div>

        {/* VIEW 0: CHECKING / CONNECTING IN PROGRESS (Prevents false disconnect UI flash on refresh) */}
        {!isConnected && isChecking && !qrCodeBase64 && (
          <Card className="border-border/80 bg-card rounded-2xl p-12 text-center shadow-xs">
            <div className="flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">Syncing WhatsApp Connection</h3>
                <p className="text-xs text-muted-foreground">
                  Validating your linked WhatsApp session and restoring active conversations...
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* VIEW 1: DISCONNECTED (NO QR YET & NOT CHECKING) */}
        {!isConnected && !isChecking && !qrCodeBase64 && (
          <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-card to-card rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3 max-w-xl">
                  <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 font-bold px-3 py-1 text-xs">
                    ⚡ Instant WhatsApp Coexistence
                  </Badge>
                  <CardTitle className="text-3xl font-extrabold text-foreground">
                    Connect Your Phone QR Code
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                    Link your active WhatsApp phone number in seconds. Use your existing phone app alongside ChatFlyr CRM for automated replies, contact group broadcasts, and scheduled messages.
                  </CardDescription>
                </div>
                
                <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-inner">
                  <QrCode className="h-14 w-14" />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-y border-border/60">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border/60">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold">Simultaneous Usage</h4>
                    <p className="text-[11px] text-muted-foreground">Keep using WhatsApp on your phone while CRM automations run in background.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border/60">
                  <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold">No Account Loss</h4>
                    <p className="text-[11px] text-muted-foreground">Maintains regular mobile session without disrupting existing contacts or chats.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border/60">
                  <Zap className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold">Instant Setup</h4>
                    <p className="text-[11px] text-muted-foreground">Scan QR code using WhatsApp Link a Device feature for 1-click connection.</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleCreateInstance} 
                disabled={loading} 
                size="lg" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 text-sm rounded-xl shadow-md transition-all gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating WhatsApp QR Code...
                  </>
                ) : (
                  <>
                    <QrCode className="h-5 w-5" />
                    Generate QR Code & Connect WhatsApp
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* VIEW 2: DISCONNECTED (QR CODE DISPLAY) */}
        {!isConnected && qrCodeBase64 && (
          <Card className="border-emerald-500/30 bg-card rounded-2xl shadow-md overflow-hidden">
            <CardHeader className="text-center pb-2">
              <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 mb-2 w-fit mx-auto font-bold px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                WAITING FOR PHONE SCAN
              </Badge>
              <CardTitle className="text-2xl font-bold">Scan QR Code with WhatsApp</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex flex-col items-center gap-6 p-6">
              <div className="bg-white p-6 rounded-2xl shadow-xl border-4 border-emerald-500/20">
                <img src={qrCodeBase64} alt="WhatsApp QR Code" className="w-64 h-64 object-contain" />
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-4 py-2 rounded-xl">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                <span>QR code refreshes automatically. Scan within 2 minutes.</span>
              </div>
              
              <div className="flex gap-3 w-full max-w-sm">
                <Button onClick={() => setQrCodeBase64(null)} variant="outline" className="flex-1 rounded-xl text-xs font-semibold">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleCreateInstance} variant="outline" className="flex-1 rounded-xl text-xs font-semibold border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10">
                  <QrCode className="h-4 w-4 mr-2" />
                  Refresh QR
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* VIEW 3: CONNECTED DASHBOARD */}
        {isConnected && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="rounded-2xl border-border/80 shadow-xs">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Connection Status</p>
                    <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">Active</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/80 shadow-xs">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Synced Chats</p>
                    <p className="text-2xl font-extrabold text-foreground mt-1">{chats.length}</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/80 shadow-xs">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">WhatsApp Groups</p>
                    <p className="text-2xl font-extrabold text-foreground mt-1">{groups.length}</p>
                  </div>
                  <div className="p-3 bg-violet-500/10 text-violet-600 rounded-2xl">
                    <Users className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/80 shadow-xs">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Active Schedules</p>
                    <p className="text-2xl font-extrabold text-foreground mt-1">{schedules.filter((s) => s.is_active).length}</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
                    <Clock className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-2xl border-border/80 shadow-xs bg-gradient-to-r from-card via-card to-purple-500/5">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl border border-purple-500/20 shadow-xs">
                      <Bot className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-foreground">AI Auto-Reply & Follow-up Engine</p>
                        <Badge variant="outline" className={cn("px-2.5 py-0.5 font-bold text-[10px] rounded-lg", autoReplyEnabled ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-purple-500/10 text-purple-600 border-purple-500/30")}>
                          {autoReplyEnabled ? "ACTIVE (ON)" : "AI STUDIO READY"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Automated AI replies, keyword match triggers, and multi-step lead follow-up drip sequences for incoming WhatsApp Coexistence messages.</p>
                    </div>
                  </div>

                  <Button 
                    size="sm" 
                    onClick={() => setActiveTab("chatbot")}
                    className="rounded-xl text-xs font-bold gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-600/20 shrink-0"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Open AI Chatbot & Follow-ups Studio
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* ENHANCED TAB NAVIGATION BUTTONS: FULLY VISIBLE & NO SCROLLBAR */}
              <TabsList className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 !h-auto group-data-horizontal/tabs:!h-auto overflow-visible p-2 bg-muted/70 dark:bg-muted/30 border border-border/80 rounded-2xl shadow-inner">
                {/* TAB 1: CHATS */}
                <TabsTrigger 
                  value="chats" 
                  className="min-h-[52px] h-auto py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 border border-border/60 shadow-xs data-[state=inactive]:bg-card data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-accent/60 data-[state=inactive]:hover:text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-600/30 data-[state=active]:border-emerald-400 flex items-center justify-center gap-2"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-500/15 data-[state=active]:bg-white/20 shrink-0">
                    <MessageSquare className="h-4 w-4 shrink-0" />
                  </div>
                  <span className="truncate">Chats</span>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 data-[state=active]:bg-white/25 data-[state=active]:text-white data-[state=active]:border-white/30 shrink-0">
                    {chats.length}
                  </span>
                </TabsTrigger>

                {/* TAB 2: AI AUTO-REPLY & FOLLOW-UPS */}
                <TabsTrigger 
                  value="chatbot" 
                  className="min-h-[52px] h-auto py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 border border-border/60 shadow-xs data-[state=inactive]:bg-card data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-accent/60 data-[state=inactive]:hover:text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-600/30 data-[state=active]:border-purple-400 flex items-center justify-center gap-2"
                >
                  <div className="p-1.5 rounded-lg bg-purple-500/15 data-[state=active]:bg-white/20 shrink-0">
                    <Bot className="h-4 w-4 shrink-0" />
                  </div>
                  <span className="truncate">AI Bot & Follow-ups</span>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-800 dark:text-purple-200 border border-purple-500/30 data-[state=active]:bg-white/25 data-[state=active]:text-white data-[state=active]:border-white/30 shrink-0">
                    Studio
                  </span>
                </TabsTrigger>

                {/* TAB 3: BULK DISPATCH */}
                <TabsTrigger 
                  value="messaging" 
                  className="min-h-[52px] h-auto py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 border border-border/60 shadow-xs data-[state=inactive]:bg-card data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-accent/60 data-[state=inactive]:hover:text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/30 data-[state=active]:border-blue-400 flex items-center justify-center gap-2"
                >
                  <div className="p-1.5 rounded-lg bg-blue-500/15 data-[state=active]:bg-white/20 shrink-0">
                    <Send className="h-4 w-4 shrink-0" />
                  </div>
                  <span className="truncate">Bulk Dispatch</span>
                  <span className="text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-800 dark:text-blue-200 border border-blue-500/30 data-[state=active]:bg-white/25 data-[state=active]:text-white data-[state=active]:border-white/30 shrink-0">
                    Fast
                  </span>
                </TabsTrigger>

                {/* TAB 4: GROUPS */}
                <TabsTrigger 
                  value="groups" 
                  className="min-h-[52px] h-auto py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 border border-border/60 shadow-xs data-[state=inactive]:bg-card data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-accent/60 data-[state=inactive]:hover:text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-600/30 data-[state=active]:border-violet-400 flex items-center justify-center gap-2"
                >
                  <div className="p-1.5 rounded-lg bg-violet-500/15 data-[state=active]:bg-white/20 shrink-0">
                    <Users className="h-4 w-4 shrink-0" />
                  </div>
                  <span className="truncate">Groups</span>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-800 dark:text-violet-200 border border-violet-500/30 data-[state=active]:bg-white/25 data-[state=active]:text-white data-[state=active]:border-white/30 shrink-0">
                    {groups.length}
                  </span>
                </TabsTrigger>

                {/* TAB 5: SCHEDULES */}
                <TabsTrigger 
                  value="schedules" 
                  className="min-h-[52px] h-auto py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 border border-border/60 shadow-xs data-[state=inactive]:bg-card data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-accent/60 data-[state=inactive]:hover:text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-600/30 data-[state=active]:border-amber-400 flex items-center justify-center gap-2"
                >
                  <div className="p-1.5 rounded-lg bg-amber-500/15 data-[state=active]:bg-white/20 shrink-0">
                    <Calendar className="h-4 w-4 shrink-0" />
                  </div>
                  <span className="truncate">Schedules</span>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30 data-[state=active]:bg-white/25 data-[state=active]:text-white data-[state=active]:border-white/30 shrink-0">
                    {schedules.length}
                  </span>
                </TabsTrigger>

                {/* TAB 6: SETTINGS */}
                <TabsTrigger 
                  value="settings" 
                  className="min-h-[52px] h-auto py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 border border-border/60 shadow-xs data-[state=inactive]:bg-card data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-accent/60 data-[state=inactive]:hover:text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-700 data-[state=active]:to-slate-900 dark:data-[state=active]:from-slate-700 dark:data-[state=active]:to-slate-800 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-slate-700/30 data-[state=active]:border-slate-500 flex items-center justify-center gap-2"
                >
                  <div className="p-1.5 rounded-lg bg-slate-500/15 data-[state=active]:bg-white/20 shrink-0">
                    <Settings className="h-4 w-4 shrink-0" />
                  </div>
                  <span className="truncate">Settings</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-800 dark:text-slate-200 border border-slate-500/30 data-[state=active]:bg-white/25 data-[state=active]:text-white data-[state=active]:border-white/30 shrink-0">
                    Config
                  </span>
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: CHATS (Migrated directly into Coexistence!) */}
              <TabsContent value="chats" className="space-y-4 mt-6">
                <Card className="rounded-2xl border-border/80 overflow-hidden shadow-xs">
                  <CardHeader className="p-5 border-b border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <span>WhatsApp Chats</span>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold text-[11px]">
                          {filteredChats.length} Active
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs">Live phone conversations synced in real-time through Coexistence.</CardDescription>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => fetchChatsAndGroups(true)} 
                      disabled={fetchingChats} 
                      className="rounded-xl text-xs gap-1.5 self-start sm:self-auto font-bold border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", fetchingChats && "animate-spin")} />
                      Sync From WhatsApp
                    </Button>
                  </CardHeader>

                  <div className="p-4 border-b border-border/80 flex flex-col sm:flex-row gap-3 items-center justify-between bg-card">
                    <div className="relative w-full sm:max-w-md">
                      <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search contact name, group, or phone number..." 
                        value={searchChat}
                        onChange={(e) => setSearchChat(e.target.value)}
                        className="pl-10 text-xs rounded-xl h-10 bg-muted/30 border-border/80"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto p-1 bg-muted/60 rounded-xl">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setChatFilter("all")} 
                        className={cn("text-xs font-bold rounded-lg px-3.5 h-8", chatFilter === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground")}
                      >
                        All ({chats.length})
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setChatFilter("direct")} 
                        className={cn("text-xs font-bold rounded-lg px-3.5 h-8", chatFilter === "direct" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground")}
                      >
                        Direct ({chats.filter(c => c.type !== "group" && !c.id.includes("@g.us")).length})
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setChatFilter("groups")} 
                        className={cn("text-xs font-bold rounded-lg px-3.5 h-8", chatFilter === "groups" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground")}
                      >
                        Groups ({groups.length})
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-0 min-h-[350px]">
                    {fetchingChats ? (
                      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                        <p className="text-xs font-semibold">Syncing WhatsApp chats...</p>
                      </div>
                    ) : filteredChats.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
                        <MessageSquare className="h-12 w-12 stroke-[1.5] text-muted-foreground/30" />
                        <p className="text-sm font-bold text-foreground">No conversations found</p>
                        <p className="text-xs text-muted-foreground max-w-sm text-center">
                          Click "Sync From WhatsApp" above to pull conversations directly from your connected device.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/60">
                        {filteredChats.map((chat) => (
                          <div 
                            key={chat.id} 
                            onClick={() => openSendModal(chat)}
                            className="flex items-center justify-between p-4 hover:bg-muted/40 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className={cn(
                                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-bold border shadow-xs",
                                chat.type === "group" || chat.id.includes("@g.us")
                                  ? "bg-violet-500/10 text-violet-600 border-violet-500/20"
                                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              )}>
                                {chat.type === "group" || chat.id.includes("@g.us") ? <Users className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm text-foreground leading-tight truncate">
                                  {chat.name || chat.id.split("@")[0]}
                                </h4>
                                <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate max-w-xs sm:max-w-md">
                                  {chat.id}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              {chat.unreadCount ? (
                                <span className="inline-flex items-center justify-center rounded-full bg-emerald-600 min-w-[20px] h-[20px] px-2 text-[10px] font-bold text-white shadow-xs">
                                  {chat.unreadCount}
                                </span>
                              ) : null}
                              <Button 
                                size="sm" 
                                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5 shadow-xs px-3.5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openSendModal(chat);
                                }}
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Message</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 2: AI AUTO-REPLY CHATBOT & FOLLOW-UPS STUDIO */}
              <TabsContent value="chatbot" className="space-y-6 mt-6">
                <ChatbotStudio />
              </TabsContent>

              {/* TAB 3: BULK DISPATCH (Includes Paste Numbers + Groups!) */}
              <TabsContent value="messaging" className="space-y-6 mt-6">
                <Card className="rounded-2xl border-border/80 shadow-xs">
                  <CardHeader className="border-b border-border/80 bg-muted/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          <span>Fast Bulk Dispatch</span>
                          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-[10px] font-bold">
                            Direct Baileys Engine
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-xs">Broadcast direct messages to raw phone numbers or multiple WhatsApp groups without approvals.</CardDescription>
                      </div>
                      
                      <div className="flex items-center p-1.5 bg-background border border-border/80 rounded-2xl shadow-xs">
                        <button
                          type="button"
                          onClick={() => setDispatchMode("numbers")}
                          className={cn("px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2", dispatchMode === "numbers" ? "bg-emerald-600 text-white shadow-md" : "text-muted-foreground hover:text-foreground")}
                        >
                          <span>📋 Paste Direct Numbers</span>
                          {detectedNumbersCount > 0 && (
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-black", dispatchMode === "numbers" ? "bg-white/20 text-white" : "bg-muted text-foreground")}>
                              {detectedNumbersCount}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDispatchMode("groups")}
                          className={cn("px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2", dispatchMode === "groups" ? "bg-emerald-600 text-white shadow-md" : "text-muted-foreground hover:text-foreground")}
                        >
                          <span>👥 WhatsApp Groups</span>
                          {selectedGroups.length > 0 && (
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-black", dispatchMode === "groups" ? "bg-white/20 text-white" : "bg-muted text-foreground")}>
                              {selectedGroups.length}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-5 p-6">
                    {/* MODE 1: PASTE NUMBERS */}
                    {dispatchMode === "numbers" ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold flex items-center gap-2">
                            <span>Paste Phone Numbers *</span>
                            <span className="text-[11px] text-muted-foreground font-normal">(one per line or comma-separated)</span>
                          </Label>
                          <div className="flex items-center gap-2">
                            {detectedNumbersCount > 0 ? (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs font-bold px-3 py-1">
                                ✓ {detectedNumbersCount} Valid Numbers Detected
                              </Badge>
                            ) : null}
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setPastedNumbers("919876543210\n919876543211\n919876543212")} 
                              className="text-[11px] h-7 rounded-lg"
                            >
                              Insert Sample
                            </Button>
                          </div>
                        </div>
                        <Textarea 
                          placeholder="919876543210&#10;919876543211&#10;919876543212" 
                          value={pastedNumbers} 
                          onChange={(e) => setPastedNumbers(e.target.value)} 
                          className="min-h-40 font-mono text-xs rounded-xl bg-background border-border/80 p-3 leading-relaxed" 
                        />
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border/60">
                          <span>💡 Format Tip: Enter full phone numbers with country code prefix (e.g. 91 for India, 1 for USA).</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Sent directly via your connected phone</span>
                        </div>
                      </div>
                    ) : (
                      /* MODE 2: SELECT GROUPS */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold">Target Groups ({selectedGroups.length} of {groups.length} selected)</Label>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={selectAllGroups} className="h-8 text-xs font-bold rounded-lg border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10">
                              Select All ({filteredGroups.length})
                            </Button>
                            <Button size="sm" variant="outline" onClick={deselectAllGroups} className="h-8 text-xs rounded-lg">
                              Clear Selection
                            </Button>
                          </div>
                        </div>
                        
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Search group name..." 
                            value={searchGroupQuery} 
                            onChange={(e) => setSearchGroupQuery(e.target.value)} 
                            className="pl-10 text-xs rounded-xl h-10 bg-background" 
                          />
                        </div>
                        
                        {filteredGroups.length === 0 ? (
                          <div className="text-center py-10 p-4 rounded-xl border border-dashed border-border bg-muted/20">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-30 text-muted-foreground" />
                            <p className="text-xs font-semibold text-foreground">No WhatsApp groups found</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Click "Sync From WhatsApp" at top or switch to "Paste Direct Numbers" above.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto p-1">
                            {filteredGroups.map((group) => {
                              const isSelected = selectedGroups.includes(group.id);
                              return (
                                <button 
                                  key={group.id} 
                                  type="button"
                                  onClick={() => toggleGroupSelection(group.id)} 
                                  className={cn(
                                    "flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left shadow-xs", 
                                    isSelected 
                                      ? "bg-emerald-500/15 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold ring-1 ring-emerald-500/40" 
                                      : "hover:bg-muted/60 bg-card border-border/80"
                                  )}
                                >
                                  <div className={cn(
                                    "h-5 w-5 rounded-md border flex items-center justify-center text-xs shrink-0 transition-colors", 
                                    isSelected ? "bg-emerald-600 text-white border-emerald-600" : "border-muted-foreground/40 bg-background"
                                  )}>
                                    {isSelected && "✓"}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold truncate leading-tight">{group.name || group.id}</p>
                                    <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">{group.id}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="space-y-2 pt-2 border-t border-border/60">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold">Message Content *</Label>
                        <span className="text-[11px] text-muted-foreground font-mono">{bulkMessage.length} characters</span>
                      </div>
                      <Textarea 
                        placeholder="Type broadcast message text here... (supports emojis 😊, line breaks, links)" 
                        value={bulkMessage} 
                        onChange={(e) => setBulkMessage(e.target.value)} 
                        className="min-h-32 text-xs rounded-xl bg-background border-border/80 p-3 leading-relaxed" 
                      />
                    </div>
                    
                    {sendingBulk && (
                      <div className="space-y-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                        <div className="flex justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Dispatching WhatsApp messages...
                          </span>
                          <span>{bulkProgress} / {bulkTotal}</span>
                        </div>
                        <div className="w-full bg-emerald-500/20 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-emerald-600 h-full transition-all duration-300" style={{ width: `${(bulkProgress / bulkTotal) * 100}%` }} />
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleSendBulk} 
                      disabled={sendingBulk || !bulkMessage.trim() || (dispatchMode === "numbers" ? detectedNumbersCount === 0 : selectedGroups.length === 0)} 
                      className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/25 gap-2 transition-all"
                    >
                      {sendingBulk ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Sending Messages ({bulkProgress}/{bulkTotal})...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          <span>{dispatchMode === "numbers" ? `Send Broadcast to ${detectedNumbersCount} Numbers Now` : `Send Broadcast to ${selectedGroups.length} Groups Now`}</span>
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 3: GROUPS LIST */}
              <TabsContent value="groups" className="space-y-6 mt-6">
                <Card className="rounded-2xl border-border/80 shadow-xs">
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 bg-muted/20">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <span>Synced WhatsApp Groups</span>
                        <Badge variant="outline" className="bg-violet-500/10 text-violet-600 border-violet-500/30 text-[11px] font-bold">
                          {groups.length} Groups
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs">All active groups associated with your connected phone.</CardDescription>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => fetchChatsAndGroups(true)} 
                      disabled={fetchingChats} 
                      className="rounded-xl text-xs gap-1.5 font-bold border-violet-500/30 text-violet-600 hover:bg-violet-500/10"
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", fetchingChats && "animate-spin")} />
                      Refresh Groups
                    </Button>
                  </CardHeader>
                  <CardContent className="p-6">
                    {groups.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground space-y-2">
                        <Users className="h-10 w-10 mx-auto mb-3 opacity-30 text-violet-500" />
                        <p className="text-xs font-bold text-foreground">No groups synced yet</p>
                        <p className="text-[11px] text-muted-foreground">Click "Refresh Groups" above to fetch your participating groups directly from WhatsApp.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {groups.map((group) => (
                          <div key={group.id} className="p-4 rounded-xl border border-border/80 bg-card hover:border-violet-500/40 transition-colors shadow-xs flex flex-col justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-lg bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
                                  <Users className="h-4 w-4" />
                                </div>
                                <p className="font-bold text-xs text-foreground truncate">{group.name || group.id}</p>
                              </div>
                              <p className="text-[10px] text-muted-foreground font-mono truncate pl-9">{group.id}</p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                setSelectedGroups([group.id]);
                                setDispatchMode("groups");
                                const btn = document.querySelector('[data-state="inactive"][value="messaging"]') as HTMLElement;
                                if (btn) btn.click();
                              }}
                              className="text-xs font-bold text-violet-600 border-violet-500/30 hover:bg-violet-500/10 rounded-xl w-full gap-1.5 h-8"
                            >
                              <Send className="h-3 w-3" />
                              Dispatch to this Group
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 4: SCHEDULES */}
              <TabsContent value="schedules" className="space-y-6 mt-6">
                <Card className="rounded-2xl border-border/80 shadow-xs">
                  <CardHeader className="border-b border-border/80 bg-muted/20">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <span>Scheduled Messages</span>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[11px] font-bold">
                        {schedules.length} Scheduled
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">Schedule messages to be automatically sent to WhatsApp groups at a specified time.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <div className="space-y-3.5 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                      <h3 className="font-extrabold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">Create New Scheduled Dispatch</h3>
                      <select 
                        value={newScheduleGroupJid} 
                        onChange={(e) => { 
                          const group = groups.find((g) => g.id === e.target.value); 
                          setNewScheduleGroupJid(e.target.value); 
                          setNewScheduleGroupName(group?.name || ""); 
                        }} 
                        className="w-full px-3 py-2.5 rounded-xl bg-background border border-border/80 text-xs font-semibold"
                      >
                        <option value="">Select Target Group...</option>
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>{g.name || g.id}</option>
                        ))}
                      </select>
                      
                      <Input type="datetime-local" value={newScheduleTime} onChange={(e) => setNewScheduleTime(e.target.value)} className="text-xs rounded-xl bg-background border-border/80 h-10" />
                      <Textarea placeholder="Scheduled message text..." value={newScheduleMessage} onChange={(e) => setNewScheduleMessage(e.target.value)} className="text-xs rounded-xl bg-background border-border/80 min-h-24 p-3" />
                      
                      <Button onClick={handleCreateSchedule} disabled={savingSchedule} className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md">
                        {savingSchedule ? "Saving..." : "Save Scheduled Dispatch"}
                      </Button>
                    </div>

                    {schedules.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-bold text-foreground">Upcoming Schedules</h4>
                        {schedules.map((s) => (
                          <div key={s.id} className="p-4 rounded-xl border border-border/80 flex items-center justify-between gap-4 bg-card shadow-xs">
                            <div className="space-y-1">
                              <p className="font-bold text-xs">{s.group_name || s.group_jid}</p>
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                                <Clock className="h-3 w-3 text-amber-500" />
                                {formatDate(s.schedule_time)}
                              </p>
                              <p className="text-xs text-foreground/80 font-mono text-[11px] line-clamp-1">{s.message_text}</p>
                            </div>
                            <Button size="sm" onClick={() => handleDeleteSchedule(s.id)} variant="outline" className="text-xs font-bold rounded-xl text-rose-600 border-rose-500/30 hover:bg-rose-500/10">
                              Delete
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 5: SETTINGS */}
              <TabsContent value="settings" className="space-y-6 mt-6">
                <Card className="rounded-2xl border-border/80 shadow-xs">
                  <CardHeader className="border-b border-border/80 bg-muted/20">
                    <CardTitle className="text-lg font-bold">Coexistence Settings</CardTitle>
                    <CardDescription className="text-xs">Configure auto-reply automations and manage linked WhatsApp session.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 p-6">
                    <div className="p-5 rounded-2xl bg-card border border-border/80 space-y-4 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm text-foreground">Auto-Reply Configuration</p>
                          <p className="text-xs text-muted-foreground">Automatically reply to incoming messages received on this Coexistence WhatsApp line.</p>
                        </div>
                        <Switch checked={autoReplyEnabled} onCheckedChange={handleToggleAutoReply} />
                      </div>
                      
                      {autoReplyEnabled && (
                        <div className="space-y-3 pt-2">
                          <Textarea 
                            placeholder="Type auto-reply message text..." 
                            value={autoReplyText} 
                            onChange={(e) => setAutoReplyText(e.target.value)} 
                            className="text-xs rounded-xl bg-background border-border/80 min-h-24 p-3 leading-relaxed" 
                          />
                          <Button onClick={handleSaveAutoReply} disabled={savingAutoReply} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-10 shadow-xs">
                            {savingAutoReply ? "Saving..." : "Save Auto-Reply Message"}
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                      <div>
                        <h4 className="font-bold text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wider">Device Management</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">Disconnecting will terminate the live background session on this server.</p>
                      </div>
                      <Button onClick={handleDisconnect} variant="destructive" className="w-full text-xs font-bold rounded-xl h-11">
                        <LogOut className="h-4 w-4 mr-2" />
                        Disconnect Coexistence Device
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Quick Send Message Dialog inside Coexistence */}
        <Dialog open={!!selectedChat} onOpenChange={(open) => !open && setSelectedChat(null)}>
          <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl bg-card">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white relative overflow-hidden">
              <DialogHeader className="relative z-10 text-left">
                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                  <Send className="w-5 h-5" />
                  Send WhatsApp Message
                </DialogTitle>
                <DialogDescription className="text-emerald-100 mt-1 text-xs">
                  Dispatching to <strong className="text-white font-bold">{selectedChat?.name || selectedChat?.id.split("@")[0]}</strong>
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-emerald-500" />
                  Select Template (Optional)
                </label>
                <Select 
                  value={selectedTemplateId} 
                  onValueChange={(val) => {
                    const id = val || "";
                    setSelectedTemplateId(id);
                    const tmpl = templates.find((t) => t.id === id);
                    if (tmpl) {
                      setQuickMessageText(tmpl.body_text || "");
                    }
                  }}
                >
                  <SelectTrigger className="w-full bg-background border-border/80 text-xs rounded-xl h-10">
                    <SelectValue placeholder="Choose a template or write custom text below..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-lg">
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="cursor-pointer text-xs">
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                  Message Content *
                </label>
                <Textarea 
                  placeholder="Type message text here..."
                  value={quickMessageText}
                  onChange={(e) => setQuickMessageText(e.target.value)}
                  className="resize-none min-h-[120px] bg-background border-border/80 text-xs rounded-xl p-3 leading-relaxed"
                />
              </div>
            </div>

            <DialogFooter className="p-6 pt-0 bg-card border-t border-border/60 flex items-center justify-between">
              <Button variant="ghost" size="sm" className="rounded-xl text-xs" onClick={() => setSelectedChat(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendQuickMessage} 
                disabled={sendingQuick || !quickMessageText.trim()}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2 shadow-sm gap-2"
              >
                {sendingQuick ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}