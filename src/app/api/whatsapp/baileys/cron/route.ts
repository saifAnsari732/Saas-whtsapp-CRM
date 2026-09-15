import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const maxDuration = 60; // Max execution time for Next.js API

export async function GET(req: Request) {
  try {
    const supabase = createAdminClient();
    
    // Check if auth is provided (simple secret)
    const url = new URL(req.url);
    const secret = url.searchParams.get('secret');
    if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current time in HH:MM format (GMT for simplicity or adjust to timezone if needed)
    // For now, let's use the local hour/minute of the server.
    const now = new Date();
    const currentHHMM = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    type ScheduleRow = {
      id: string;
      user_id: string;
      group_jid: string;
      message_text: string;
      schedule_time: string;
    };

    // Fetch all active schedules matching the current time
    const { data: schedulesRaw, error } = await supabase
      .from('scheduled_group_messages')
      .select('*')
      .eq('is_active', true)
      .eq('schedule_time', currentHHMM);

    if (error) {
      console.error("Cron fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const schedules = (schedulesRaw || []) as ScheduleRow[];

    if (schedules.length === 0) {
      return NextResponse.json({ success: true, message: 'No schedules for ' + currentHHMM });
    }

    const results = [];
    
    for (const schedule of schedules) {
      const userId = schedule.user_id;
      
      // Check if this user has an active Baileys socket in memory
      // In a real distributed system, we'd need a worker or redis pub/sub, 
      // but since everything runs in one node process for now:
      const sock = global.waSockets?.[userId];
      
      if (!sock) {
        results.push({ id: schedule.id, status: 'failed', reason: 'Socket not connected in memory' });
        continue;
      }
      
      try {
        await sock.sendMessage(schedule.group_jid, { text: schedule.message_text });
        
        // Update last_sent_at
        await (supabase as any)
          .from('scheduled_group_messages')
          .update({ last_sent_at: new Date().toISOString() })
          .eq('id', schedule.id);

          
        results.push({ id: schedule.id, status: 'success' });
      } catch (err: any) {
        results.push({ id: schedule.id, status: 'failed', reason: err.message });
      }
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error: any) {
    console.error("Scheduled Message Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
