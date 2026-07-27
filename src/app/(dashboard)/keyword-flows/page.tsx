"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Zap,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  MessageSquareText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCan } from "@/hooks/use-can";
import { Button } from "@/components/ui/button";
import { GatedButton } from "@/components/ui/gated-button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type KeywordFlow = {
  id: string;
  name: string;
  keywords: string[];
  template_id: string;
  is_active: boolean;
  created_at: string;
};

type Template = {
  id: string;
  name: string;
};

export default function KeywordFlowsPage() {
  const canCreate = useCan("send-messages");
  const [flows, setFlows] = useState<KeywordFlow[] | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<KeywordFlow | null>(null);
  const [form, setForm] = useState({ name: "", keywords: "", template_id: "" });
  const [saving, setSaving] = useState(false);

  async function loadData() {
    try {
      const supabase = createClient();
      const [flowsRes, templatesRes] = await Promise.all([
        supabase.from("keyword_flows").select("*").order("created_at", { ascending: false }),
        supabase.from("message_templates").select("id, name").eq("status", "APPROVED"),
      ]);

      if (flowsRes.error) throw flowsRes.error;
      if (templatesRes.error) throw templatesRes.error;

      setFlows(flowsRes.data || []);
      setTemplates(templatesRes.data || []);
    } catch (err) {
      toast.error("Failed to load keyword flows");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function toggleActive(flow: KeywordFlow, active: boolean) {
    const supabase = createClient();
    setFlows((prev) =>
      (prev || []).map((f) => (f.id === flow.id ? { ...f, is_active: active } : f))
    );
    const { error } = await supabase
      .from("keyword_flows")
      .update({ is_active: active })
      .eq("id", flow.id);
    if (error) {
      toast.error("Failed to update status");
      loadData();
    }
  }

  async function deleteFlow(id: string) {
    if (!confirm("Are you sure you want to delete this flow?")) return;
    const supabase = createClient();
    setFlows((prev) => (prev || []).filter((f) => f.id !== id));
    const { error } = await supabase.from("keyword_flows").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete flow");
      loadData();
    } else {
      toast.success("Flow deleted");
    }
  }

  async function saveFlow() {
    if (!form.name.trim() || !form.keywords.trim() || !form.template_id) {
      return toast.error("Please fill in all fields");
    }

    setSaving(true);
    const supabase = createClient();
    const keywordsArray = form.keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    try {
      const authReq = await supabase.auth.getUser();
      const user_id = authReq.data.user?.id;
      if (!user_id) throw new Error("Not logged in");

      if (editingFlow) {
        const { error } = await supabase
          .from("keyword_flows")
          .update({
            name: form.name,
            keywords: keywordsArray,
            template_id: form.template_id,
          })
          .eq("id", editingFlow.id);
        if (error) throw error;
        toast.success("Flow updated");
      } else {
        const { error } = await supabase.from("keyword_flows").insert({
          name: form.name,
          keywords: keywordsArray,
          template_id: form.template_id,
          user_id: user_id,
        });
        if (error) throw error;
        toast.success("Flow created");
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error("Failed to save flow");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Zap className="h-5 w-5 text-primary" />
            Keyword Flow
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage auto responders and chatbots for your WhatsApp devices
          </p>
        </div>
        <GatedButton
          canAct={canCreate}
          gateReason="create flows"
          onClick={() => {
            setEditingFlow(null);
            setForm({ name: "", keywords: "", template_id: "" });
            setDialogOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Add
        </GatedButton>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-muted/30">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !flows || flows.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card/50 text-center">
            <Zap className="h-10 w-10 text-muted-foreground/50" />
            <div className="space-y-1">
              <h3 className="font-medium text-foreground">No Keyword Flows yet</h3>
              <p className="text-sm text-muted-foreground">
                Create a keyword flow to auto-reply to specific incoming words.
              </p>
            </div>
            {canCreate && (
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => {
                  setEditingFlow(null);
                  setForm({ name: "", keywords: "", template_id: "" });
                  setDialogOpen(true);
                }}
              >
                Create your first flow
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flows.map((flow) => {
              const template = templates.find((t) => t.id === flow.template_id);
              return (
                <div
                  key={flow.id}
                  className="rounded-xl border border-border bg-card shadow-sm flex flex-col"
                >
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{flow.name}</h3>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        Chatbot
                      </span>
                      {flow.is_active && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                          active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={flow.is_active}
                        onCheckedChange={(val) => toggleActive(flow, val)}
                        disabled={!canCreate}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[popup-open]:bg-muted"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingFlow(flow);
                              setForm({
                                name: flow.name,
                                keywords: flow.keywords.join(", "),
                                template_id: flow.template_id,
                              });
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => deleteFlow(flow.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="p-4 space-y-3 text-sm">
                    <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
                      <span className="text-muted-foreground font-medium">Trigger:</span>
                      <span className="text-foreground">Keyword Based</span>
                    </div>
                    <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
                      <span className="text-muted-foreground font-medium">Keywords:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {flow.keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-xs"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
                      <span className="text-muted-foreground font-medium">Response:</span>
                      <span className="flex items-center gap-1.5 text-foreground">
                        <MessageSquareText className="h-3.5 w-3.5 text-muted-foreground" />
                        {template?.name || "Unknown Template"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-popover border-border">
          <DialogHeader>
            <DialogTitle>
              {editingFlow ? "Edit Keyword Flow" : "Create Keyword Flow"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Flow Name</Label>
              <Input
                placeholder="e.g. Greeting Flow"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Keywords (comma separated)</Label>
              <Input
                placeholder="e.g. hi, hello, help"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                className="bg-muted border-border"
              />
              <p className="text-xs text-muted-foreground">
                If an incoming message matches any of these exactly, the flow will trigger.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Response Template</Label>
              <Select
                value={form.template_id}
                onValueChange={(val) => setForm({ ...form, template_id: val || "" })}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={saveFlow} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
