import { screenshotHint } from './screenshotGuide';

// Turns a stored number ("08012345678", "+2348012345678", "8012345678") into
// the digits-only international form WhatsApp links need. Returns null when it
// can't be a real number, so the button is hidden rather than opening a
// broken chat.
export function whatsappDigits(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return null;
  let out = digits;
  if (digits.startsWith('234') && digits.length === 13) out = digits;
  else if (digits.startsWith('0') && digits.length === 11) out = '234' + digits.slice(1);
  else if (digits.length === 10) out = '234' + digits;
  if (out.length < 11 || out.length > 15) return null;
  return out;
}

// The AI's reason is stored with a routing prefix, and for onboarding retries
// past attempt 2 it is a routing note, not a real reason (no AI check ran).
function cleanReason(raw) {
  const r = String(raw || '').replace(/^Sent for a human check:\s*/i, '').trim();
  if (!r || /^Attempt \d+/i.test(r) || /manual review \(AI check off/i.test(r) || /AI check was unavailable/i.test(r)) return '';
  return r;
}

// The message an admin sends to an engager whose proof is waiting for a
// human. It says plainly what the automatic check saw, what to send instead,
// and links to the example for that exact platform and action.
export function buildEngagerMessage({ name, platform, action, taskCode, reason, isOnboarding }) {
  const first = String(name || '').trim().split(/\s+/)[0] || 'there';
  const what = isOnboarding ? `${platform} ${action} test` : `${platform} ${action} task${taskCode ? ` (${taskCode})` : ''}`;
  const why = cleanReason(reason);
  const lines = [
    `Hi ${first}, this is Primeloop.`,
    '',
    `Your proof for the ${what} is waiting for a manual check because our automatic check could not confirm it.`,
  ];
  if (why) lines.push('', `What it saw: ${why}`);
  lines.push(
    '',
    `To get it approved quickly, please send a new screenshot: ${screenshotHint(action)}`,
    '',
    `See an example here: https://primeloop.app/engager/screenshot-guide#${platform}-${action}`,
    '',
    'Thank you!'
  );
  return lines.join('\n');
}

export function whatsappHref(rawNumber, text) {
  const digits = whatsappDigits(rawNumber);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
