import { NextResponse } from 'next/server';
import { getAdminDb, cleanForFirestore } from '@/lib/firebase/admin';
import { getAccountContext } from '@/lib/firebase/auth-helper';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const accCtx = await getAccountContext(request as any);
    const accountId = accCtx?.accountId || '61740bf8-b21e-42dd-9ab3-9118bca90bc6';
    const { contactId } = await params;

    const body = await request.json().catch(() => ({}));
    const tagId = body?.tag_id || body?.tagId;

    if (!tagId) {
      return NextResponse.json({ error: 'tag_id is required' }, { status: 400 });
    }

    const fDb = getAdminDb();
    if (!fDb) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const contactRef = fDb.collection('accounts').doc(accountId).collection('contacts').doc(contactId);
    const docSnap = await contactRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const data = docSnap.data() || {};
    const tags: string[] = Array.isArray(data.tags) ? [...data.tags] : [];

    if (!tags.includes(tagId)) {
      tags.push(tagId);
      await contactRef.update({
        tags,
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, added: true, tags });
  } catch (err: any) {
    console.error('[api/contacts/[contactId]/tags] POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const accCtx = await getAccountContext(request as any);
    const accountId = accCtx?.accountId || '61740bf8-b21e-42dd-9ab3-9118bca90bc6';
    const { contactId } = await params;

    const body = await request.json().catch(() => ({}));
    const tagId = body?.tag_id || body?.tagId;

    if (!tagId) {
      return NextResponse.json({ error: 'tag_id is required' }, { status: 400 });
    }

    const fDb = getAdminDb();
    if (!fDb) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const contactRef = fDb.collection('accounts').doc(accountId).collection('contacts').doc(contactId);
    const docSnap = await contactRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const data = docSnap.data() || {};
    const tags: string[] = Array.isArray(data.tags) ? data.tags.filter((t: string) => t !== tagId) : [];

    await contactRef.update({
      tags,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, removed: true, tags });
  } catch (err: any) {
    console.error('[api/contacts/[contactId]/tags] DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
