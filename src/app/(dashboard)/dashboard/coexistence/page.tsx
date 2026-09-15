"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, QrCode, Loader2, CheckCircle2, Smartphone, LogOut, Clock, MessageSquare, Users, Send, Settings, Calendar, Search } from "lucide-react";
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

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/whatsapp/coexistence/status", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          // The coexistence status endpoint returns 'state' instead of 'status'
          setStatus(data.state || "disconnected");
          // Also update QR code if available
          if (data.qr && data.qr !== qrCodeBase64) {
            setQrCodeBase64(data.qr);
          }
        }
      } catch (error) { console.error("Status fetch error:", error); }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (status !== "connected") return;
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/whatsapp/baileys/settings");
        const data = await res.json();
        if (data.settings) { setAutoReplyEnabled(data.settings.auto_reply_enabled); setAutoReplyText(data.settings.auto_reply_text || ""); }
      } catch (error) { console.error("Settings fetch error:", error); }
    };
    fetchSettings();
  }, [status]);

  const handleCreateInstance = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/coexistence/create-instance", { method: "POST" });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `API error: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Check for QR code in the correct location - data.qrcode.base64
      if (data.data?.qrcode?.base64) {
        setQrCodeBase64(data.data.qrcode.base64);
        toast.success("QR Code generated");
        
        // Update status if provided
        if (data.state) {
          setStatus(data.state);
        }
      } else {
        toast.error("QR code not generated");
      }
    } catch (error: any) { 
      console.error("Create instance error:", error);
      toast.error(error.message || "Failed to create instance"); 
    }
    finally { setLoading(false); }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect?")) return;
    
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
      const res = await fetch("/api/whatsapp/baileys/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ auto_reply_enabled: !autoReplyEnabled, auto_reply_text: autoReplyText }) });
      const data = await res.json();
      if (data.success) { setAutoReplyEnabled(!autoReplyEnabled); toast.success("Updated"); }
    } catch (error: any) { toast.error(error.message); }
    finally { setSavingAutoReply(false); }
  };

  const handleSaveAutoReply = async () => {
    setSavingAutoReply(true);
    try {
      const res = await fetch("/api/whatsapp/baileys/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ auto_reply_enabled: autoReplyEnabled, auto_reply_text: autoReplyText }) });
      const data = await res.json();
      if (data.success) toast.success("Saved");
    } catch (error: any) { toast.error(error.message); }
    finally { setSavingAutoReply(false); }
  };

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/baileys/chats");
      const data = await res.json();
      if (data.data) setGroups(data.data);
    } catch (error) { toast.error("Failed to fetch groups"); }
  }, []);

  useEffect(() => { if (status === "connected") fetchGroups(); }, [status, fetchGroups]);

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/baileys/schedules");
      const data = await res.json();
      if (data.schedules) setSchedules(data.schedules);
    } catch (error) { console.error("Schedules error:", error); }
  }, []);

  useEffect(() => {
    if (status === "connected") {
      fetchSchedules();
      const interval = setInterval(fetchSchedules, 10000);
      return () => clearInterval(interval);
    }
  }, [status, fetchSchedules]);

  const handleCreateSchedule = async () => {
    if (!newScheduleGroupJid || !newScheduleMessage || !newScheduleTime) { toast.error("Fill all fields"); return; }
    setSavingSchedule(true);
    try {
      const res = await fetch("/api/whatsapp/baileys/schedules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ group_jid: newScheduleGroupJid, group_name: newScheduleGroupName, message_text: newScheduleMessage, schedule_time: newScheduleTime }) });
      const data = await res.json();
      if (data.success) { toast.success("Schedule created"); setNewScheduleGroupJid(""); setNewScheduleGroupName(""); setNewScheduleMessage(""); setNewScheduleTime(""); await fetchSchedules(); }
    } catch (error: any) { toast.error(error.message); }
    finally { setSavingSchedule(false); }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm("Delete?")) return;
    try {
      const res = await fetch("/api/whatsapp/baileys/schedules", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schedule_id: scheduleId }) });
      const data = await res.json();
      if (data.success) { toast.success("Deleted"); await fetchSchedules(); }
    } catch (error: any) { toast.error(error.message); }
  };

  const handleSendBulk = async () => {
    if (!bulkMessage.trim() || selectedGroups.length === 0) { toast.error("Enter message and select groups"); return; }
    setSendingBulk(true);
    setBulkProgress(0);
    setBulkTotal(selectedGroups.length);
    let successCount = 0;
    try {
      for (let i = 0; i < selectedGroups.length; i++) {
        try {
          const res = await fetch("/api/whatsapp/baileys/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: selectedGroups[i], message: bulkMessage }) });
          if (res.ok) successCount++;
        } catch (err) { console.error("Send error", selectedGroups[i]); }
        setBulkProgress(i + 1);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      if (successCount > 0) { toast.success(`Sent to ${successCount}/${selectedGroups.length}`); setBulkMessage(""); setSelectedGroups([]); }
    } catch (error: any) { toast.error(error.message); }
    finally { setSendingBulk(false); }
  };

  const toggleGroupSelection = (groupId: string) => setSelectedGroups((prev) => prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]);
  const selectAllGroups = () => setSelectedGroups(filteredGroups.map((g) => g.id));
  const deselectAllGroups = () => setSelectedGroups([]);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button></Link>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-500"><Smartphone className="h-6 w-6" /></div>
              <div><h1 className="text-2xl font-bold">Fast Coexistence</h1><p className="text-sm text-muted-foreground">Run WhatsApp on your phone while automating</p></div>
            </div>
          </div>
          <Badge className={cn("px-4 py-2 border", status === "connected" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20")}><div className="h-2 w-2 rounded-full mr-2 animate-pulse" />{status === "connected" ? "Connected" : "Disconnected"}</Badge>
        </div>

        {status === "disconnected" && !qrCodeBase64 && (
          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent mb-8">
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div><Badge className="bg-green-500/20 text-green-500 border-green-500/30 mb-4"><div className="h-2 w-2 rounded-full bg-green-500 mr-2" />GET STARTED</Badge><CardTitle className="text-3xl">Connect WhatsApp</CardTitle></div>
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-green-500/10"><Smartphone className="h-10 w-10 text-green-500" /></div>
              </div>
              <CardDescription className="max-w-lg">Scan the QR code to connect your WhatsApp and unlock automation, scheduling, bulk messaging, and more.</CardDescription>
            </CardHeader>
            <CardContent><Button onClick={handleCreateInstance} disabled={loading} size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white">{loading ? (<><Loader2 className="h-5 w-5 mr-2 animate-spin" />Generating QR...</>) : (<><QrCode className="h-5 w-5 mr-2" />Connect WhatsApp</>)}</Button></CardContent>
          </Card>
        )}

        {status === "disconnected" && qrCodeBase64 && (
          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent mb-8">
            <CardHeader className="text-center">
              <Badge className="bg-green-500/20 text-green-500 border-green-500/30 mb-2 w-fit mx-auto"><div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />WAITING FOR SCAN</Badge>
              <CardTitle>Scan QR Code</CardTitle>
              <CardDescription>Open WhatsApp → Settings → Linked Devices → Link a Device</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-xl"><img src={qrCodeBase64} alt="QR Code" className="w-64 h-64" /></div>
              <p className="text-sm text-muted-foreground">QR code expires in 2 minutes</p>
              <div className="flex gap-3 w-full max-w-sm">
                <Button onClick={() => setQrCodeBase64(null)} variant="outline" className="flex-1"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
                <Button onClick={handleCreateInstance} variant="outline" className="flex-1"><QrCode className="h-4 w-4 mr-2" />New QR</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {status === "connected" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card><CardContent className="p-6"><CheckCircle2 className="h-6 w-6 text-emerald-600" /><p className="mt-4 text-2xl font-bold">Active</p><p className="text-sm">Connected</p></CardContent></Card>
              <Card><CardContent className="p-6"><MessageSquare className="h-6 w-6 text-blue-600" /><p className="mt-4 text-2xl font-bold">{baileysStats?.chatCount || 0}</p><p className="text-sm">Chats</p></CardContent></Card>
              <Card><CardContent className="p-6"><Users className="h-6 w-6 text-violet-600" /><p className="mt-4 text-2xl font-bold">{groups.filter((g) => g.type === "group").length}</p><p className="text-sm">Groups</p></CardContent></Card>
              <Card><CardContent className="p-6"><Clock className="h-6 w-6 text-amber-600" /><p className="mt-4 text-2xl font-bold">{schedules.filter((s) => s.is_active).length}</p><p className="text-sm">Schedules</p></CardContent></Card>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4"><MessageSquare className="h-6 w-6" /><div><p className="font-semibold">Auto-Reply {autoReplyEnabled ? "Enabled" : "Disabled"}</p><p className="text-sm text-muted-foreground">{autoReplyEnabled ? "Active" : "Inactive"}</p></div></div>
                  <Badge variant="outline" className={autoReplyEnabled ? "bg-emerald-500/10 text-emerald-500" : ""}>{autoReplyEnabled ? "On" : "Off"}</Badge>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="messaging" className="w-full">
              <TabsList className="grid w-full grid-cols-4"><TabsTrigger value="messaging"><Send className="h-4 w-4 mr-2" />Send</TabsTrigger><TabsTrigger value="groups"><Users className="h-4 w-4 mr-2" />Groups</TabsTrigger><TabsTrigger value="schedules"><Calendar className="h-4 w-4 mr-2" />Schedule</TabsTrigger><TabsTrigger value="settings"><Settings className="h-4 w-4 mr-2" />Settings</TabsTrigger></TabsList>

              <TabsContent value="messaging" className="space-y-6 mt-6">
                <Card><CardHeader><CardTitle>Bulk Send</CardTitle><CardDescription>Send to multiple groups</CardDescription></CardHeader><CardContent className="space-y-4">
                  <div className="space-y-3"><Label>Groups ({selectedGroups.length})</Label><div className="flex gap-2 mb-3"><Button size="sm" variant="outline" onClick={selectAllGroups}>All</Button><Button size="sm" variant="outline" onClick={deselectAllGroups}>None</Button></div><div className="relative mb-3"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">{filteredGroups.map((group) => (<button key={group.id} onClick={() => toggleGroupSelection(group.id)} className={cn("flex items-center gap-3 p-3 rounded-lg border transition-all text-left", selectedGroups.includes(group.id) ? "bg-primary/10 border-primary" : "hover:bg-muted")}><div className={cn("h-5 w-5 rounded border", selectedGroups.includes(group.id) ? "bg-primary" : "")} /><span className="text-sm">{group.name || group.id}</span></button>))}</div></div>
                  <div className="space-y-3"><Label>Message</Label><Textarea placeholder="Type message..." value={bulkMessage} onChange={(e) => setBulkMessage(e.target.value)} className="min-h-32" /></div>
                  {sendingBulk && (<div className="space-y-2"><div className="flex justify-between text-xs"><span>Sending...</span><span>{bulkProgress}/{bulkTotal}</span></div><div className="w-full bg-muted rounded h-2"><div className="bg-primary h-full" style={{ width: `${(bulkProgress / bulkTotal) * 100}%` }} /></div></div>)}
                  <Button onClick={handleSendBulk} disabled={sendingBulk || selectedGroups.length === 0} className="w-full">{sendingBulk ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>) : (<><Send className="h-4 w-4 mr-2" />Send</>)}</Button>
                </CardContent></Card>
              </TabsContent>

              <TabsContent value="groups" className="space-y-6 mt-6">
                <Card><CardHeader><CardTitle>Groups</CardTitle><CardDescription>Your synced chats</CardDescription></CardHeader><CardContent>
                  {groups.length === 0 ? (<div className="text-center py-8"><Users className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No groups yet</p></div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{groups.map((group) => (<div key={group.id} className="p-4 rounded-lg border bg-card"><p className="font-semibold text-sm">{group.name || group.id}</p><p className="text-xs text-muted-foreground">{group.type}</p></div>))}</div>)}
                </CardContent></Card>
              </TabsContent>

              <TabsContent value="schedules" className="space-y-6 mt-6">
                <Card><CardHeader><CardTitle>Schedules</CardTitle></CardHeader><CardContent className="space-y-4">
                  <div className="space-y-3 p-4 rounded-lg bg-muted"><h3 className="font-semibold">New Schedule</h3><select value={newScheduleGroupJid} onChange={(e) => { const group = groups.find((g) => g.id === e.target.value); setNewScheduleGroupJid(e.target.value); setNewScheduleGroupName(group?.name || ""); }} className="w-full px-3 py-2 rounded-lg bg-background border"><option value="">Select group</option>{groups.map((g) => (<option key={g.id} value={g.id}>{g.name || g.id}</option>))}</select><Input type="datetime-local" value={newScheduleTime} onChange={(e) => setNewScheduleTime(e.target.value)} /><Textarea placeholder="Message..." value={newScheduleMessage} onChange={(e) => setNewScheduleMessage(e.target.value)} /><Button onClick={handleCreateSchedule} disabled={savingSchedule} className="w-full">{savingSchedule ? "Saving..." : "Create"}</Button></div>
                  {schedules.length > 0 && (<div className="space-y-3">{schedules.map((s) => (<div key={s.id} className="p-4 rounded-lg border"><p className="font-semibold text-sm">{s.group_name}</p><p className="text-xs text-muted-foreground">{formatDate(s.schedule_time)}</p><Button size="sm" onClick={() => handleDeleteSchedule(s.id)} className="mt-2 w-full text-xs" variant="outline">Delete</Button></div>))}</div>)}
                </CardContent></Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 mt-6">
                <Card><CardHeader><CardTitle>Settings</CardTitle></CardHeader><CardContent>
                  <div className="p-4 rounded-lg bg-muted space-y-4">
                    <div className="flex items-center justify-between mb-4"><div><p className="font-semibold">Auto-Reply</p><p className="text-sm text-muted-foreground">Auto-respond to messages</p></div><Switch checked={autoReplyEnabled} onCheckedChange={handleToggleAutoReply} /></div>
                    {autoReplyEnabled && (<div className="space-y-3"><Textarea placeholder="Reply message..." value={autoReplyText} onChange={(e) => setAutoReplyText(e.target.value)} /><Button onClick={handleSaveAutoReply} disabled={savingAutoReply} className="w-full">{savingAutoReply ? "Saving..." : "Save"}</Button></div>)}
                  </div>
                  <Button onClick={handleDisconnect} variant="destructive" className="w-full mt-4"><LogOut className="h-4 w-4 mr-2" />Disconnect</Button>
                </CardContent></Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}