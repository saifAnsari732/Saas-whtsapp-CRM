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
  RefreshCcw,
  CheckCircle2,
  Bot,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type KeywordFlow = {
  id: string;
  name: string;
  keywords: string[];
  response_type?: "template" | "text";
  template_id: string | null;
  template_name?: string | null;
  text_message: string | null;
  is_active: boolean;
  created_at: string;
};

export type Template = {
  id: string;
  name: string;
  language?: string;
};

export default function KeywordFlowsPage() {
  const canCreate = useCan("send-messages");
  const [flows, setFlows] = useState<KeywordFlow[] | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<KeywordFlow | null>(null);
  const [form, setForm] = useState({
    name: "",
    keywords: "",
    response_type: "text",
    template_id: "",
    text_message: "",
  });
  const [saving, setSaving] = useState(false);

  async function loadData(silent = false) {
    if (!silent && !flows) setLoading(true);
    try {
      const [flowsRes, templatesRes] = await Promise.all([
        fetch("/api/keyword-flows"),
        fetch("/api/whatsapp/templates"),
      ]);

      if (!flowsRes.ok) {
        throw new Error("Failed to fetch keyword flows");
      }

      const flowsData = await flowsRes.json();
      setFlows(flowsData.flows || []);

      if (templatesRes.ok) {
        const tmplData = await templatesRes.json();
        const list = tmplData.templates || [];
        setTemplates(
          list.map((t: any) => ({
            id: t.name || t.id,
            name: t.name,
            language: t.language || "en_US",
          }))
        );
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load keyword flows");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData(true);
  }

  async function toggleActive(flow: KeywordFlow, active: boolean) {
    setFlows((prev) =>
      (prev || []).map((f) => (f.id === flow.id ? { ...f, is_active: active } : f))
    );
    try {
      const res = await fetch("/api/keyword-flows", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: flow.id, is_active: active }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success(active ? "Flow activated" : "Flow paused");
    } catch (error) {
      toast.error("Failed to update status");
      loadData(true);
    }
  }

  async function deleteFlow(id: string) {
    if (!confirm("Are you sure you want to delete this keyword flow?")) return;
    setFlows((prev) => (prev || []).filter((f) => f.id !== id));
    try {
      const res = await fetch(`/api/keyword-flows?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete flow");
      toast.success("Keyword flow deleted");
    } catch (error) {
      toast.error("Failed to delete flow");
      loadData(true);
    }
  }

  async function saveFlow() {
    if (!form.name.trim() || !form.keywords.trim()) {
      return toast.error("Please enter a flow name and at least one keyword");
    }
    if (form.response_type === "template" && !form.template_id) {
      return toast.error("Please select a template");
    }
    if (form.response_type === "text" && !form.text_message?.trim()) {
      return toast.error("Please enter a text message response");
    }

    setSaving(true);
    const keywordsArray = form.keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const selectedTemplate = templates.find(
      (t) => t.id === form.template_id || t.name === form.template_id
    );

    const payload = {
      id: editingFlow?.id,
      name: form.name.trim(),
      keywords: keywordsArray,
      response_type: form.response_type,
      template_id:
        form.response_type === "template"
          ? selectedTemplate?.id || form.template_id
          : null,
      template_name:
        form.response_type === "template"
          ? selectedTemplate?.name || form.template_id
          : null,
      text_message: form.response_type === "text" ? form.text_message.trim() : null,
    };

    try {
      const method = editingFlow ? "PUT" : "POST";
      const res = await fetch("/api/keyword-flows", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error || "Error saving flow");
      }

      toast.success(editingFlow ? "Flow updated successfully" : "Flow created successfully");
      setDialogOpen(false);
      loadData(true);
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : "Error saving flow");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col space-y-6 p-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h1 className="flex flex-wrap items-center gap-2.5 text-2xl font-extrabold tracking-tight text-foreground">
            <Zap className="h-6 w-6 text-primary" />
            <span>Keyword Flow</span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
              Auto-Reply
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>Live Engine Ready</span>
            </span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage auto responders and intelligent chatbots that trigger instantly when customers text specific keywords.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-10 border-border/80 bg-card text-foreground hover:bg-muted font-bold text-xs px-3.5 rounded-xl shadow-xs gap-1.5"
            title="Refresh keyword flows"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <GatedButton
            canAct={canCreate}
            gateReason="create flows"
            onClick={() => {
              setEditingFlow(null);
              setForm({
                name: "",
                keywords: "",
                response_type: "text",
                template_id: "",
                text_message: "",
              });
              setDialogOpen(true);
            }}
            className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs px-4 rounded-xl shadow-md gap-2 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Create Flow</span>
          </GatedButton>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !flows || flows.length === 0 ? (
          <div className="flex h-72 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Bot className="h-7 w-7" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-base font-bold text-foreground">No Keyword Flows Configured</h3>
              <p className="text-xs text-muted-foreground">
                Set up trigger words like <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-[11px]">hi</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-[11px]">price</code>, or <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-[11px]">demo</code> so your bot responds automatically 24/7.
              </p>
              {canCreate && (
                <Button
                  variant="outline"
                  className="mt-3 font-semibold text-xs border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => {
                    setEditingFlow(null);
                    setForm({
                      name: "",
                      keywords: "",
                      response_type: "text",
                      template_id: "",
                      text_message: "",
                    });
                    setDialogOpen(true);
                  }}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Create First Keyword Flow
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {flows.map((flow) => {
              const template = templates.find(
                (t) => t.id === flow.template_id || t.name === flow.template_name
              );
              return (
                <div
                  key={flow.id}
                  className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-border/60">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                          <Zap className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-foreground line-clamp-1">
                            {flow.name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              Chatbot
                            </span>
                            {flow.is_active ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-500/10 text-muted-foreground border border-slate-500/20">
                                Paused
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Switch
                          checked={flow.is_active}
                          onCheckedChange={(val) => toggleActive(flow, val)}
                          disabled={!canCreate}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:bg-muted"
                              />
                            }
                          >
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-border bg-popover">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingFlow(flow);
                                setForm({
                                  name: flow.name,
                                  keywords: (flow.keywords || []).join(", "),
                                  response_type:
                                    flow.response_type ||
                                    (flow.text_message ? "text" : "template"),
                                  template_id: flow.template_id || flow.template_name || "",
                                  text_message: flow.text_message || "",
                                });
                                setDialogOpen(true);
                              }}
                              className="cursor-pointer"
                            >
                              <Pencil className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-500 focus:text-red-600 cursor-pointer"
                              onClick={() => deleteFlow(flow.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="py-3 space-y-2.5 text-xs">
                      <div>
                        <span className="text-muted-foreground font-semibold block mb-1">
                          Keywords Triggered:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(flow.keywords || []).map((kw, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono text-[11px] font-semibold border border-purple-500/20"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-1">
                        <span className="text-muted-foreground font-semibold block mb-1">
                          Bot Response:
                        </span>
                        {flow.text_message ? (
                          <p className="rounded-lg bg-muted/60 p-2.5 text-foreground italic text-[11px] leading-relaxed border border-border/40">
                            "{flow.text_message}"
                          </p>
                        ) : (
                          <div className="flex items-center gap-2 rounded-lg bg-muted/60 p-2.5 text-foreground font-medium text-[11px] border border-border/40">
                            <MessageSquareText className="h-4 w-4 text-primary shrink-0" />
                            <span className="truncate">
                              Template: {template?.name || flow.template_name || flow.template_id || "WhatsApp Template"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 text-[10px] text-muted-foreground border-t border-border/40 flex items-center justify-between">
                    <span>Created: {new Date(flow.created_at).toLocaleDateString()}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="h-3 w-3" /> Ready
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-popover border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              {editingFlow ? "Edit Keyword Flow" : "Create Keyword Flow"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Flow Name</Label>
              <Input
                placeholder="e.g. Welcome Greeting / Pricing Inquiry"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-muted border-border text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Trigger Keywords (comma separated)
              </Label>
              <Input
                placeholder="e.g. hi, hello, price, rate, support"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                className="bg-muted border-border font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                When a customer texts any of these words, this automated reply triggers instantly.
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              <Label className="text-xs font-semibold text-foreground">Response Type</Label>
              <RadioGroup
                value={form.response_type}
                onValueChange={(v) => setForm({ ...form, response_type: v as "text" | "template" })}
                className="flex items-center gap-5"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="text" id="r-text" />
                  <Label htmlFor="r-text" className="text-xs font-medium cursor-pointer">
                    Text Message (Fast & Custom)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="template" id="r-template" />
                  <Label htmlFor="r-template" className="text-xs font-medium cursor-pointer">
                    WhatsApp Template
                  </Label>
                </div>
              </RadioGroup>

              {form.response_type === "text" ? (
                <div className="space-y-1.5 mt-2">
                  <Label className="text-xs font-semibold text-foreground">Message Body</Label>
                  <Textarea
                    placeholder="Hello! Thanks for reaching out. How can our team help you today?"
                    value={form.text_message}
                    onChange={(e) => setForm({ ...form, text_message: e.target.value })}
                    className="min-h-[100px] bg-muted border-border text-xs"
                  />
                </div>
              ) : (
                <div className="space-y-1.5 mt-2">
                  <Label className="text-xs font-semibold text-foreground">Select Approved Template</Label>
                  <Select
                    value={form.template_id}
                    onValueChange={(val) => setForm({ ...form, template_id: val || "" })}
                  >
                    <SelectTrigger className="bg-muted border-border text-xs">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-popover">
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id} className="text-xs">
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={saveFlow}
              disabled={saving}
              className="bg-primary text-primary-foreground font-bold text-xs"
            >
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              {saving ? "Saving..." : "Save Keyword Flow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
