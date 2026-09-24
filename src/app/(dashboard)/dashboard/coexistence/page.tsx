"use client";

import { useCallback, useEffect, useState } from "react";
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
  Sparkles,
  Zap,
  ShieldCheck,
  RefreshCw,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Schedule = { id: string; group_jid: string; group_name: string; message_text: string; schedule_time: string; is_active: boolean; last_sent_at: string | null; created_at: string };
type BaileysGroup = { id: string; name?: string; type?: string };

export default function CoexistenceSetupPage() {
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("disconnected");
  const [baileysStats, setBaileysStats] = useState<{ chatCount: number } | null>(null);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplyText, setAutoReplyText] = useState("");
  const [savingAutoReply, setSavingAutoReply] = useState(false);
  const [groups, setGroups] = useState<BaileysGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [newScheduleGroupJid, setNewScheduleGroupJid] = useState("");
  const [newScheduleGroupName, setNewScheduleGroupName] = useState("");
  const [newScheduleMessage, setNewScheduleMessage] = useState("");
  const [newScheduleTime, setNewScheduleTime] = useState("");
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  const [sendingBulk, setSendingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);

  const filteredGroups = groups.filter((g) => (g.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || g.id.toLowerCase().includes(searchQuery.toLowerCase()));

  // Normalize status check
  const isConnected = status === "connected" || status === "open" || status === "PAIRED";

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/whatsapp/coexistence/status", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          // Normalize status response
          const currentStatus = data.state || data.status || "disconnected";
          setStatus(currentStatus);
          
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
        if (data.state) {
          setStatus(data.state);
        }
      } else {
        toast.error("QR code not generated. Please try again.");
      }
    } catch (error: any) { 
      console.error("Create instance error:", error);
      toast.error(error.message || "Failed to create instance"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Coexistence?")) return;
    
    try {
      const res = await fetch("/api/whatsapp/coexistence/disconnect", { method: "POST" });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `API error: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        setStatus("disconnected");
        setQrCodeBase64(null);
        setGroups([]);
        setSchedules([]);
        toast.success("Disconnected successfully");
      } else {
        toast.error("Failed to disconnect");
      }
    } catch (error: any) {
      console.error("Disconnect error:", error);
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

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/baileys/chats");
      const data = await res.json();
      if (data.data) setGroups(data.data);
    } catch (error) { 
      console.error("Failed to fetch groups"); 
    }
  }, []);

  useEffect(() => { 
    if (isConnected) fetchGroups(); 
  }, [isConnected, fetchGroups]);

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

  const handleSendBulk = async () => {
    if (!bulkMessage.trim() || selectedGroups.length === 0) { 
      toast.error("Enter a message and select at least one group"); 
      return; 
    }
    setSendingBulk(true);
    setBulkProgress(0);
    setBulkTotal(selectedGroups.length);
    let successCount = 0;
    try {
      for (let i = 0; i < selectedGroups.length; i++) {
        try {
          const res = await fetch("/api/whatsapp/baileys/send", { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ to: selectedGroups[i], message: bulkMessage }) 
          });
          if (res.ok) successCount++;
        } catch (err) { 
          console.error("Send error", selectedGroups[i]); 
        }
        setBulkProgress(i + 1);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      if (successCount > 0) { 
        toast.success(`Dispatched to ${successCount}/${selectedGroups.length} chats`); 
        setBulkMessage(""); 
        setSelectedGroups([]); 
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
          
          <Badge className={cn("px-4 py-2 border text-xs font-bold rounded-xl flex items-center gap-2", isConnected ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-rose-500/10 text-rose-600 border-rose-500/30")}>
            <span className={cn("h-2 w-2 rounded-full animate-pulse", isConnected ? "bg-emerald-500" : "bg-rose-500")} />
            {isConnected ? "Connected & Active" : "Disconnected"}
          </Badge>
        </div>

        {/* VIEW 1: DISCONNECTED (NO QR YET) */}
        {!isConnected && !qrCodeBase64 && (
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
                    <p className="text-2xl font-extrabold text-foreground mt-1">{groups.length}</p>
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
                    <p className="text-2xl font-extrabold text-foreground mt-1">{groups.filter((g) => g.type === "group" || g.id.includes("@g.us")).length}</p>
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

            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">Auto-Reply Engine {autoReplyEnabled ? "Active" : "Paused"}</p>
                      <p className="text-xs text-muted-foreground">Automated instant replies for incoming WhatsApp Coexistence messages.</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("px-3 py-1 font-bold text-xs rounded-lg", autoReplyEnabled ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-muted text-muted-foreground")}>
                    {autoReplyEnabled ? "ON" : "OFF"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="messaging" className="w-full">
              <TabsList className="grid w-full grid-cols-4 p-1 bg-muted rounded-xl">
                <TabsTrigger value="messaging" className="rounded-lg font-bold text-xs py-2">
                  <Send className="h-4 w-4 mr-2" />
                  Bulk Dispatch
                </TabsTrigger>
                <TabsTrigger value="groups" className="rounded-lg font-bold text-xs py-2">
                  <Users className="h-4 w-4 mr-2" />
                  Group List
                </TabsTrigger>
                <TabsTrigger value="schedules" className="rounded-lg font-bold text-xs py-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedules
                </TabsTrigger>
                <TabsTrigger value="settings" className="rounded-lg font-bold text-xs py-2">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="messaging" className="space-y-6 mt-6">
                <Card className="rounded-2xl border-border/80">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Bulk Group Dispatch</CardTitle>
                    <CardDescription className="text-xs">Broadcast messages to multiple WhatsApp chats or groups simultaneously.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold">Target Groups ({selectedGroups.length} selected)</Label>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={selectAllGroups} className="h-7 text-xs rounded-lg">Select All</Button>
                          <Button size="sm" variant="outline" onClick={deselectAllGroups} className="h-7 text-xs rounded-lg">Deselect All</Button>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search group name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 text-xs rounded-xl" />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
                        {filteredGroups.map((group) => (
                          <button 
                            key={group.id} 
                            onClick={() => toggleGroupSelection(group.id)} 
                            className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all text-left", selectedGroups.includes(group.id) ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold" : "hover:bg-muted border-border/60")}
                          >
                            <div className={cn("h-4 w-4 rounded border flex items-center justify-center text-[10px]", selectedGroups.includes(group.id) ? "bg-emerald-600 text-white border-emerald-600" : "border-border")} />
                            <span className="text-xs truncate">{group.name || group.id}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">Message Text</Label>
                      <Textarea placeholder="Type broadcast message..." value={bulkMessage} onChange={(e) => setBulkMessage(e.target.value)} className="min-h-32 text-xs rounded-xl" />
                    </div>
                    
                    {sendingBulk && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>Dispatching...</span>
                          <span>{bulkProgress}/{bulkTotal}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div className="bg-emerald-600 h-full transition-all" style={{ width: `${(bulkProgress / bulkTotal) * 100}%` }} />
                        </div>
                      </div>
                    )}
                    
                    <Button onClick={handleSendBulk} disabled={sendingBulk || selectedGroups.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl py-2.5">
                      {sendingBulk ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Dispatching Messages...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Bulk Broadcast Now
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="groups" className="space-y-6 mt-6">
                <Card className="rounded-2xl border-border/80">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Synced WhatsApp Groups & Chats</CardTitle>
                    <CardDescription className="text-xs">Live overview of synced phone conversations.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {groups.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-xs font-medium">No groups or chats synced yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {groups.map((group) => (
                          <div key={group.id} className="p-4 rounded-xl border border-border/80 bg-card space-y-1">
                            <p className="font-bold text-xs text-foreground truncate">{group.name || group.id}</p>
                            <p className="text-[10px] text-muted-foreground font-mono truncate">{group.id}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="schedules" className="space-y-6 mt-6">
                <Card className="rounded-2xl border-border/80">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Scheduled Messages</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 p-4 rounded-xl bg-muted/60 border border-border/60">
                      <h3 className="font-bold text-xs">Create New Schedule</h3>
                      <select 
                        value={newScheduleGroupJid} 
                        onChange={(e) => { 
                          const group = groups.find((g) => g.id === e.target.value); 
                          setNewScheduleGroupJid(e.target.value); 
                          setNewScheduleGroupName(group?.name || ""); 
                        }} 
                        className="w-full px-3 py-2 rounded-xl bg-background border border-border/80 text-xs font-medium"
                      >
                        <option value="">Select Target Group...</option>
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>{g.name || g.id}</option>
                        ))}
                      </select>
                      
                      <Input type="datetime-local" value={newScheduleTime} onChange={(e) => setNewScheduleTime(e.target.value)} className="text-xs rounded-xl bg-background" />
                      <Textarea placeholder="Scheduled message text..." value={newScheduleMessage} onChange={(e) => setNewScheduleMessage(e.target.value)} className="text-xs rounded-xl bg-background" />
                      
                      <Button onClick={handleCreateSchedule} disabled={savingSchedule} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl">
                        {savingSchedule ? "Saving..." : "Save Scheduled Dispatch"}
                      </Button>
                    </div>

                    {schedules.length > 0 && (
                      <div className="space-y-3 pt-2">
                        {schedules.map((s) => (
                          <div key={s.id} className="p-4 rounded-xl border border-border/80 flex items-center justify-between gap-4">
                            <div>
                              <p className="font-bold text-xs">{s.group_name || s.group_jid}</p>
                              <p className="text-[11px] text-muted-foreground">{formatDate(s.schedule_time)}</p>
                            </div>
                            <Button size="sm" onClick={() => handleDeleteSchedule(s.id)} variant="outline" className="text-xs font-semibold rounded-lg text-rose-600 border-rose-500/30">
                              Delete
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 mt-6">
                <Card className="rounded-2xl border-border/80">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Coexistence Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-xl bg-muted/60 border border-border/60 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-xs">Auto-Reply Configuration</p>
                          <p className="text-[11px] text-muted-foreground">Automatically reply to incoming messages on Coexistence.</p>
                        </div>
                        <Switch checked={autoReplyEnabled} onCheckedChange={handleToggleAutoReply} />
                      </div>
                      
                      {autoReplyEnabled && (
                        <div className="space-y-3 pt-2">
                          <Textarea placeholder="Type auto-reply message..." value={autoReplyText} onChange={(e) => setAutoReplyText(e.target.value)} className="text-xs rounded-xl bg-background" />
                          <Button onClick={handleSaveAutoReply} disabled={savingAutoReply} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl">
                            {savingAutoReply ? "Saving..." : "Save Auto-Reply Message"}
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <Button onClick={handleDisconnect} variant="destructive" className="w-full text-xs font-bold rounded-xl py-2.5">
                      <LogOut className="h-4 w-4 mr-2" />
                      Disconnect Coexistence Device
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

      </div>
    </div>
  );
}