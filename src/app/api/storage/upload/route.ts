import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminStorage, getAdminDb } from '@/lib/firebase/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAccountContext } from '@/lib/firebase/auth-helper';
import { buildMediaPath } from '@/lib/storage/upload-media';

function toValidUUID(str: string): string {
  if (!str) return '00000000-0000-4000-a000-000000000000';
  const stripped = str.replace(/^acct-/, '');
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(stripped)) return stripped;
  if (uuidRegex.test(str)) return str;
  const hex = Array.from(new TextEncoder().encode(str))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .padEnd(32, '0')
    .slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export async function POST(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any);
    if (!accCtx?.user || !accCtx?.accountId) {
      return NextResponse.json({ error: 'Unauthorized: Please sign in first' }, { status: 401 });
    }

    const accountId = toValidUUID(accCtx.accountId);
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucketName = (formData.get('bucket') as string) || 'chat-media';
    const templateId = (formData.get('templateId') as string) || (formData.get('selectedTemplateId') as string) || null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const path = buildMediaPath(accountId, file.name);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let publicUrl = '';

    // 1. Primary: Upload to Firebase Storage
    try {
      const fbStorage = getAdminStorage();
      const targetBucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'whatsapp-saas-7ab44.firebasestorage.app';
      const fbBucket = fbStorage.bucket(targetBucketName);
      const fileRef = fbBucket.file(`chat-media/${path}`);
      const downloadToken = crypto.randomUUID();

      await fileRef.save(fileBuffer, {
        metadata: {
          contentType: file.type || 'application/octet-stream',
          cacheControl: 'public, max-age=31536000',
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
          },
        },
        public: true,
      });

      // Ensure public read if bucket rules allow
      await fileRef.makePublic().catch(() => {});

      const encodedPath = encodeURIComponent(fileRef.name);
      publicUrl = `https://firebasestorage.googleapis.com/v0/b/${fbBucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;
      console.log('[POST /api/storage/upload] Uploaded to Firebase Storage:', publicUrl);
    } catch (fbErr) {
      console.warn('[POST /api/storage/upload] Firebase Storage upload warning:', fbErr);
    }

    // 2. Fallback / Sync to Supabase Storage if Firebase URL was not generated
    if (!publicUrl) {
      const supabaseAdmin = createAdminClient();
      const { error: uploadError } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(path, fileBuffer, {
          contentType: file.type || 'application/octet-stream',
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('[POST /api/storage/upload] Supabase Storage upload error:', uploadError);
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      const { data: urlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(path);
      publicUrl = urlData.publicUrl;
    }

    // 3. Store permanent header_media_url for template ID if provided
    if (templateId && publicUrl) {
      try {
        const firestore = getAdminDb();
        await firestore.collection('message_templates').doc(templateId).set(
          {
            header_media_url: publicUrl,
            updated_at: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (fsErr) {
        console.warn('[POST /api/storage/upload] Firestore template update warning:', fsErr);
      }

      try {
        const supabaseAdmin = createAdminClient();
        await supabaseAdmin
          .from('message_templates')
          .update({ header_media_url: publicUrl })
          .eq('id', templateId);
      } catch (sbErr) {
        console.warn('[POST /api/storage/upload] Supabase template update warning:', sbErr);
      }
    }

    return NextResponse.json({ publicUrl, path });
  } catch (err: any) {
    console.error('[POST /api/storage/upload] Exception:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any);
    if (!accCtx?.user || !accCtx?.accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bucket = 'chat-media', path } = await request.json();
    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    // Try deleting from Firebase Storage
    try {
      const fbStorage = getAdminStorage();
      const targetBucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'whatsapp-saas-7ab44.firebasestorage.app';
      const fbBucket = fbStorage.bucket(targetBucketName);
      await fbBucket.file(`chat-media/${path}`).delete({ ignoreNotFound: true });
    } catch {}

    // Try deleting from Supabase Storage
    try {
      const supabaseAdmin = createAdminClient();
      await supabaseAdmin.storage.from(bucket).remove([path]);
    } catch {}

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
