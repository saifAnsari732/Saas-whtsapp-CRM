"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, Filter, MessageSquare, Users, History, AlertCircle, Send, Smartphone, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CoexistenceConnectionPrompt } from "@/components/dashboard/coexistence-connection-prompt";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BaileysChat {
  id: string;
  name?: string;
  unreadCount?: number;
  conversationTimestamp?: number;
}

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

export default function WhatsAppChatsPage() {
  const [chats, setChats] = useState<BaileysChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "groups" | "direct">("all");

  // Send Message Modal State
  const [selectedChat, setSelectedChat] = useState<BaileysChat | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/whatsapp/baileys/chats");
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to fetch chats");
      
      setChats(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openSendModal = async (chat: BaileysChat) => {
    setSelectedChat(chat);
    setMessageText("");
    setSelectedTemplateId("");
    if (templates.length === 0) {
      try {
        const res = await fetch("/api/whatsapp/templates?status=all");
        const data = await res.json();
        if (data.templates) {
          setTemplates(data.templates);
        }
      } catch (err) {
        console.error("Failed to load templates", err);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!selectedChat || (!messageText.trim() && !selectedTemplateId)) return;
    setSending(true);
    try {
      const tmpl = templates.find(t => t.id === selectedTemplateId);
      const res = await fetch("/api/whatsapp/baileys/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedChat.id,
          message: messageText,
          mediaUrl: tmpl?.header_media_url || null,
          mediaType: tmpl?.header_format || null,
          templateName: tmpl?.name || null,
          templateLanguage: tmpl?.language || 'en_US'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");
      
      setSelectedChat(null);
      setMessageText("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  const filteredChats = chats.filter((chat) => {
    const isGroup = chat.id.includes("@g.us");
    
    if (filter === "groups" && !isGroup) return false;
    if (filter === "direct" && isGroup) return false;
    
    if (search) {
      const name = chat.name?.toLowerCase() || "";
      const id = chat.id.toLowerCase();
      if (!name.includes(search.toLowerCase()) && !id.includes(search.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  }).sort((a, b) => (b.conversationTimestamp || 0) - (a.conversationTimestamp || 0));

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* Optional Non-Blocking Prompt Banner */}
        <CoexistenceConnectionPrompt />

        {/* Main Card */}
        <div className="bg-card text-card-foreground rounded-2xl shadow-xs border border-border/80 overflow-hidden">
          
          {/* Header Row */}
          <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/80 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-2xl border border-emerald-500/20">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                  <span>WhatsApp Conversations</span>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold">
                    Synced Chats
                  </Badge>
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  View recent Coexistence chats, search conversations, and send instant WhatsApp templates.
                </p>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={fetchChats} 
              size="sm" 
              className="rounded-xl border-border/80 text-xs font-semibold gap-1.5"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              <span>Refresh Chats</span>
            </Button>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 border-b border-border/80 bg-background flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by contact name or phone number..." 
                className="pl-10 bg-muted/50 border-border/80 rounded-xl h-10 text-xs focus-visible:ring-emerald-500" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setFilter("all")}
                className={cn("rounded-xl text-xs font-bold px-4", filter === "all" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}
              >
                All Chats ({chats.length})
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setFilter("direct")}
                className={cn("rounded-xl text-xs font-bold px-4", filter === "direct" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}
              >
                Direct
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setFilter("groups")}
                className={cn("rounded-xl text-xs font-bold px-4", filter === "groups" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}
              >
                Groups
              </Button>
            </div>
          </div>

          {/* Chat List Body */}
          <div className="bg-background min-h-[420px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <p className="text-xs font-semibold">Syncing WhatsApp chats...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-rose-500 space-y-2">
                <AlertCircle className="h-8 w-8" />
                <p className="font-bold text-sm">Unable to load WhatsApp chats</p>
                <p className="text-xs text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchChats} className="mt-2 text-xs rounded-xl">
                  Try Again
                </Button>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground space-y-3">
                <MessageSquare className="h-12 w-12 stroke-[1.5] text-muted-foreground/30" />
                <p className="text-sm font-bold text-foreground">No conversations found</p>
                <p className="text-xs text-muted-foreground max-w-sm text-center">
                  Connect your phone on the Coexistence setup page to view your live WhatsApp chats here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {filteredChats.map((chat) => (
                  <div 
                    key={chat.id} 
                    onClick={() => openSendModal(chat)}
                    className="flex items-center justify-between p-4 hover:bg-muted/40 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                        {chat.id.includes('@g.us') ? <Users className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
                      </div>
                      <div className="flex flex-col justify-center">
                        <h3 className="font-bold text-foreground text-sm leading-tight">
                          {chat.name || chat.id.split('@')[0]}
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate max-w-xs sm:max-w-md">
                          {chat.id}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {chat.unreadCount ? (
                        <span className="inline-flex items-center justify-center rounded-full bg-emerald-600 min-w-[20px] h-[20px] px-2 text-[11px] font-bold text-white shadow-xs">
                          {chat.unreadCount}
                        </span>
                      ) : null}
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs font-bold text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 rounded-xl gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          openSendModal(chat);
                        }}
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send Template
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Template Send Modal */}
        <Dialog open={!!selectedChat} onOpenChange={(open) => !open && setSelectedChat(null)}>
          <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl bg-card">
            <div className="bg-gradient-to-r from-rose-500 to-rose-600 p-6 text-white relative overflow-hidden">
              <DialogHeader className="relative z-10 text-left">
                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                  <Send className="w-5 h-5" />
                  Quick WhatsApp Send
                </DialogTitle>
                <DialogDescription className="text-rose-100 mt-1 text-xs">
                  Dispatching template to <strong className="text-white font-bold">{selectedChat?.name || selectedChat?.id.split('@')[0]}</strong>
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-rose-500" />
                  Select WhatsApp Template
                </label>
                <Select 
                  value={selectedTemplateId} 
                  onValueChange={(val) => {
                    const id = val || "";
                    setSelectedTemplateId(id);
                    const tmpl = templates.find(t => t.id === id);
                    if (tmpl) {
                      let fullText = "";
                      if (tmpl.header_format === 'TEXT' && tmpl.header_content) {
                        fullText += `*${tmpl.header_content}*\n\n`;
                      }
                      fullText += tmpl.body_text || "";
                      if (tmpl.footer_text) {
                        fullText += `\n\n_${tmpl.footer_text}_`;
                      }
                      if (tmpl.buttons && Array.isArray(tmpl.buttons) && tmpl.buttons.length > 0) {
                        fullText += `\n\n*Options:*`;
                        tmpl.buttons.forEach((btn: any, index: number) => {
                          fullText += `\n${index + 1}. ${btn.text || btn.url || btn.phone_number}`;
                        });
                      }
                      setMessageText(fullText);
                    } else {
                      setMessageText("");
                    }
                  }}
                >
                  <SelectTrigger className="w-full bg-background border-border/80 text-xs rounded-xl h-10">
                    <SelectValue placeholder="Choose an approved template..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-lg">
                    {templates.length === 0 ? (
                      <div className="p-2 text-xs text-muted-foreground">No approved templates found</div>
                    ) : (
                      templates.map(t => (
                        <SelectItem key={t.id} value={t.id} className="cursor-pointer text-xs">
                          {t.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-rose-500" />
                  Message Content Preview
                </label>
                <Textarea 
                  placeholder="Type message text or choose a template..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="resize-none min-h-[120px] bg-background border-border/80 text-xs rounded-xl p-3 leading-relaxed"
                />
              </div>
            </div>

            <DialogFooter className="p-6 pt-0 bg-card border-t border-border/60 flex items-center justify-between">
              <Button variant="ghost" size="sm" className="rounded-xl text-xs" onClick={() => setSelectedChat(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendMessage} 
                disabled={sending || (!messageText.trim() && !selectedTemplateId)}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2 shadow-sm transition-all"
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Now
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
