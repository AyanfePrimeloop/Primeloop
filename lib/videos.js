// The three onboarding videos on YouTube, plus the second each chapter starts
// and ends at, so a page can play just the part that is relevant.
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
};
