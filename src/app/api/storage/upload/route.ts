import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminStorage, getAdminDb } from '@/lib/firebase/admin';
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
    const templateId = (formData.get('templateId') as string) || (formData.get('selectedTemplateId') as string) || null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const path = buildMediaPath(accountId, file.name);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let publicUrl = '';

    // Upload to Firebase Storage with permanent download token
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

      // Best effort public read for legacy public access if allowed
      await fileRef.makePublic().catch(() => {});

      const encodedPath = encodeURIComponent(fileRef.name);
      publicUrl = `https://firebasestorage.googleapis.com/v0/b/${fbBucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;
      console.log('[POST /api/storage/upload] Uploaded to Firebase Storage:', publicUrl);
    } catch (fbErr: any) {
      console.error('[POST /api/storage/upload] Firebase Storage upload error:', fbErr);
      return NextResponse.json({ 
        error: `Firebase Storage upload failed: ${fbErr?.message || 'Unknown error'}` 
      }, { status: 500 });
    }

    // Store permanent header_media_url for template ID if provided
    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|avi|webm|mkv|3gp)$/i.test(file.name);
    const isDoc = file.type.includes('pdf') || file.type.includes('doc') || /\.(pdf|docx?)$/i.test(file.name);
    const detectedType = isVideo ? 'video' : isDoc ? 'document' : 'image';

    if (templateId && publicUrl) {
      try {
        const firestore = getAdminDb();
        const updateDoc = {
          header_media_url: publicUrl,
          header_type: detectedType,
          updated_at: new Date().toISOString(),
        };

        await Promise.allSettled([
          firestore.collection('message_templates').doc(templateId).set(updateDoc, { merge: true }),
          firestore.collection('accounts').doc(accCtx.accountId).collection('templates').doc(templateId).set(updateDoc, { merge: true }),
        ]);

        console.log(`[POST /api/storage/upload] Successfully bound media (${detectedType}) to template: ${templateId}`);
      } catch (fsErr) {
        console.warn('[POST /api/storage/upload] Firestore template update warning:', fsErr);
      }
    }

    return NextResponse.json({ publicUrl, path, mediaType: detectedType });
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

    const { path } = await request.json();
    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    // Delete from Firebase Storage
    try {
      const fbStorage = getAdminStorage();
      const targetBucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'whatsapp-saas-7ab44.firebasestorage.app';
      const fbBucket = fbStorage.bucket(targetBucketName);
      await fbBucket.file(`chat-media/${path}`).delete({ ignoreNotFound: true });
    } catch (delErr) {
      console.warn('[DELETE /api/storage/upload] File delete notice:', delErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
