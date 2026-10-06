import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CONVERSATION_SELECT, normalizeConversation } from '@/lib/inbox/conversations';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('conversations')
      .select(CONVERSATION_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({ conversation: normalizeConversation(data as any) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const admin = createAdminClient();

    const allowedUpdates: Record<string, any> = {};
    if (body.status !== undefined) allowedUpdates.status = body.status;
    if (body.unread_count !== undefined) allowedUpdates.unread_count = body.unread_count;
    if (body.assigned_agent_id !== undefined) allowedUpdates.assigned_agent_id = body.assigned_agent_id;

    const { data, error } = await admin
      .from('conversations')
      .update(allowedUpdates)
      .eq('id', id)
      .select(CONVERSATION_SELECT)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ conversation: data ? normalizeConversation(data as any) : null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
