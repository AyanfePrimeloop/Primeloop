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
  // text in a single screenshot. For every other action, the platform shows
  // WHO did it in a different place (a "liked by" line, the page header of
  // whichever profile is on screen, a saved collection that is only ever
  // yours) — or, for some actions on some platforms (a YouTube like, for
  // example), nowhere at all. Demanding a spelled-out name match for those
  // caused real, correctly-performed submissions to be sent to human review
  // for no reason, so it is only required where it is actually shown.
  const evidenceByAction = {
    like: `A "like" is proven by the reaction/like-by line under the post (e.g. "You, [names] and N others liked this"), or the like/heart icon shown in its activated/filled state together with that line if present. The single most reliable signal is the word "You" appearing in that liked-by line — only the account that is actually logged in on that screen can ever be shown as "You" there. If "You" appears in the liked-by line, that is by itself enough — you do not additionally need to see the engager's name spelled out anywhere. Some platforms (e.g. YouTube) show no liked-by line at all — on those, the icon's activated state on the correct post is enough by itself.`,
    reaction: `Same as "like" — look for the reaction line under the post ("You reacted", "You and N others").`,
    share: `A "share" or "repost" is proven by EITHER (a) a share/repost confirmation screen or dialog shown at the moment of sharing, OR (b) the post appearing freshly at the top of the engager's OWN profile or timeline — recognisable because their own name or photo is the page header or the post's author line, with a recent time like "Just now" or a few minutes ago, and the original post (its author, e.g. a business page) shown embedded underneath. A screenshot that only shows someone viewing or scrolling the ORIGINAL post — on the original page's own feed, or on a stranger's or a different person's profile — is NOT proof of a share, even if like/comment/share counts are visible in the same shot; those counts do not show that THIS engager shared it.`,
    repost: `Same as "share" above.`,
    follow: `A "follow" is proven by the Follow button showing its followed/active state (e.g. "Following") on the correct page or profile. Whoever's profile is being viewed is normally the page being followed, not the engager, so their own name is not expected to appear here.`,
    subscribe: `A "subscribe" is proven by the Subscribe button showing its subscribed/active state on the correct channel. The engager's own name is not expected to appear here.`,
    save: `A "save"/"bookmark" is proven by the post appearing inside the engager's own Saved/Bookmarks collection (which only they can ever see), or the save icon shown in its activated state on the correct post.`,
    bookmark: `Same as "save" above.`,
    watch: `A "watch" is proven by the video's progress bar shown at or near the end, or a completion indicator, on the correct video.`,
  };
  const evidence = evidenceByAction[action] || `Look for clear, platform-native visual confirmation that "${action}" was completed on the correct post/page.`;

  const prompt = `You are a strict but fair reviewer checking proof-of-engagement screenshots for a
social media engagement service. The engager claims to have performed this action: "${action}"
on this post/page: "${postLink}", using the account name: "${expectedAccountName}".

What counts as evidence for "${action}":
${evidence}

Important reading rules:
- Only judge WHO performed the action from the liked-by/reactions line (for like/share), the page
  header of whichever profile/timeline is on screen (for share/follow/subscribe), or the name
  directly attached to the engager's own comment text (for comment/reply).
- Never attribute the action to a name that only appears somewhere ELSE in the screenshot, such as
  a different person's comment further down the page — other names visible in a screenshot (other
  commenters, other likers) are completely normal on a real post and do not disqualify the
  submission by themselves.
${isText ? `- For this action the account name must roughly match "${expectedAccountName}".` : `- A spelled-out name match is NOT required for this action: the word "You" in a liked-by/reactions line, or the engager's own profile/timeline being the one shown on screen, is itself sufficient identity proof. Only treat this as a mismatch if a DIFFERENT, specific name is clearly shown as the one who performed the action instead.`}

Look at the screenshot and answer only with a JSON object, no other text, in this exact shape:
{"verdict": "approved" | "rejected" | "needs_review", "reason": "one short sentence"}

Rules:
- "approved": the evidence described above for "${action}" is clearly visible, on the correct
  post/page.
- "rejected": the screenshot clearly does NOT show the claimed action (wrong post, blank/irrelevant
  image, action not activated/confirmed by the evidence above, or a different, specific account is
  clearly shown performing it instead).
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
