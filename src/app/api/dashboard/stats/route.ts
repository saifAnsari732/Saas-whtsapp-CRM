import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAccountContext } from '@/lib/firebase/auth-helper';

export async function GET(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any);
    const accountId = accCtx?.accountId;

    if (!accCtx?.user || !accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = createAdminClient();

    // 1. Fetch broadcasts for this account (lean columns for speed)
    const { data: bcastData } = await db
      .from('broadcasts')
      .select('id, name, status, total_recipients, delivered_count, sent_count, failed_count, created_at, scheduled_at')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    const broadcasts = bcastData ?? [];
    const totalBroadcasts = broadcasts.length;
    let totalDelivered = 0;
    let totalSent = 0;
    let totalFailed = 0;
    let totalPending = 0;

    for (const b of broadcasts) {
      totalSent += b.sent_count || 0;
      totalDelivered += b.delivered_count || 0;
      totalFailed += b.failed_count || 0;
      if (b.status === 'sending' || b.status === 'scheduled') {
        totalPending += (b.total_recipients || 0) - ((b.sent_count || 0) + (b.failed_count || 0));
      }
    }

    // 2. Fetch contacts count today & total
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const { count: newContactsToday } = await db
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .gte('created_at', todayISO);

    // 3. Fetch conversations count
    const { count: activeConversations } = await db
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId);

    // 4. Messaging analytics
    const msgAnalytics = {
      delivered: totalDelivered,
      seen: totalDelivered,
      failed: totalFailed,
      pending: Math.max(0, totalPending),
    };

    // 5. Broadcast analytics
    const broadcastAnalytics = {
      totalBroadcasts,
      recentBroadcasts: broadcasts.slice(0, 5).map(b => ({
        id: b.id,
        name: b.name,
        status: b.status,
        totalRecipients: b.total_recipients || 0,
        deliveredCount: b.delivered_count || 0,
        failedCount: b.failed_count || 0,
        createdAt: b.created_at,
        scheduledAt: b.scheduled_at,
      })),
    };

    // 6. Metrics Bundle
    const metrics = {
      activeConversations: { current: activeConversations ?? 0, previous: 0 },
      newContactsToday: { current: newContactsToday ?? 0, previous: 0 },
      openDealsValue: 0,
      openDealsCount: 0,
      messagesSentToday: { current: totalSent, previous: 0 },
    };

    // 7. Template performance (lean aggregation)
    const { data: tmplData } = await db
      .from('message_templates')
      .select('id, name, status, usage_count, send_count')
      .order('created_at', { ascending: false })
      .limit(20);

    const tmpls = tmplData ?? [];
    const templatePerformance = {
      total: tmpls.length,
      approved: tmpls.filter(t => (t.status || '').toUpperCase() === 'APPROVED').length,
      pending: tmpls.filter(t => (t.status || '').toUpperCase() === 'PENDING').length,
      rejected: tmpls.filter(t => (t.status || '').toUpperCase() === 'REJECTED').length,
      topTemplates: tmpls.slice(0, 5).map(t => ({
        id: t.id,
        name: t.name,
        status: t.status,
        sendCount: t.usage_count || t.send_count || 0
      }))
    };

    return NextResponse.json({
      metrics,
      msgAnalytics,
      broadcastAnalytics,
      templatePerformance,
      broadcasts,
    });
  } catch (err: any) {
    console.error('[GET /api/dashboard/stats] error:', err);
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 });
  }
}
