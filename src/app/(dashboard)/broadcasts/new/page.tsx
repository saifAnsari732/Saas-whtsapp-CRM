'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { MessageTemplate } from '@/types';
import { useBroadcastSending } from '@/hooks/use-broadcast-sending';
import { uploadAccountMedia } from '@/lib/storage/upload-media';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { 
  Settings, 
  Users, 
  MessageSquare, 
  Clock, 
  X, 
  Loader2, 
  Info, 
  UploadCloud, 
  Smartphone,
  Phone,
  ExternalLink,
  Reply,
  CheckCheck,
  Rocket,
  Sparkles,
  Send,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export default function NewBroadcastPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accountId } = useAuth();
  const { createBroadcastAndStart, isProcessing } = useBroadcastSending();
  const supabase = createClient();

  const [name, setName] = useState('');
  
  // Recipients
  const [recipientMode, setRecipientMode] = useState<'group' | 'numbers'>('group');
  const [groupId, setGroupId] = useState('');
  const [pastedNumbers, setPastedNumbers] = useState('');

  const detectedNumbersList = useMemo(() => {
    return pastedNumbers
      .split(/[\n,]+/)
      .map((n) => n.trim().replace(/\D/g, ""))
      .filter((n) => n.length >= 8);
  }, [pastedNumbers]);
  const detectedNumbersCount = detectedNumbersList.length;

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupSelection, setGroupSelection] = useState<string>('create_new');
  const [newGroupName, setNewGroupName] = useState('');
  const [groupNumbers, setGroupNumbers] = useState('');
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  // Scheduling & Delay
  const [sendWhen, setSendWhen] = useState<'immediately' | 'later'>('immediately');
  const [scheduleDate, setScheduleDate] = useState('');
  const [sendDelaySeconds, setSendDelaySeconds] = useState<number>(3);

  // Templates
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [headerMediaUrl, setHeaderMediaUrl] = useState('');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [contactGroups, setContactGroups] = useState<{id: string; name: string}[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [variables, setVariables] = useState<Record<string, { type: 'static' | 'field' | 'custom_field'; value: string }>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const requiresMedia = selectedTemplate?.header_type && selectedTemplate.header_type !== 'text' && selectedTemplate.header_type !== ('none' as any);

  const placeholders = useMemo(() => {
    if (!selectedTemplate) return [];
    const textToSearch = [
      selectedTemplate.body_text,
      selectedTemplate.header_content,
      ...(selectedTemplate.buttons || []).map((b: any) => b.url || b.text),
    ].filter(Boolean).join(' ');
    
    const matches = textToSearch.match(/\{\{(\d+)\}\}/g);
    if (!matches) return [];
    return [...new Set(matches)].sort();
  }, [selectedTemplate]);

  // Compute live replaced body text for WhatsApp Preview
  const previewBodyText = useMemo(() => {
    if (!selectedTemplate?.body_text) return '';
    let text = selectedTemplate.body_text;
    placeholders.forEach((ph) => {
      const key = ph.replace(/[\{\}]/g, '');
      const varConfig = variables[key];
      if (varConfig) {
        if (varConfig.type === 'static' && varConfig.value) {
          text = text.replaceAll(ph, varConfig.value);
        } else if (varConfig.type === 'field') {
          const fieldName = varConfig.value || 'name';
          text = text.replaceAll(ph, `[${fieldName.toUpperCase()}]`);
        } else if (varConfig.type === 'custom_field' && varConfig.value) {
          text = text.replaceAll(ph, `[${varConfig.value}]`);
        }
      }
    });
    return text;
  }, [selectedTemplate, placeholders, variables]);

  useEffect(() => {
    async function fetchTemplates() {
      setIsLoadingTemplates(true);
      const [tplRes, tagsRes] = await Promise.all([
        supabase.from('message_templates').select('*').eq('status', 'APPROVED'),
        supabase.from('tags').select('*').order('name')
      ]);
      
      if (!tagsRes.error && tagsRes.data) {
        setContactGroups(tagsRes.data);
      }
      
      const { data, error } = tplRes;
      if (!error && data) {
        setTemplates(data as MessageTemplate[]);
        
        const resendId = searchParams.get('resend_id');
        const resendName = searchParams.get('resend_name');
        const resendTemplateName = searchParams.get('resend_template');
        if (resendName) setName(resendName + ' (Copy)');
        if (resendTemplateName) {
           const found = (data as MessageTemplate[]).find(t => t.name === resendTemplateName);
           if (found) setSelectedTemplateId(found.id);
        }

        if (resendId) {
          const { data: oldRecipients } = await supabase
            .from('broadcast_recipients')
            .select('contact:contacts(phone)')
            .eq('broadcast_id', resendId);
            
          if (oldRecipients && oldRecipients.length > 0) {
            setRecipientMode('numbers');
            const phones = oldRecipients.map((r: any) => r.contact?.phone).filter(Boolean);
            setPastedNumbers(phones.join('\n'));
          }
        }
      }
      setIsLoadingTemplates(false);
    }
    fetchTemplates();
  }, [supabase, searchParams]);

  // Pre-fill the header media URL if the template already has one saved permanently
  useEffect(() => {
    if (selectedTemplate && requiresMedia && selectedTemplate.header_media_url) {
      setHeaderMediaUrl(selectedTemplate.header_media_url);
    } else {
      setHeaderMediaUrl('');
    }
  }, [selectedTemplate, requiresMedia]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTemplateId) return;

    try {
      setIsUploading(true);
      toast.info('Uploading media...');
      
      const { publicUrl } = await uploadAccountMedia('chat-media', file);
      setHeaderMediaUrl(publicUrl);

      const { error } = await supabase
        .from('message_templates')
        .update({ header_media_url: publicUrl })
        .eq('id', selectedTemplateId);

      if (error) {
        console.error("Failed to update template permanent URL:", error);
      } else {
        setTemplates(prev => prev.map(t => 
          t.id === selectedTemplateId ? { ...t, header_media_url: publicUrl } : t
        ));
        toast.success('Media uploaded and saved to template permanently!');
      }

    } catch (err) {
      console.error(err);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveGroup = async () => {
    setIsSavingGroup(true);
    const supabase = createClient();
    try {
      let tagId = groupSelection;
      
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('account_id').eq('user_id', user.user?.id).single();
      
      if (!profile) {
         throw new Error("Failed to load user profile");
      }

      if (groupSelection === 'create_new') {
        if (!newGroupName.trim()) {
           toast.error("Please enter a group name");
           setIsSavingGroup(false);
           return;
        }
        
        const { data: newTag, error: tagErr } = await supabase.from('tags').insert({
          name: newGroupName.trim(),
          user_id: user.user?.id,
          account_id: profile.account_id
        }).select().single();
        
        if (newTag) {
          tagId = newTag.id;
        } else {
          console.error("Tag creation error:", tagErr);
          throw new Error("Failed to create tag");
        }
      }
      
      if (groupNumbers.trim()) {
        const numbers = groupNumbers.split(/[\n,]+/).map(n => n.trim().replace(/\D/g, '')).filter(Boolean);
        
        if (numbers.length > 0) {
          const { data: existingContacts } = await supabase.from('contacts').select('id, phone').eq('account_id', profile.account_id).in('phone', numbers);
          const existingPhones = new Set((existingContacts || []).map(c => c.phone));
          
          const newNumbers = numbers.filter(n => !existingPhones.has(n));
          if (newNumbers.length > 0) {
            const contactsToInsert = newNumbers.map(phone => ({
              account_id: profile.account_id,
              user_id: user.user?.id,
              phone: phone,
              name: phone
            }));
            const { error: insertErr } = await supabase.from('contacts').insert(contactsToInsert);
            if (insertErr) {
               console.error("Contacts insert error:", insertErr);
               throw new Error("Failed to insert contacts");
            }
          }
          
          const { data: allContacts } = await supabase.from('contacts').select('id').eq('account_id', profile.account_id).in('phone', numbers);
          
          if (allContacts && tagId) {
             const contactTags = allContacts.map(c => ({
               contact_id: c.id,
               tag_id: tagId
             }));
             const { error: ctErr } = await supabase.from('contact_tags').upsert(contactTags, { onConflict: 'contact_id,tag_id' });
             if (ctErr) {
               console.error("Contact tags insert error:", ctErr);
               throw new Error("Failed to insert contact tags");
             }
          }
        }
      }
      
      setIsGroupModalOpen(false);
      setNewGroupName('');
      setGroupNumbers('');
      toast.success("Group saved successfully");
      
      const { data: tags } = await supabase.from('tags').select('id, name').eq('account_id', profile.account_id).order('name');
      if (tags) {
        setContactGroups(tags);
        setGroupId(tagId);
      }
      
    } catch (err) {
      console.error(err);
      toast.error("Failed to save group");
    } finally {
      setIsSavingGroup(false);
    }
  };

  useEffect(() => {
    if (placeholders.length > 0) {
      const initial: Record<string, any> = {};
      placeholders.forEach((ph, idx) => {
        const key = ph.replace(/[\{\}]/g, '');
        initial[key] = { type: 'field', value: idx === 0 ? 'name' : 'phone' };
      });
      setVariables(initial);
    } else {
      setVariables({});
    }
  }, [placeholders]);

  async function handleSend() {
    if (!name.trim()) {
      toast.error('Campaign Name is required');
      return;
    }
    if (recipientMode === 'group' && !groupId) {
      toast.error('Please select a contact group');
      return;
    }
    if (recipientMode === 'numbers' && !pastedNumbers.trim()) {
      toast.error('Please paste at least one phone number');
      return;
    }
    if (sendWhen === 'later' && !scheduleDate) {
      toast.error('Please select a schedule date and time');
      return;
    }
    if (!selectedTemplate) {
      toast.error('Please select a WhatsApp Template');
      return;
    }
    if (requiresMedia && !headerMediaUrl.trim()) {
      toast.error('This template requires a media attachment URL');
      return;
    }
    
    try {
      let audience: any = { type: 'all' };

      if (recipientMode === 'group') {
        if (groupId === 'all') {
          audience = { type: 'all' };
        } else {
          audience = { type: 'tags', tagIds: [groupId] };
        }
      } else if (recipientMode === 'numbers') {
        const numbers = pastedNumbers.split(/[\n,]+/).map(n => n.trim()).filter(Boolean);
        audience = { 
          type: 'csv', 
          csvContacts: numbers.map(phone => ({ phone })) 
        };
      }

      const id = await createBroadcastAndStart({
        name,
        template: selectedTemplate,
        audience,
        variables,
        headerMediaUrl: requiresMedia ? headerMediaUrl : undefined,
        scheduledAt: sendWhen === 'later' ? new Date(scheduleDate).toISOString() : undefined,
        delaySeconds: sendDelaySeconds,
        batchDelayMs: sendDelaySeconds * 1000,
      } as any);

      toast.success(sendWhen === 'later' ? 'Campaign scheduled successfully!' : 'Campaign created and sending started!');
      
      if (sendWhen === 'later') {
        router.push('/broadcasts');
      } else {
        router.push(`/broadcasts/${id}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Broadcast failed';
      toast.error(message);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage Contact Group</DialogTitle>
            <DialogDescription>
              Create a new group or add numbers to an existing one.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Select Group</Label>
              <Select value={groupSelection} onValueChange={(v) => setGroupSelection(v || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="create_new" className="font-semibold text-primary">+ Create New Group</SelectItem>
                  {contactGroups.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>{tag.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {groupSelection === 'create_new' && (
              <div className="space-y-2">
                <Label>New Group Name</Label>
                <Input 
                  placeholder="e.g. Premium Customers" 
                  value={newGroupName} 
                  onChange={e => setNewGroupName(e.target.value)} 
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Add Numbers (Optional)</Label>
              <Textarea 
                placeholder="Paste numbers separated by commas or newlines (e.g. 919876543210, 919876543211)..."
                value={groupNumbers}
                onChange={e => setGroupNumbers(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGroupModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveGroup} disabled={isSavingGroup}>
              {isSavingGroup ? "Saving..." : "Save Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="w-full px-4 sm:px-8 py-6 pb-28 max-w-7xl mx-auto">
        {/* Top Header Row with Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-border/80">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <span>Create New Campaign</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                Bulk Broadcast
              </span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Configure campaign details, select target contact groups, and schedule automatic dispatches.
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/broadcasts')} 
              className="gap-1.5 rounded-xl border-border/80 text-xs font-semibold px-4"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={isProcessing} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all gap-2"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
              <span>{isProcessing ? (sendWhen === 'later' ? 'Scheduling...' : 'Sending...') : (sendWhen === 'later' ? 'Schedule Campaign' : '🚀 Launch Campaign Now')}</span>
            </Button>
          </div>
        </div>

        {/* 4-Step Intuitive Workflow Guide */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-card border border-border/80 shadow-xs flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-600 font-black text-xs flex items-center justify-center shrink-0">1</div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">1. Campaign Title</p>
              <p className="text-[10px] text-muted-foreground truncate">Name your broadcast</p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border/80 shadow-xs flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-500/15 text-blue-600 font-black text-xs flex items-center justify-center shrink-0">2</div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">2. Target Audience</p>
              <p className="text-[10px] text-muted-foreground truncate">Group or Paste Numbers</p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border/80 shadow-xs flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-500/15 text-amber-600 font-black text-xs flex items-center justify-center shrink-0">3</div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">3. Delivery Timing</p>
              <p className="text-[10px] text-muted-foreground truncate">Instant or Scheduled</p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border/80 shadow-xs flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-purple-500/15 text-purple-600 font-black text-xs flex items-center justify-center shrink-0">4</div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">4. Live Preview</p>
              <p className="text-[10px] text-muted-foreground truncate">Verify & Launch</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Configuration Cards (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Section 1: Basic Information */}
            <div className="bg-card text-card-foreground border border-border/80 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold border-b border-border/60 pb-3">
                <Settings className="h-4 w-4 text-emerald-500" />
                <h2 className="text-xs uppercase tracking-wider">1. Basic Information</h2>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground">Campaign Name *</Label>
                <Input 
                  placeholder="e.g., Festive Offer Sale Campaign" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background border-border/80 text-sm focus:border-emerald-500 transition-colors rounded-xl h-11"
                />
              </div>
            </div>

            {/* Section 2: Target Recipients */}
            <div className="bg-card text-card-foreground border border-border/80 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold border-b border-border/60 pb-3">
                <Users className="h-4 w-4 text-blue-500" />
                <h2 className="text-xs uppercase tracking-wider">2. Target Audience & Recipients *</h2>
              </div>
              
              <Tabs value={recipientMode} onValueChange={(v: any) => setRecipientMode(v)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 p-1.5 bg-muted/80 rounded-xl mb-4 h-12 gap-1.5">
                  <TabsTrigger value="group" className="rounded-lg font-bold text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs py-2">
                    🏷️ Select Contact Group
                  </TabsTrigger>
                  <TabsTrigger value="numbers" className="rounded-lg font-bold text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs py-2 flex items-center justify-center gap-1.5">
                    <span>📋 Paste Direct Numbers</span>
                    {detectedNumbersCount > 0 && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded-full font-black">
                        {detectedNumbersCount}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="group" className="mt-0 space-y-3">
                  <div className="flex items-center gap-2">
                    <Select value={groupId} onValueChange={(v) => setGroupId(v || '')}>
                      <SelectTrigger className="bg-background border-border/80 w-full rounded-xl h-11">
                        <SelectValue placeholder="Choose a contact group..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">⚡ All Contacts</SelectItem>
                        {contactGroups.map(g => (
                          <SelectItem key={g.id} value={g.id}>
                            🏷️ {g.name || 'Unnamed Group'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={() => setIsGroupModalOpen(true)} className="shrink-0 font-bold text-xs rounded-xl h-11 border-blue-500/30 text-blue-600 hover:bg-blue-500/10">
                      + New Group
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Select an existing audience group saved from your contacts or tags list.</p>
                </TabsContent>

                <TabsContent value="numbers" className="mt-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Paste Phone Numbers (one per line or comma-separated)</span>
                    <div className="flex items-center gap-2">
                      {detectedNumbersCount > 0 && (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[11px] font-bold">
                          ✓ {detectedNumbersCount} Numbers Detected
                        </Badge>
                      )}
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
                    className="min-h-[120px] bg-background border-border/80 font-mono text-xs rounded-xl p-3 leading-relaxed"
                    value={pastedNumbers}
                    onChange={(e) => setPastedNumbers(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border/60">
                    💡 Enter full numbers with country code prefix (e.g. 91 for India, 1 for USA). No + sign needed.
                  </p>
                </TabsContent>
              </Tabs>
            </div>

            {/* Section 3: Dispatch Timing & Delay */}
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <Clock className="h-4 w-4 text-rose-500" />
                  <span>3. Dispatch Timing & Anti-Ban Protection *</span>
                </div>
              </div>

              <RadioGroup value={sendWhen} onValueChange={(v: any) => setSendWhen(v)} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={cn(
                  "flex items-start space-x-3 p-3.5 rounded-xl border transition-all cursor-pointer",
                  sendWhen === 'immediately' ? "bg-background border-rose-500 ring-1 ring-rose-500/40 shadow-xs" : "bg-card border-border/60 hover:border-border"
                )}>
                  <RadioGroupItem value="immediately" id="immed" className="mt-0.5" />
                  <Label htmlFor="immed" className="font-semibold text-xs cursor-pointer space-y-1">
                    <span className="block text-foreground font-bold">Send Immediately</span>
                    <span className="text-[11px] text-muted-foreground font-normal block">Campaign starts dispatching right after creation</span>
                  </Label>
                </div>

                <div className={cn(
                  "flex items-start space-x-3 p-3.5 rounded-xl border transition-all cursor-pointer",
                  sendWhen === 'later' ? "bg-background border-rose-500 ring-1 ring-rose-500/40 shadow-xs" : "bg-card border-border/60 hover:border-border"
                )}>
                  <RadioGroupItem value="later" id="later" className="mt-0.5" />
                  <Label htmlFor="later" className="font-semibold text-xs cursor-pointer space-y-1">
                    <span className="block text-foreground font-bold">Schedule for Later</span>
                    <span className="text-[11px] text-muted-foreground font-normal block">Choose custom date & time slot</span>
                  </Label>
                </div>
              </RadioGroup>

              {sendWhen === 'later' && (
                <div className="pt-2">
                  <Label className="text-xs font-semibold text-foreground mb-1.5 block">Select Schedule Date & Time</Label>
                  <Input type="datetime-local" className="bg-background max-w-sm border-border/80 rounded-xl" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
                </div>
              )}

              <div className="pt-4 border-t border-rose-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-foreground text-xs flex items-center gap-2">
                    <span>Message Interval (Anti-Ban Protection)</span>
                    <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full">Anti-Ban Guard</span>
                  </Label>
                </div>
                
                <div className="flex items-center gap-3">
                  <Select value={String(sendDelaySeconds)} onValueChange={(v) => setSendDelaySeconds(Number(v))}>
                    <SelectTrigger className="w-56 bg-background font-semibold border-border/80 text-xs rounded-xl">
                      <SelectValue placeholder="Select delay" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Second (Fast)</SelectItem>
                      <SelectItem value="2">2 Seconds</SelectItem>
                      <SelectItem value="3">3 Seconds (Recommended)</SelectItem>
                      <SelectItem value="5">5 Seconds (Safe)</SelectItem>
                      <SelectItem value="10">10 Seconds (Very Safe)</SelectItem>
                      <SelectItem value="15">15 Seconds (Extra Safe)</SelectItem>
                      <SelectItem value="30">30 Seconds</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-[11px] text-muted-foreground font-medium">Wait {sendDelaySeconds}s between each message.</span>
                </div>
              </div>
            </div>

            {/* Section 4: WhatsApp Message Configuration */}
            <div className="bg-card text-card-foreground border border-border/80 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold border-b border-border/60 pb-3">
                <MessageSquare className="h-4 w-4 text-rose-500" />
                <h2 className="text-xs uppercase tracking-wider">4. Message Configuration & Template *</h2>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground">Select WhatsApp Template *</Label>
                <Select value={selectedTemplateId} onValueChange={(v) => setSelectedTemplateId(v || '')} disabled={isLoadingTemplates}>
                  <SelectTrigger className="bg-background border-border/80 font-medium rounded-xl">
                    <SelectValue placeholder={isLoadingTemplates ? "Loading templates..." : "Choose an approved template..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.length === 0 && !isLoadingTemplates && (
                      <SelectItem value="none" disabled>No approved templates found</SelectItem>
                    )}
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} ({t.language})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">Select from Meta-approved WhatsApp Business templates for bulk broadcast dispatch.</p>
              </div>

              {/* Variable Mapping UI */}
              {selectedTemplate && placeholders.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border/60">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
                    <Settings className="h-3.5 w-3.5 text-rose-500" />
                    <h3>Template Variables Personalization</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {placeholders.map((ph) => {
                      const key = ph.replace(/[\{\}]/g, '');
                      const current = variables[key] || { type: 'field', value: 'name' };
                      return (
                        <div key={ph} className="p-3 border border-border/80 rounded-xl bg-background space-y-2">
                          <div className="flex items-center justify-between font-bold text-xs">
                            <span>Variable {ph}</span>
                            <span className="text-[10px] bg-rose-500/10 text-rose-600 border border-rose-500/30 px-2 py-0.5 rounded font-semibold">
                              {current.type === 'field' ? 'Contact Field' : current.type === 'custom_field' ? 'Custom Field' : 'Static Text'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Select
                              value={current.type}
                              onValueChange={(val: any) => {
                                setVariables(prev => ({
                                  ...prev,
                                  [key]: { type: val, value: val === 'field' ? 'name' : '' }
                                }));
                              }}
                            >
                              <SelectTrigger className="text-xs h-8 bg-card border-border/60 rounded-lg">
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="field">Contact Field</SelectItem>
                                <SelectItem value="static">Static Text</SelectItem>
                                <SelectItem value="custom_field">Custom Field</SelectItem>
                              </SelectContent>
                            </Select>

                            {current.type === 'field' ? (
                              <Select
                                value={current.value || 'name'}
                                onValueChange={(val) => {
                                  if (val) {
                                    setVariables(prev => ({
                                      ...prev,
                                      [key]: { type: 'field', value: val }
                                    }));
                                  }
                                }}
                              >
                                <SelectTrigger className="text-xs h-8 bg-card border-border/60 rounded-lg">
                                  <SelectValue placeholder="Field" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="name">Name</SelectItem>
                                  <SelectItem value="phone">Phone Number</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="company">Company</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                placeholder={current.type === 'static' ? "Static text..." : "Field ID..."}
                                value={current.value || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setVariables(prev => ({
                                    ...prev,
                                    [key]: { type: current.type, value: val }
                                  }));
                                }}
                                className="text-xs h-8 bg-card border-border/60 rounded-lg"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {requiresMedia && (
                <div className="space-y-3 pt-4 border-t border-border/60">
                  <Label className="flex items-center gap-2 text-xs font-bold text-foreground">
                    Header Media Attachment (Required)
                  </Label>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="https://example.com/image.jpg"
                        value={headerMediaUrl}
                        onChange={(e) => setHeaderMediaUrl(e.target.value)}
                        className="bg-background flex-1 text-xs rounded-xl"
                      />
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept={selectedTemplate?.header_type === 'video' ? 'video/*' : selectedTemplate?.header_type === 'document' ? '.pdf,.doc,.docx' : 'image/*'}
                        onChange={handleFileUpload}
                      />
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="gap-2 shrink-0 text-xs font-semibold rounded-xl"
                      >
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                        Upload File
                      </Button>
                    </div>

                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Info className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                      <p>
                        Paste a public URL or upload a file. 
                        <strong className="text-rose-600 dark:text-rose-400 block mt-0.5">
                          Uploaded media is saved directly into your account storage.
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Form Action Buttons */}
            <div className="flex items-center justify-between p-4 bg-card border border-border/80 rounded-2xl shadow-xs">
              <Button 
                variant="outline" 
                onClick={() => router.push('/broadcasts')} 
                className="gap-1.5 rounded-xl border-border/80 text-xs font-semibold px-5"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSend} 
                disabled={isProcessing} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all gap-2"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                <span>{isProcessing ? (sendWhen === 'later' ? 'Scheduling...' : 'Sending...') : (sendWhen === 'later' ? 'Schedule Campaign' : '🚀 Launch Campaign Now')}</span>
              </Button>
            </div>

          </div>

          {/* Right Column: Live Message Preview & Campaign Trigger (5 Columns) */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-rose-500" />
                  Live WhatsApp Preview
                </span>
                <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Real-time
                </span>
              </div>

              {/* Realistic Phone Mockup Shell */}
              <div className="bg-[#efeae2] dark:bg-[#0b141a] rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 shadow-md">
                {/* Phone Header Strip */}
                <div className="bg-[#075e54] dark:bg-[#1f2c34] text-white px-4 py-2.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white shadow-xs">
                    CF
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold truncate">ChatFlyr Business</h4>
                    <p className="text-[10px] text-emerald-200 truncate">Official Business Account</p>
                  </div>
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </div>

                {/* WhatsApp Chat Wall & Message Bubble Container */}
                <div className="p-4 min-h-[560px] max-h-[720px] h-[640px] overflow-y-auto flex flex-col justify-start gap-3 bg-[radial-gradient(#0000000a_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px]">
                  
                  {/* System Date Badge */}
                  <div className="self-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full shadow-2xs border border-slate-200/50 dark:border-slate-700/50">
                    TODAY
                  </div>

                  {selectedTemplate ? (
                    <div className="bg-white dark:bg-[#202c33] text-slate-800 dark:text-slate-100 rounded-xl p-3.5 shadow-sm text-xs space-y-2.5 max-w-[92%] self-start border border-slate-200/80 dark:border-slate-700/60 relative group">
                      
                      {/* Optional Header Media */}
                      {headerMediaUrl && (
                        <div className="rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 max-h-52">
                          {selectedTemplate.header_type === 'video' ? (
                            <video src={headerMediaUrl} controls className="w-full max-h-48 object-contain bg-black" />
                          ) : (
                            <img src={headerMediaUrl} alt="Header Preview" className="w-full max-h-48 object-contain bg-slate-50 dark:bg-slate-900" />
                          )}
                        </div>
                      )}

                      {/* Header Text (if text header type) */}
                      {selectedTemplate.header_type === 'text' && selectedTemplate.header_content && (
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {selectedTemplate.header_content}
                        </div>
                      )}

                      {/* Main Message Body Text */}
                      <p className="whitespace-pre-wrap font-sans leading-relaxed text-xs text-slate-800 dark:text-slate-100">
                        {previewBodyText || selectedTemplate.body_text}
                      </p>

                      {/* Footer Text */}
                      {selectedTemplate.footer_text && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-700/50 pt-1.5 font-medium">
                          {selectedTemplate.footer_text}
                        </p>
                      )}

                      {/* Time & Double Checkmark */}
                      <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400 dark:text-slate-500 pt-0.5">
                        <span>12:00 PM</span>
                        <CheckCheck className="h-3 w-3 text-blue-500" />
                      </div>

                      {/* Template Buttons Preview */}
                      {selectedTemplate.buttons && selectedTemplate.buttons.length > 0 && (
                        <div className="mt-3 border-t border-slate-200/80 dark:border-slate-700/80 divide-y divide-slate-200/80 dark:divide-slate-700/80 -mx-3.5 -mb-3.5 rounded-b-xl overflow-hidden">
                          {selectedTemplate.buttons.map((btn: any, idx: number) => (
                            <div 
                              key={idx} 
                              className="py-2.5 px-3 text-center font-bold text-xs text-[#00a884] dark:text-[#00a884] flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                            >
                              {btn.type === 'URL' ? <ExternalLink className="h-3.5 w-3.5" /> : btn.type === 'PHONE_NUMBER' ? <Phone className="h-3.5 w-3.5" /> : <Reply className="h-3.5 w-3.5" />}
                              <span>{btn.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full my-auto py-24 px-4 text-center text-slate-400 dark:text-slate-500 space-y-3">
                      <MessageSquare className="h-12 w-12 stroke-[1.5] text-slate-300 dark:text-slate-700" />
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 max-w-xs">
                        Select a WhatsApp Template on the left to view real-time message layout & preview.
                      </p>
                    </div>
                  )}

                </div>
              </div>

              {/* Sidebar Action Trigger */}
              <div className="pt-3 border-t border-border/60 space-y-2">
                <Button 
                  onClick={handleSend} 
                  disabled={isProcessing} 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 text-xs shadow-md rounded-xl transition-all gap-2"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                  <span>{isProcessing ? (sendWhen === 'later' ? 'Scheduling...' : 'Sending...') : (sendWhen === 'later' ? 'Schedule Campaign' : '🚀 Launch Campaign Now')}</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/broadcasts')}
                  className="w-full text-xs font-semibold rounded-xl"
                >
                  Cancel
                </Button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
