// The engagement quality rules. One source of truth: the Terms page, the
// engager dashboard, onboarding, the admin review reminder and the AI checker
// all read from here, so they can never disagree.
//
// Quality is what Primeloop sells. Rules that only a person can honour (watch
// to the end, never unfollow) are enforced by review, spot checks and the
// consequences below; the AI checks what a screenshot can show.

export const MIN_COMMENT_WORDS = 4;

export const ENGAGER_RULES = [
  {
    title: 'Real and by hand',
    body: 'Every like, comment, share and follow is done by you, from your own account. No bots, no AI-written text, no copy-and-paste.',
  },
  {
    title: 'Comments must speak about the post',
    body: `Write about what is actually in this post. Generic lines such as "this is awesome" or "I love this post" are not accepted, because they could go under any post.`,
  },
  {
    title: `At least ${MIN_COMMENT_WORDS} words`,
    body: `Every comment must be ${MIN_COMMENT_WORDS} words or more. One, two or three word comments are only allowed when the client's note on the task says so.`,
  },
  {
    title: 'Watch videos to the end',
    body: 'For a video, watch all of it before you comment, and make your comment relate to what it says.',
  },
  {
    title: 'Never unfollow or unsubscribe after you are paid',
    body: 'A follow or subscribe must stay in place. Removing it after payment forfeits the payment and can lead to removal from Primeloop.',
  },
];

export const RULES_SUMMARY_FOR_AI = `Quality rules that apply to every submission:
- Comments and replies must be genuine and specific to the post. Generic praise that could sit under any post ("this is awesome", "love this", "nice one", "great post", emoji-only or one-line filler) is NOT acceptable.
- A comment must be at least ${MIN_COMMENT_WORDS} words long, unless the client's note (given below, if any) explicitly allows shorter comments.
- If the post's caption, image or video is visible, the comment must relate to it. If it is not visible, judge only that the comment is specific (mentions concrete details) and not generic filler.
- Text that looks copy-pasted, templated or written by a bot is not acceptable.`;
