import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SEND_BATCH_SIZE = 10;
const SEND_BATCH_DELAY_MS = 1000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: Request) {
  try {
    const { broadcastId, payload, totalRecipients, origin } = await req.json();

    // Respond immediately so client can navigate
    const res = NextResponse.json({ success: true, status: 'started' });

    // Background process (Promises in Next.js Node runtime keep running)
    runBackgroundLoop(broadcastId, payload, totalRecipients, origin).catch(console.error);

    return res;
  } catch (err) {
    console.error('Failed to start broadcast background task', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

async function runBackgroundLoop(broadcastId: string, payload: any, totalRecipients: number, origin: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Must use service role to bypass cookies in detached context
  const supabase = createClient(supabaseUrl, supabaseKey);

  function resolveVariables(variables: Record<string, any>, contact: any, customValues?: Map<string, string>): string[] {
    if (!variables) return [];
    const keys = Object.keys(variables).sort((a, b) => {
      const an = Number(a); const bn = Number(b);
      if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
      return a.localeCompare(b);
    });
    return keys.map((key) => {
      const v = variables[key];
      if (v.type === 'static') return v.value;
      if (v.type === 'field') {
        const fieldMap: Record<string, string | undefined> = {
          name: contact.name, phone: contact.phone, email: contact.email, company: contact.company,
        };
        return fieldMap[v.value] ?? '';
      }
      return customValues?.get(v.value) ?? '';
    });
  }

  try {
    const { data: recipients, error: recipientsFetchError } = await supabase
      .from('broadcast_recipients')
      .select('*, contact:contacts(*)')
      .eq('broadcast_id', broadcastId);

    if (recipientsFetchError || !recipients) return;

    const contactIds = recipients.map((r: any) => r.contact?.id).filter(Boolean);
    
    // Inline fetchCustomValueIndex logic
    const customValueIndex = new Map<string, any[]>();
    if (contactIds.length > 0) {
      const { data: cvData } = await supabase
        .from('contact_custom_values')
        .select('*')
        .in('contact_id', contactIds);
      if (cvData) {
        for (const row of cvData) {
          if (!customValueIndex.has(row.contact_id)) {
            customValueIndex.set(row.contact_id, []);
          }
          customValueIndex.get(row.contact_id)!.push(row);
        }
      }
    }

    let failedCount = 0;
    const headerType = payload.template.header_type;
    const isMediaHeader = headerType === 'image' || headerType === 'video' || headerType === 'document';
    const headerMediaUrl = payload.headerMediaUrl?.trim();
    const messageParams = isMediaHeader && headerMediaUrl ? { headerMediaUrl } : undefined;

    for (let i = 0; i < recipients.length; i += SEND_BATCH_SIZE) {
      const batch = recipients.slice(i, i + SEND_BATCH_SIZE);
      const apiRecipients = batch.filter((r: any) => r.contact?.phone).map((r: any) => {
        // Build contact specific custom values map
        const cvMap = new Map<string, string>();
        if (r.contact && customValueIndex.has(r.contact.id)) {
          for (const cv of customValueIndex.get(r.contact.id)!) {
            cvMap.set(cv.field_id, cv.value);
          }
        }
        
        return {
          phone: r.contact!.phone as string,
          params: r.contact ? resolveVariables(payload.variables, r.contact, cvMap) : [],
          ...(messageParams ? { messageParams } : {}),
        };
      });

      if (apiRecipients.length === 0) continue;

      try {
        const res = await fetch(`${origin}/api/whatsapp/broadcast`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipients: apiRecipients,
            template_name: payload.template.name,
            template_language: payload.template.language ?? 'en_US',
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Broadcast API request failed');

        const resultsByPhone = new Map<string, any>();
        for (const r of (data.results ?? [])) resultsByPhone.set(r.phone, r);

        for (const recipient of batch) {
          const phone = recipient.contact?.phone;
          const result = phone ? resultsByPhone.get(phone) : undefined;
          if (!result) {
            failedCount++;
            await supabase.from('broadcast_recipients').update({ status: 'failed', error_message: 'No phone number' }).eq('id', recipient.id);
            continue;
          }
          if (result.status === 'sent') {
            await supabase.from('broadcast_recipients').update({ status: 'sent', sent_at: new Date().toISOString(), whatsapp_message_id: result.whatsapp_message_id ?? null, error_message: null }).eq('id', recipient.id);
          } else {
            failedCount++;
            await supabase.from('broadcast_recipients').update({ status: 'failed', error_message: result.error ?? 'Unknown error' }).eq('id', recipient.id);
          }
        }
      } catch (err) {
        for (const recipient of batch) {
          failedCount++;
          await supabase.from('broadcast_recipients').update({ status: 'failed', error_message: err instanceof Error ? err.message : 'Unknown error' }).eq('id', recipient.id);
        }
      }

      // Update broadcast stats locally (so the frontend sees progress)
      // We don't necessarily need to update progress percentage in DB since we can just update the sent_count
      // Actually, frontend polls the 'broadcasts' and 'broadcast_recipients' table for updates.
      // So the DB triggers or this loop updating recipient statuses is enough!

      if (i + SEND_BATCH_SIZE < recipients.length) {
        await sleep(payload.batchDelayMs ?? SEND_BATCH_DELAY_MS);
      }
    }

    const finalStatus = failedCount === totalRecipients ? 'failed' : 'sent';
    await supabase.from('broadcasts').update({ status: finalStatus }).eq('id', broadcastId);

  } catch (e) {
    console.error('Background loop failed', e);
    await supabase.from('broadcasts').update({ status: 'failed' }).eq('id', broadcastId);
  }
}
