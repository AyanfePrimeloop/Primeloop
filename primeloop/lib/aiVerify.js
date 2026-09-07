import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Checks a submitted screenshot against what the task actually required.
 *
 * @param {Object} params
 * @param {string} params.imageBase64 - the screenshot, base64-encoded
 * @param {string} params.imageMediaType - e.g. 'image/png' or 'image/jpeg'
 * @param {string} params.action - e.g. 'like', 'comment', 'share', 'follow'
 * @param {string} params.expectedAccountName - the name the engager registered with
 * @param {string} params.postLink - the post/page the action was supposed to be on
 * @returns {Promise<{verdict: 'approved'|'rejected'|'needs_review', reason: string}>}
 */
export async function verifyScreenshot({
  imageBase64,
  imageMediaType,
  action,
  expectedAccountName,
  postLink,
}) {
  const prompt = `You are a strict but fair reviewer checking proof-of-engagement screenshots for a
social media engagement service. The engager claims to have performed this action: "${action}"
on this post/page: "${postLink}", using the account name: "${expectedAccountName}".

Look at the screenshot and answer only with a JSON object, no other text, in this exact shape:
{"verdict": "approved" | "rejected" | "needs_review", "reason": "one short sentence"}

Rules:
- "approved": the screenshot clearly shows the claimed action was completed (e.g. the like/heart
  icon is in its "activated" state, a comment is visible and readable, a share confirmation is shown,
  or a "following" button state is visible), AND the account name visible roughly matches
  "${expectedAccountName}".
- "rejected": the screenshot clearly does NOT show the claimed action (wrong post, blank/irrelevant
  image, action not activated, or account name clearly does not match).
- "needs_review": the screenshot is ambiguous, cropped awkwardly, low quality, or you are not
  confident either way — a human should look at it.

Be strict about "approved" — only use it when the evidence is clearly visible. When in doubt, use
"needs_review" rather than guessing.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: imageMediaType, data: imageBase64 },
          },
          { type: 'text', text: prompt },
        ],
      },
    ],
  });

  const textBlock = response.content.find((c) => c.type === 'text');
  try {
    const parsed = JSON.parse(textBlock.text.trim());
    return parsed;
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
