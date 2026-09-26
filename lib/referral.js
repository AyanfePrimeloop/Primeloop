// One source of truth for the referral programme: the rules, the links, the
// ready-to-post captions and where each graphic's link goes. The dashboard,
// the Refer & earn page and the bonus logic all read from here so they can
// never disagree about what a referral is worth.

export const REFERRAL_BONUS = 200; // naira per referred person who reaches the milestone
export const REFERRAL_MILESTONE = 10; // approved tasks the referred person must complete

const ORIGIN = (process.env.NEXT_PUBLIC_APP_URL || 'https://primeloop.app').replace(/\/$/, '');

// Only letters and digits, so a code can never carry anything into a link.
export function cleanCode(code) {
  const c = String(code || '').trim();
  return /^[A-Za-z0-9]{3,24}$/.test(c) ? c : null;
}

// The short link is what goes on graphics and captions; it redirects to
// /join?ref=CODE (see pages/r/[code].js). The full link is the fallback.
export function referralLinks(code) {
  const c = cleanCode(code);
  if (!c) return null;
  return {
    short: `${ORIGIN}/r/${c}`,
    full: `${ORIGIN}/join?ref=${c}`,
    display: `${ORIGIN.replace(/^https?:\/\//, '')}/r/${c}`,
  };
}

// Where each graphic's link is drawn, measured from the rendered templates in
// public/referral (see the referral-templates build script). `zone` is in the
// template's own pixels: posts put the link at the right of the footer, next
// to the "Join free" button; the story puts it inside the orange button.
export const GRAPHICS = [
  { id: 'E1', file: '/referral/E1-phone-can-pay-you.jpg', label: 'Your phone can pay you', w: 1080, h: 1350, cta: [80, 1171, 288, 109], url: [635, 1202, 365, 48] },
  { id: 'E2', file: '/referral/E2-three-steps.jpg', label: 'Paid in 3 steps', w: 1080, h: 1350, cta: [80, 1184, 281, 96], url: [635, 1208, 365, 48] },
  { id: 'E3', file: '/referral/E3-friday-payday.jpg', label: 'It is Friday', w: 1080, h: 1350, cta: [80, 1184, 257, 96], url: [635, 1208, 365, 48] },
  { id: 'E4', file: '/referral/E4-rules-that-keep-you-paid.jpg', label: '4 rules that keep you paid', w: 1080, h: 1350, cta: [80, 1184, 257, 96], url: [635, 1208, 365, 48] },
  { id: 'E5', file: '/referral/E5-no-follower-minimum.jpg', label: 'No follower minimum', w: 1080, h: 1350, cta: [80, 1184, 257, 96], url: [635, 1208, 365, 48] },
  { id: 'E6', file: '/referral/E6-do-it-on-your-phone.jpg', label: 'Scroll less. Earn more.', w: 1080, h: 1350, cta: [80, 1184, 257, 96], url: [635, 1208, 365, 48] },
  { id: 'E7', file: '/referral/E7-story-earn.jpg', label: 'Story: Get paid to do simple tasks', w: 1080, h: 1920, story: true, cta: [80, 1640, 920, 109], url: null },
];

// Where the link text goes for a graphic: its centre line, and the widest it
// may be (posts share the footer with the button, so the link must fit the
// gap; the story has the whole pill).
export function linkPlacement(g) {
  if (g.story) {
    const [x, y, w, h] = g.cta;
    return { align: 'center', x: x + w / 2, y: y + h / 2, maxWidth: w - 80, color: '#141a33', size: 44 };
  }
  const [cx, , cw] = g.cta;
  const [ux, uy, uw, uh] = g.url;
  const right = ux + uw; // the footer's right edge (x=1000)
  return { align: 'right', x: right, y: uy + uh / 2, maxWidth: right - (cx + cw) - 30, color: '#ffffff', size: 40 };
}

// Ready-to-post captions. They describe the platform, not the sender, so they
// are true for someone on their first day too, and they never promise income:
// an engager who has been paid can add their own honest line. Each includes the
// link and a plain note that the sender earns a bonus, which is the honest way
// to promote a referral link.
export function captions(link) {
  const disclose = 'I earn a small bonus when people I refer start doing tasks.';
  return [
    {
      id: 'whatsapp-status',
      label: 'WhatsApp Status',
      hint: 'Post one of the graphics, and paste this as the caption.',
      text: `📱 Your phone can pay you.\n\nPrimeloop pays people to do simple social media tasks (like, comment, follow). Payouts go out every Friday, straight to your bank or Opay. Free to join, no follower minimum.\n\nJoin with my link: ${link}\n\n(${disclose})`,
    },
    {
      id: 'whatsapp-message',
      label: 'WhatsApp message to one person',
      hint: 'For friends who ask "how does it work?". Change the first line to their name.',
      text: `Hi! You asked about ways to earn from your phone. Primeloop pays people for simple social media tasks like liking, commenting and following, with payouts every Friday. It's free to join and there's no follower minimum.\n\nHere is my link if you want to try it: ${link}\n\nOnce you join, read the "Screenshot guide" in your dashboard before your first task. It saves a lot of time. (${disclose})`,
    },
    {
      id: 'facebook',
      label: 'Facebook post',
      hint: 'Post it with a graphic on your profile, or in groups where promotions are allowed.',
      text: `Looking for a way to earn from your phone? 📱\n\nPrimeloop pays people for doing simple tasks on social media: liking, commenting, following. Payouts every Friday to your bank or Opay. It's free to join and there's no follower minimum.\n\nJoin here: ${link}\n\n${disclose}\n\n#Primeloop #EarnOnline #NigeriaSideHustle`,
    },
    {
      id: 'instagram',
      label: 'Instagram caption',
      hint: 'Instagram captions are not clickable, so also put the link in your bio (or a link sticker in a Story).',
      text: `Your phone can pay you. 📱\n\nSimple social media tasks, paid every Friday. Free to join, no follower minimum.\n\nLink in my bio 👆 (${disclose})\n\n#Primeloop #EarnOnline #NigeriaSideHustle`,
    },
    {
      id: 'tiktok',
      label: 'TikTok caption',
      hint: 'Put the link in your TikTok bio. Say "link in bio" in the video and caption.',
      text: `How people in Nigeria are earning from their phones 👇\nSimple tasks, paid every Friday. Free to join. Link in my bio. (${disclose}) #Primeloop #EarnOnline #NigeriaSideHustle`,
    },
    {
      id: 'x',
      label: 'X (Twitter) post',
      hint: 'Under 280 characters, link included.',
      text: `Primeloop pays people for simple social media tasks. Payouts every Friday, free to join, no follower minimum. Join with my link: ${link} (I earn a bonus if you start doing tasks)`,
    },
    {
      id: 'bio',
      label: 'Bio line',
      hint: 'For your Instagram, TikTok or X bio.',
      text: `Earn from your phone 👉 ${link}`,
    },
  ];
}

// Share-sheet links that open the app with the message ready.
export function shareLinks(link, text) {
  const t = encodeURIComponent(text);
  const u = encodeURIComponent(link);
  return {
    whatsapp: `https://wa.me/?text=${t}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text.slice(0, 250))}`,
    telegram: `https://t.me/share/url?url=${u}&text=${t}`,
  };
}
