import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getChatbotConfig, saveChatbotConfig, getFollowUpQueue } from '@/lib/chatbot/storage';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const accountId = profile?.account_id || user.id;
    const config = await getChatbotConfig(accountId, user.id);
    const queue = getFollowUpQueue(accountId);

    return NextResponse.json({
      success: true,
      config,
      queue,
      stats: {
        totalFollowUpsQueued: queue.length,
        pendingFollowUps: queue.filter((q) => q.status === 'pending').length,
        sentFollowUps: queue.filter((q) => q.status === 'sent').length,
      }
    });
  } catch (error: any) {
    console.error('Failed to get chatbot config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const accountId = profile?.account_id || user.id;
    const body = await req.json();

    const updated = await saveChatbotConfig(accountId, user.id, body);

    return NextResponse.json({
      success: true,
      config: updated,
    });
  } catch (error: any) {
    console.error('Failed to save chatbot config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
