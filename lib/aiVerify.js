import Anthropic from '@anthropic-ai/sdk';
import { buildVerifyPrompt } from './verifyPrompt';
import { wantsIconZoom, iconColumnCrop } from './iconZoom';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Checks a submitted screenshot against what the task actually required.
 *
 * @param {Object} params
 * @param {string} params.imageBase64 - the screenshot, base64-encoded
 * @param {string} params.imageMediaType - e.g. 'image/png' or 'image/jpeg'
 * @param {string} params.action - e.g. 'like', 'comment', 'share', 'follow'
 * @param {string} params.platform - facebook | instagram | tiktok | x | youtube
 * @param {string} params.expectedAccountName - the name the engager registered with
 * @param {string} [params.profileLink] - their registered profile link (its @handle can differ from the display name)
 * @param {string} params.postLink - the post/page the action was supposed to be on
 * @returns {Promise<{verdict: 'approved'|'rejected'|'needs_review', reason: string}>}
 *
 * The instructions themselves live in lib/verifyPrompt.js so they can be
 * tested against real screenshots without calling the app.
 */
export async function verifyScreenshot({
  imageBase64,
  imageMediaType,
  action,
  platform,
  expectedAccountName,
  profileLink,
  postLink,
  specialInstructions,
}) {
  // Small hearts on dark video screens are misread at full size, so for those
  // likes the checker also gets an enlarged crop of the icon column.
  const zoom = wantsIconZoom(action, platform) ? await iconColumnCrop(imageBase64) : null;

  const prompt = buildVerifyPrompt({
    action,
    platform,
    expectedAccountName,
    profileLink,
    postLink,
    specialInstructions,
    hasZoomCrop: !!zoom,
  });

  const content = [{ type: 'image', source: { type: 'base64', media_type: imageMediaType, data: imageBase64 } }];
  if (zoom) content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: zoom } });
  content.push({ type: 'text', text: prompt });

  const response = await anthropic.messages.create({
    // A small, fast model reads a screenshot well and costs a fraction of the
    // big ones. Override with AI_VERIFY_MODEL if checking quality needs a bump.
    model: process.env.AI_VERIFY_MODEL || 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{ role: 'user', content }],
  });

  const textBlock = response.content.find((c) => c.type === 'text');
  try {
    // Models sometimes wrap the JSON in a code fence or add a stray sentence —
    // pull out the first {...} block instead of insisting the whole reply
    // is bare JSON.
    const match = textBlock.text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : textBlock.text.trim());
    if (!['approved', 'rejected', 'needs_review'].includes(parsed.verdict)) {
      return { verdict: 'needs_review', reason: 'AI response was not a recognised verdict.' };
    }
    return { verdict: parsed.verdict, reason: String(parsed.reason || '').slice(0, 300) };
  } catch (e) {
    // If the model didn't return clean JSON, don't guess — send it to a human.
    return { verdict: 'needs_review', reason: 'AI response could not be parsed automatically.' };
  }
}

/**
 * Simple perceptual-style duplicate check: compares a hash of the new
 * screenshot against hashes already stored for this task. A real
 * perceptual hash (e.g. via the 'sharp' + a pHash library) is recommended
 * for production; this file marks exactly where to plug that in.
 */
export function isDuplicateHash(newHash, existingHashes) {
  return existingHashes.includes(newHash);
}
