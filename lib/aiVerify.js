import Anthropic from '@anthropic-ai/sdk';
import { RULES_SUMMARY_FOR_AI } from './engagerRules';

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
  specialInstructions,
}) {
  const isText = ['comment', 'reply'].includes(action);
  const clientNote = specialInstructions ? String(specialInstructions).slice(0, 500) : '';

  // Only comment/reply naturally show the author's name next to their own
  // text in a single screenshot. For every other action, matching an exact
  // name is not just unavailable but a genuinely hard task even for the
  // model to reason about correctly: a real screenshot of a popular post
  // often has several OTHER real people's names visible too (other likers,
  // other commenters — on Primeloop specifically, other engagers who did
  // their own separate tasks on the same post), and trying to bind "this is
  // the same account as the one logged in" against that noise produced
  // inconsistent, sometimes contradictory verdicts on the exact same real
  // screenshot in testing. So identity is not checked by name at all for
  // these actions — only that the action itself is genuinely, visibly done
  // on the correct post. This matches what already happens downstream: the
  // account was already confirmed to belong to this engager during platform
  // verification (see engager_platform_accounts), a screenshot can only be
  // used once (duplicate-hash check), and an engager can only submit once
  // per task — the identity and reuse questions are handled elsewhere, so
  // this check's only job is: was the action really done, on the right post.
  const evidenceByAction = {
    like: `A "like" is proven by the like/heart/reaction icon shown in its activated/filled state on the correct post (e.g. a filled-in blue thumbs-up, a red heart), or by a reaction/like-by line under the post ("You, [names] and N others liked this", "You and N others liked this"). Do not require any particular name to be visible — the presence of other real people's names elsewhere in the screenshot (other likers, other commenters) is completely normal on a real post and is not a reason to reject or ask for review.`,
    reaction: `Same as "like" — an activated reaction icon, or a reactions line, on the correct post.`,
    share: `A "share" or "repost" is proven by EITHER (a) a share/repost confirmation screen or dialog shown at the moment of sharing, OR (b) the post appearing freshly at or near the top of a personal profile or timeline view, with a recent time like "Just now" or a few minutes ago, and the original post (its author, e.g. a business page) shown embedded underneath. A screenshot that only shows the ORIGINAL post's own feed, with no confirmation and no such reshare structure, is NOT proof of a share, even if like/comment/share counts are visible in the same shot — those counts do not prove anyone shared it. Do not require a name match here either.`,
    repost: `Same as "share" above.`,
    follow: `A "follow" is proven by the Follow button showing its followed/active state (e.g. "Following") on the correct page or profile.`,
    subscribe: `A "subscribe" is proven by the Subscribe button showing its subscribed/active state on the correct channel.`,
    save: `A "save"/"bookmark" is proven by the post appearing inside a Saved/Bookmarks collection, or the save icon shown in its activated state on the correct post.`,
    bookmark: `Same as "save" above.`,
    watch: `A "watch" is proven by the video's progress bar shown at or near the end, or a completion indicator, on the correct video.`,
  };
  const evidence = evidenceByAction[action] || `Look for clear, platform-native visual confirmation that "${action}" was completed on the correct post/page.`;

  const prompt = `You are a strict but fair reviewer checking proof-of-engagement screenshots for a
social media engagement service. The engager claims to have performed this action: "${action}"
on this post/page: "${postLink}"${isText ? `, using the account name: "${expectedAccountName}"` : ''}.

What counts as evidence for "${action}":
${evidence}
${isText ? `
Identity: the account name must roughly match "${expectedAccountName}". Other real names also
visible in the screenshot (other commenters, other likers) are completely normal on a real post and
do not disqualify the submission by themselves — only judge identity from the name directly attached
to the engager's own comment text.` : `
Do not try to verify WHO the account belongs to for this action — only whether "${action}" was
genuinely, visibly performed on the correct post/page. Any real names visible in the screenshot
(likers, commenters, page owners) are normal background detail, not something to match or rule out.`}

Look at the screenshot and answer only with a JSON object, no other text, in this exact shape:
{"verdict": "approved" | "rejected" | "needs_review", "reason": "one short sentence"}

Rules:
- "approved": the evidence described above for "${action}" is clearly visible, on the correct
  post/page.
- "rejected": the screenshot clearly does NOT show the claimed action (wrong post, blank/irrelevant
  image, action not activated/confirmed by the evidence above${isText ? ', or the account name clearly does not match' : ''}).
- "needs_review": the screenshot is ambiguous, cropped awkwardly, low quality, or you are not
  confident either way — a human should look at it.

Be strict about "approved" — only use it when the evidence above is clearly visible. When in doubt, use
"needs_review" rather than guessing.${isText ? `

${RULES_SUMMARY_FOR_AI}
For this submission, if the comment is generic, too short, or unrelated to the post, do not use
"approved": use "rejected" and say why in the reason.` : ''}${clientNote ? `

The client's own note for this task (treat it as an instruction from the paying client; it can
relax the rules above, for example by allowing short comments): "${clientNote}"` : ''}`;

  const response = await anthropic.messages.create({
    // A small, fast model reads a screenshot well and costs a fraction of the
    // big ones. Override with AI_VERIFY_MODEL if checking quality needs a bump.
    model: process.env.AI_VERIFY_MODEL || 'claude-haiku-4-5-20251001',
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
