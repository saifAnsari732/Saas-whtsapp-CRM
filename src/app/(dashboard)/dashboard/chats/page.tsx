"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, Filter, MessageSquare, Users, History, AlertCircle, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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
      
      // Close modal and clear text
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
    
    // Type filtering
    if (filter === "groups" && !isGroup) return false;
    if (filter === "direct" && isGroup) return false;
    
    // Text search
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
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8 bg-[#f0f2f5] min-h-screen">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-border/50">
        <div className="bg-[#f0f2f5] p-4 flex items-center justify-between border-b border-border/50">
          <h1 className="text-xl font-semibold text-[#111b21] flex items-center gap-3">
            <div className="bg-[#00a884] p-2 rounded-full text-white">
              <History className="h-5 w-5" />
            </div>
            WhatsApp Chats
          </h1>
          <div className="flex items-center gap-3 text-[#54656f]">
            <Button variant="ghost" onClick={fetchChats} size="icon" className="hover:bg-black/5 rounded-full" title="Refresh">
              <Filter className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="bg-white p-3 border-b border-border/50 flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[#54656f]" />
            </div>
            <Input 
              placeholder="Search or start new chat" 
              className="pl-11 bg-[#f0f2f5] border-none rounded-lg h-9 text-[#111b21] placeholder:text-[#54656f] focus-visible:ring-0 focus-visible:ring-offset-0" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            <Button 
              variant="ghost"
              onClick={() => setFilter("all")}
              className={`rounded-full h-8 px-4 text-sm font-medium ${filter === "all" ? "bg-[#d8fdd2] text-[#00a884] hover:bg-[#d8fdd2]" : "bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]"}`}
            >
              All
            </Button>
            <Button 
              variant="ghost"
              onClick={() => setFilter("direct")}
              className={`rounded-full h-8 px-4 text-sm font-medium whitespace-nowrap ${filter === "direct" ? "bg-[#d8fdd2] text-[#00a884] hover:bg-[#d8fdd2]" : "bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]"}`}
            >
              Direct
            </Button>
            <Button 
              variant="ghost"
              onClick={() => setFilter("groups")}
              className={`rounded-full h-8 px-4 text-sm font-medium whitespace-nowrap ${filter === "groups" ? "bg-[#d8fdd2] text-[#00a884] hover:bg-[#d8fdd2]" : "bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]"}`}
            >
              Groups
            </Button>
          </div>
        </div>

        <div className="bg-white min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-[#54656f]">
              <Loader2 className="h-8 w-8 animate-spin text-[#00a884] mb-4" />
              <p>Syncing chats...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-red-500">
              <AlertCircle className="h-8 w-8 mb-4" />
              <p className="font-semibold">Failed to load chats</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-[#54656f]">
              <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
              <p>No conversations found.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f2f5]">
              {filteredChats.map((chat) => (
                <div 
                  key={chat.id} 
                  onClick={() => openSendModal(chat)}
                  className="flex items-center justify-between p-3 hover:bg-[#f5f6f6] cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-[49px] w-[49px] shrink-0 items-center justify-center rounded-full bg-[#dfe5e7] text-[#54656f] overflow-hidden">
                      {chat.id.includes('@g.us') ? <Users className="h-7 w-7 opacity-70" /> : <MessageSquare className="h-7 w-7 opacity-70" />}
                    </div>
                    <div className="flex flex-col justify-center">
                      <h3 className="font-normal text-[#111b21] text-[17px] leading-tight mb-0.5">
                        {chat.name || chat.id.split('@')[0]}
                      </h3>
                      <p className="text-[14px] text-[#667781] leading-tight truncate max-w-[200px] sm:max-w-md">
                        {chat.id}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end justify-between h-[50px]">
                    <div className="flex items-center gap-2">
                      <span className={`text-[12px] ${chat.unreadCount ? 'text-[#25D366]' : 'text-[#667781]'}`}>
                        {chat.conversationTimestamp ? new Date(chat.conversationTimestamp * 1000).toLocaleDateString() : ''}
                      </span>
                      {chat.unreadCount ? (
                        <span className="inline-flex items-center justify-center rounded-full bg-[#25D366] min-w-[20px] h-[20px] px-1.5 text-[11px] font-bold text-white">
                          {chat.unreadCount}
                        </span>
                      ) : null}
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 text-[11px] text-[#00a884] hover:text-[#008069] hover:bg-[#00a884]/10 px-2 mt-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        openSendModal(chat);
                      }}
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Send Template
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedChat} onOpenChange={(open) => !open && setSelectedChat(null)}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
          <div className="bg-gradient-to-r from-rose-500 to-orange-400 p-6 text-white relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <MessageSquare className="w-32 h-32" />
            </div>
            <DialogHeader className="relative z-10 text-left">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-white">
                <Send className="w-6 h-6" />
                Quick Send
              </DialogTitle>
              <DialogDescription className="text-rose-100 mt-1">
                Sending to <strong className="text-white">{selectedChat?.name || selectedChat?.id.split('@')[0]}</strong>
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 bg-card space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Filter className="w-4 h-4 text-rose-500" />
                Select a Template
              </label>
              <Select 
                value={selectedTemplateId} 
                onValueChange={(val) => {
                  const id = val || "";
                  setSelectedTemplateId(id);
                  const tmpl = templates.find(t => t.id === id);
                  if (tmpl) {
                    let fullText = "";
                    
                    // Include Text Header
                    if (tmpl.header_format === 'TEXT' && tmpl.header_content) {
                      fullText += `*${tmpl.header_content}*\n\n`;
                    }
                    
                    // Include Body
                    fullText += tmpl.body_text || "";
                    
                    // Include Footer
                    if (tmpl.footer_text) {
                      fullText += `\n\n_${tmpl.footer_text}_`;
                    }
                    
                    // Include Buttons as text options
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
                <SelectTrigger className="w-full bg-muted/50 border-border focus:ring-rose-500 h-11 rounded-xl">
                  <SelectValue placeholder="Choose an approved template..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg">
                  {templates.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No templates found</div>
                  ) : (
                    templates.map(t => (
                      <SelectItem key={t.id} value={t.id} className="cursor-pointer">
                        {t.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-rose-500" />
                Message Content <span className="text-muted-foreground font-normal text-xs">(Optional)</span>
              </label>
              <div className="relative">
                <Textarea 
                  placeholder="Type your custom message or select a template to populate this box..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="resize-none min-h-[140px] bg-muted/50 border-border focus-visible:ring-rose-500 p-4 rounded-xl leading-relaxed shadow-inner"
                />
                <div className="absolute bottom-3 right-3 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-md backdrop-blur-sm border border-border">
                  {messageText.length} chars
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5 bg-blue-50/50 text-blue-600/80 p-2 rounded-lg border border-blue-100">
                <AlertCircle className="w-3.5 h-3.5" />
                You can manually edit variables (like {'{{1}}'}) before sending.
              </p>
            </div>
          </div>

          <DialogFooter className="p-6 pt-0 bg-card border-t border-border/50 sm:justify-between flex items-center">
            <Button variant="ghost" className="rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors" onClick={() => setSelectedChat(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendMessage} 
              disabled={sending || (!messageText.trim() && !selectedTemplateId)}
              className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20 px-8 transition-all active:scale-95"
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
  );
}
