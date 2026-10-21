import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { getAccountContext } from '@/lib/firebase/auth-helper';
import { runBackgroundLoop } from '@/lib/whatsapp/broadcast-runner';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any);
    const accountId = accCtx?.accountId;

    if (!accCtx?.user || !accountId) {
      return NextResponse.json({ broadcasts: [] }, { status: 401 });
    }

    const broadcastsMap = new Map<string, any>();

    // 1. Primary: Fetch from Firebase Firestore
    try {
      const fDb = getAdminDb();
      if (fDb) {
        // A. Check nested accounts/{accountId}/broadcasts
        const nestedSnap = await fDb
          .collection('accounts')
          .doc(accountId)
          .collection('broadcasts')
          .get();

        for (const doc of nestedSnap.docs) {
          const data = doc.data();
          broadcastsMap.set(doc.id, {
            id: doc.id,
            ...data,
            created_at:
              data.created_at ||
              data.createdAt?.toDate?.()?.toISOString() ||
              (typeof data.createdAt === 'string' ? data.createdAt : null) ||
              new Date().toISOString(),
          });
        }

        // B. Check top-level broadcasts collection by accountId / account_id
        let topSnap = await fDb
          .collection('broadcasts')
          .where('account_id', '==', accountId)
          .get();

        if (topSnap.empty) {
          topSnap = await fDb
            .collection('broadcasts')
            .where('accountId', '==', accountId)
            .get();
        }

        for (const doc of topSnap.docs) {
          if (!broadcastsMap.has(doc.id)) {
            const data = doc.data();
            broadcastsMap.set(doc.id, {
              id: doc.id,
              ...data,
              created_at:
                data.created_at ||
                data.createdAt?.toDate?.()?.toISOString() ||
                (typeof data.createdAt === 'string' ? data.createdAt : null) ||
                new Date().toISOString(),
            });
          }
        }
      }
    } catch (fsErr) {
      console.warn('[GET /api/whatsapp/broadcasts] Firestore read warning:', fsErr);
    }

    // 2. Fallback / Merge from Supabase only if available (safely guarded)
    try {
      const supabaseAdmin = createAdminClient();
      const fetchPromise = supabaseAdmin
        .from('broadcasts')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      // 2s timeout guard so dead Supabase host never hangs or fails the route
      const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('Timeout') }), 2000)
      );

      const res = await Promise.race([fetchPromise, timeoutPromise]);
      if (res?.data && Array.isArray(res.data)) {
        for (const bc of res.data) {
          if (!broadcastsMap.has(bc.id)) {
            broadcastsMap.set(bc.id, bc);
          }
        }
      }
    } catch (sbErr) {
      // Quietly ignore Supabase errors since Firebase is the primary datastore
    }

    const list = Array.from(broadcastsMap.values()).sort((a, b) => {
      const tA = new Date(a.created_at || 0).getTime();
      const tB = new Date(b.created_at || 0).getTime();
      return tB - tA;
    });

    // Auto-resume any stuck/sending broadcasts in background
    for (const bc of list) {
      if (bc.status === 'sending') {
        void runBackgroundLoop(bc.id).catch((e) =>
          console.error(`[GET /api/whatsapp/broadcasts] Auto-resume failed for ${bc.id}:`, e)
        );
      }
    }

    return NextResponse.json({ broadcasts: list });
  } catch (err: any) {
    console.error('[GET /api/whatsapp/broadcasts] Catch error:', err?.message || err);
    return NextResponse.json({ broadcasts: [] }, { status: 200 });
  }
}
