import { supabaseAdmin } from './supabaseAdmin';

const BUCKET = 'submission-screenshots';

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
  const ext = mediaType === 'image/png' ? 'png' : 'jpg';
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
