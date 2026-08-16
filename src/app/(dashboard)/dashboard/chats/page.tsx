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
    if (!selectedChat || !messageText.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/whatsapp/baileys/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedChat.id,
          message: messageText
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
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <History className="h-8 w-8 text-rose-500" />
          Native WhatsApp Chats
        </h1>
        <p className="mt-2 text-muted-foreground">
          View and filter all historical conversations directly synced from your connected phone.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between rounded-xl bg-card p-4 border border-border shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search conversations..." 
            className="pl-9 bg-background/50" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            variant={filter === "all" ? "default" : "outline"} 
            onClick={() => setFilter("all")}
            className="flex-1 sm:flex-none"
          >
            All
          </Button>
          <Button 
            variant={filter === "direct" ? "default" : "outline"}
            onClick={() => setFilter("direct")}
            className="flex-1 sm:flex-none"
          >
            <MessageSquare className="mr-2 h-4 w-4" /> Direct
          </Button>
          <Button 
            variant={filter === "groups" ? "default" : "outline"}
            onClick={() => setFilter("groups")}
            className="flex-1 sm:flex-none"
          >
            <Users className="mr-2 h-4 w-4" /> Groups
          </Button>
          <Button variant="ghost" onClick={fetchChats} size="icon" title="Refresh">
            <Filter className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-rose-500 mb-4" />
            <p>Syncing chats from WhatsApp engine...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-12 text-red-500">
            <AlertCircle className="h-8 w-8 mb-4" />
            <p className="font-semibold">Failed to load chats</p>
            <p className="text-sm mt-1">{error}</p>
            <p className="text-xs text-muted-foreground mt-4">Make sure your device is connected via Fast Coexistence.</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
            <p>No conversations found.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredChats.map((chat) => (
              <div key={chat.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${chat.id.includes('@g.us') ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'}`}>
                    {chat.id.includes('@g.us') ? <Users className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-base">
                      {chat.name || chat.id.split('@')[0]}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {chat.id}
                    </p>
                  </div>
                </div>
                
                <div className="text-right flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    {chat.unreadCount ? (
                      <span className="inline-flex items-center justify-center rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-bold text-white">
                        {chat.unreadCount} New
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Read</span>
                    )}
                    {chat.conversationTimestamp && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(chat.conversationTimestamp * 1000).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => openSendModal(chat)}>
                    <Send className="mr-1 h-3 w-3" /> Send
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedChat} onOpenChange={(open) => !open && setSelectedChat(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Message to {selectedChat?.name || selectedChat?.id.split('@')[0]}</DialogTitle>
            <DialogDescription>
              Select a template or type a custom message to send directly via Native Baileys.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Select 
                value={selectedTemplateId} 
                onValueChange={(val) => {
                  const id = val || "";
                  setSelectedTemplateId(id);
                  const tmpl = templates.find(t => t.id === id);
                  if (tmpl) setMessageText(tmpl.body_text);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a Template (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Textarea 
                placeholder="Type your message here..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">You can edit the template variables here before sending.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedChat(null)}>Cancel</Button>
            <Button onClick={handleSendMessage} disabled={sending || !messageText.trim()}>
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
