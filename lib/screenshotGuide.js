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
  like: 'Include the "Liked by" / reactions line under the post in the shot, not just the heart or thumbs-up icon. On Facebook and Instagram this is the line that says "You, [names] and N others" — the word "You" is what proves it was your account.',
  reaction: 'Include the reactions line under the post, not just the icon.',
  comment: `Your comment must be visible with your name next to it, ${'4'}+ words, and about what's actually in the post — not generic praise.`,
  reply: 'Your reply must be visible with your name next to it, and specific to what you are replying to.',
  share: "Don't screenshot the original post by itself — that never proves you shared it. After sharing, open your own profile or timeline and screenshot the post appearing there (your name at the top, \"Just now\"), or screenshot the share confirmation screen at the moment you tap Share.",
  repost: "Don't screenshot the original post by itself. After reposting, screenshot it appearing on your own profile, with your name and a recent time on it.",
  follow: 'Screenshot the Follow button showing "Following" (already tapped), on the correct page or profile.',
  subscribe: 'Screenshot the Subscribe button showing "Subscribed" (already tapped), on the correct channel.',
  save: 'Screenshot the post inside your own Saved collection, or the save icon shown activated on the correct post.',
  bookmark: 'Screenshot the post inside your own Bookmarks, or the bookmark icon shown activated on the correct post.',
  watch: "Screenshot the video's progress bar near the end, or a \"watched\" indicator, on the correct video.",
};

export function screenshotHint(action) {
  return SCREENSHOT_GUIDE[action] || 'Make sure the action and the correct post are both clearly visible in the same screenshot.';
}
