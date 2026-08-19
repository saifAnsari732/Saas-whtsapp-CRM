'use client';

import { useState, useEffect, useRef } from 'react';
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

  // Scheduling
  const [sendWhen, setSendWhen] = useState<'immediately' | 'later'>('immediately');
  const [scheduleDate, setScheduleDate] = useState('');

  // Templates
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [headerMediaUrl, setHeaderMediaUrl] = useState('');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchTemplates() {
      setIsLoadingTemplates(true);
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('status', 'APPROVED');
      
      if (!error && data) {
        setTemplates(data as MessageTemplate[]);
        
        const resendName = searchParams.get('resend_name');
        const resendTemplateName = searchParams.get('resend_template');
        if (resendName) setName(resendName + ' (Copy)');
        if (resendTemplateName) {
           const found = (data as MessageTemplate[]).find(t => t.name === resendTemplateName);
           if (found) setSelectedTemplateId(found.id);
        }
      }
      setIsLoadingTemplates(false);
    }
    fetchTemplates();
  }, [supabase, searchParams]);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const requiresMedia = selectedTemplate?.header_type === 'image' || 
                        selectedTemplate?.header_type === 'video' || 
                        selectedTemplate?.header_type === 'document';

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
        variables: {},
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
            <TabsContent value="group">
              <Select value={groupId} onValueChange={(v) => setGroupId(v || '')}>
                <SelectTrigger className="bg-card">
                  <SelectValue placeholder="Choose a contact group..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contacts</SelectItem>
                </SelectContent>
              </Select>
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
  );
}
