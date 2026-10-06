'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { MessageTemplate } from '@/types';
import { useBroadcastSending } from '@/hooks/use-broadcast-sending';
import { uploadAccountMedia } from '@/lib/storage/upload-media';
import { sanitizePhoneForMeta, validatePhone, PhoneValidation } from '@/lib/whatsapp/phone-utils';
import { WhatsAppPhoneMockup } from '@/components/broadcasts/whatsapp-phone-mockup';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
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
  Send,
  SlidersHorizontal,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Zap,
  Copy,
  Trash2,
  FileText,
  Tag,
  Check
} from 'lucide-react';

export default function NewBroadcastPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accountId } = useAuth();
  const { createBroadcastAndStart, isProcessing } = useBroadcastSending();
  const supabase = createClient();

  const [name, setName] = useState('');
  
  // Recipients
  const [recipientMode, setRecipientMode] = useState<'group' | 'numbers'>('numbers');
  const [groupId, setGroupId] = useState('');
  const [pastedNumbers, setPastedNumbers] = useState('');

  // Advanced phone parsing & live validation
  const parsedPhoneList = useMemo(() => {
    if (!pastedNumbers.trim()) {
      return { valid: [] as PhoneValidation[], invalid: [] as { raw: string; error: string }[] };
    }
    const lines = pastedNumbers
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const valid: PhoneValidation[] = [];
    const invalid: { raw: string; error: string }[] = [];
    const seenPhones = new Set<string>();

    for (const raw of lines) {
      const res = validatePhone(raw);
      if (res.isValid && res.phone) {
        if (!seenPhones.has(res.phone)) {
          seenPhones.add(res.phone);
          valid.push(res);
        }
      } else {
        invalid.push({ raw, error: res.error || 'Invalid phone' });
      }
    }
    return { valid, invalid };
  }, [pastedNumbers]);

  const validCount = parsedPhoneList.valid.length;
  const invalidCount = parsedPhoneList.invalid.length;

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupSelection, setGroupSelection] = useState<string>('create_new');
  const [newGroupName, setNewGroupName] = useState('');
  const [groupNumbers, setGroupNumbers] = useState('');
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  // Scheduling & Delay
  const [sendWhen, setSendWhen] = useState<'immediately' | 'later'>('immediately');
  const [scheduleDate, setScheduleDate] = useState('');
  const [sendDelaySeconds, setSendDelaySeconds] = useState<number>(10);

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
      try {
        const [tplRes, tagsRes] = await Promise.all([
          fetch('/api/whatsapp/templates').then((r) => r.json()).catch(() => ({ templates: [] })),
          supabase.from('tags').select('*').order('name')
        ]);
        
        if (!tagsRes.error && tagsRes.data) {
          setContactGroups(tagsRes.data);
        }
        
        const loadedTemplates: MessageTemplate[] = Array.isArray(tplRes.templates) ? tplRes.templates : [];
        const approvedTemplates = loadedTemplates.filter(
          (t) => !t.status || (t.status || '').toUpperCase() === 'APPROVED' || (t.status || '').toLowerCase() === 'approved'
        );
        const data = approvedTemplates.length > 0 ? approvedTemplates : loadedTemplates;
        setTemplates(data);
        
        const resendId = searchParams.get('resend_id');
        const resendName = searchParams.get('resend_name');
        const resendTemplateName = searchParams.get('resend_template');
        if (resendName) setName(resendName + ' (Copy)');
        if (resendTemplateName) {
          const found = data.find((t) => t.name === resendTemplateName);
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
      } catch (err) {
        console.error('Failed to load templates for broadcast:', err);
      } finally {
        setIsLoadingTemplates(false);
      }
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
    if (!file) return;

    try {
      setIsUploading(true);
      toast.info('Uploading media attachment...');
      
      const { publicUrl } = await uploadAccountMedia('chat-media', file, selectedTemplateId);
      setHeaderMediaUrl(publicUrl);

      if (selectedTemplateId) {
        setTemplates(prev => prev.map(t => 
          t.id === selectedTemplateId ? { ...t, header_media_url: publicUrl } : t
        ));
      }
      toast.success('Media uploaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to upload file');
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
        const numbers = groupNumbers
          .split(/[\n,]+/)
          .map(n => sanitizePhoneForMeta(n.trim()))
          .filter(Boolean);
        
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
    if (recipientMode === 'numbers' && validCount === 0) {
      toast.error('Please paste at least one valid phone number');
      return;
    }
    if (sendWhen === 'later' && !scheduleDate) {
      toast.error('Please select a schedule date and time');
      return;
    }
    if (!selectedTemplate) {
      toast.error('Please select an approved WhatsApp Template');
      return;
    }
    if (requiresMedia && !headerMediaUrl.trim()) {
      toast.error('This template requires a header media attachment');
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
        // Use sanitized & validated phone numbers
        const sanitizedPhones = parsedPhoneList.valid.map(v => v.phone);
        audience = { 
          type: 'csv', 
          csvContacts: sanitizedPhones.map(phone => ({ phone })) 
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

      toast.success(sendWhen === 'later' ? 'Campaign scheduled successfully!' : 'Campaign launched successfully!');
      
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
    <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-zinc-950">
      {/* Modal for Group Creation */}
      <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              <span>Manage Contact Group</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Create a new contact audience or append numbers to an existing group.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Group Selection</Label>
              <Select value={groupSelection} onValueChange={(v) => setGroupSelection(v || '')}>
                <SelectTrigger className="rounded-xl h-10 text-xs">
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="create_new" className="font-bold text-emerald-600">
                    + Create New Group
                  </SelectItem>
                  {contactGroups.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id} className="text-xs">
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {groupSelection === 'create_new' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">New Group Name *</Label>
                <Input 
                  placeholder="e.g. VIP Customers, Diwali Buyers" 
                  value={newGroupName} 
                  onChange={e => setNewGroupName(e.target.value)} 
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            )}
            
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Add Phone Numbers (Optional)</Label>
              <Textarea 
                placeholder="Paste numbers separated by newlines (e.g. 919876543210, 9511450924)..."
                value={groupNumbers}
                onChange={e => setGroupNumbers(e.target.value)}
                className="min-h-[110px] rounded-xl text-xs font-mono"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsGroupModalOpen(false)} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button 
              size="sm"
              onClick={handleSaveGroup} 
              disabled={isSavingGroup}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
            >
              {isSavingGroup ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              {isSavingGroup ? "Saving..." : "Save Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Main Container */}
      <div className="w-full px-4 sm:px-8 py-6 pb-24 max-w-7xl mx-auto space-y-6">
        
        {/* Top Breadcrumb & Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-zinc-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <Link href="/broadcasts" className="hover:text-foreground flex items-center gap-1 transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Campaigns</span>
              </Link>
              <span>/</span>
              <span className="text-foreground font-semibold">New Broadcast</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Create WhatsApp Campaign
              </h1>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                Meta Official Cloud API
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure campaign details, select verified audience, schedule delivery speed, and preview message in real-time.
            </p>
          </div>
          
          {/* Header Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/broadcasts')} 
              className="gap-1.5 rounded-xl border-slate-200 dark:border-zinc-800 text-xs font-semibold px-4 h-9"
            >
              <X className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={isProcessing} 
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 h-9 rounded-xl shadow-sm transition-all gap-1.5 active:scale-[0.98]"
            >
              {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              <span>
                {isProcessing 
                  ? (sendWhen === 'later' ? 'Scheduling...' : 'Dispatching...') 
                  : (sendWhen === 'later' ? 'Schedule Broadcast' : 'Launch Campaign')}
              </span>
            </Button>
          </div>
        </div>

        {/* 4-Step Sleek Workflow Guide */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className={cn(
            "p-3 rounded-2xl border transition-all flex items-center gap-3",
            name.trim() 
              ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/60" 
              : "bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs"
          )}>
            <div className={cn(
              "h-8 w-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0",
              name.trim() ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300"
            )}>
              {name.trim() ? <Check className="h-4 w-4 stroke-[2.5]" /> : "1"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">1. Campaign Title</p>
              <p className="text-[11px] text-muted-foreground truncate">{name.trim() || 'Name broadcast'}</p>
            </div>
          </div>

          <div className={cn(
            "p-3 rounded-2xl border transition-all flex items-center gap-3",
            (recipientMode === 'numbers' ? validCount > 0 : !!groupId)
              ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/60" 
              : "bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs"
          )}>
            <div className={cn(
              "h-8 w-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0",
              (recipientMode === 'numbers' ? validCount > 0 : !!groupId) 
                ? "bg-emerald-600 text-white" 
                : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300"
            )}>
              {(recipientMode === 'numbers' ? validCount > 0 : !!groupId) ? <Check className="h-4 w-4 stroke-[2.5]" /> : "2"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">2. Target Audience</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {recipientMode === 'numbers' 
                  ? (validCount > 0 ? `${validCount} Valid Numbers` : 'Paste numbers') 
                  : (groupId ? 'Group selected' : 'Choose group')}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl border bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
              3
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">3. Delivery Speed</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {sendWhen === 'immediately' ? `Instant (${sendDelaySeconds}s delay)` : 'Scheduled'}
              </p>
            </div>
          </div>

          <div className={cn(
            "p-3 rounded-2xl border transition-all flex items-center gap-3",
            selectedTemplate 
              ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/60" 
              : "bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs"
          )}>
            <div className={cn(
              "h-8 w-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0",
              selectedTemplate ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300"
            )}>
              {selectedTemplate ? <Check className="h-4 w-4 stroke-[2.5]" /> : "4"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">4. Template & Preview</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {selectedTemplate ? selectedTemplate.name : 'Choose template'}
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form & Step Cards (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step 1: Campaign Details */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">1. Campaign Details</h2>
                    <p className="text-[11px] text-muted-foreground">Give your broadcast a recognizable reference name</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Campaign Name <span className="text-rose-500">*</span>
                </Label>
                <Input 
                  placeholder="e.g. Diwali Mega Festive Offer, September Newsletter" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-50/50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-sm focus-visible:ring-emerald-500 rounded-xl h-11"
                />
              </div>
            </div>

            {/* Step 2: Target Audience & Smart Numbers */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">2. Target Audience & Numbers <span className="text-rose-500">*</span></h2>
                    <p className="text-[11px] text-muted-foreground">Select saved contact tags or paste direct phone numbers</p>
                  </div>
                </div>
              </div>
              
              <Tabs value={recipientMode} onValueChange={(v: any) => setRecipientMode(v)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-100 dark:bg-zinc-800/80 rounded-xl mb-4 h-11 gap-1">
                  <TabsTrigger 
                    value="numbers" 
                    className="rounded-lg font-bold text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-foreground data-[state=active]:shadow-xs py-1.5 flex items-center justify-center gap-1.5"
                  >
                    <Phone className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Paste Direct Numbers</span>
                    {validCount > 0 && (
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 rounded-full font-bold">
                        {validCount}
                      </span>
                    )}
                  </TabsTrigger>

                  <TabsTrigger 
                    value="group" 
                    className="rounded-lg font-bold text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-foreground data-[state=active]:shadow-xs py-1.5 flex items-center justify-center gap-1.5"
                  >
                    <Tag className="h-3.5 w-3.5 text-blue-600" />
                    <span>Select Contact Group</span>
                  </TabsTrigger>
                </TabsList>

                {/* TAB: Direct Numbers */}
                <TabsContent value="numbers" className="mt-0 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Phone Numbers List
                      </Label>
                      {validCount > 0 && (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 text-[11px] font-bold py-0.5">
                          ✓ {validCount} Ready (+91 Formatted)
                        </Badge>
                      )}
                      {invalidCount > 0 && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 dark:border-amber-800 text-[11px] font-bold py-0.5">
                          ⚠️ {invalidCount} Invalid/Skipped
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setPastedNumbers("9511450924\n9876543210\n919876543211")} 
                        className="text-[11px] h-7 px-2 text-slate-600 hover:text-emerald-600 rounded-lg"
                      >
                        Sample Numbers
                      </Button>
                      {pastedNumbers.trim() && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setPastedNumbers("")} 
                          className="text-[11px] h-7 px-2 text-slate-400 hover:text-rose-500 rounded-lg"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  <Textarea 
                    placeholder="Paste numbers (one per line, with or without 91):&#10;9511450924&#10;9876543210&#10;+91 91234 56789" 
                    className="h-36 max-h-36 min-h-[144px] [field-sizing:fixed] overflow-y-auto resize-none bg-slate-50/50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 font-mono text-xs rounded-xl p-3 leading-relaxed focus-visible:ring-emerald-500"
                    style={{ fieldSizing: 'fixed' as any, height: '144px', maxHeight: '144px', overflowY: 'auto' }}
                    value={pastedNumbers}
                    onChange={(e) => setPastedNumbers(e.target.value)}
                  />

                  {/* Formatted Number Chips Preview */}
                  {validCount > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                        <span>Formatted Dispatch Preview ({validCount} total):</span>
                        {validCount > 4 && <span>Showing first 4</span>}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {parsedPhoneList.valid.slice(0, 4).map((item, idx) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-mono text-xs font-semibold"
                          >
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            {item.displayPhone || `+${item.phone}`}
                          </span>
                        ))}
                        {validCount > 4 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 text-xs font-medium">
                            +{validCount - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Smart Validation Explanatory Card */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800/80 text-[11px] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span>Smart Number Auto-Correction Active</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Indian 10-digit mobile numbers (e.g. <code>9511450924</code>) automatically receive country code <code>91</code>. Accidental duplicate prefixes (<code>9191...</code>), international zeros (<code>0091...</code>), trunk zeros (<code>0...</code>), hyphens, and spaces are automatically filtered so no message ever fails.
                    </p>
                  </div>
                </TabsContent>

                {/* TAB: Contact Group */}
                <TabsContent value="group" className="mt-0 space-y-3">
                  <div className="flex items-center gap-2">
                    <Select value={groupId} onValueChange={(v) => setGroupId(v || '')}>
                      <SelectTrigger className="bg-slate-50/50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 w-full rounded-xl h-11 text-xs font-medium">
                        <SelectValue placeholder="Choose an audience group..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all" className="font-bold text-emerald-600">
                          ⚡ All Contacts (Broadcast to entire CRM)
                        </SelectItem>
                        {contactGroups.map(g => (
                          <SelectItem key={g.id} value={g.id} className="text-xs">
                            🏷️ {g.name || 'Unnamed Group'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsGroupModalOpen(true)} 
                      className="shrink-0 font-bold text-xs rounded-xl h-11 border-blue-500/30 text-blue-600 hover:bg-blue-500/10 px-4"
                    >
                      + New Group
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Select an existing audience group saved from your contacts or tags list.</p>
                </TabsContent>
              </Tabs>
            </div>

            {/* Step 3: Delivery Schedule & Anti-Ban Speed */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">3. Delivery Schedule & Anti-Ban Speed <span className="text-rose-500">*</span></h2>
                    <p className="text-[11px] text-muted-foreground">Configure dispatch schedule and protect your WhatsApp number reputation</p>
                  </div>
                </div>
              </div>

              {/* Delivery Timing Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div 
                  onClick={() => setSendWhen('immediately')}
                  className={cn(
                    "p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-1.5",
                    sendWhen === 'immediately' 
                      ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500 ring-1 ring-emerald-500/30 shadow-xs" 
                      : "bg-slate-50/50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-emerald-600" />
                      Send Immediately
                    </span>
                    {sendWhen === 'immediately' && <Check className="h-4 w-4 text-emerald-600 stroke-[2.5]" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Broadcast dispatches immediately through Meta Cloud API upon launch.
                  </p>
                </div>

                <div 
                  onClick={() => setSendWhen('later')}
                  className={cn(
                    "p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-1.5",
                    sendWhen === 'later' 
                      ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500 ring-1 ring-emerald-500/30 shadow-xs" 
                      : "bg-slate-50/50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                      Schedule for Later
                    </span>
                    {sendWhen === 'later' && <Check className="h-4 w-4 text-emerald-600 stroke-[2.5]" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Set a future date and time slot for automated campaign delivery.
                  </p>
                </div>
              </div>

              {sendWhen === 'later' && (
                <div className="pt-2 space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Select Schedule Date & Time <span className="text-rose-500">*</span>
                  </Label>
                  <Input 
                    type="datetime-local" 
                    className="bg-slate-50/50 dark:bg-zinc-950 max-w-sm border-slate-200 dark:border-zinc-800 rounded-xl h-11 text-xs" 
                    value={scheduleDate} 
                    onChange={e => setScheduleDate(e.target.value)} 
                  />
                </div>
              )}

              {/* Anti-Ban Interval Protection */}
              <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Message Dispatch Interval (Anti-Ban Guard)</span>
                  </Label>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 text-[10px] font-bold">
                    Safe Stagger
                  </Badge>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <Select value={String(sendDelaySeconds)} onValueChange={(v) => setSendDelaySeconds(Number(v))}>
                    <SelectTrigger className="w-full sm:w-60 bg-slate-50/50 dark:bg-zinc-950 font-semibold border-slate-200 dark:border-zinc-800 text-xs rounded-xl h-10">
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="1" className="text-xs">1 Second (High Speed)</SelectItem>
                      <SelectItem value="3" className="text-xs">3 Seconds (Fast)</SelectItem>
                      <SelectItem value="5" className="text-xs">5 Seconds (Balanced)</SelectItem>
                      <SelectItem value="10" className="text-xs font-bold text-emerald-600">10 Seconds (Recommended - Safe Anti-Ban)</SelectItem>
                      <SelectItem value="15" className="text-xs">15 Seconds (Extra Safe)</SelectItem>
                      <SelectItem value="30" className="text-xs">30 Seconds (Max Protection)</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Waits {sendDelaySeconds} second{sendDelaySeconds > 1 ? 's' : ''} between each message to protect phone health.
                  </span>
                </div>
              </div>
            </div>

            {/* Step 4: Template & Dynamic Personalization */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">4. Message Template & Personalization <span className="text-rose-500">*</span></h2>
                    <p className="text-[11px] text-muted-foreground">Select approved Meta template and map dynamic variables</p>
                  </div>
                </div>
              </div>

              {/* Template Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Select Approved Template <span className="text-rose-500">*</span>
                </Label>
                <Select value={selectedTemplateId} onValueChange={(v) => setSelectedTemplateId(v || '')} disabled={isLoadingTemplates}>
                  <SelectTrigger className="bg-slate-50/50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 font-medium rounded-xl h-11 text-xs">
                    <SelectValue placeholder={isLoadingTemplates ? "Loading templates..." : "Choose an approved template..."}>
                      {selectedTemplate ? `${selectedTemplate.name} (${selectedTemplate.category || 'Utility'}) — ${selectedTemplate.language || 'en'}` : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {templates.length === 0 && !isLoadingTemplates && (
                      <SelectItem value="none" disabled>No approved templates found</SelectItem>
                    )}
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.name} ({t.category || 'Utility'}) — {t.language || 'en'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Removed Meta Marketing Notice as requested */}
              </div>

              {/* Dynamic Variables Mapper */}
              {selectedTemplate && placeholders.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold text-xs">
                      <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
                      <span>Template Personalization ({placeholders.join(', ')})</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      Auto-replaces variables per contact
                    </span>
                  </div>

                  <div className="grid gap-3">
                    {placeholders.map((ph) => {
                      const key = ph.replace(/[\{\}]/g, '');
                      const current = variables[key] || { type: 'field', value: 'name' };
                      const combinedValue = current.type === 'static' ? 'static' : (current.value || 'name');

                      return (
                        <div key={ph} className="p-3.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50/60 dark:bg-zinc-950 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/50">
                                {ph}
                              </span>
                              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                Maps to recipient data:
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {current.type === 'static' ? 'Fixed text for all' : 'Dynamic per contact'}
                            </span>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2">
                            <Select
                              value={combinedValue}
                              onValueChange={(val) => {
                                if (val === 'static') {
                                  setVariables(prev => ({
                                    ...prev,
                                    [key]: { type: 'static', value: prev[key]?.type === 'static' ? prev[key].value : '' }
                                  }));
                                } else {
                                  setVariables(prev => ({
                                    ...prev,
                                    [key]: { type: 'field', value: val || '' }
                                  }));
                                }
                              }}
                            >
                              <SelectTrigger className="text-xs h-9 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-lg">
                                <SelectValue placeholder="Choose Value" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="name" className="text-xs">Contact Name (Recommended)</SelectItem>
                                <SelectItem value="phone" className="text-xs">Phone Number</SelectItem>
                                <SelectItem value="email" className="text-xs">Email Address</SelectItem>
                                <SelectItem value="company" className="text-xs">Company Name</SelectItem>
                                <SelectItem value="static" className="text-xs">Custom Fixed Text...</SelectItem>
                              </SelectContent>
                            </Select>

                            {current.type === 'static' && (
                              <Input
                                placeholder="Enter custom text for this variable..."
                                value={current.value || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setVariables(prev => ({
                                    ...prev,
                                    [key]: { type: 'static', value: val }
                                  }));
                                }}
                                className="text-xs h-9 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-lg"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-200/50 dark:border-emerald-900/30">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Safe Fallback:</strong> If a contact has no name saved, our system automatically supplies <em>&quot;Customer&quot;</em> so WhatsApp Meta API never rejects delivery due to missing parameters.
                    </span>
                  </div>
                </div>
              )}

              {/* Header Media Attachment */}
              {requiresMedia && (
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                  <Label className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <UploadCloud className="h-4 w-4 text-emerald-600" />
                    <span>Header Media Attachment (Required by Template)</span>
                  </Label>
                  
                  <div className="flex flex-col gap-2.5">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="https://example.com/banner.jpg"
                        value={headerMediaUrl}
                        onChange={(e) => setHeaderMediaUrl(e.target.value)}
                        className="bg-slate-50/50 dark:bg-zinc-950 flex-1 text-xs rounded-xl h-10 border-slate-200 dark:border-zinc-800"
                      />
                      
                      {headerMediaUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setHeaderMediaUrl('')}
                          title="Remove media attachment"
                          className="h-10 w-10 border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}

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
                        className="gap-1.5 shrink-0 text-xs font-semibold rounded-xl h-10 border-slate-200 dark:border-zinc-800"
                      >
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4 text-emerald-600" />}
                        <span>Upload File</span>
                      </Button>
                    </div>

                    <div className="flex items-start gap-2 text-xs text-muted-foreground bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800">
                      <Info className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                      <p className="text-[11px] leading-relaxed">
                        Paste any public HTTPS media link or upload directly. Uploaded media is securely stored in your CRM storage bucket and saved to this template.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Form Actions */}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-xs">
              <Button 
                variant="outline" 
                onClick={() => router.push('/broadcasts')} 
                className="rounded-xl border-slate-200 dark:border-zinc-800 text-xs font-semibold px-4 h-10"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSend} 
                disabled={isProcessing} 
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 h-10 rounded-xl shadow-sm transition-all gap-2 active:scale-[0.98]"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>
                  {isProcessing 
                    ? (sendWhen === 'later' ? 'Scheduling...' : 'Dispatching...') 
                    : (sendWhen === 'later' ? 'Schedule Broadcast' : 'Launch Campaign Now')}
                </span>
              </Button>
            </div>

          </div>

          {/* Right Column: Realistic Sticky Smartphone Preview (5 cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-emerald-600" />
                  Live WhatsApp Preview
                </span>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Real-time
                </span>
              </div>

              {/* Realistic High-End Smartphone Device Mockup */}
              <WhatsAppPhoneMockup 
                businessName="ChatFlyr Business"
                template={selectedTemplate}
                bodyText={previewBodyText}
                headerMediaUrl={headerMediaUrl}
              />

              {/* Campaign Quick Summary & Launch Box */}
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-muted-foreground font-medium">Ready Recipients:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {recipientMode === 'numbers' ? `${validCount} Contacts` : groupId ? 'Group Selected' : 'None Selected'}
                  </span>
                </div>

                <Button 
                  onClick={handleSend} 
                  disabled={isProcessing} 
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 text-xs shadow-sm rounded-xl transition-all gap-2 active:scale-[0.98]"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>
                    {isProcessing 
                      ? (sendWhen === 'later' ? 'Scheduling...' : 'Dispatching...') 
                      : (sendWhen === 'later' ? 'Schedule Broadcast' : 'Launch Campaign Now')}
                  </span>
                </Button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
