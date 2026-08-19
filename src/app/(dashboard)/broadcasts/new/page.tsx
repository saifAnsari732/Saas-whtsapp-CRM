'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { MessageTemplate } from '@/types';
import { useBroadcastSending } from '@/hooks/use-broadcast-sending';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, MessageSquare, Upload, X, Loader2, Info } from 'lucide-react';

export default function NewBroadcastPage() {
  const router = useRouter();
  const { accountId } = useAuth();
  const { createAndSendBroadcast, isProcessing } = useBroadcastSending();
  const supabase = createClient();

  const [name, setName] = useState('');
  
  // Recipients
  const [recipientMode, setRecipientMode] = useState<'group' | 'numbers'>('group');
  const [groupId, setGroupId] = useState('');
  const [pastedNumbers, setPastedNumbers] = useState('');

  // Templates
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [headerMediaUrl, setHeaderMediaUrl] = useState('');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  useEffect(() => {
    async function fetchTemplates() {
      setIsLoadingTemplates(true);
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('status', 'APPROVED');
      
      if (!error && data) {
        setTemplates(data as MessageTemplate[]);
      }
      setIsLoadingTemplates(false);
    }
    fetchTemplates();
  }, [supabase]);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const requiresMedia = selectedTemplate?.header_type === 'image' || 
                        selectedTemplate?.header_type === 'video' || 
                        selectedTemplate?.header_type === 'document';

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
    if (!selectedTemplate) {
      toast.error('Please select a WhatsApp Template');
      return;
    }
    if (requiresMedia && !headerMediaUrl.trim()) {
      toast.error('This template requires a media attachment URL');
      return;
    }
    
    try {
      let audience: any = { type: 'all' }; // fallback

      if (recipientMode === 'group') {
        if (groupId === 'all') {
          audience = { type: 'all' };
        } else {
          // If they selected a specific tag, use it
          audience = { type: 'tags', tagIds: [groupId] };
        }
      } else if (recipientMode === 'numbers') {
        const numbers = pastedNumbers.split(/[\n,]+/).map(n => n.trim()).filter(Boolean);
        audience = { 
          type: 'csv', 
          csvContacts: numbers.map(phone => ({ phone })) 
        };
      }

      await createAndSendBroadcast({
        name,
        template: selectedTemplate,
        audience,
        variables: {}, // We are keeping variables simple/empty for now to ensure smooth sending
        headerMediaUrl: requiresMedia ? headerMediaUrl : undefined,
      });

      toast.success('Campaign created and sending started!');
      router.push('/broadcasts');
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
                  {/* Dynamic tags could go here */}
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
                  <SelectItem key={t.id} value={t.id}>{t.name} ({t.language})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <div className="bg-muted/30 p-4 rounded-lg mt-4 border text-sm text-muted-foreground whitespace-pre-wrap">
              <strong>Template Preview:</strong><br/>
              {selectedTemplate.body_text}
            </div>
          )}

          {requiresMedia && (
            <div className="space-y-2 pt-4">
              <Label>Media Attachment URL *</Label>
              <div className="flex flex-col gap-2">
                <Input 
                  placeholder="https://example.com/image.jpg"
                  value={headerMediaUrl}
                  onChange={(e) => setHeaderMediaUrl(e.target.value)}
                  className="bg-card"
                />
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                  <p>This template requires a <b>{selectedTemplate?.header_type?.toUpperCase()}</b> attachment. Please provide a direct public URL to the file. This file will be sent as the header of the WhatsApp message.</p>
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
          {isProcessing ? 'Sending...' : 'Send Campaign'}
        </Button>
      </div>
    </div>
  );
}
