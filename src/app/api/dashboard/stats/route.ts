import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { getAccountContext } from '@/lib/firebase/auth-helper';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any);
    const accountId = accCtx?.accountId;

    if (!accCtx?.user || !accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fDb = getAdminDb();
    let broadcasts: any[] = [];
    let newContactsToday = 0;
    let activeConversations = 0;
    let tmpls: any[] = [];

    // ── 1. Fetch from Firebase Firestore (Primary) ──────────────────
    if (fDb) {
      try {
        // A. Broadcasts
        const bcastMap = new Map<string, any>();
        const nestedBcasts = await fDb
          .collection('accounts')
          .doc(accountId)
          .collection('broadcasts')
          .get()
          .catch(() => ({ docs: [] } as any));

        for (const doc of nestedBcasts.docs) {
          bcastMap.set(doc.id, { id: doc.id, ...doc.data() });
        }

        const topBcasts = await fDb
          .collection('broadcasts')
          .where('account_id', '==', accountId)
          .get()
          .catch(() => ({ docs: [] } as any));

        for (const doc of topBcasts.docs) {
          if (!bcastMap.has(doc.id)) {
            bcastMap.set(doc.id, { id: doc.id, ...doc.data() });
          }
        }

        broadcasts = Array.from(bcastMap.values());

        // B. Contacts count today & total
        const contactsSnap = await fDb
          .collection('accounts')
          .doc(accountId)
          .collection('contacts')
          .get()
          .catch(() => ({ docs: [] } as any));

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        for (const cDoc of contactsSnap.docs) {
          const cData = cDoc.data();
          const createdAt = cData.createdAt?.toDate?.() || (cData.createdAt ? new Date(cData.createdAt) : null);
          if (createdAt && createdAt >= todayStart) {
            newContactsToday++;
          }
        }

        // C. Conversations count
        const convsSnap = await fDb
          .collection('accounts')
          .doc(accountId)
          .collection('conversations')
          .get()
          .catch(() => ({ docs: [] } as any));

        activeConversations = convsSnap.docs.length;

        // D. Templates
        const tmplSnap = await fDb
          .collection('message_templates')
          .get()
          .catch(() => ({ docs: [] } as any));

        tmpls = tmplSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      } catch (fsErr) {
        console.warn('[GET /api/dashboard/stats] Firestore read warning:', fsErr);
      }
    }

    // ── 2. Fallback to Supabase if Firestore was completely empty (Guarded) ──
    if (broadcasts.length === 0 && activeConversations === 0) {
      try {
        const db = createAdminClient();
        const fetchPromise = Promise.allSettled([
          db
            .from('broadcasts')
            .select('id, name, status, total_recipients, delivered_count, sent_count, failed_count, created_at, scheduled_at')
            .eq('account_id', accountId)
            .order('created_at', { ascending: false }),
          db.from('conversations').select('id', { count: 'exact', head: true }).eq('account_id', accountId),
          db.from('message_templates').select('id, name, status, usage_count, send_count').limit(20),
        ]);

        const timeout = new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 1500));
        const results = await Promise.race([fetchPromise, timeout]);

        if (Array.isArray(results) && results.length >= 3) {
          if (results[0].status === 'fulfilled' && results[0].value?.data) {
            broadcasts = results[0].value.data;
          }
          if (results[1].status === 'fulfilled' && results[1].value?.count != null) {
            activeConversations = results[1].value.count;
          }
          if (results[2].status === 'fulfilled' && results[2].value?.data) {
            tmpls = results[2].value.data;
          }
        }
      } catch {}
    }

    // ── 3. Calculations & Aggregations ──────────────────────────────
    const totalBroadcasts = broadcasts.length;
    let totalDelivered = 0;
    let totalSent = 0;
    let totalFailed = 0;
    let totalPending = 0;

    for (const b of broadcasts) {
      totalSent += Number(b.sent_count) || 0;
      totalDelivered += Number(b.delivered_count) || 0;
      totalFailed += Number(b.failed_count) || 0;
      if (b.status === 'sending' || b.status === 'scheduled') {
        const total = Number(b.total_recipients) || 0;
        const processed = (Number(b.sent_count) || 0) + (Number(b.failed_count) || 0);
        totalPending += Math.max(0, total - processed);
      }
    }

    const msgAnalytics = {
      delivered: totalDelivered,
      seen: totalDelivered,
      failed: totalFailed,
      pending: Math.max(0, totalPending),
    };

    const broadcastAnalytics = {
      totalBroadcasts,
      recentBroadcasts: broadcasts.slice(0, 5).map((b) => ({
        id: b.id,
        name: b.name,
        status: b.status,
        totalRecipients: Number(b.total_recipients) || 0,
        deliveredCount: Number(b.delivered_count) || 0,
        failedCount: Number(b.failed_count) || 0,
        createdAt: b.created_at || b.createdAt,
        scheduledAt: b.scheduled_at || b.scheduledAt,
      })),
    };

    const metrics = {
      activeConversations: { current: activeConversations, previous: 0 },
      newContactsToday: { current: newContactsToday, previous: 0 },
      openDealsValue: 0,
      openDealsCount: 0,
      messagesSentToday: { current: totalSent, previous: 0 },
    };

    const templatePerformance = {
      total: tmpls.length,
      approved: tmpls.filter((t) => (t.status || '').toUpperCase() === 'APPROVED').length,
      pending: tmpls.filter((t) => (t.status || '').toUpperCase() === 'PENDING').length,
      rejected: tmpls.filter((t) => (t.status || '').toUpperCase() === 'REJECTED').length,
      topTemplates: tmpls.slice(0, 5).map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        sendCount: t.usage_count || t.send_count || 0,
      })),
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
