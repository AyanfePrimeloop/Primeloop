import { supabaseAdmin } from './supabaseAdmin';

const BUCKET = 'submission-screenshots';

// Server-side limits — never trust the client's own compression step, since
// this API can be called directly (bypassing the browser entirely) by
// anyone who inspects the network requests. This is the real enforcement
// point, not the frontend's compressImage.js.
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB, generous headroom above what compressImage.js produces
const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateScreenshotUpload({ base64, mediaType }) {
  if (!base64 || typeof base64 !== 'string') {
    return { ok: false, reason: 'No image data received.' };
  }
  if (!ALLOWED_MEDIA_TYPES.includes(mediaType)) {
    return { ok: false, reason: 'Only JPEG, PNG, or WebP images are accepted.' };
  }
  // Base64 is ~4/3 the size of the raw bytes — this estimate is generous
  // enough to catch anything wildly over the limit without needing to
  // actually decode the whole payload first.
  const approxBytes = (base64.length * 3) / 4;
  if (approxBytes > MAX_UPLOAD_BYTES) {
    return { ok: false, reason: 'Image is too large.' };
  }
  return { ok: true };
}

/**
 * Uploads a base64-encoded screenshot to Supabase Storage and returns a
 * public URL. Call this once per submission, right before inserting the
 * submissions/onboarding_submissions row, and store the returned URL.
 *
 * One-time setup required in Supabase: Storage > New bucket > name it
 * "submission-screenshots" > make it Public (screenshots aren't sensitive
 * and this keeps retrieval simple for the admin review queue).
 */
export async function uploadScreenshot({ base64, mediaType, pathPrefix }) {
  const ext = mediaType === 'image/png' ? 'png' : mediaType === 'image/webp' ? 'webp' : 'jpg';
  const path = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(base64, 'base64');

  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, buffer, {
    contentType: mediaType,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
