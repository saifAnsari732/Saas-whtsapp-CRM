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
  Sparkles,
  Smile,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  CheckCheck,
  Camera,
  Wifi,
  Battery,
  Mic,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  FileText,
  Check,
  Copy,
  X,
  Layers
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
import { CoexistenceGuide } from "@/components/dashboard/coexistence-guide";

type Schedule = { id: string; group_jid: string; group_name: string; message_text: string; schedule_time: string; is_active: boolean; last_sent_at: string | null; created_at: string };
type BaileysChat = { id: string; name?: string; type?: string; unreadCount?: number; conversationTimestamp?: number };

interface Template {
  id: string;
  name: string;
  body_text: string;
  header_media_url?: string | null;
  header_format?: string | null;
  header_content?: string | null;
  buttons?: any;
  language?: string;
}

function formatJidDisplay(jid: string, name?: string | null): {
  title: string;
  subtitle: string;
  isGroup: boolean;
  initials: string;
  avatarBg: string;
} {
  const isGroup = jid.endsWith("@g.us");
  if (isGroup) {
    const title = name || "WhatsApp Group";
    const initials = title.slice(0, 2).toUpperCase();
    return {
      title,
      subtitle: "Group conversation",
      isGroup: true,
      initials,
      avatarBg: "from-violet-500 to-purple-600 text-white shadow-violet-500/20"
    };
  }

  const rawPhone = jid.split("@")[0].replace(/\D/g, "");
  let formattedPhone = `+${rawPhone}`;
  if (rawPhone.startsWith("91") && rawPhone.length === 12) {
    formattedPhone = `+91 ${rawPhone.slice(2, 7)} ${rawPhone.slice(7)}`;
  } else if (rawPhone.length === 10) {
    formattedPhone = `+91 ${rawPhone.slice(0, 5)} ${rawPhone.slice(5)}`;
  }

  const gradients = [
    "from-emerald-500 to-teal-600 text-white shadow-emerald-500/20",
    "from-blue-500 to-indigo-600 text-white shadow-blue-500/20",
    "from-amber-500 to-orange-600 text-white shadow-amber-500/20",
    "from-rose-500 to-pink-600 text-white shadow-rose-500/20",
    "from-cyan-500 to-blue-600 text-white shadow-cyan-500/20",
    "from-violet-500 to-fuchsia-600 text-white shadow-violet-500/20",
  ];
  let charSum = 0;
  for (let i = 0; i < rawPhone.length; i++) charSum += rawPhone.charCodeAt(i);
  const avatarBg = gradients[charSum % gradients.length];

  if (name && name.trim() && name !== rawPhone && !name.includes("@")) {
    const parts = name.trim().split(/\s+/);
    const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
    return {
      title: name,
      subtitle: formattedPhone,
      isGroup: false,
      initials,
      avatarBg
    };
  }

  return {
    title: formattedPhone,
    subtitle: "Direct Contact",
    isGroup: false,
    initials: rawPhone.length >= 2 ? rawPhone.slice(-2) : "WA",
    avatarBg
  };
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
  
  // Chats & Groups State with Persistent LocalStorage Cache (One-Time Sync Feature)
  const [chats, setChats] = useState<BaileysChat[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const persistent = localStorage.getItem("wacrm_persistent_chats");
        if (persistent) {
          const parsed = JSON.parse(persistent);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        const cached = sessionStorage.getItem("wacrm_cached_chats");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [];
  });
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("wacrm_chats_last_synced_str") || "";
    }
    return "";
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
  const [bulkButtons, setBulkButtons] = useState<any[]>([]);

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

  // Enhanced Template & Studio State
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [selectedTemplateForBroadcast, setSelectedTemplateForBroadcast] = useState<string>("");
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>("all");

  // Template Form Fields
  const [tmplFormName, setTmplFormName] = useState("");
  const [tmplFormCategory, setTmplFormCategory] = useState("Marketing");
  const [tmplFormHeader, setTmplFormHeader] = useState("");
  const [tmplFormBody, setTmplFormBody] = useState("");
  const [tmplFormFooter, setTmplFormFooter] = useState("");
  const [tmplFormButtons, setTmplFormButtons] = useState<any[]>([]);

  // Attached Template for current live message
  const [attachedTemplate, setAttachedTemplate] = useState<any | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Live Phone Interface State
  const [activeLiveChat, setActiveLiveChat] = useState<BaileysChat | null>(null);
  const [activeLiveMessages, setActiveLiveMessages] = useState<any[]>([]);
  const [fetchingLiveMessages, setFetchingLiveMessages] = useState(false);
  const [liveMessageText, setLiveMessageText] = useState("");
  const [sendingLiveMessage, setSendingLiveMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const disconnectCounterRef = useRef(0);
  const isSyncingRef = useRef(false);
  const lastSyncTimestampRef = useRef<number>(0);

  const isConnected = status === "connected" || status === "open" || status === "PAIRED";
  const isChecking = status === "checking" || status === "connecting" || status === "reconnecting";
  const isEffectivelyConnected = isConnected || (chats.length > 0 && status !== "disconnected");

  const detectedNumbersList = useMemo(() => {
    return pastedNumbers
      .split(/[\n,]+/)
      .map((n) => n.trim().replace(/\D/g, ""))
      .filter((n) => n.length >= 8);
  }, [pastedNumbers]);
  const detectedNumbersCount = detectedNumbersList.length;

  const groups = useMemo(() => {
    return chats.filter((c) => c.type === "group" || c.id.includes("@g.us"));
  }, [chats]);

  const filteredGroups = useMemo(() => {
    const q = searchGroupQuery.toLowerCase().trim();
    if (!q) return groups;
    return groups.filter((g) => (g.name || "").toLowerCase().includes(q) || g.id.toLowerCase().includes(q));
  }, [groups, searchGroupQuery]);

  const filteredChats = useMemo(() => {
    const q = searchChat.toLowerCase().trim();
    return chats.filter((c) => {
      const isGroup = c.type === "group" || c.id.includes("@g.us");
      if (chatFilter === "groups" && !isGroup) return false;
      if (chatFilter === "direct" && isGroup) return false;

      if (q) {
        const name = (c.name || "").toLowerCase();
        const id = c.id.toLowerCase();
        return name.includes(q) || id.includes(q);
      }
      return true;
    }).sort((a, b) => (b.conversationTimestamp || 0) - (a.conversationTimestamp || 0));
  }, [chats, chatFilter, searchChat]);

  // Poll connection status with visibility detection & stable state transitions
  useEffect(() => {
    const fetchStatus = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const res = await fetch("/api/whatsapp/coexistence/status", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          const currentStatus = data.state || data.status || "disconnected";
          
          if (currentStatus === "connected" || currentStatus === "open" || currentStatus === "PAIRED") {
            disconnectCounterRef.current = 0;
            setStatus((prev) => (prev === "open" ? prev : "open"));
            if (typeof window !== "undefined") {
              localStorage.setItem("wacrm_coex_status", "connected");
            }
            setQrCodeBase64(null);
          } else if (currentStatus === "connecting" || currentStatus === "reconnecting") {
            setStatus((prev) => (prev === "connecting" ? prev : "connecting"));
          } else if (currentStatus === "disconnected") {
            disconnectCounterRef.current += 1;
            const wasConnected = typeof window !== "undefined" && localStorage.getItem("wacrm_coex_status") === "connected";
            if (!wasConnected || disconnectCounterRef.current >= 3) {
              setStatus((prev) => (prev === "disconnected" ? prev : "disconnected"));
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
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Advanced One-Time WhatsApp Chat Sync & Persistent Cache Algorithm
  const fetchChatsAndGroups = useCallback(async (notify = false, force = false) => {
    // If not forced and we already have cached chats, NEVER re-sync automatically!
    if (!force && chats.length > 0) {
      return;
    }

    // Concurrency Mutex: Prevent duplicate overlapping network requests
    if (isSyncingRef.current) return;

    isSyncingRef.current = true;
    setFetchingChats(true);
    try {
      const url = force ? "/api/whatsapp/baileys/chats?force=true" : "/api/whatsapp/baileys/chats";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
          setChats(data.data);
          lastSyncTimestampRef.current = Date.now();
          const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          setLastSyncTime(timeStr);

          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("wacrm_persistent_chats", JSON.stringify(data.data));
              localStorage.setItem("wacrm_chats_last_synced_str", timeStr);
              sessionStorage.setItem("wacrm_cached_chats", JSON.stringify(data.data));
            } catch {}
          }
          if (notify) toast.success(`Synced ${data.data.length} chats from WhatsApp! Saved to persistent cache.`);
        }
      }
    } catch (error) { 
      if (notify) toast.error("Failed to fetch chats");
    } finally {
      isSyncingRef.current = false;
      setFetchingChats(false);
    }
  }, [chats.length]);

  // ONE-TIME SYNC ONLY: If chats are already in cache, never trigger network sync automatically!
  useEffect(() => { 
    if (isConnected && chats.length === 0) {
      fetchChatsAndGroups(false, false);
    }
  }, [isConnected, chats.length, fetchChatsAndGroups]);

  // Stable Auto-select active chat: preserves current selection and prevents re-render loops
  useEffect(() => {
    if (filteredChats.length > 0) {
      setActiveLiveChat((prev) => {
        if (!prev) return filteredChats[0];
        const stillExists = filteredChats.some((c) => c.id === prev.id);
        return stillExists ? prev : filteredChats[0];
      });
    }
  }, [filteredChats]);

  // Fetch messages when active chat ID changes
  const fetchLiveMessages = useCallback(async (chatId: string) => {
    setFetchingLiveMessages(true);
    try {
      const res = await fetch(`/api/whatsapp/baileys/chats/${encodeURIComponent(chatId)}/messages`);
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setActiveLiveMessages(data.messages);
      } else {
        setActiveLiveMessages([]);
      }
    } catch {
      setActiveLiveMessages([]);
    } finally {
      setFetchingLiveMessages(false);
    }
  }, []);

  const activeChatId = activeLiveChat?.id;
  useEffect(() => {
    if (activeChatId) {
      fetchLiveMessages(activeChatId);
    }
  }, [activeChatId, fetchLiveMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeLiveMessages]);

  // Send message directly from WhatsApp phone composer (supports interactive buttons & templates)
  const handleSendLiveMessage = async (textToSend?: string, buttonsToSend?: any[]) => {
    const text = (textToSend || liveMessageText).trim();
    const buttons = buttonsToSend || (attachedTemplate ? attachedTemplate.buttons : undefined);
    if (!activeLiveChat || (!text && !buttons) || sendingLiveMessage) return;

    setSendingLiveMessage(true);
    const tempId = `msg-${Date.now()}`;
    const newMsg = {
      key: { id: tempId, fromMe: true },
      message: { conversation: text },
      buttons: buttons && Array.isArray(buttons) && buttons.length > 0 ? buttons : undefined,
      messageTimestamp: Math.floor(Date.now() / 1000),
      status: "PENDING"
    };

    setActiveLiveMessages(prev => [...prev, newMsg]);
    setLiveMessageText("");
    setAttachedTemplate(null);

    try {
      const res = await fetch("/api/whatsapp/baileys/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: activeLiveChat.id,
          message: text,
          buttons: buttons && Array.isArray(buttons) && buttons.length > 0 ? buttons : undefined,
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send");
      }

      toast.success("Dispatched via WhatsApp phone!");
      setActiveLiveMessages(prev => prev.map(m => m.key?.id === tempId ? { ...m, status: "SERVER_ACK" } : m));
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch message");
      setActiveLiveMessages(prev => prev.filter(m => m.key?.id !== tempId));
    } finally {
      setSendingLiveMessage(false);
    }
  };

  // Fetch Templates from Database
  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/templates");
      if (res.ok) {
        const data = await res.json();
        if (data.templates && Array.isArray(data.templates)) {
          setTemplates(data.templates);
        }
      }
    } catch (err) {
      console.error("Failed to load templates:", err);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleOpenCreateTemplate = () => {
    setEditingTemplate(null);
    setTmplFormName("");
    setTmplFormCategory("Marketing");
    setTmplFormHeader("");
    setTmplFormBody("");
    setTmplFormFooter("");
    setTmplFormButtons([
      { type: "QUICK_REPLY", text: "Interested" },
      { type: "URL", text: "Visit Website", url: "https://chatflyr.com" }
    ]);
    setTemplateEditorOpen(true);
  };

  const handleOpenEditTemplate = (tmpl: any) => {
    setEditingTemplate(tmpl);
    setTmplFormName(tmpl.name || "");
    setTmplFormCategory(tmpl.category || "Marketing");
    setTmplFormHeader(tmpl.header_content || "");
    setTmplFormBody(tmpl.body_text || "");
    setTmplFormFooter(tmpl.footer_text || "");
    setTmplFormButtons(Array.isArray(tmpl.buttons) ? [...tmpl.buttons] : []);
    setTemplateEditorOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!tmplFormName.trim() || !tmplFormBody.trim()) {
      toast.error("Please enter both template name and body text");
      return;
    }

    setSavingTemplate(true);
    try {
      const payload = {
        name: tmplFormName,
        category: tmplFormCategory,
        header_content: tmplFormHeader,
        body_text: tmplFormBody,
        footer_text: tmplFormFooter,
        buttons: tmplFormButtons,
      };

      const isEdit = !!editingTemplate?.id;
      const url = "/api/whatsapp/templates";
      const method = isEdit ? "PUT" : "POST";
      const body = isEdit ? { id: editingTemplate.id, ...payload } : payload;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(isEdit ? "Template updated in database!" : "Template created and saved in database!");
        setTemplateEditorOpen(false);
        await fetchTemplates();
      } else {
        toast.error(data.error || "Failed to save template");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save template");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template from the database?")) return;
    try {
      const res = await fetch(`/api/whatsapp/templates?id=${encodeURIComponent(templateId)}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Template deleted from database");
        await fetchTemplates();
      } else {
        toast.error("Failed to delete template");
      }
    } catch {
      toast.error("Network error deleting template");
    }
  };

  const handleApplyTemplateToLive = (tmpl: any) => {
    if (!activeLiveChat) return;
    const activeInfo = formatJidDisplay(activeLiveChat.id, activeLiveChat.name);
    let text = tmpl.body_text || "";
    text = text.replace(/\{\{name\}\}/gi, activeInfo.title);
    if (tmpl.header_content) {
      text = `*${tmpl.header_content}*\n\n${text}`;
    }
    if (tmpl.footer_text) {
      text = `${text}\n\n_${tmpl.footer_text}_`;
    }
    setLiveMessageText(text);
    setAttachedTemplate(tmpl);
    setTemplatePickerOpen(false);
    toast.success(`Template "${tmpl.name}" loaded into message composer`);
  };

  const handleSendTemplateDirectlyToLive = async (tmpl: any) => {
    if (!activeLiveChat) return;
    const activeInfo = formatJidDisplay(activeLiveChat.id, activeLiveChat.name);
    let text = tmpl.body_text || "";
    text = text.replace(/\{\{name\}\}/gi, activeInfo.title);
    if (tmpl.header_content) {
      text = `*${tmpl.header_content}*\n\n${text}`;
    }
    if (tmpl.footer_text) {
      text = `${text}\n\n_${tmpl.footer_text}_`;
    }
    setTemplatePickerOpen(false);
    await handleSendLiveMessage(text, tmpl.buttons);
  };

  const filteredTemplatesList = useMemo(() => {
    return templates.filter((t) => {
      if (templateCategoryFilter !== "all" && t.category !== templateCategoryFilter) return false;
      if (templateSearchQuery) {
        const q = templateSearchQuery.toLowerCase();
        return (t.name || "").toLowerCase().includes(q) || (t.body_text || "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [templates, templateCategoryFilter, templateSearchQuery]);

  const handleSelectTemplateForBulk = (templateId: string) => {
    setSelectedTemplateForBroadcast(templateId);
    if (!templateId) {
      setBulkButtons([]);
      return;
    }
    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl) {
      let text = tmpl.body_text || "";
      if (tmpl.header_content) {
        text = `*${tmpl.header_content}*\n\n${text}`;
      }
      if (tmpl.footer_text) {
        text = `${text}\n\n_${tmpl.footer_text}_`;
      }
      setBulkMessage(text);
      if (Array.isArray(tmpl.buttons) && tmpl.buttons.length > 0) {
        setBulkButtons(tmpl.buttons);
      } else {
        setBulkButtons([]);
      }
      toast.success(`Template "${tmpl.name}" loaded with interactive action buttons!`);
    } else {
      setBulkButtons([]);
    }
  };

  const handleUseTemplateForBroadcast = (tmpl: any) => {
    setSelectedTemplateForBroadcast(tmpl.id);
    let text = tmpl.body_text || "";
    if (tmpl.header_content) {
      text = `*${tmpl.header_content}*\n\n${text}`;
    }
    if (tmpl.footer_text) {
      text = `${text}\n\n_${tmpl.footer_text}_`;
    }
    setBulkMessage(text);
    if (Array.isArray(tmpl.buttons) && tmpl.buttons.length > 0) {
      setBulkButtons(tmpl.buttons);
    } else {
      setBulkButtons([]);
    }
    setActiveTab("messaging");
    toast.success(`Template "${tmpl.name}" loaded for bulk dispatch! Choose numbers or groups.`);
  };

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
            body: JSON.stringify({ 
              to: targetRecipients[i], 
              message: bulkMessage,
              buttons: bulkButtons.length > 0 ? bulkButtons : undefined
            }) 
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
        setBulkButtons([]);
        setSelectedTemplateForBroadcast("");
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
        
        {/* Top Header Card - SaaS Grade */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-xs">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="rounded-xl border-slate-200 dark:border-zinc-800 hover:bg-muted font-bold text-xs h-9">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
                <Smartphone className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isConnected ? "bg-emerald-400" : isChecking ? "bg-amber-400" : "bg-slate-400")} />
                  <span className={cn("relative inline-flex rounded-full h-3 w-3", isConnected ? "bg-emerald-500" : isChecking ? "bg-amber-500" : "bg-slate-500")} />
                </span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>WhatsApp Coexistence</span>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px] uppercase font-bold tracking-wider">
                    Dual-Device Sync
                  </Badge>
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Run WhatsApp directly on your physical mobile phone while ChatFlyr CRM automates replies & group broadcasts.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isEffectivelyConnected && (
              <>
                {lastSyncTime && (
                  <Badge variant="outline" className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 text-xs font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Cache Saved ({chats.length})</span>
                    <span className="text-[10px] text-muted-foreground">• {lastSyncTime}</span>
                  </Badge>
                )}

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchChatsAndGroups(true, true)} 
                  disabled={fetchingChats}
                  className="rounded-xl text-xs font-bold gap-1.5 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 h-9"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", fetchingChats && "animate-spin")} />
                  <span>{fetchingChats ? "Syncing..." : "Sync WhatsApp"}</span>
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDisconnect}
                  className="rounded-xl text-xs font-bold gap-1.5 border-rose-500/30 text-rose-600 hover:bg-rose-500/10 dark:hover:bg-rose-950/20 h-9"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Disconnect</span>
                </Button>
              </>
            )}

            <Badge className={cn("px-4 py-2 border text-xs font-bold rounded-xl flex items-center gap-2 shadow-2xs", 
              isConnected || isEffectivelyConnected
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" 
                : isChecking 
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800" 
                  : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-300 border-slate-200 dark:border-zinc-700"
            )}>
              <span className={cn("h-2.5 w-2.5 rounded-full", 
                isConnected || isEffectivelyConnected ? "bg-emerald-500 animate-pulse" : isChecking ? "bg-amber-500 animate-pulse" : "bg-slate-400"
              )} />
              {isConnected || isEffectivelyConnected ? "Connected & Active" : isChecking ? "Syncing Connection..." : "Disconnected"}
            </Badge>
          </div>
        </div>

        {/* VIEW 0: CHECKING / CONNECTING IN PROGRESS (Only shows on empty fresh load, NEVER blocks cached chats) */}
        {!isEffectivelyConnected && isChecking && !qrCodeBase64 && chats.length === 0 && (
          <Card className="border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center shadow-xs">
            <div className="flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
              <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Syncing WhatsApp Connection</h3>
                <p className="text-xs text-muted-foreground">
                  Validating your linked WhatsApp session and restoring active conversations...
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* VIEW 1: DISCONNECTED (NO QR YET & NOT CHECKING) */}
        {!isEffectivelyConnected && !isChecking && !qrCodeBase64 && chats.length === 0 && (
          <Card className="border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl shadow-xs overflow-hidden">
            <CardHeader className="p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                  <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-bold px-3 py-1 text-xs">
                    ⚡ Instant WhatsApp Coexistence
                  </Badge>
                  <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Connect Your Phone QR Code
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Link your active WhatsApp phone number in seconds. Use your existing phone app alongside ChatFlyr CRM for automated replies, contact group broadcasts, and scheduled messages.
                  </CardDescription>
                </div>
                
                <div className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
                  <QrCode className="h-10 w-10 sm:h-12 sm:w-12" />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 sm:p-8 pt-0 space-y-6">
              {/* PRIMARY ACTION BUTTON AT TOP */}
              <div className="pt-2">
                <Button 
                  onClick={handleCreateInstance} 
                  disabled={loading} 
                  size="lg" 
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-4 text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.99] gap-2.5 cursor-pointer h-14"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating WhatsApp QR Code...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-5 w-5" />
                      Generate QR Code & Connect WhatsApp Now
                    </>
                  )}
                </Button>
              </div>

              {/* AWARENESS & BENEFITS CARDS SHIFTED BELOW BUTTON */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-t border-slate-100 dark:border-zinc-800">
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50/60 dark:bg-zinc-950/60 border border-slate-200/70 dark:border-zinc-800 shadow-2xs hover:border-emerald-500/30 transition-colors">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Simultaneous Usage</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Keep using WhatsApp on your phone while CRM automations run in background.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50/60 dark:bg-zinc-950/60 border border-slate-200/70 dark:border-zinc-800 shadow-2xs hover:border-emerald-500/30 transition-colors">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">No Account Loss</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Maintains regular mobile session without disrupting existing contacts or chats.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50/60 dark:bg-zinc-950/60 border border-slate-200/70 dark:border-zinc-800 shadow-2xs hover:border-emerald-500/30 transition-colors">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Instant Setup</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Scan QR code using WhatsApp Link a Device feature for 1-click connection.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* VIEW 2: DISCONNECTED (QR CODE DISPLAY) */}
        {!isEffectivelyConnected && qrCodeBase64 && (
          <Card className="border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl shadow-xs overflow-hidden">
            <CardHeader className="text-center pb-2 pt-6">
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 mb-3 w-fit mx-auto font-bold px-4 py-1.5 text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                WAITING FOR PHONE SCAN
              </Badge>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Scan QR Code with WhatsApp</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-1">
                Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex flex-col items-center gap-6 p-6 sm:p-8">
              <div className="relative bg-white p-6 sm:p-8 rounded-3xl shadow-lg border border-slate-200">
                <img src={qrCodeBase64} alt="WhatsApp QR Code" className="w-64 h-64 object-contain" />
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-slate-50 dark:bg-zinc-950 px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                <span>QR code refreshes automatically. Scan within 2 minutes.</span>
              </div>
              
              <div className="flex gap-3 w-full max-w-sm">
                <Button onClick={() => setQrCodeBase64(null)} variant="outline" className="flex-1 rounded-xl text-xs font-bold h-10 border-slate-200 dark:border-zinc-800">
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Back
                </Button>
                <Button onClick={handleCreateInstance} variant="outline" className="flex-1 rounded-xl text-xs font-bold border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 h-10">
                  <QrCode className="h-4 w-4 mr-1.5" />
                  Refresh QR
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ONLY RENDER INLINE GUIDE ON DISCONNECTED STATES */}
        {!isEffectivelyConnected && <CoexistenceGuide />}

        {/* VIEW 3: CONNECTED DASHBOARD */}
        {isEffectivelyConnected && (
          <div className="space-y-6">
            {/* Top 4 KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="rounded-2xl border-slate-200/80 dark:border-zinc-800 shadow-xs bg-white dark:bg-zinc-900">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Connection Status</p>
                    <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">Active</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Phone linked & ready</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl border border-emerald-500/20">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200/80 dark:border-zinc-800 shadow-xs bg-white dark:bg-zinc-900">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Synced Chats</p>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{chats.length}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Direct & group chats</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl border border-blue-500/20">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200/80 dark:border-zinc-800 shadow-xs bg-white dark:bg-zinc-900">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">WhatsApp Groups</p>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{groups.length}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Communities & groups</p>
                  </div>
                  <div className="p-3 bg-violet-500/10 text-violet-600 rounded-2xl border border-violet-500/20">
                    <Users className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200/80 dark:border-zinc-800 shadow-xs bg-white dark:bg-zinc-900">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Active Schedules</p>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{schedules.filter((s) => s.is_active).length}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Upcoming automations</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl border border-amber-500/20">
                    <Clock className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Tabs Navigation Hub */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 !h-auto group-data-horizontal/tabs:!h-auto overflow-visible p-2 bg-slate-100/90 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/80 rounded-2xl shadow-inner">
                {/* TAB 1: CHATS */}
                <TabsTrigger 
                  value="chats" 
                  className="min-h-[52px] h-auto py-2.5 px-3 rounded-xl font-black text-xs transition-all duration-200 border border-emerald-500/25 shadow-xs bg-white dark:bg-zinc-900 text-slate-800 dark:text-slate-200 hover:border-emerald-500/60 hover:bg-emerald-50/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-600/35 data-[state=active]:border-emerald-400 flex items-center justify-center gap-2"
                >
                  <div className="p-1 rounded-lg bg-emerald-500/15 data-[state=active]:bg-white/20 shrink-0 text-emerald-600 dark:text-emerald-400 data-[state=active]:text-white">
                    <MessageSquare className="h-4 w-4 shrink-0" />
                  </div>
                  <span>Live Chats</span>
                  <span className="text-[11px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 data-[state=active]:bg-white/25 data-[state=active]:text-white data-[state=active]:border-white/30 shrink-0">
                    {chats.length}
                  </span>
                </TabsTrigger>

                {/* TAB 2: AI AUTO-REPLY & FOLLOW-UPS */}
                <TabsTrigger 
                  value="chatbot" 
                  className="min-h-[52px] h-auto py-2.5 px-3 rounded-xl font-black text-xs transition-all duration-200 border border-purple-500/25 shadow-xs bg-white dark:bg-zinc-900 text-slate-800 dark:text-slate-200 hover:border-purple-500/60 hover:bg-purple-50/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-600/35 data-[state=active]:border-purple-400 flex items-center justify-center gap-2"
                >
                  <div className="p-1 rounded-lg bg-purple-500/15 data-[state=active]:bg-white/20 shrink-0 text-purple-600 dark:text-purple-400 data-[state=active]:text-white">
                    <Bot className="h-4 w-4 shrink-0" />
                  </div>
                  <span>AI Studio</span>
                  <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 data-[state=active]:bg-white/25 data-[state=active]:text-white data-[state=active]:border-white/30 shrink-0">
                    {autoReplyEnabled ? "Live" : "Bot"}
                  </span>
                </TabsTrigger>

                {/* TAB 3: BULK DISPATCH */}
                <TabsTrigger 
                  value="messaging" 
                  className="min-h-[52px] h-auto py-2.5 px-3 rounded-xl font-black text-xs transition-all duration-200 border border-blue-500/25 shadow-xs bg-white dark:bg-zinc-900 text-slate-800 dark:text-slate-200 hover:border-blue-500/60 hover:bg-blue-50/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/35 data-[state=active]:border-blue-400 flex items-center justify-center gap-2"
                >
                  <div className="p-1 rounded-lg bg-blue-500/15 data-[state=active]:bg-white/20 shrink-0 text-blue-600 dark:text-blue-400 data-[state=active]:text-white">
                    <Send className="h-4 w-4 shrink-0" />
                  </div>
                  <span>Broadcast</span>
                  <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 data-[state=active]:bg-white/25 data-[state=active]:text-white data-[state=active]:border-white/30 shrink-0">
                    Fast
                  </span>
                </TabsTrigger>

                {/* TAB: TEMPLATES (IN-BUILT & CUSTOM INTERACTIVE TEMPLATES) */}
                <TabsTrigger 
                  value="templates" 
                  className="min-h-[52px] h-auto py-2.5 px-3 rounded-xl font-black text-xs transition-all duration-200 border border-emerald-500/25 shadow-xs bg-white dark:bg-zinc-900 text-slate-800 dark:text-slate-200 hover:border-emerald-500/60 hover:bg-emerald-50/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-600/35 data-[state=active]:border-emerald-400 flex items-center justify-center gap-2"
                >
                  <div className="p-1 rounded-lg bg-emerald-500/15 data-[state=active]:bg-white/20 shrink-0 text-emerald-600 dark:text-emerald-400 data-[state=active]:text-white">
                    <Sparkles className="h-4 w-4 shrink-0" />
                  </div>
                  <span>Templates</span>
                  <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 data-[state=active]:bg-white/25 data-[state=active]:text-white data-[state=active]:border-white/30 shrink-0">
                    {templates.length || "DB"}
                  </span>
                </TabsTrigger>

                {/* TAB 4: GROUPS */}
                <TabsTrigger 
                  value="groups" 
                  className="min-h-[52px] h-auto py-2.5 px-3 rounded-xl font-black text-xs transition-all duration-200 border border-violet-500/25 shadow-xs bg-white dark:bg-zinc-900 text-slate-800 dark:text-slate-200 hover:border-violet-500/60 hover:bg-violet-50/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-600/35 data-[state=active]:border-violet-400 flex items-center justify-center gap-2"
                >
                  <div className="p-1 rounded-lg bg-violet-500/15 data-[state=active]:bg-white/20 shrink-0 text-violet-600 dark:text-violet-400 data-[state=active]:text-white">
                    <Users className="h-4 w-4 shrink-0" />
                  </div>
                  <span>Groups</span>
                  <span className="text-[11px] font-black px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30 data-[state=active]:bg-white/25 data-[state=active]:text-white data-[state=active]:border-white/30 shrink-0">
                    {groups.length}
                  </span>
                </TabsTrigger>

                {/* TAB 5: SCHEDULES */}
                <TabsTrigger 
                  value="schedules" 
                  className="min-h-[52px] h-auto py-2.5 px-3 rounded-xl font-black text-xs transition-all duration-200 border border-amber-500/25 shadow-xs bg-white dark:bg-zinc-900 text-slate-800 dark:text-slate-200 hover:border-amber-500/60 hover:bg-amber-50/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/35 data-[state=active]:border-amber-400 flex items-center justify-center gap-2"
                >
                  <div className="p-1 rounded-lg bg-amber-500/15 data-[state=active]:bg-white/20 shrink-0 text-amber-600 dark:text-amber-400 data-[state=active]:text-white">
                    <Calendar className="h-4 w-4 shrink-0" />
                  </div>
                  <span>Schedules</span>
                  <span className="text-[11px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 data-[state=active]:bg-white/25 data-[state=active]:text-white data-[state=active]:border-white/30 shrink-0">
                    {schedules.length}
                  </span>
                </TabsTrigger>

                {/* TAB 6: SETTINGS */}
                <TabsTrigger 
                  value="settings" 
                  className="min-h-[52px] h-auto py-2.5 px-3 rounded-xl font-black text-xs transition-all duration-200 border border-slate-400/25 shadow-xs bg-white dark:bg-zinc-900 text-slate-800 dark:text-slate-200 hover:border-slate-500/60 hover:bg-slate-100/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-700 data-[state=active]:to-zinc-900 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-slate-700/35 data-[state=active]:border-slate-500 flex items-center justify-center gap-2"
                >
                  <div className="p-1 rounded-lg bg-slate-500/15 data-[state=active]:bg-white/20 shrink-0 text-slate-600 dark:text-slate-400 data-[state=active]:text-white">
                    <Settings className="h-4 w-4 shrink-0" />
                  </div>
                  <span>Settings</span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30 data-[state=active]:bg-white/25 data-[state=active]:text-white data-[state=active]:border-white/30 shrink-0">
                    Config
                  </span>
                </TabsTrigger>

                {/* TAB 7: GUIDE & BAN SAFETY */}
                <TabsTrigger 
                  value="guide" 
                  className="min-h-[52px] h-auto py-2.5 px-3 rounded-xl font-black text-xs transition-all duration-200 border border-teal-500/25 shadow-xs bg-white dark:bg-zinc-900 text-slate-800 dark:text-slate-200 hover:border-teal-500/60 hover:bg-teal-50/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-emerald-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-teal-600/35 data-[state=active]:border-teal-400 flex items-center justify-center gap-2"
                >
                  <div className="p-1 rounded-lg bg-teal-500/15 data-[state=active]:bg-white/20 shrink-0 text-teal-600 dark:text-teal-400 data-[state=active]:text-white">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                  </div>
                  <span>Ban Rules</span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 data-[state=active]:bg-white/25 data-[state=active]:text-white data-[state=active]:border-white/30 shrink-0">
                    Guide
                  </span>
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: CHATS (PHONE-LIKE WHATSAPP ACCOUNT UI) */}
              <TabsContent value="chats" className="space-y-4 mt-6">
                {/* Smartphone Device Mockup Container - Responsive viewport height & dedicated layout */}
                <div className="max-w-6xl mx-auto rounded-[28px] sm:rounded-[36px] border-4 sm:border-8 border-slate-800 dark:border-zinc-800 shadow-2xl bg-[#0B141A] overflow-hidden flex flex-col h-[calc(100vh-210px)] min-h-[580px] max-h-[760px]">
                  
                  {/* Smartphone Top Notch & WhatsApp App Bar - Pinned Sticky Header */}
                  <div className="shrink-0 sticky top-0 z-30 select-none">
                    {/* Top Notch & Status */}
                    <div className="bg-slate-900 px-6 py-1.5 flex items-center justify-between border-b border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
                      <span>9:41</span>
                      <span className="text-[10px] text-emerald-400 font-extrabold uppercase">● 5G</span>
                    </div>
                    
                    {/* Front Camera & Speaker Notch */}
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-12 bg-slate-700 rounded-full" />
                      <div className="h-2.5 w-2.5 bg-slate-700 rounded-full border border-slate-600" />
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <Wifi className="h-3.5 w-3.5" />
                      <Battery className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  {/* WhatsApp Mobile App Header */}
                  <div className="bg-[#008069] dark:bg-[#1F2C34] text-white px-4 sm:px-6 py-3.5 shadow-md flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg sm:text-xl font-bold tracking-tight">WhatsApp</span>
                        <Badge className="bg-emerald-700/80 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full border-0">
                          COEXISTENCE
                        </Badge>
                      </div>
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-100/90 font-medium">
                        <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                        Phone Linked & Active
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => fetchChatsAndGroups(true, true)}
                        disabled={fetchingChats}
                        className="h-8 px-2.5 rounded-lg text-white hover:bg-emerald-700/60 dark:hover:bg-zinc-700/60 text-xs font-semibold gap-1.5"
                      >
                        <RefreshCw className={cn("h-3.5 w-3.5", fetchingChats && "animate-spin")} />
                        <span className="hidden sm:inline">{fetchingChats ? "Syncing..." : "Sync Phone"}</span>
                      </Button>
                      <Camera className="h-4 w-4 text-emerald-100 cursor-pointer hover:text-white transition-colors" />
                      <MoreVertical className="h-4 w-4 text-emerald-100 cursor-pointer hover:text-white transition-colors" />
                    </div>
                  </div>

                  {/* WhatsApp Android Tabs */}
                  <div className="bg-[#008069] dark:bg-[#1F2C34] text-white flex border-b border-emerald-700/60 dark:border-zinc-700/60 px-2 sm:px-4">
                    <button
                      type="button"
                      onClick={() => setChatFilter("direct")}
                      className={cn(
                        "flex-1 py-2.5 text-center text-xs font-bold uppercase tracking-wider transition-all relative",
                        chatFilter === "direct" ? "text-white font-extrabold" : "text-emerald-100/70 hover:text-white"
                      )}
                    >
                      <span>Chats ({chats.filter(c => c.type !== "group" && !c.id.includes("@g.us")).length})</span>
                      {chatFilter === "direct" && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-t-sm" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setChatFilter("groups")}
                      className={cn(
                        "flex-1 py-2.5 text-center text-xs font-bold uppercase tracking-wider transition-all relative",
                        chatFilter === "groups" ? "text-white font-extrabold" : "text-emerald-100/70 hover:text-white"
                      )}
                    >
                      <span>Groups ({groups.length})</span>
                      {chatFilter === "groups" && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-t-sm" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setChatFilter("all")}
                      className={cn(
                        "flex-1 py-2.5 text-center text-xs font-bold uppercase tracking-wider transition-all relative",
                        chatFilter === "all" ? "text-white font-extrabold" : "text-emerald-100/70 hover:text-white"
                      )}
                    >
                      <span>All ({chats.length})</span>
                      {chatFilter === "all" && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-t-sm" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Two-Pane WhatsApp Layout */}
                <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 bg-white dark:bg-[#111B21] overflow-hidden">
                  
                  {/* Left Pane: WhatsApp Chat List */}
                  <div className={cn(
                    "md:col-span-5 lg:col-span-4 border-r border-slate-200/80 dark:border-zinc-800 flex flex-col h-full min-h-0 bg-white dark:bg-[#111B21]",
                    activeLiveChat ? "hidden md:flex" : "flex"
                  )}>
                    {/* In-app Search Bar */}
                    <div className="p-2.5 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-[#111B21] shrink-0 sticky top-0 z-10">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <Input
                          placeholder="Search or start new chat..."
                          value={searchChat}
                          onChange={(e) => setSearchChat(e.target.value)}
                          className="pl-9 text-xs h-8.5 rounded-xl bg-white dark:bg-[#202C33] border-slate-200/80 dark:border-zinc-700/80 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Chats Scroll Area */}
                    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain divide-y divide-slate-100/80 dark:divide-zinc-800/60">
                        {fetchingChats ? (
                          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
                            <Loader2 className="h-7 w-7 animate-spin text-[#008069]" />
                            <p className="text-xs font-semibold">Syncing phone chats...</p>
                          </div>
                        ) : filteredChats.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-2 p-4 text-center">
                            <MessageSquare className="h-10 w-10 text-slate-300 dark:text-zinc-700 stroke-[1.5]" />
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No conversations found</p>
                            <p className="text-[11px] text-muted-foreground">Click "Sync Phone" at top to fetch chats.</p>
                          </div>
                        ) : (
                          filteredChats.map((chat) => {
                            const isSelected = activeLiveChat?.id === chat.id;
                            const info = formatJidDisplay(chat.id, chat.name);

                            return (
                              <div
                                key={chat.id}
                                onClick={() => setActiveLiveChat(chat)}
                                className={cn(
                                  "flex items-center gap-3.5 px-3.5 py-3 cursor-pointer transition-all relative border-b border-slate-100 dark:border-zinc-800/60",
                                  isSelected 
                                    ? "bg-[#F0F2F5] dark:bg-[#2A3942] border-l-4 border-l-[#00A884]" 
                                    : "hover:bg-slate-50 dark:hover:bg-[#202C33]/60"
                                )}
                              >
                                {/* Contact Avatar */}
                                <div className={cn(
                                  "h-12 w-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm bg-gradient-to-br",
                                  info.avatarBg
                                )}>
                                  {info.isGroup ? <Users className="h-5 w-5 text-white" /> : info.initials}
                                </div>

                                {/* Chat Info */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                                      {info.title}
                                    </h4>
                                    <span className="text-[11px] text-muted-foreground font-medium shrink-0">
                                      {chat.conversationTimestamp 
                                        ? new Date(chat.conversationTimestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                        : "Just now"}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between gap-2 mt-0.5">
                                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                      <CheckCheck className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                                      <span className="truncate">{info.subtitle}</span>
                                    </p>
                                    {chat.unreadCount ? (
                                      <span className="h-4 min-w-4 px-1.5 rounded-full bg-[#25D366] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                                        {chat.unreadCount}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Right Pane: WhatsApp Live Chat Conversation */}
                    <div className={cn(
                      "md:col-span-7 lg:col-span-8 flex flex-col h-full min-h-0 bg-[#EFEAE2] dark:bg-[#0B141A] relative overflow-hidden",
                      activeLiveChat ? "flex" : "hidden md:flex"
                    )}>
                      {activeLiveChat ? (
                        <div className="flex flex-col h-full min-h-0">
                          {/* Chat Thread Header - Pinned Sticky */}
                          {(() => {
                            const activeInfo = formatJidDisplay(activeLiveChat.id, activeLiveChat.name);
                            return (
                              <div className="bg-[#F0F2F5] dark:bg-[#202C33] border-b border-slate-200/80 dark:border-zinc-800 p-2.5 px-4 flex items-center justify-between shadow-xs shrink-0 sticky top-0 z-20">
                                <div className="flex items-center gap-3 min-w-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setActiveLiveChat(null)}
                                    className="md:hidden p-1 h-8 w-8 rounded-full"
                                  >
                                    <ArrowLeft className="h-4 w-4" />
                                  </Button>

                                  <div className="relative">
                                    <div className={cn(
                                      "h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm bg-gradient-to-br",
                                      activeInfo.avatarBg
                                    )}>
                                      {activeInfo.isGroup ? <Users className="h-5 w-5 text-white" /> : activeInfo.initials}
                                    </div>
                                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#25D366] border-2 border-white dark:border-[#202C33]" />
                                  </div>

                                  <div className="min-w-0">
                                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate flex items-center gap-2">
                                      <span>{activeInfo.title}</span>
                                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                        Live Mobile Sync
                                      </span>
                                    </h3>
                                    <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">online</span>
                                      <span>•</span>
                                      <span>{activeInfo.subtitle}</span>
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setTemplatePickerOpen(true)}
                                    className="h-8 px-2.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 gap-1.5 cursor-pointer shadow-2xs"
                                  >
                                    <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                                    <span className="hidden sm:inline">Templates</span>
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-200/60 dark:hover:bg-zinc-700/60">
                                    <Search className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-200/60 dark:hover:bg-zinc-700/60">
                                    <Phone className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-200/60 dark:hover:bg-zinc-700/60">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Quick Template Suggestion Strip Floating Above Stream */}
                          <div className="shrink-0 bg-white/95 dark:bg-[#111B21]/95 border-b border-slate-200/60 dark:border-zinc-800/60 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar z-10">
                            <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0 px-1">
                              <Sparkles className="h-3 w-3" />
                              <span>Quick:</span>
                            </span>
                            {templates.slice(0, 5).map((tmpl) => (
                              <button
                                key={tmpl.id}
                                type="button"
                                onClick={() => handleApplyTemplateToLive(tmpl)}
                                className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-slate-300 border border-slate-200/80 dark:border-zinc-700 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <span>⚡ {tmpl.name.replace(/_/g, " ")}</span>
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setTemplatePickerOpen(true)}
                              className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Sparkles className="h-3 w-3 text-emerald-600" />
                              <span>All Templates ({templates.length})</span>
                            </button>
                          </div>

                          {/* Chat Message Stream - Dedicated Scrollable Container */}
                          <div 
                            className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-3"
                            style={{
                              backgroundColor: "#efeae2",
                              backgroundImage: "radial-gradient(#0000000d 1px, transparent 1px), radial-gradient(#0000000d 1px, #efeae2 1px)",
                              backgroundSize: "20px 20px",
                              backgroundPosition: "0 0, 10px 10px"
                            }}
                          >
                            {/* Privacy Notice Banner */}
                            <div className="flex justify-center my-1">
                              <div className="px-3.5 py-1.5 rounded-xl bg-amber-100/80 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-700/50 shadow-2xs max-w-md text-center">
                                <p className="text-[11px] text-amber-900 dark:text-amber-200 font-medium leading-relaxed flex items-center justify-center gap-1.5">
                                  <span>🔒</span>
                                  <span>Messages sent here dispatch live to destination WhatsApp phones.</span>
                                </p>
                              </div>
                            </div>

                            {/* Date Badge */}
                            <div className="flex justify-center my-2">
                              <span className="bg-white/90 dark:bg-[#182229] text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full shadow-2xs border border-slate-200/60 dark:border-zinc-800">
                                Today
                              </span>
                            </div>

                            {/* Messages List */}
                            {fetchingLiveMessages ? (
                              <div className="flex flex-col items-center justify-center py-16 space-y-2">
                                <Loader2 className="h-6 w-6 animate-spin text-[#008069]" />
                                <span className="text-xs text-muted-foreground font-medium">Loading live messages...</span>
                              </div>
                            ) : activeLiveMessages.length === 0 ? (
                              <div className="text-center py-16 space-y-3">
                                <div className="p-3.5 bg-white/90 dark:bg-[#202C33] rounded-2xl w-fit mx-auto shadow-xs border border-slate-200/80 dark:border-zinc-800">
                                  <MessageSquare className="h-7 w-7 text-[#008069]" />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Start Live WhatsApp Chat</p>
                                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                    Send a message or select a template below. It will dispatch live through your connected mobile WhatsApp device.
                                  </p>
                                </div>
                              </div>
                            ) : (
                              activeLiveMessages.map((msg, i) => {
                                const isMe = msg.key?.fromMe;
                                const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "[Media / Attachment]";
                                const time = msg.messageTimestamp 
                                  ? new Date(msg.messageTimestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : "Now";

                                return (
                                  <div key={msg.key?.id || i} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                                    <div className={cn(
                                      "max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 px-3.5 shadow-xs space-y-2 relative text-xs leading-relaxed",
                                      isMe 
                                        ? "bg-[#D9FDD3] dark:bg-[#005C4B] text-slate-900 dark:text-emerald-50 rounded-tr-xs" 
                                        : "bg-white dark:bg-[#202C33] text-slate-900 dark:text-slate-100 rounded-tl-xs"
                                    )}>
                                      <p className="whitespace-pre-wrap select-text font-normal">{text}</p>
                                      
                                      {/* Interactive Buttons Preview in Message Bubble */}
                                      {msg.buttons && Array.isArray(msg.buttons) && msg.buttons.length > 0 && (
                                        <div className="pt-2 border-t border-black/10 dark:border-white/10 space-y-1.5">
                                          {msg.buttons.map((btn: any, bIdx: number) => (
                                            <div 
                                              key={bIdx}
                                              className={cn(
                                                "px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-2xs border transition-all",
                                                isMe 
                                                  ? "bg-white/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300/40" 
                                                  : "bg-[#00A884]/10 text-[#00A884] dark:text-[#25D366] border-[#00A884]/30"
                                              )}
                                            >
                                              {btn.type === "URL" ? (
                                                <span className="flex items-center gap-1">🌐 {btn.text}</span>
                                              ) : btn.type === "PHONE_NUMBER" ? (
                                                <span className="flex items-center gap-1">📞 {btn.text}</span>
                                              ) : (
                                                <span className="flex items-center gap-1">🔘 {btn.text}</span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground mt-1">
                                        <span>{time}</span>
                                        {isMe && <CheckCheck className="h-3.5 w-3.5 text-[#53BDEB]" />}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                            <div ref={messagesEndRef} />
                          </div>

                          {/* WhatsApp Chat Composer Bar - Pinned Sticky at bottom */}
                          <div className="p-2.5 sm:p-3 px-3 sm:px-4 bg-[#F0F2F5] dark:bg-[#202C33] border-t border-slate-200/80 dark:border-zinc-800 flex items-center gap-2 shrink-0 sticky bottom-0 z-20">
                            {/* Emoji Button */}
                            <div className="relative">
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setShowEmojiPicker(prev => !prev)}
                                className="h-9 w-9 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-full hover:bg-slate-200/70 dark:hover:bg-zinc-700/60 cursor-pointer"
                              >
                                <Smile className="h-5 w-5" />
                              </Button>

                              {showEmojiPicker && (
                                <div className="absolute bottom-12 left-0 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl p-2 shadow-xl flex items-center gap-1.5 z-30">
                                  {["👍", "❤️", "😂", "🙏", "🎉", "🔥", "✅", "👋"].map((emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => {
                                        setLiveMessageText(prev => prev + emoji);
                                        setShowEmojiPicker(false);
                                      }}
                                      className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg flex items-center justify-center text-lg transition-transform hover:scale-125 cursor-pointer"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Templates Picker Trigger Pill Button */}
                            <Button 
                              type="button"
                              variant="outline" 
                              size="sm" 
                              onClick={() => setTemplatePickerOpen(true)}
                              className="h-9 px-2.5 sm:px-3 rounded-full text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 gap-1.5 shrink-0 shadow-2xs cursor-pointer"
                            >
                              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="hidden sm:inline">Templates</span>
                            </Button>

                            {/* Attachment Button */}
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="icon" 
                              onClick={() => openSendModal(activeLiveChat)}
                              className="h-9 w-9 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-full hover:bg-slate-200/70 dark:hover:bg-zinc-700/60 shrink-0 cursor-pointer"
                            >
                              <Paperclip className="h-5 w-5" />
                            </Button>

                            {/* Chat Message Input Box */}
                            <div className="flex-1 relative flex items-center">
                              <Input
                                placeholder={`Message ${formatJidDisplay(activeLiveChat.id, activeLiveChat.name).title}...`}
                                value={liveMessageText}
                                onChange={(e) => setLiveMessageText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendLiveMessage();
                                  }
                                }}
                                className="w-full bg-white dark:bg-[#111B21] border border-slate-300/80 dark:border-zinc-700/80 h-10 px-4 rounded-full text-xs sm:text-sm text-slate-900 dark:text-white shadow-2xs focus-visible:ring-2 focus-visible:ring-[#008069] focus-visible:border-transparent placeholder:text-muted-foreground/80"
                              />
                              {attachedTemplate && (
                                <Badge className="absolute right-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                                  <span>⚡ Template attached</span>
                                  <button type="button" onClick={() => setAttachedTemplate(null)} className="ml-1 hover:text-rose-200">×</button>
                                </Badge>
                              )}
                            </div>

                            {/* Send Message Button */}
                            <Button
                              type="button"
                              onClick={() => handleSendLiveMessage()}
                              disabled={sendingLiveMessage || (!liveMessageText.trim() && !attachedTemplate)}
                              className="h-10 w-10 rounded-full bg-[#00A884] hover:bg-[#008F6F] active:scale-95 text-white flex items-center justify-center shrink-0 shadow-md transition-all disabled:opacity-40 cursor-pointer"
                            >
                              {sendingLiveMessage ? (
                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                              ) : (
                                <Send className="h-4 w-4 text-white ml-0.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-[#F8F9FA] dark:bg-[#111B21]">
                          <div className="h-20 w-20 rounded-3xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20 shadow-sm">
                            <Smartphone className="h-10 w-10" />
                          </div>
                          <div className="space-y-1.5 max-w-sm">
                            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">WhatsApp Coexistence Live View</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Select any contact or group on the left to start live chatting directly through your connected mobile WhatsApp device.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Dual-Device Sync Active</span>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
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
                    
                    {/* Inbuilt Interactive Template Picker */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <Sparkles className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">Inbuilt Interactive Templates</p>
                            <p className="text-[10px] text-muted-foreground">Select pre-built templates with interactive action buttons or write custom message.</p>
                          </div>
                        </div>
                        {selectedTemplateForBroadcast && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setSelectedTemplateForBroadcast("");
                              setBulkMessage("");
                              setBulkButtons([]);
                            }}
                            className="h-6 text-[10px] text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 px-2 rounded-lg"
                          >
                            Clear Template
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Select 
                          value={selectedTemplateForBroadcast} 
                          onValueChange={(val) => handleSelectTemplateForBulk(val || "")}
                        >
                          <SelectTrigger className="w-full bg-background border-border/80 text-xs rounded-xl h-9">
                            <SelectValue placeholder="⚡ Choose Inbuilt Demo / Custom Template..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl shadow-lg">
                            {templates.map((t) => (
                              <SelectItem key={t.id} value={t.id} className="cursor-pointer text-xs">
                                <span className="font-bold">{t.name}</span>
                                {t.buttons && t.buttons.length > 0 && (
                                  <span className="ml-2 text-[10px] text-emerald-600 dark:text-emerald-400">({t.buttons.length} buttons)</span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                          {templates.slice(0, 3).map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => handleSelectTemplateForBulk(t.id)}
                              className={cn(
                                "px-2.5 py-1.5 rounded-lg text-[11px] font-bold truncate transition-all shrink-0 border",
                                selectedTemplateForBroadcast === t.id
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                  : "bg-background hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-300 border-border/80"
                              )}
                            >
                              ⚡ {t.name.split("_").slice(0, 2).join(" ")}
                            </button>
                          ))}
                        </div>
                      </div>

                      {bulkButtons.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              Interactive Action Buttons Attached ({bulkButtons.length}):
                            </span>
                            <button
                              type="button"
                              onClick={() => setBulkButtons([])}
                              className="text-[10px] text-rose-600 hover:underline"
                            >
                              Remove Buttons
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {bulkButtons.map((b, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-xs"
                              >
                                {b.type === "URL" && <ExternalLink className="h-3 w-3 text-blue-500" />}
                                {b.type === "PHONE_NUMBER" && <Phone className="h-3 w-3 text-emerald-500" />}
                                {b.type === "QUICK_REPLY" && <Check className="h-3 w-3 text-violet-500" />}
                                <span>{b.text}</span>
                                {b.url && <span className="text-[9px] text-muted-foreground font-mono truncate max-w-[120px]">({b.url})</span>}
                                {b.phone_number && <span className="text-[9px] text-muted-foreground font-mono">({b.phone_number})</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
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

              {/* TAB: TEMPLATES (IN-BUILT & EDITABLE INTERACTIVE TEMPLATES STORED IN DB) */}
              <TabsContent value="templates" className="space-y-6 mt-6">
                <Card className="rounded-2xl border-border/80 shadow-xs">
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 bg-muted/20">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          <span>Interactive WhatsApp Templates</span>
                        </CardTitle>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[11px] font-bold">
                          {templates.length} in Database
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-1">
                        Pre-built high-converting templates with interactive action buttons. Stored in your database, fully customizable, and ready for instant 1-click broadcast or live chat.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fetchTemplates(true)}
                        className="rounded-xl text-xs font-bold gap-1.5 h-9"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Refresh
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleOpenCreateTemplate}
                        className="rounded-xl text-xs font-bold gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Create Template
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Search & Category Filter Toolbar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Search templates by title or content..."
                          value={templateSearchQuery}
                          onChange={(e) => setTemplateSearchQuery(e.target.value)}
                          className="pl-9 h-9 text-xs rounded-xl bg-background border-border/80"
                        />
                        {templateSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setTemplateSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                        {["all", "Marketing", "Utility", "Support"].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setTemplateCategoryFilter(cat)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 border",
                              templateCategoryFilter === cat
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                : "bg-card hover:bg-muted/60 text-muted-foreground border-border/80"
                            )}
                          >
                            {cat === "all" ? "All Categories" : cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Templates Grid */}
                    {filteredTemplatesList.length === 0 ? (
                      <div className="text-center py-16 border-2 border-dashed border-border/80 rounded-2xl p-8 space-y-3">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                          <Sparkles className="h-6 w-6" />
                        </div>
                        <h4 className="font-bold text-sm text-foreground">No templates found</h4>
                        <p className="text-xs text-muted-foreground max-w-md mx-auto">
                          {templateSearchQuery || templateCategoryFilter !== "all"
                            ? "No templates match your search filter. Try clearing your filters or create a new custom template."
                            : "Your database currently has no templates. Click below to create your first interactive template."}
                        </p>
                        <Button
                          size="sm"
                          onClick={handleOpenCreateTemplate}
                          className="rounded-xl text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white mt-2"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Create New Template
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredTemplatesList.map((tmpl) => {
                          const buttons = Array.isArray(tmpl.buttons) ? tmpl.buttons : [];
                          return (
                            <div
                              key={tmpl.id}
                              className="rounded-2xl border border-border/80 bg-card hover:border-emerald-500/50 hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden group shadow-xs"
                            >
                              <div className="p-4 space-y-3">
                                {/* Card Header / Badges */}
                                <div className="flex items-center justify-between gap-2">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                      tmpl.category === "Marketing" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
                                      tmpl.category === "Utility" && "bg-blue-500/10 text-blue-600 border-blue-500/30",
                                      tmpl.category === "Support" && "bg-violet-500/10 text-violet-600 border-violet-500/30",
                                      !["Marketing", "Utility", "Support"].includes(tmpl.category) && "bg-muted text-muted-foreground border-border"
                                    )}
                                  >
                                    {tmpl.category || "General"}
                                  </Badge>

                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{tmpl.language || "en_US"}</span>
                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
                                      Active
                                    </Badge>
                                  </div>
                                </div>

                                {/* Template Title */}
                                <div>
                                  <h4 className="font-extrabold text-sm text-foreground line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                    {tmpl.name}
                                  </h4>
                                </div>

                                {/* Simulated Authentic WhatsApp Bubble Preview */}
                                <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40 space-y-2 text-xs">
                                  {tmpl.header_content && (
                                    <p className="font-extrabold text-xs text-foreground/90 pb-1 border-b border-emerald-200/40 dark:border-emerald-800/30">
                                      {tmpl.header_content}
                                    </p>
                                  )}
                                  <p className="text-foreground/80 leading-relaxed text-[11px] whitespace-pre-wrap line-clamp-4 font-sans">
                                    {tmpl.body_text}
                                  </p>
                                  {tmpl.footer_text && (
                                    <p className="text-[10px] text-muted-foreground italic pt-1">
                                      {tmpl.footer_text}
                                    </p>
                                  )}

                                  {/* Interactive Buttons Preview Inside Bubble */}
                                  {buttons.length > 0 && (
                                    <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 space-y-1.5">
                                      {buttons.map((b: any, bIdx: number) => (
                                        <div
                                          key={bIdx}
                                          className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white/90 dark:bg-zinc-900/90 border border-emerald-300/60 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] shadow-2xs"
                                        >
                                          {b.type === "URL" && <ExternalLink className="h-3 w-3 text-blue-500 shrink-0" />}
                                          {b.type === "PHONE_NUMBER" && <Phone className="h-3 w-3 text-emerald-500 shrink-0" />}
                                          {b.type === "QUICK_REPLY" && <Check className="h-3 w-3 text-violet-500 shrink-0" />}
                                          <span className="truncate">{b.text}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Card Action Footer */}
                              <div className="p-3 bg-muted/30 border-t border-border/80 flex items-center justify-between gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleUseTemplateForBroadcast(tmpl)}
                                  className="flex-1 h-8 rounded-xl text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                >
                                  <Zap className="h-3 w-3" />
                                  Broadcast
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenEditTemplate(tmpl)}
                                  className="h-8 px-2.5 rounded-xl text-xs font-bold border-border/80 hover:bg-muted/80"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteTemplate(tmpl.id)}
                                  className="h-8 px-2.5 rounded-xl text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
                      onClick={() => fetchChatsAndGroups(true, true)} 
                      disabled={fetchingChats} 
                      className="rounded-xl text-xs gap-1.5 font-bold border-violet-500/30 text-violet-600 hover:bg-violet-500/10"
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", fetchingChats && "animate-spin")} />
                      {fetchingChats ? "Syncing..." : "Refresh Groups"}
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

              {/* TAB 7: GUIDE & BAN SAFETY */}
              <TabsContent value="guide" className="space-y-6 mt-6">
                <CoexistenceGuide />
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

        {/* 1. Quick Template Picker Drawer/Modal (From Live Chat Composer) */}
        <Dialog open={templatePickerOpen} onOpenChange={setTemplatePickerOpen}>
          <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl bg-card">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white">
              <DialogHeader className="text-left">
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
                  <Sparkles className="h-5 w-5" />
                  Select Interactive Template
                </DialogTitle>
                <DialogDescription className="text-emerald-100 text-xs mt-1">
                  Choose a pre-built template from your database. You can insert it into the composer or send it directly.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto overscroll-contain">
              {templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground space-y-2">
                  <Sparkles className="h-8 w-8 mx-auto text-emerald-500 opacity-40" />
                  <p className="text-xs font-bold text-foreground">No templates found in database</p>
                  <p className="text-[11px]">Create a new template from the Templates tab.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((tmpl) => {
                    const buttons = Array.isArray(tmpl.buttons) ? tmpl.buttons : [];
                    return (
                      <div
                        key={tmpl.id}
                        className="p-4 rounded-xl border border-border/80 bg-background hover:border-emerald-500/50 hover:bg-muted/30 transition-all space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-foreground">{tmpl.name}</span>
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                            {tmpl.category || "Marketing"}
                          </Badge>
                        </div>

                        {/* WhatsApp preview bubble */}
                        <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40 text-[11px] space-y-1.5 font-sans">
                          {tmpl.header_content && <p className="font-bold text-foreground/90">{tmpl.header_content}</p>}
                          <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{tmpl.body_text}</p>
                          {tmpl.footer_text && <p className="text-[10px] text-muted-foreground italic">{tmpl.footer_text}</p>}
                          {buttons.length > 0 && (
                            <div className="pt-1.5 flex flex-wrap gap-1">
                              {buttons.map((b: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                >
                                  {b.type === "URL" && <ExternalLink className="h-2.5 w-2.5 text-blue-500" />}
                                  {b.type === "PHONE_NUMBER" && <Phone className="h-2.5 w-2.5 text-emerald-500" />}
                                  {b.type === "QUICK_REPLY" && <Check className="h-2.5 w-2.5 text-violet-500" />}
                                  {b.text}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApplyTemplateToLive(tmpl)}
                            className="h-7 px-3 text-xs font-bold rounded-lg border-border/80"
                          >
                            Insert in Composer
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSendTemplateDirectlyToLive(tmpl)}
                            className="h-7 px-3 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-xs"
                          >
                            <Send className="h-3 w-3" />
                            Send Directly
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <DialogFooter className="p-4 bg-muted/20 border-t border-border/60">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTemplatePickerOpen(false)}
                className="rounded-xl text-xs"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 2. Interactive Template Builder & Editor Dialog (Stored in DB) */}
        <Dialog open={templateEditorOpen} onOpenChange={setTemplateEditorOpen}>
          <DialogContent className="sm:max-w-[760px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl bg-card">
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-5 text-white">
              <DialogHeader className="text-left">
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
                  <Sparkles className="h-5 w-5" />
                  {editingTemplate?.id ? "Edit Interactive Template" : "Create New Interactive Template"}
                </DialogTitle>
                <DialogDescription className="text-emerald-100 text-xs mt-1">
                  Design WhatsApp interactive message templates with action buttons (Quick Reply, URL Link, Phone Call). Stored directly in your database.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 max-h-[75vh] overflow-y-auto overscroll-contain">
              {/* Left Column: Form Fields */}
              <div className="md:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Template Name *</Label>
                    <Input
                      placeholder="e.g. festive_offer_30"
                      value={tmplFormName}
                      onChange={(e) => setTmplFormName(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                      className="h-9 text-xs rounded-xl bg-background border-border/80 font-mono"
                    />
                    <span className="text-[10px] text-muted-foreground">Lowercase & underscores only</span>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Category</Label>
                    <select
                      value={tmplFormCategory}
                      onChange={(e) => setTmplFormCategory(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl bg-background border border-border/80 text-xs font-semibold"
                    >
                      <option value="Marketing">Marketing</option>
                      <option value="Utility">Utility</option>
                      <option value="Support">Support</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Header Text (Optional)</Label>
                  <Input
                    placeholder="e.g. Special Festive Announcement 🎉"
                    value={tmplFormHeader}
                    onChange={(e) => setTmplFormHeader(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-background border-border/80"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold">Body Message Content *</Label>
                    <span className="text-[10px] text-muted-foreground">Supports &#123;&#123;name&#125;&#125; variable</span>
                  </div>
                  <Textarea
                    placeholder="Type template message body text here... Use {{name}} to personalize with contact name."
                    value={tmplFormBody}
                    onChange={(e) => setTmplFormBody(e.target.value)}
                    className="min-h-28 text-xs rounded-xl bg-background border-border/80 p-3 leading-relaxed"
                  />
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-muted-foreground font-medium">Quick Insert:</span>
                    {["{{name}}", "{{phone}}", "{{discount}}", "{{code}}"].map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => setTmplFormBody((prev) => `${prev} ${variable}`)}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors"
                      >
                        {variable}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Footer Text (Optional)</Label>
                  <Input
                    placeholder="e.g. Reply STOP to unsubscribe • ChatFlyr"
                    value={tmplFormFooter}
                    onChange={(e) => setTmplFormFooter(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-background border-border/80"
                  />
                </div>

                {/* Interactive Action Buttons Builder */}
                <div className="space-y-2.5 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-emerald-500" />
                      <Label className="text-xs font-bold">Interactive Action Buttons (Max 3)</Label>
                    </div>
                    {tmplFormButtons.length < 3 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setTmplFormButtons((prev) => [
                            ...prev,
                            { type: "QUICK_REPLY", text: `Action ${prev.length + 1}` }
                          ])
                        }
                        className="h-7 px-2.5 rounded-lg text-xs font-bold text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Add Button
                      </Button>
                    )}
                  </div>

                  {tmplFormButtons.length === 0 ? (
                    <div className="p-3 rounded-xl border border-dashed border-border/80 text-center text-muted-foreground text-xs">
                      No buttons added yet. Click &quot;Add Button&quot; to create Quick Replies, Website Links, or Phone Call triggers.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {tmplFormButtons.map((btn, bIdx) => (
                        <div
                          key={bIdx}
                          className="p-3 rounded-xl border border-border/80 bg-background space-y-2 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-extrabold text-foreground">Button #{bIdx + 1}</span>
                            <button
                              type="button"
                              onClick={() => setTmplFormButtons((prev) => prev.filter((_, i) => i !== bIdx))}
                              className="text-rose-600 hover:text-rose-700 text-xs"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <select
                              value={btn.type}
                              onChange={(e) =>
                                setTmplFormButtons((prev) =>
                                  prev.map((b, i) => (i === bIdx ? { ...b, type: e.target.value } : b))
                                )
                              }
                              className="h-8 px-2.5 rounded-lg bg-background border border-border/80 text-xs font-medium"
                            >
                              <option value="QUICK_REPLY">Quick Reply (Text)</option>
                              <option value="URL">Website Link (URL)</option>
                              <option value="PHONE_NUMBER">Phone Call (Tel)</option>
                            </select>

                            <Input
                              placeholder="Button Label Text"
                              value={btn.text}
                              onChange={(e) =>
                                setTmplFormButtons((prev) =>
                                  prev.map((b, i) => (i === bIdx ? { ...b, text: e.target.value } : b))
                                )
                              }
                              className="h-8 text-xs rounded-lg bg-background border-border/80"
                            />
                          </div>

                          {btn.type === "URL" && (
                            <Input
                              placeholder="https://example.com/page"
                              value={btn.url || ""}
                              onChange={(e) =>
                                setTmplFormButtons((prev) =>
                                  prev.map((b, i) => (i === bIdx ? { ...b, url: e.target.value } : b))
                                )
                              }
                              className="h-8 text-xs rounded-lg bg-background border-border/80 font-mono"
                            />
                          )}

                          {btn.type === "PHONE_NUMBER" && (
                            <Input
                              placeholder="+919876543210"
                              value={btn.phone_number || ""}
                              onChange={(e) =>
                                setTmplFormButtons((prev) =>
                                  prev.map((b, i) => (i === bIdx ? { ...b, phone_number: e.target.value } : b))
                                )
                              }
                              className="h-8 text-xs rounded-lg bg-background border-border/80 font-mono"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Real-Time Phone Bubble Preview */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="w-full space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Smartphone className="h-4 w-4 text-emerald-500" />
                    <span>Live WhatsApp Preview</span>
                  </div>

                  <div className="w-full rounded-2xl border-4 border-slate-800 bg-[#E5DDD5] dark:bg-[#0B141A] p-4 shadow-xl min-h-[360px] flex flex-col justify-center">
                    {/* WhatsApp Chat Bubble */}
                    <div className="bg-white dark:bg-[#1F2C34] rounded-xl shadow-md p-3.5 space-y-2 text-xs border border-black/5 dark:border-white/5">
                      {tmplFormHeader ? (
                        <p className="font-extrabold text-xs text-foreground pb-1 border-b border-border/60">
                          {tmplFormHeader}
                        </p>
                      ) : (
                        <p className="font-extrabold text-[11px] text-muted-foreground/60 italic pb-1 border-b border-dashed border-border/40">
                          (No Header)
                        </p>
                      )}

                      <p className="text-foreground/90 leading-relaxed text-xs whitespace-pre-wrap font-sans">
                        {tmplFormBody || "Your message body content will appear here in real time..."}
                      </p>

                      {tmplFormFooter && (
                        <p className="text-[10px] text-muted-foreground italic pt-1">
                          {tmplFormFooter}
                        </p>
                      )}

                      <div className="flex justify-end pt-1">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          9:41 AM <CheckCheck className="h-3 w-3 text-sky-500" />
                        </span>
                      </div>

                      {/* Interactive Buttons Stack Inside Preview */}
                      {tmplFormButtons.length > 0 && (
                        <div className="pt-2 border-t border-border/60 space-y-1.5">
                          {tmplFormButtons.map((b, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold text-xs shadow-2xs hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              {b.type === "URL" && <ExternalLink className="h-3 w-3 text-blue-500" />}
                              {b.type === "PHONE_NUMBER" && <Phone className="h-3 w-3 text-emerald-500" />}
                              {b.type === "QUICK_REPLY" && <Check className="h-3 w-3 text-violet-500" />}
                              <span className="truncate">{b.text || `Button ${i + 1}`}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 bg-muted/20 border-t border-border/60 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTemplateEditorOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveTemplate}
                disabled={savingTemplate || !tmplFormName.trim() || !tmplFormBody.trim()}
                className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs"
              >
                {savingTemplate ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving to Database...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Save Template in Database
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