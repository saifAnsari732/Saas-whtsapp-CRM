import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processIncomingMessage } from '@/lib/chatbot/processor';

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
    const { message, contactName } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    const result = await processIncomingMessage({
      accountId,
      userId: user.id,
      senderJid: '919876543210@s.whatsapp.net',
      messageText: message,
      senderName: contactName || 'Customer',
    });

    return NextResponse.json({
      success: true,
      reply: result.replyText || 'No auto-reply matched your message.',
      source: result.source || 'none',
      ruleMatched: result.ruleMatched || null,
      delayMs: result.delayMs,
    });
  } catch (error: any) {
    console.error('Failed to test chatbot:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
