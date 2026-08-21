'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { MessageTemplate } from '@/types';
import { useBroadcastSending } from '@/hooks/use-broadcast-sending';
import { uploadAccountMedia } from '@/lib/storage/upload-media';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Settings, Users, MessageSquare, Clock, X, Loader2, Info, UploadCloud } from 'lucide-react';

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

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupSelection, setGroupSelection] = useState<string>('create_new');
  const [newGroupName, setNewGroupName] = useState('');
  const [groupNumbers, setGroupNumbers] = useState('');
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  // Scheduling
  const [sendWhen, setSendWhen] = useState<'immediately' | 'later'>('immediately');
  const [scheduleDate, setScheduleDate] = useState('');

  // Templates
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [headerMediaUrl, setHeaderMediaUrl] = useState('');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [contactGroups, setContactGroups] = useState<{id: string; name: string}[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [variables, setVariables] = useState<Record<string, { type: 'static' | 'field'; value: string }>>({});
  
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
      
      // Upload to chat-media bucket
      const { publicUrl } = await uploadAccountMedia('chat-media', file);
      
      setHeaderMediaUrl(publicUrl);

      // Permanently save it to the template in the database
      const { error } = await supabase
        .from('message_templates')
        .update({ header_media_url: publicUrl })
        .eq('id', selectedTemplateId);

      if (error) {
        console.error("Failed to update template permanent URL:", error);
      } else {
        // Update local state so it doesn't revert
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
      // Reset input
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

      // 1. Create tag if needed
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
      
      // 2. Add numbers if provided
      if (groupNumbers.trim()) {
        const numbers = groupNumbers.split(/[\n,]+/).map(n => n.trim().replace(/\D/g, '')).filter(Boolean);
        
        if (numbers.length > 0) {
          // Find existing contacts
          const { data: existingContacts } = await supabase.from('contacts').select('id, phone').eq('account_id', profile.account_id).in('phone', numbers);
          const existingPhones = new Set((existingContacts || []).map(c => c.phone));
          
          // Insert new ones
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
          
          // Re-fetch all to get their IDs
          const { data: allContacts } = await supabase.from('contacts').select('id').eq('account_id', profile.account_id).in('phone', numbers);
          
          if (allContacts && tagId) {
             const contactTags = allContacts.map(c => ({
               contact_id: c.id,
               tag_id: tagId
             }));
             // Insert and ignore duplicates using onConflict
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
      
      // Instead of window reload, just refresh tags
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
      <div className="mx-auto max-w-4xl bg-background text-foreground pb-20 mt-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <h1 className="text-2xl font-bold">Create New Campaign</h1>
        <Button variant="ghost" size="icon" onClick={() => router.push('/broadcasts')}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-8">
        
        {/* Basic Information */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
            <Settings className="h-5 w-5" />
            <h2>Basic Information</h2>
          </div>
          
          <div className="space-y-2">
            <Label>Campaign Name *</Label>
            <Input 
              placeholder="e.g., Summer Sale Campaign" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-card"
            />
          </div>
        </section>

        {/* Recipients */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
            <Users className="h-5 w-5" />
            <h2>Recipients *</h2>
          </div>
          
          <Tabs value={recipientMode} onValueChange={(v: any) => setRecipientMode(v)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="group" className="data-[state=active]:bg-primary data-[state=active]:text-white">Select Group</TabsTrigger>
              <TabsTrigger value="numbers" className="data-[state=active]:bg-primary data-[state=active]:text-white">Paste Numbers</TabsTrigger>
            </TabsList>
            <TabsContent value="group" className="flex items-center gap-2">
              <Select value={groupId} onValueChange={(v) => setGroupId(v || '')}>
                <SelectTrigger className="bg-card w-full">
                  <SelectValue placeholder="Choose a contact group..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contacts</SelectItem>
                  {contactGroups.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={() => setIsGroupModalOpen(true)}>
                + New Group
              </Button>
            </TabsContent>
            <TabsContent value="numbers">
              <Textarea 
                placeholder="Paste numbers separated by commas or newlines... (e.g. 919876543210, 919876543211)" 
                className="min-h-[100px] bg-card"
                value={pastedNumbers}
                onChange={(e) => setPastedNumbers(e.target.value)}
              />
            </TabsContent>
          </Tabs>

          <div className="mt-4 p-4 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Clock className="h-4 w-4" />
              When to Send? *
            </div>
            <RadioGroup value={sendWhen} onValueChange={(v: any) => setSendWhen(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="immediately" id="immed" />
                <Label htmlFor="immed" className="font-medium flex flex-col">
                  Send Immediately
                  <span className="text-xs text-muted-foreground font-normal">Campaign will start as soon as it's created</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="later" id="later" />
                <Label htmlFor="later" className="font-medium flex flex-col">
                  Schedule for Later
                  <span className="text-xs text-muted-foreground font-normal">Choose a specific date and time</span>
                </Label>
              </div>
            </RadioGroup>
            {sendWhen === 'later' && (
              <Input type="datetime-local" className="max-w-xs mt-3 bg-card" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
            )}
          </div>
        </section>

        {/* Message Configuration */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
            <MessageSquare className="h-5 w-5" />
            <h2>Message Configuration</h2>
          </div>

          <div className="space-y-2">
            <Label>Select WhatsApp Template *</Label>
            <Select value={selectedTemplateId} onValueChange={(v) => setSelectedTemplateId(v || '')} disabled={isLoadingTemplates}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder={isLoadingTemplates ? "Loading templates..." : "Choose an approved template..."} />
              </SelectTrigger>
              <SelectContent>
                {templates.length === 0 && !isLoadingTemplates && (
                  <SelectItem value="none" disabled>No approved templates found</SelectItem>
                )}
                {templates.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {/* Fallback to showing ID if name is a UUID (happens if imported from 3rd party tools) */}
                    {t.name} ({t.language})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Note: If your template name looks like a long code (e.g. c85e09...), this is normal and comes directly from WhatsApp Manager.</p>
          </div>

          {selectedTemplate && (
            <div className="bg-muted/30 p-4 rounded-lg mt-4 border text-sm text-muted-foreground whitespace-pre-wrap">
              <strong>Template Preview:</strong><br/>
              {selectedTemplate.body_text}
            </div>
          )}

          {requiresMedia && (
            <div className="space-y-3 pt-4 border-t mt-4">
              <Label className="flex items-center gap-2">
                Media Attachment (Required)
              </Label>
              
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://example.com/image.jpg"
                    value={headerMediaUrl}
                    onChange={(e) => setHeaderMediaUrl(e.target.value)}
                    className="bg-card flex-1"
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
                    className="gap-2 shrink-0"
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                    Upload File
                  </Button>
                </div>

                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                  <p>
                    You can either paste a URL or upload a file. 
                    <strong className="text-primary block mt-1">
                      Once uploaded, we will permanently link this file to this template so you don't have to upload it again next time!
                    </strong>
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Footer Actions */}
      <div className="mt-10 pt-6 border-t flex items-center justify-end gap-3 sticky bottom-0 bg-background/95 backdrop-blur z-10 py-4">
        <Button variant="outline" onClick={() => router.push('/broadcasts')}>
          Cancel
        </Button>
        <Button onClick={handleSend} disabled={isProcessing} className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[160px]">
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {isProcessing ? (sendWhen === 'later' ? 'Scheduling...' : 'Sending...') : (sendWhen === 'later' ? 'Schedule Campaign' : 'Send Campaign')}
        </Button>
      </div>
    </div>
    </div>
  );
}



