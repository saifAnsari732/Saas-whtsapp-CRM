import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || process.env.AUTOMATION_CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date().toISOString();

    // Query broadcasts that are scheduled and ready to send
    const { data: dueBroadcasts, error: fetchErr } = await supabase
      .from('broadcasts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now);

    if (fetchErr) {
      console.error('[Scheduled Broadcast Cron] Fetch error:', fetchErr);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!dueBroadcasts || dueBroadcasts.length === 0) {
      return NextResponse.json({ message: 'No scheduled broadcasts due', processed: 0 });
    }

    console.log(`[Scheduled Broadcast Cron] Found ${dueBroadcasts.length} due broadcasts.`);

    let processedCount = 0;

    for (const b of dueBroadcasts) {
      // Transition status to sending to prevent double execution
      const { error: updateErr } = await supabase
        .from('broadcasts')
        .update({ status: 'sending' })
        .eq('id', b.id)
        .eq('status', 'scheduled');

      if (updateErr) {
        console.error(`[Scheduled Broadcast Cron] Failed to lock broadcast ${b.id}:`, updateErr);
        continue;
      }

      // Fetch template details
      const { data: template } = await supabase
        .from('message_templates')
        .select('*')
        .eq('name', b.template_name)
        .eq('account_id', b.account_id)
        .maybeSingle();

      const payload = {
        name: b.name,
        template: template || { name: b.template_name, language: b.template_language ?? 'en_US' },
        audience: b.audience_filter || { type: 'all' },
        variables: b.template_variables || {},
        batchDelayMs: 3000,
      };

      const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      // Dispatch to broadcast run API
      try {
        await fetch(`${origin}/api/whatsapp/broadcast/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            broadcastId: b.id,
            payload,
            totalRecipients: b.total_recipients,
            origin,
          }),
        });
        processedCount++;
      } catch (runErr) {
        console.error(`[Scheduled Broadcast Cron] Error triggering broadcast ${b.id}:`, runErr);
      }
    }

    return NextResponse.json({
      message: 'Scheduled broadcasts processed',
      processed: processedCount,
      total: dueBroadcasts.length,
    });
  } catch (err: any) {
    console.error('[Scheduled Broadcast Cron] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
