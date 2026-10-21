import { NextResponse } from 'next/server';
import { getAdminDb, cleanForFirestore } from '@/lib/firebase/admin';
import { getAccountContext } from '@/lib/firebase/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any);
    const accountId = accCtx?.accountId;

    if (!accCtx?.user || !accountId) {
      return NextResponse.json({ flows: [] }, { status: 401 });
    }

    const fDb = getAdminDb();
    if (!fDb) {
      return NextResponse.json({ flows: [] });
    }

    const flowsMap = new Map<string, any>();

    // 1. Check nested accounts/{accountId}/keyword_flows
    try {
      const snap = await fDb
        .collection('accounts')
        .doc(accountId)
        .collection('keyword_flows')
        .get();

      for (const doc of snap.docs) {
        const d = doc.data();
        flowsMap.set(doc.id, {
          id: doc.id,
          ...d,
          created_at: d.created_at || d.createdAt || new Date().toISOString(),
        });
      }
    } catch (nestedErr) {
      console.warn('[keyword-flows GET] nested fetch error:', nestedErr);
    }

    // 2. Check top-level keyword_flows
    try {
      let topSnap = await fDb
        .collection('keyword_flows')
        .where('account_id', '==', accountId)
        .get();

      if (topSnap.empty) {
        topSnap = await fDb
          .collection('keyword_flows')
          .where('accountId', '==', accountId)
          .get();
      }

      for (const doc of topSnap.docs) {
        if (!flowsMap.has(doc.id)) {
          const d = doc.data();
          flowsMap.set(doc.id, {
            id: doc.id,
            ...d,
            created_at: d.created_at || d.createdAt || new Date().toISOString(),
          });
        }
      }
    } catch (topErr) {
      console.warn('[keyword-flows GET] top fetch error:', topErr);
    }

    const list = Array.from(flowsMap.values()).sort((a, b) => {
      const tA = new Date(a.created_at || 0).getTime();
      const tB = new Date(b.created_at || 0).getTime();
      return tB - tA;
    });

    return NextResponse.json({ flows: list });
  } catch (err: any) {
    console.error('[keyword-flows GET] Error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to load keyword flows', flows: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any);
    const accountId = accCtx?.accountId;

    if (!accCtx?.user || !accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fDb = getAdminDb();
    if (!fDb) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    const body = await request.json();
    const { name, keywords, response_type, template_id, template_name, text_message, is_active } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Flow name is required' }, { status: 400 });
    }

    let parsedKeywords: string[] = [];
    if (Array.isArray(keywords)) {
      parsedKeywords = keywords.map((k) => String(k).trim().toLowerCase()).filter(Boolean);
    } else if (typeof keywords === 'string') {
      parsedKeywords = keywords
        .split(',')
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);
    }

    if (parsedKeywords.length === 0) {
      return NextResponse.json({ error: 'At least one keyword trigger is required' }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const flowId = `kf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const flowData = cleanForFirestore({
      id: flowId,
      account_id: accountId,
      accountId: accountId,
      user_id: accCtx.user.uid || (accCtx.user as any).id || 'system',
      name: name.trim(),
      keywords: parsedKeywords,
      response_type: response_type === 'text' ? 'text' : 'template',
      template_id: template_id || null,
      template_name: template_name || null,
      text_message: text_message?.trim() || null,
      is_active: is_active ?? true,
      created_at: nowIso,
      updated_at: nowIso,
    });

    await Promise.allSettled([
      fDb.collection('accounts').doc(accountId).collection('keyword_flows').doc(flowId).set(flowData),
      fDb.collection('keyword_flows').doc(flowId).set(flowData),
    ]);

    return NextResponse.json({ flow: flowData }, { status: 201 });
  } catch (err: any) {
    console.error('[keyword-flows POST] Error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create keyword flow' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any);
    const accountId = accCtx?.accountId;

    if (!accCtx?.user || !accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fDb = getAdminDb();
    if (!fDb) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    const body = await request.json();
    const { id, name, keywords, response_type, template_id, template_name, text_message, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Flow ID is required' }, { status: 400 });
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = String(name).trim();
    if (keywords !== undefined) {
      if (Array.isArray(keywords)) {
        updateData.keywords = keywords.map((k) => String(k).trim().toLowerCase()).filter(Boolean);
      } else if (typeof keywords === 'string') {
        updateData.keywords = keywords
          .split(',')
          .map((k) => k.trim().toLowerCase())
          .filter(Boolean);
      }
    }
    if (response_type !== undefined) updateData.response_type = response_type;
    if (template_id !== undefined) updateData.template_id = template_id || null;
    if (template_name !== undefined) updateData.template_name = template_name || null;
    if (text_message !== undefined) updateData.text_message = text_message ? String(text_message).trim() : null;
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);

    const cleanUpdate = cleanForFirestore(updateData);

    await Promise.allSettled([
      fDb.collection('accounts').doc(accountId).collection('keyword_flows').doc(id).set(cleanUpdate, { merge: true }),
      fDb.collection('keyword_flows').doc(id).set(cleanUpdate, { merge: true }),
    ]);

    return NextResponse.json({ success: true, updated: cleanUpdate });
  } catch (err: any) {
    console.error('[keyword-flows PUT] Error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to update keyword flow' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any);
    const accountId = accCtx?.accountId;

    if (!accCtx?.user || !accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: 'Flow ID is required' }, { status: 400 });
    }

    const fDb = getAdminDb();
    if (fDb) {
      await Promise.allSettled([
        fDb.collection('accounts').doc(accountId).collection('keyword_flows').doc(id).delete(),
        fDb.collection('keyword_flows').doc(id).delete(),
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[keyword-flows DELETE] Error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to delete keyword flow' }, { status: 500 });
  }
}
