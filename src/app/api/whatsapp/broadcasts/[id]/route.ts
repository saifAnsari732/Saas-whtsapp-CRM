import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { getAccountContext } from '@/lib/firebase/auth-helper';
import { runBackgroundLoop } from '@/lib/whatsapp/broadcast-runner';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: broadcastId } = await params;
    const accCtx = await getAccountContext(request as any);
    const accountId = accCtx?.accountId;

    if (!accCtx?.user || !accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let broadcast: any = null;
    let recipients: any[] = [];

    // 1. Primary: Fetch from Firebase Firestore
    try {
      const fDb = getAdminDb();
      if (fDb) {
        // Try nested doc accounts/{accountId}/broadcasts/{broadcastId}
        const nestedDoc = await fDb
          .collection('accounts')
          .doc(accountId)
          .collection('broadcasts')
          .doc(broadcastId)
          .get();

        if (nestedDoc.exists) {
          broadcast = { id: nestedDoc.id, ...nestedDoc.data() };
        } else {
          // Fallback to top-level broadcasts doc
          const topDoc = await fDb.collection('broadcasts').doc(broadcastId).get();
          if (topDoc.exists) {
            broadcast = { id: topDoc.id, ...topDoc.data() };
          }
        }

        if (broadcast) {
          const effectiveAccountId = broadcast.account_id || broadcast.accountId || accountId;
          // Fetch recipients from Firestore subcollection
          const recSnap = await fDb
            .collection('accounts')
            .doc(effectiveAccountId)
            .collection('broadcasts')
            .doc(broadcastId)
            .collection('recipients')
            .get();

          if (!recSnap.empty) {
            recipients = recSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          } else {
            // Also check top-level broadcast_recipients
            const topRecSnap = await fDb
              .collection('broadcast_recipients')
              .where('broadcast_id', '==', broadcastId)
              .get();
            if (!topRecSnap.empty) {
              recipients = topRecSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
            }
          }

          if (recipients.length > 0) {
            const computedSent = recipients.filter((r) => r.status === 'sent' || r.status === 'delivered' || r.status === 'read' || r.status === 'replied').length;
            const computedDelivered = recipients.filter((r) => r.status === 'delivered' || r.status === 'read' || r.status === 'replied').length;
            const computedRead = recipients.filter((r) => r.status === 'read' || r.status === 'replied').length;
            const computedReplied = recipients.filter((r) => r.status === 'replied').length;
            const computedFailed = recipients.filter((r) => r.status === 'failed').length;

            broadcast.sent_count = computedSent;
            broadcast.delivered_count = computedDelivered;
            broadcast.read_count = computedRead;
            broadcast.replied_count = computedReplied;
            broadcast.failed_count = computedFailed;

            // Self-healing sync back to Firestore parent docs
            const syncPayload = {
              sent_count: computedSent,
              delivered_count: computedDelivered,
              read_count: computedRead,
              replied_count: computedReplied,
              failed_count: computedFailed,
            };
            void Promise.allSettled([
              fDb.collection('accounts').doc(effectiveAccountId).collection('broadcasts').doc(broadcastId).set(syncPayload, { merge: true }),
              fDb.collection('broadcasts').doc(broadcastId).set(syncPayload, { merge: true }),
            ]);
          }
        }
      }
    } catch (fsErr) {
      console.warn(`[GET /api/whatsapp/broadcasts/${broadcastId}] Firestore warning:`, fsErr);
    }

    if (!broadcast) {
      return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });
    }

    // Auto-resume if status is sending
    if (broadcast.status === 'sending') {
      const effectiveAccountId = broadcast.account_id || broadcast.accountId || accountId;
      void runBackgroundLoop(broadcastId, { accountId: effectiveAccountId }).catch((e) =>
        console.error(`[GET /api/whatsapp/broadcasts/${broadcastId}] Auto-resume error:`, e)
      );
    }

    return NextResponse.json({
      broadcast,
      recipients: recipients ?? [],
    });
  } catch (err: any) {
    console.error('[GET /api/whatsapp/broadcasts/[id]] Error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: broadcastId } = await params;
    const accCtx = await getAccountContext(request as any);
    const accountId = accCtx?.accountId;

    if (!accCtx?.user || !accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Delete from Firebase Firestore
    try {
      const fDb = getAdminDb();
      if (fDb) {
        await Promise.allSettled([
          fDb
            .collection('accounts')
            .doc(accountId)
            .collection('broadcasts')
            .doc(broadcastId)
            .delete(),
          fDb.collection('broadcasts').doc(broadcastId).delete(),
        ]);
      }
    } catch (fsErr) {
      console.warn(`[DELETE /api/whatsapp/broadcasts/${broadcastId}] Firestore delete warning:`, fsErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE /api/whatsapp/broadcasts/[id]] Error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
