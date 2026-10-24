import { uploadResumableMedia } from '@/lib/whatsapp/meta-api';
import type { TemplatePayload } from '@/lib/whatsapp/template-validators';

/**
 * Meta requires an `example.header_handle` (from the Resumable Upload
 * API) to create/edit a template with an IMAGE or VIDEO header — a plain public
 * URL is not accepted at creation time. This helper turns the template's
 * `header_media_url` (whether the user uploaded a file or pasted a link)
 * into a handle and writes it onto the payload, so both the upload path
 * and the legacy URL path actually succeed.
 */

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const VIDEO_MAX_BYTES = 16 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/3gpp'];

async function fetchAndUploadVideoHandle(url: string, accessToken: string, appId: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error('Could not fetch the header video URL. Make sure it is publicly reachable.');
  }
  if (!res.ok) {
    throw new Error(`Header video URL returned ${res.status}. It must be publicly reachable.`);
  }

  const contentType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength === 0) {
    throw new Error('Header video is empty.');
  }
  if (bytes.byteLength > VIDEO_MAX_BYTES) {
    throw new Error(
      `Header video is ${(bytes.byteLength / 1024 / 1024).toFixed(1)} MB — Meta's limit is 16 MB.`,
    );
  }

  const mimeType = contentType && ALLOWED_VIDEO_TYPES.includes(contentType) ? contentType : 'video/mp4';
  const fileName = 'header.mp4';

  const { handle } = await uploadResumableMedia({
    appId,
    accessToken,
    fileName,
    mimeType,
    bytes,
  });

  return handle;
}

async function fetchAndUploadHandle(url: string, accessToken: string, appId: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error('Could not fetch the header image URL. Make sure it is publicly reachable.');
  }
  if (!res.ok) {
    throw new Error(`Header image URL returned ${res.status}. It must be publicly reachable.`);
  }

  const contentType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (contentType && !ALLOWED_IMAGE_TYPES.includes(contentType)) {
    throw new Error(`Header image must be JPEG or PNG (got ${contentType}).`);
  }

  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength === 0) {
    throw new Error('Header image is empty.');
  }
  if (bytes.byteLength > IMAGE_MAX_BYTES) {
    throw new Error(
      `Header image is ${(bytes.byteLength / 1024 / 1024).toFixed(1)} MB — Meta's limit is 5 MB.`,
    );
  }

  const mimeType = ALLOWED_IMAGE_TYPES.includes(contentType) ? contentType : 'image/jpeg';
  const fileName = mimeType === 'image/png' ? 'header.png' : 'header.jpg';

  const { handle } = await uploadResumableMedia({
    appId,
    accessToken,
    fileName,
    mimeType,
    bytes,
  });

  return handle;
}

export async function ensureImageHeaderHandle(
  payload: TemplatePayload,
  accessToken: string,
): Promise<void> {
  const getAppId = () => {
    const appId = process.env.META_APP_ID;
    if (!appId) {
      console.warn(
        'META_APP_ID not set – skipping resumable upload. Media handle will be skipped.',
      );
      return null;
    }
    return appId;
  };

  if (payload.header_type === 'CAROUSEL' && payload.cards) {
    const appId = getAppId();
    if (!appId) return;
    for (const card of payload.cards) {
      if (card.header_format === 'IMAGE' && !card.header_handle && card.header_media_url) {
        card.header_handle = await fetchAndUploadHandle(card.header_media_url, accessToken, appId);
      }
    }
    return;
  }

  if (payload.header_type === 'video') {
    if (payload.header_handle) return;
    if (!payload.header_media_url) return;
    const appId = getAppId();
    if (!appId) return;
    payload.header_handle = await fetchAndUploadVideoHandle(payload.header_media_url, accessToken, appId);
    return;
  }

  if (payload.header_type !== 'image') return;
  if (payload.header_handle) return; // already have one
  if (!payload.header_media_url) return; // validator already requires url-or-handle
  const appId = getAppId();
  if (!appId) return;
  payload.header_handle = await fetchAndUploadHandle(payload.header_media_url, accessToken, appId);
}
