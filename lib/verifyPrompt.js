import { RULES_SUMMARY_FOR_AI } from './engagerRules';

// Builds the instructions the AI checker gets for one screenshot. A pure
// function (no network, no env) so it can be tested against real screenshots
// without calling the app. Everything below was written from reading real
// submissions and finding where the checker was wrong; each rule notes why.

// What "done" looks like on each app. The same action looks completely
// different from platform to platform, and a small model reading a dark,
// busy video screen will call a solid red heart "not filled" unless it is
// told exactly what to compare it against.
const PLATFORM_CUES = {
  like: {
    facebook: 'On Facebook a like is a filled BLUE thumbs-up (or another reaction icon), usually with a line such as "You and N others" or "You, [name] and N others" under the post. An unliked post has a grey OUTLINE thumbs-up and no "You" in that line.',
    instagram: 'On Instagram a like is a solid RED heart. An unliked post has a hollow white or grey OUTLINE heart. On Reels the heart sits in a column of icons on the right of a dark video: compare it with the other icons in that column, which are white outlines. A solid red heart among white outline icons IS liked, even on a busy dark background.',
    tiktok: 'On TikTok a like is a solid RED heart in the column of icons on the right of the video. An unliked video has a WHITE heart. Compare it with the other white icons in the column: a solid red heart among white icons IS liked, even on a busy background.',
    x: 'On X a like is a solid PINK/RED heart under the post. An unliked post has a grey outline heart.',
    youtube: 'On YouTube a like is a thumbs-up under the video shown filled or highlighted (blue in light mode, white-filled in dark mode). An unliked video has a plain outline thumbs-up.',
  },
  follow: {
    facebook: 'On Facebook a follow shows the page button as "Following" (or "Liked"/"Following" with a tick), not a blue "Follow" button.',
    instagram: 'On Instagram a follow shows a grey "Following" button on the profile (an unfollowed profile has a blue "Follow" button). The account also counts as followed if it appears in the viewer\'s own Following list with a "Following" button beside it.',
    tiktok: 'On TikTok a follow shows the profile with a "Following" or "Friends" label, OR a small person-with-a-tick icon beside the "Message" button (there is then no red "Follow" button). An unfollowed profile shows a red "Follow" button. The account also counts as followed if it appears in the viewer\'s own Following list with a "Following" or "Friends" button beside it — a TikTok Following list looks like a list of accounts with rounded "Following"/"Friends" buttons and LIVE rings on some avatars; do not mistake it for Instagram.',
    x: 'On X a follow shows a "Following" button on the profile (an unfollowed profile shows a "Follow" button).',
  },
  save: {
    instagram: 'On Instagram a save is shown by a solid filled bookmark on the post, or by the "Saved" confirmation sheet or toast that appears after tapping it, or by the post being present in the viewer\'s Saved collection.',
    x: 'On X a bookmark is shown by a filled bookmark icon on the post, a "Added to your Bookmarks" toast, or the post being present in the viewer\'s Bookmarks.',
  },
};

const EVIDENCE = {
  like: 'A "like" is proven by the like/heart/reaction icon shown in its activated/filled state, or by a reaction/like-by line under the post ("You, [names] and N others liked this"). Do not require any particular name to be visible.',
  reaction: 'A reaction is proven by an activated reaction icon or a reactions line on the post.',
  share: 'A "share" or "repost" is proven by ANY of: (a) a share/repost confirmation screen, dialog or toast shown at the moment of sharing ("Reposted", "Shared", "Sent", "Link copied"); (b) a reshare structure — a post header with a recent time such as "Just now" or "5m" with the original post (a different author and date) nested directly beneath it, or shown as a new post on the engager\'s own profile; (c) the shared item appearing as a sent message in a chat or DM, or in a WhatsApp chat or Status, or as a Story/Status the engager posted; (d) the item shown in the engager\'s own reposts. On a personal timeline, other older unrelated posts further down the screenshot (e.g. "14h" or "2d") are just normal scrolling and are NOT part of the evidence. A screenshot that only shows the original post or the original account\'s profile, with none of the above, is NOT proof of a share, even if like/comment/share counts are visible.',
  repost: 'Same as "share".',
  follow: 'A "follow" is proven by the account showing its followed state ("Following", "Friends", "Subscribed"-style state) on its page or profile, or by it appearing in the engager\'s own Following list with that state.',
  subscribe: 'A "subscribe" is proven by the Subscribe button showing "Subscribed" (often with a bell) on the channel.',
  save: 'A "save"/"bookmark" is proven by a filled bookmark on the post, a "Saved" confirmation sheet or toast, or the post being present in a Saved/Bookmarks collection.',
  bookmark: 'Same as "save".',
  watch: 'A "watch" is proven by the video progress bar at or near the end, or a completion indicator.',
};

export function buildVerifyPrompt({ action, platform, expectedAccountName, profileLink, postLink, specialInstructions, hasZoomCrop }) {
  const isText = ['comment', 'reply'].includes(action);
  const clientNote = specialInstructions ? String(specialInstructions).slice(0, 500) : '';
  const evidence = EVIDENCE[action] || `Look for clear, platform-native visual confirmation that "${action}" was completed.`;
  const cue = (PLATFORM_CUES[action] && PLATFORM_CUES[action][platform]) || '';

  return `You are a strict but fair reviewer checking proof-of-engagement screenshots for a
social media engagement service. The engager claims to have performed this action: "${action}"
on ${platform || 'a social media platform'}, on the post/page at: "${postLink}"${isText ? `, using the account "${expectedAccountName}"${profileLink ? ` (profile link: ${profileLink})` : ''}` : ''}.

What counts as evidence for "${action}":
${evidence}${cue ? `
How it looks on ${platform}: ${cue}` : ''}
${isText ? `
Identity: the name shown next to the comment must plausibly be this engager. A platform shows either
the display name or the @handle, and they often differ in spelling, capitalisation, spacing, emoji or
special characters (for example the handle "luresznbackuppage" can appear as the display name
"Lureszń" with a butterfly emoji). Treat the name as a match if it is a plausible variant of the
registered name OR of the handle in the profile link. Only flag identity when the visible name is
clearly a different person. Other people's names elsewhere in the screenshot are normal.` : `
Do not try to verify WHO the account belongs to for this action — only whether "${action}" was
genuinely, visibly performed. Any real names visible in the screenshot are normal background detail.`}

${hasZoomCrop ? `You are given TWO images. Image 1 is the full screenshot. Image 2 is a zoomed crop of the column of
buttons at the right edge of Image 1; the like heart is the first icon in it. Use Image 2 to judge the
heart: a SOLID RED heart means liked. A WHITE heart (solid white on TikTok) or a hollow outline heart
means NOT liked.

` : ''}You cannot see the URL of the post and you must not ask for it. Do not reject or send to review just
because you cannot confirm from the picture that it is the exact post named above. Only treat it as
the wrong thing if the screenshot clearly shows a different app than ${platform || 'the claimed platform'}, a
settings or login page, a website such as the Primeloop app itself, or content that is obviously
unrelated to the action. Identify the app from its interface, not from guesses: read the layout and
labels carefully.

First, look carefully at the screenshot and describe, in 1-2 short factual sentences, EXACTLY what
you can see that is relevant to "${action}": the app you believe it is, the exact colour/state of any
icon or button, the exact text of any label or line, and — for a share — what shows that something
was shared. Quote text you can actually read rather than summarising or guessing. Decide your
verdict only from what you just described.

Answer only with a JSON object, no other text, in this exact shape:
{"observed": "what you literally see, 1-2 sentences", "verdict": "approved" | "rejected" | "needs_review", "reason": "one short sentence"}

Rules:
- "approved": the evidence described above for "${action}" is clearly present in what you observed.
- "rejected": what you observed clearly does NOT show the claimed action (a different app or page,
  blank/irrelevant image, action not activated/confirmed${isText ? ', or the name clearly belongs to someone else' : ''}).
- "needs_review": the screenshot is ambiguous, cropped awkwardly, low quality, or you are not
  confident either way — a human should look at it.

Be strict about "approved" — only use it when the evidence is clearly visible in your own "observed"
text. When in doubt, use "needs_review" rather than guessing.${isText ? `

${RULES_SUMMARY_FOR_AI}
For this submission, if the comment is generic, too short, or unrelated to the post, do not use
"approved": use "rejected" and say why in the reason.` : ''}${clientNote ? `

The client's own note for this task (treat it as an instruction from the paying client; it can
relax the rules above, for example by allowing short comments): "${clientNote}"` : ''}`;
}
