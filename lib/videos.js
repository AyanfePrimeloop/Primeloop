// The onboarding videos, plus the second each chapter starts and ends at, so a
// page can play just the part that is relevant. Those with an `id` are on
// YouTube; those with a `file` are hosted on this site (public/videos) and play
// in the page with no third party. To move one to YouTube later, replace `file`
// and `poster` with an `id` and nothing else changes.
export const VIDEOS = {
  engager: {
    id: 'bSW6RqrBVIo',
    title: 'How to earn on Primeloop',
    chapters: {
      verify: { start: 56, end: 81, title: 'Verify a platform' },
      task: { start: 81, end: 127, title: 'Find a task and submit proof' },
      rules: { start: 127, end: 159, title: 'The quality rules' },
      payday: { start: 159, end: 180, title: 'Get paid every Friday' },
    },
  },
  client: {
    id: '84Llb6CG1xU',
    title: 'How to buy engagement on Primeloop',
    chapters: {
      order: { start: 51, end: 102, title: 'Build and pay for your order' },
      track: { start: 119, end: 151, title: 'Track your order live' },
      refunds: { start: 151, end: 171, title: 'Refunds and support' },
    },
  },
  admin: {
    id: 'bYUauVOY5FI',
    title: 'Admin walkthrough',
    chapters: {
      review: { start: 68, end: 97, title: 'Review queue' },
      verification: { start: 133, end: 164, title: 'Verification' },
      payouts: { start: 217, end: 242, title: 'Friday payouts' },
      trouble: { start: 242, end: 265, title: 'When things go wrong' },
    },
  },
  // ---- newest features (a video shows only where it has an id, or a file) ----
  referral: {
    id: 'NEWIcMWiPmI',
    title: 'Earn more with referrals',
    chapters: {
      link: { start: 10.9, end: 32, title: 'Find and share your link' },
      results: { start: 53.4, end: 77.2, title: 'Track your results' },
      graphics: { start: 77.2, end: 97.6, title: 'Graphics with your link on them' },
      post: { start: 119.7, end: 138.6, title: 'Where and how to post' },
    },
  },
  adminTools: {
    id: '-DRykacjAqs',
    title: 'New admin tools',
    chapters: {
      order: { start: 11.8, end: 104.7, title: 'Place an order for a client' },
      review: { start: 104.7, end: 126.2, title: 'Message an engager on WhatsApp' },
      broadcast: { start: 126.2, end: 174.1, title: 'Broadcast to everyone' },
      totals: { start: 174.1, end: 189, title: 'Totals at a glance' },
    },
  },
  teamOrder: {
    id: 'pU32NZOrW5c',
    title: 'When our team places your order',
    chapters: {
      pay: { start: 29.4, end: 62, title: 'Your payment link' },
      track: { start: 62, end: 84.9, title: 'Follow your order live' },
    },
  },
};

// True when a video has somewhere to play from. Pages hide their video block until then.
export function hasVideo(key) {
  const v = VIDEOS[key];
  return !!(v && (v.id || v.file));
}
