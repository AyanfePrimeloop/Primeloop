// Instagram, TikTok and X show a like as a small heart in a column of icons at
// the right edge of a dark, busy video. At full-screenshot size the AI
// checker reads a solid red heart as "not filled" about half the time (found
// by reading real submissions). Cropping that column and enlarging it makes
// the heart unmistakable, and costs only a second, small image.
//
// Fails safe: if the image library can't load or anything goes wrong this
// returns null and the check simply runs on the full screenshot as before.

const ZOOM_PLATFORMS = new Set(['instagram', 'tiktok', 'x']);

export function wantsIconZoom(action, platform) {
  return action === 'like' && ZOOM_PLATFORMS.has(platform);
}

export async function iconColumnCrop(imageBase64) {
  try {
    const { default: sharp } = await import('sharp');
    const input = Buffer.from(imageBase64, 'base64');
    const meta = await sharp(input).metadata();
    if (!meta.width || !meta.height) return null;
    const left = Math.round(meta.width * 0.72);
    const top = Math.round(meta.height * 0.25);
    const width = meta.width - left;
    const height = Math.round(meta.height * 0.7);
    const out = await sharp(input)
      .extract({ left, top, width, height })
      .resize({ width: width * 2 })
      .jpeg({ quality: 88 })
      .toBuffer();
    return out.toString('base64');
  } catch (e) {
    return null;
  }
}
