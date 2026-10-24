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
import { Switch } from '@/components/ui/switch';
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
  Check,
  Image as ImageIcon,
  Video as VideoIcon,
  Play,
  Sparkles
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

  // Instant Broadcast Auto-Reply
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [autoReplyText, setAutoReplyText] = useState('Thank you for reaching out! We received your message and our team will get back to you shortly.');

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
  const headerType = (selectedTemplate?.header_type || (selectedTemplate as any)?.headerType || (selectedTemplate as any)?.header_format || (selectedTemplate as any)?.headerFormat || '').toLowerCase();
  const requiresMedia = Boolean(headerType && headerType !== 'text' && headerType !== 'none');
  const [selectedMediaType, setSelectedMediaType] = useState<'image' | 'video' | 'document'>('image');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'reels' | 'standard'>('reels');

  useEffect(() => {
    if (headerType === 'video') {
      setSelectedMediaType('video');
    } else if (headerType === 'document') {
      setSelectedMediaType('document');
    } else {
      setSelectedMediaType('image');
    }
  }, [headerType, selectedTemplateId]);

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
    const savedUrl = selectedTemplate?.header_media_url || (selectedTemplate as any)?.headerMediaUrl;
    if (selectedTemplate && requiresMedia && savedUrl) {
      setHeaderMediaUrl(savedUrl);
      if (/\.(mp4|mov|webm|mkv|3gp)($|\?)/i.test(savedUrl)) {
        setSelectedMediaType('video');
      }
    } else if (!savedUrl) {
      setHeaderMediaUrl('');
    }
  }, [selectedTemplate, requiresMedia]);

  const isCurrentVideo = selectedMediaType === 'video' || /\.(mp4|mov|webm|mkv|3gp)($|\?)/i.test(headerMediaUrl);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|avi|webm|mkv|3gp)$/i.test(file.name);
    const chosenType: 'image' | 'video' | 'document' = isVideo ? 'video' : selectedMediaType === 'video' ? 'video' : 'image';

    if (isVideo && file.size > 16 * 1024 * 1024) {
      toast.error('Video size exceeds 16MB Meta limit. Please select a smaller video file.');
      return;
    }

    try {
      setIsUploading(true);
      toast.info(isVideo ? 'Uploading video to Cloud...' : 'Uploading media attachment...');
      
      const { publicUrl, mediaType } = await uploadAccountMedia('chat-media', file, selectedTemplateId);
      setHeaderMediaUrl(publicUrl);
      const activeType = mediaType || chosenType;
      setSelectedMediaType(activeType);

      if (selectedTemplateId) {
        setTemplates(prev => prev.map(t => 
          t.id === selectedTemplateId ? { ...t, header_media_url: publicUrl, header_type: activeType } : t
        ));
      }
      toast.success(`${activeType === 'video' ? 'Video' : 'Media'} uploaded and permanently saved to template!`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const [isSavingMediaUrl, setIsSavingMediaUrl] = useState(false);

  const handleSaveMediaUrlToTemplate = async (urlToSave?: string) => {
    const finalUrl = (urlToSave || headerMediaUrl).trim();
    if (!selectedTemplateId || !finalUrl) {
      toast.error('Please enter a valid media URL first');
      return;
    }
    const isVideo = selectedMediaType === 'video' || /\.(mp4|mov|webm|mkv|3gp)($|\?)/i.test(finalUrl);
    const targetType = isVideo ? 'video' : 'image';

    try {
      setIsSavingMediaUrl(true);
      const res = await fetch('/api/whatsapp/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTemplateId,
          header_media_url: finalUrl,
          header_type: targetType,
        }),
      });
      if (res.ok) {
        setSelectedMediaType(targetType);
        setTemplates(prev => prev.map(t => 
          t.id === selectedTemplateId ? { ...t, header_media_url: finalUrl, header_type: targetType } : t
        ));
        toast.success(`${isVideo ? 'Video' : 'Image'} URL permanently saved to template!`);
      } else {
        toast.error('Failed to link media URL to template');
      }
    } catch {
      toast.error('Failed to link media URL to template');
    } finally {
      setIsSavingMediaUrl(false);
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
          const existingPhones = new Set((existingContacts || []).map((c: any) => c.phone));
          
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
             const contactTags = allContacts.map((c: any) => ({
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

      const isVideo = selectedMediaType === 'video' || /\.(mp4|mov|webm|mkv|3gp)($|\?)/i.test(headerMediaUrl);
      const templateHeaderType = (selectedTemplate?.header_type || (selectedTemplate as any)?.headerType || 'text').toLowerCase();

      // Guard: Meta Template Format Mismatch Validation
      if (requiresMedia && isVideo && templateHeaderType === 'image') {
        const videoTemplate = templates.find(t => (t.header_type || (t as any)?.headerType || '').toLowerCase() === 'video');
        if (videoTemplate) {
          toast.error(`"${selectedTemplate.name}" is approved on Meta for IMAGES only. Please select "${videoTemplate.name}" to send this Video.`, {
            duration: 6000,
          });
        } else {
          toast.error(`"${selectedTemplate.name}" is approved for IMAGES only. Meta Cloud API rejects videos with error #132012. Please select a Video template.`, {
            duration: 6000,
          });
        }
        return;
      }

      if (requiresMedia && !isVideo && templateHeaderType === 'video') {
        toast.error(`"${selectedTemplate.name}" requires a Video attachment. Please upload an .mp4 video or select an Image template.`);
        return;
      }

      const effectiveTemplate = selectedTemplate ? {
        ...selectedTemplate,
        header_type: templateHeaderType,
        header_media_url: requiresMedia ? headerMediaUrl : undefined,
      } : selectedTemplate;

      const id = await createBroadcastAndStart({
        name,
        template: effectiveTemplate,
        audience,
        variables,
        headerMediaUrl: requiresMedia ? headerMediaUrl : undefined,
        scheduledAt: sendWhen === 'later' ? new Date(scheduleDate).toISOString() : undefined,
        delaySeconds: sendDelaySeconds,
        batchDelayMs: sendDelaySeconds * 1000,
        autoReplyEnabled,
        autoReplyText: autoReplyEnabled ? autoReplyText.trim() : undefined,
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

        {/* 5-Step Sleek Workflow Guide */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">1. Title</p>
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
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">2. Audience</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {recipientMode === 'numbers' 
                  ? (validCount > 0 ? `${validCount} Valid` : 'Paste numbers') 
                  : (groupId ? 'Selected' : 'Choose')}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl border bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
              3
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">3. Speed</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {sendWhen === 'immediately' ? `${sendDelaySeconds}s delay` : 'Scheduled'}
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
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">4. Template</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {selectedTemplate ? selectedTemplate.name : 'Choose template'}
              </p>
            </div>
          </div>

          <div className={cn(
            "p-3 rounded-2xl border transition-all flex items-center gap-3",
            autoReplyEnabled
              ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-800/60" 
              : "bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs"
          )}>
            <div className={cn(
              "h-8 w-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0",
              autoReplyEnabled ? "bg-amber-600 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300"
            )}>
              {autoReplyEnabled ? <Zap className="h-4 w-4 fill-white" /> : "5"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">5. Auto-Reply</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {autoReplyEnabled ? 'Active (⚡ <300ms)' : 'Disabled'}
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
                      {selectedTemplate ? (
                        <span className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white">{selectedTemplate.name}</span>
                          <span className="text-muted-foreground text-[11px]">({selectedTemplate.category || 'Utility'}) — {selectedTemplate.language || 'en'}</span>
                          <span className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                            (selectedTemplate.header_type || '').toLowerCase() === 'video'
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                              : (selectedTemplate.header_type || '').toLowerCase() === 'image'
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-300"
                          )}>
                            {(selectedTemplate.header_type || '').toLowerCase() === 'video' ? '🎬 Video / Reels' : (selectedTemplate.header_type || '').toLowerCase() === 'image' ? '🖼️ Image' : '📝 Text'}
                          </span>
                        </span>
                      ) : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {templates.length === 0 && !isLoadingTemplates && (
                      <SelectItem value="none" disabled>No approved templates found</SelectItem>
                    )}
                    {templates.map(t => {
                      const hType = (t.header_type || (t as any).headerType || '').toLowerCase();
                      const formatBadge = hType === 'video' ? '🎬 Video / Reels' : hType === 'image' ? '🖼️ Image' : hType === 'document' ? '📄 Doc' : '📝 Text';
                      return (
                        <SelectItem key={t.id} value={t.id} className="text-xs">
                          <span className="font-semibold text-slate-900 dark:text-white">{t.name}</span>
                          <span className="text-muted-foreground ml-1.5 text-[11px]">({t.category || 'Utility'}) — {t.language || 'en'}</span>
                          <span className={cn(
                            "ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                            hType === 'video' 
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                              : hType === 'image'
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-300"
                          )}>
                            {formatBadge}
                          </span>
                        </SelectItem>
                      );
                    })}
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
                </div>
              )}

              {/* Header Media Attachment */}
              {requiresMedia ? (
                <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                        {isCurrentVideo ? (
                          <VideoIcon className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-emerald-600" />
                        )}
                        <span>Header Media Attachment ({isCurrentVideo ? 'VIDEO' : selectedMediaType.toUpperCase()})</span>
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Attach an Image or Video to appear at the top of your broadcast message
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Media Format Switcher: Image / Video */}
                      <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700">
                        <button
                          type="button"
                          onClick={() => setSelectedMediaType('image')}
                          className={cn(
                            "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer",
                            !isCurrentVideo
                              ? "bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-xs"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                          )}
                        >
                          <ImageIcon className="h-3 w-3" />
                          <span>Image</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedMediaType('video')}
                          className={cn(
                            "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer",
                            isCurrentVideo
                              ? "bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-xs"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                          )}
                        >
                          <VideoIcon className="h-3 w-3" />
                          <span>Video</span>
                        </button>
                      </div>

                      <Badge variant="outline" className="w-fit bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 text-[10px] font-bold flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        <span>Cloud Upload Active</span>
                      </Badge>
                    </div>
                  </div>

                  {/* Meta Template Format Warning */}
                  {selectedTemplate && (selectedTemplate.header_type || '').toLowerCase() === 'image' && isCurrentVideo && (() => {
                    const videoTmpl = templates.find(t => (t.header_type || (t as any).headerType || '').toLowerCase() === 'video');
                    return (
                      <div className="p-4 rounded-2xl bg-amber-50/95 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs space-y-2.5 shadow-xs">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="font-bold text-amber-950 dark:text-amber-200">Meta Template Format Mismatch Alert</p>
                            <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                              Template <strong className="font-bold text-amber-950 dark:text-amber-100">{selectedTemplate.name}</strong> Meta WhatsApp Cloud API me <strong className="uppercase underline">IMAGE</strong> format me approved hai. Agar aap is template ke sath Video bhejenge to Meta reject kar dega (Error #132012).
                            </p>
                          </div>
                        </div>
                        {videoTmpl && (
                          <div className="pt-1 flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                setSelectedTemplateId(videoTmpl.id);
                                setSelectedMediaType('video');
                                toast.success(`Switched to approved video template: ${videoTmpl.name}`);
                              }}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl h-8 px-3.5 flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <VideoIcon className="h-3.5 w-3.5" />
                              <span>Switch to {videoTmpl.name} (Approved Video Template)</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept={selectedMediaType === 'video' ? 'video/*,.mp4,.mov,.webm,.3gp' : selectedMediaType === 'document' ? '.pdf,.doc,.docx' : 'image/*,.png,.jpg,.jpeg,.webp'}
                    onChange={handleFileUpload}
                  />

                  {headerMediaUrl ? (
                    <div className="p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {isCurrentVideo ? (
                          <div className={cn(
                            "relative rounded-2xl overflow-hidden border-2 border-emerald-500/30 shadow-md shrink-0 bg-black flex items-center justify-center transition-all",
                            videoAspectRatio === 'reels' 
                              ? "w-36 sm:w-44 aspect-[9/16] max-h-72" 
                              : "h-28 w-44 aspect-[16/9]"
                          )}>
                            <video 
                              src={headerMediaUrl} 
                              controls 
                              playsInline
                              className="h-full w-full object-cover" 
                            />
                            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/10 shadow-xs">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              <span>{videoAspectRatio === 'reels' ? 'Reels 9:16' : '16:9'}</span>
                            </div>
                          </div>
                        ) : selectedTemplate?.header_type === 'document' ? (
                          <div className="h-24 w-28 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex flex-col items-center justify-center gap-1.5 shrink-0">
                            <FileText className="h-8 w-8 text-emerald-600" />
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Document</span>
                          </div>
                        ) : (
                          <div className="relative h-24 w-36 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-xs shrink-0 bg-slate-100 dark:bg-zinc-900 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={headerMediaUrl} 
                              alt="Header preview" 
                              className="h-full w-full object-cover" 
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Permanently Stored in Cloud ({isCurrentVideo ? 'Video MP4' : 'Image'})</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground">• One-time upload active</span>
                          </div>

                          <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-[11px] font-mono text-slate-600 dark:text-slate-300 truncate">
                            {headerMediaUrl}
                          </div>

                          {/* Aspect Ratio Format Switcher for Video */}
                          {isCurrentVideo && (
                            <div className="flex items-center gap-2 pt-1">
                              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Display Size:</span>
                              <div className="flex items-center bg-white dark:bg-zinc-900 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-[11px]">
                                <button
                                  type="button"
                                  onClick={() => setVideoAspectRatio('reels')}
                                  className={cn(
                                    "px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer",
                                    videoAspectRatio === 'reels'
                                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 shadow-2xs font-bold"
                                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                                  )}
                                >
                                  <span>📱 Reels (9:16)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setVideoAspectRatio('standard')}
                                  className={cn(
                                    "px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer",
                                    videoAspectRatio === 'standard'
                                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 shadow-2xs font-bold"
                                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                                  )}
                                >
                                  <span>📺 Landscape (16:9)</span>
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploading}
                              className="h-8 text-xs rounded-xl font-semibold gap-1.5 border-slate-200 dark:border-zinc-800"
                            >
                              {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5 text-emerald-600" />}
                              <span>Replace {isCurrentVideo ? 'Video' : 'Image'}</span>
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleSaveMediaUrlToTemplate()}
                              disabled={isSavingMediaUrl}
                              className="h-8 text-xs rounded-xl font-semibold gap-1.5 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            >
                              {isSavingMediaUrl ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                              <span>Save to Template Permanently</span>
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setHeaderMediaUrl('')}
                              className="h-8 text-xs rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              <span>Remove</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-emerald-500 dark:border-zinc-700 dark:hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-emerald-50/30 dark:bg-zinc-950/40 dark:hover:bg-emerald-950/10 transition-colors space-y-2"
                      >
                        <div className="h-10 w-10 mx-auto rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                          {isUploading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : isCurrentVideo ? (
                            <VideoIcon className="h-5 w-5" />
                          ) : (
                            <UploadCloud className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {isUploading 
                              ? 'Uploading to Firebase Storage...' 
                              : isCurrentVideo 
                                ? 'Click to Upload WhatsApp Video (.MP4, .MOV)' 
                                : 'Click to Upload Media / Poster (Image or Video)'}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {isCurrentVideo
                              ? 'Supports MP4, MOV, WebM • Max 16MB'
                              : 'Supports PNG, JPG, WEBP, MP4 • Max 16MB'}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-[10px] font-semibold">
                          Upload Once • Permanently Stored in Cloud
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex-1 h-px bg-slate-200 dark:border-zinc-800" />
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          or paste {isCurrentVideo ? 'video' : 'image'} url
                        </span>
                        <div className="flex-1 h-px bg-slate-200 dark:border-zinc-800" />
                      </div>

                      <div className="flex gap-2">
                        <Input 
                          placeholder={isCurrentVideo ? "https://example.com/promo-video.mp4" : "https://example.com/banner.jpg"}
                          value={headerMediaUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            setHeaderMediaUrl(val);
                            if (/\.(mp4|mov|webm|mkv|3gp)($|\?)/i.test(val)) {
                              setSelectedMediaType('video');
                            }
                          }}
                          className="bg-slate-50/50 dark:bg-zinc-950 flex-1 text-xs rounded-xl h-10 border-slate-200 dark:border-zinc-800 font-mono"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => handleSaveMediaUrlToTemplate()} 
                          disabled={!headerMediaUrl.trim() || isSavingMediaUrl}
                          className="shrink-0 text-xs font-semibold rounded-xl h-10 border-slate-200 dark:border-zinc-800 gap-1.5"
                        >
                          {isSavingMediaUrl ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 text-emerald-600" />}
                          <span>Save to Template</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : selectedTemplate ? (
                <div className="pt-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800/60 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>Template header format: <strong className="text-slate-700 dark:text-slate-300 font-semibold uppercase">{selectedTemplate.header_type || 'Text / None'}</strong></span>
                    </span>
                    <span className="text-[11px] text-slate-500">To send images or posters, select a template with Image header (e.g. Kisan Choice).</span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Step 5: Instant Auto-Reply on Customer Response (Smart Bot) */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                        5. Instant Auto-Reply on Customer Reply
                      </h2>
                      <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 text-[10px] font-bold">
                        Ultra Fast (⚡ &lt;300ms)
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Automatically send a custom reply whenever any recipient responds to this campaign
                    </p>
                  </div>
                </div>

                <Switch
                  checked={autoReplyEnabled}
                  onCheckedChange={setAutoReplyEnabled}
                  aria-label="Enable instant auto-reply"
                />
              </div>

              {autoReplyEnabled ? (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Custom Instant Reply Message
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      Supports dynamic variable: <code className="bg-muted px-1 py-0.5 rounded text-[10px]">&#123;name&#125;</code>
                    </span>
                  </div>

                  <Textarea
                    rows={3}
                    placeholder="e.g. Namaste {name}! Thank you for your reply. Our support team has received your message and will connect with you right away."
                    value={autoReplyText}
                    onChange={(e) => setAutoReplyText(e.target.value)}
                    className="bg-slate-50/50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-xl text-xs leading-relaxed"
                  />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Instant auto-reply is currently disabled for this broadcast. Inbound replies will only be stored in Inbox.
                </p>
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
                template={selectedTemplate ? {
                  ...selectedTemplate,
                  header_type: isCurrentVideo ? 'video' : selectedTemplate.header_type,
                } : selectedTemplate}
                bodyText={previewBodyText}
                headerMediaUrl={headerMediaUrl}
                videoAspectRatio={videoAspectRatio}
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
