// What to actually capture in a proof screenshot, per action. One source of
// truth: the engager dashboard, the onboarding test page, and the AI checker
// prompt (lib/aiVerify.js) all agree with this, so what we tell engagers to
// do is exactly what gets them approved.
//
// Why this exists: a screenshot of an activated like/share icon on its own
// rarely proves WHO did it — the platform shows that separately (a "liked by"
// line, or your own profile/timeline). Cropping that part out is the single
// biggest cause of a submission going to review instead of being approved
// on the spot.
export const SCREENSHOT_GUIDE = {
  like: 'Make sure the like/heart icon is clearly filled in (activated), with the like count visible, on the right post.',
  reaction: 'Make sure the reaction icon is clearly filled in (activated), on the right post.',
  comment: `Your comment must be visible with your name next to it, ${'4'}+ words, and about what's actually in the post — not generic praise.`,
  reply: 'Your reply must be visible with your name next to it, and specific to what you are replying to.',
  share: "Don't screenshot the original post by itself — that never proves you shared it. After sharing, open your own profile or timeline and screenshot the post appearing there (your name at the top, \"Just now\"). Keep the shot tight around just that — don't scroll down far enough to show your other, older posts underneath, it can make the review harder to read.",
  repost: "Don't screenshot the original post by itself. After reposting, screenshot it appearing on your own profile, with your name and a recent time on it. Keep the shot tight around just that — don't scroll down to show your other, older posts underneath.",
  follow: 'Screenshot the Follow button showing "Following" (already tapped), on the correct page or profile.',
  subscribe: 'Screenshot the Subscribe button showing "Subscribed" (already tapped), on the correct channel.',
  save: 'Screenshot the post inside your own Saved collection, or the save icon shown activated on the correct post.',
  bookmark: 'Screenshot the post inside your own Bookmarks, or the bookmark icon shown activated on the correct post.',
  watch: "Screenshot the video's progress bar near the end, or a \"watched\" indicator, on the correct video.",
};

export function screenshotHint(action) {
  return SCREENSHOT_GUIDE[action] || 'Make sure the action and the correct post are both clearly visible in the same screenshot.';
}

// Full per-platform guide for the /engager/screenshot-guide page: which
// actions exist on each platform (matches pricing_rules/verification_settings),
// how to actually get the proof on that specific app, and which small
// illustration (see components/ScreenshotMock.js) to show next to it.
// Platform display names come from lib/platformDomains.js — one source of truth.
export const PLATFORM_GUIDE = {
  facebook: [
    { action: 'like', mock: 'like', how: 'Tap the like icon on the post. The reaction line under the post fills in automatically — screenshot the post with that line visible.' },
    { action: 'comment', mock: 'comment-good', how: 'Type a real comment about the post — 4+ words, something only someone who actually read it would say — then screenshot it once posted.' },
    { action: 'follow', mock: 'follow', how: 'Tap Follow on the page, then screenshot the button once it changes to "Following".' },
    { action: 'share', mock: 'share', how: 'Tap Share. Then go to your own profile/timeline and screenshot the post appearing there, kept tight (not scrolled down to your older posts) — not the original post itself.' },
  ],
  instagram: [
    { action: 'like', mock: 'like', how: 'Double-tap the photo or tap the heart until it fills red, then screenshot with the likes count visible.' },
    { action: 'comment', mock: 'comment-good', how: 'Type a real comment about the post — 4+ words — then screenshot it once posted, with your username next to it.' },
    { action: 'follow', mock: 'follow', how: 'Tap Follow on the profile, then screenshot the button once it changes to "Following".' },
    { action: 'save', mock: 'save', how: 'Tap the bookmark/ribbon icon on the post until it fills in, then screenshot it — or open your Saved collection and screenshot the post there.' },
    { action: 'share', mock: 'share', how: 'Share it to your Story, or repost to your grid — then screenshot it there, kept tight and not scrolled past it, not the original post.' },
  ],
  tiktok: [
    { action: 'like', mock: 'like', how: 'Tap the heart on the right side of the video until it turns red, then screenshot with the count visible.' },
    { action: 'comment', mock: 'comment-good', how: 'Type a real comment about the video — 4+ words — then screenshot it once posted, with your username next to it.' },
    { action: 'follow', mock: 'follow', how: 'Tap Follow on the profile, then screenshot the button once it changes to "Following".' },
    { action: 'share', mock: 'share', how: 'Tap Share → Repost, then screenshot it appearing on your own profile, kept tight — not the original video.' },
    { action: 'watch', mock: 'watch', how: 'Watch the whole video, then screenshot near the end with the progress bar almost full.' },
  ],
  x: [
    { action: 'like', mock: 'like', how: 'Tap the heart under the post until it fills in, then screenshot with the like count visible.' },
    { action: 'follow', mock: 'follow', how: 'Tap Follow on the profile, then screenshot the button once it changes to "Following".' },
    { action: 'reply', mock: 'comment-good', how: 'Reply with something real about the post — 4+ words — then screenshot it once posted, with your handle next to it.' },
    { action: 'repost', mock: 'share', how: 'Tap Repost and confirm it, then screenshot it appearing on your own profile/timeline, kept tight — not the original post.' },
    { action: 'bookmark', mock: 'save', how: 'Tap the bookmark icon on the post until it fills in, then screenshot it — or open your Bookmarks and screenshot the post there.' },
  ],
  youtube: [
    { action: 'like', mock: 'like', how: 'Tap the thumbs-up under the video until it turns blue, then screenshot it.' },
    { action: 'comment', mock: 'comment-good', how: 'Type a real comment about the video — 4+ words — then screenshot it once posted, with your channel name next to it.' },
    { action: 'subscribe', mock: 'follow', how: 'Tap Subscribe on the channel, then screenshot the button once it changes to "Subscribed".' },
    { action: 'watch', mock: 'watch', how: 'Watch the whole video, then screenshot near the end with the progress bar almost full.' },
  ],
};
