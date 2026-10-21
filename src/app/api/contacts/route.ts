import { NextResponse } from 'next/server';
import { getAdminDb, cleanForFirestore } from '@/lib/firebase/admin';
import { getAccountContext } from '@/lib/firebase/auth-helper';
import { normalizePhone } from '@/lib/whatsapp/phone-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any);
    const accountId = accCtx?.accountId || '61740bf8-b21e-42dd-9ab3-9118bca90bc6';

    const fDb = getAdminDb();
    if (!fDb) {
      return NextResponse.json({ contacts: [], tags: [] });
    }

    const contactsRef = fDb.collection('accounts').doc(accountId).collection('contacts');
    const tagsRef = fDb.collection('accounts').doc(accountId).collection('tags');

    const [contactsSnap, tagsSnap] = await Promise.all([
      contactsRef.get(),
      tagsRef.get(),
    ]);

    const tags: any[] = [];
    const tagsMap = new Map<string, any>();
    tagsSnap.forEach((doc) => {
      const tagData = { id: doc.id, ...doc.data() };
      tags.push(tagData);
      tagsMap.set(doc.id, tagData);
    });

    const contacts: any[] = [];
    contactsSnap.forEach((doc) => {
      const data = doc.data();
      const rawTags = Array.isArray(data.tags) ? data.tags : [];
      const hydratedTags = rawTags.map((t: any) => {
        if (typeof t === 'string') {
          return tagsMap.get(t) || { id: t, name: t, color: '#3b82f6' };
        }
        return t;
      });

      const cAt = data.createdAt || data.created_at || doc.createTime?.toDate()?.toISOString() || new Date().toISOString();
      const uAt = data.updatedAt || data.updated_at || doc.updateTime?.toDate()?.toISOString() || new Date().toISOString();

      contacts.push({
        id: doc.id,
        user_id: data.userId || 'system',
        account_id: accountId,
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        company: data.company || '',
        ...data,
        tags: hydratedTags,
        createdAt: cAt,
        updatedAt: uAt,
        created_at: cAt,
        updated_at: uAt,
      });
    });

    // Sort descending by createdAt
    contacts.sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tB - tA;
    });

    return NextResponse.json({ contacts, tags });
  } catch (err: any) {
    console.error('[api/contacts] GET error:', err);
    return NextResponse.json({ error: err.message, contacts: [], tags: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any);
    const accountId = accCtx?.accountId || '61740bf8-b21e-42dd-9ab3-9118bca90bc6';
    const userId = accCtx?.user?.uid || 'system';

    const body = await request.json();

    const fDb = getAdminDb();
    if (!fDb) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const nowIso = new Date().toISOString();
    const contactsRef = fDb.collection('accounts').doc(accountId).collection('contacts');

    // Support batch import
    if (Array.isArray(body?.batch)) {
      const items = body.batch;
      let imported = 0;
      let skipped = 0;
      const batch = fDb.batch();

      for (const item of items) {
        const rawPhone = String(item.phone || item.Phone || '').trim();
        if (!rawPhone) {
          skipped++;
          continue;
        }
        const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
        if (cleanPhone.length < 5) {
          skipped++;
          continue;
        }
        const contactId = item.id || `c_${cleanPhone}`;
        const docRef = contactsRef.doc(contactId);

        const contactObj = cleanForFirestore({
          id: contactId,
          name: item.name || item.Name || rawPhone,
          phone: normalizePhone(rawPhone) || rawPhone,
          email: item.email || item.Email || null,
          company: item.company || item.Company || null,
          tags: Array.isArray(item.tags) ? item.tags : [],
          accountId,
          userId,
          createdAt: nowIso,
          updatedAt: nowIso,
        });

        batch.set(docRef, contactObj, { merge: true });
        imported++;
      }

      await batch.commit();
      return NextResponse.json({ success: true, imported, skipped, total: items.length });
    }

    const { id, name, phone, email, company, tags } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const contactId = id || `c_${cleanPhone}`;

    const contactRef = contactsRef.doc(contactId);
    const existingDoc = await contactRef.get();

    const contactObj = cleanForFirestore({
      id: contactId,
      name: name || phone,
      phone: normalizePhone(phone) || phone,
      email: email || null,
      company: company || null,
      tags: Array.isArray(tags) ? tags : existingDoc.data()?.tags || [],
      accountId,
      userId: existingDoc.data()?.userId || userId,
      createdAt: existingDoc.data()?.createdAt || nowIso,
      updatedAt: nowIso,
    });

    await contactRef.set(contactObj, { merge: true });

    return NextResponse.json({ contact: contactObj, success: true });
  } catch (err: any) {
    console.error('[api/contacts] POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any);
    const accountId = accCtx?.accountId || '61740bf8-b21e-42dd-9ab3-9118bca90bc6';

    const url = new URL(request.url);
    const queryId = url.searchParams.get('id');

    let idsToDelete: string[] = [];

    if (queryId) {
      idsToDelete = [queryId];
    } else {
      try {
        const body = await request.json();
        if (Array.isArray(body?.ids)) {
          idsToDelete = body.ids;
        }
      } catch {}
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json({ error: 'No contact ID provided' }, { status: 400 });
    }

    const fDb = getAdminDb();
    if (!fDb) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const contactsRef = fDb.collection('accounts').doc(accountId).collection('contacts');
    const batch = fDb.batch();

    for (const cid of idsToDelete) {
      batch.delete(contactsRef.doc(cid));
    }

    await batch.commit();

    return NextResponse.json({ success: true, count: idsToDelete.length });
  } catch (err: any) {
    console.error('[api/contacts] DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
