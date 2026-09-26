import { platformLabel } from './platformDomains';
import { whatsappDigits } from './whatsappLink';

const PLURALS = { reply: 'replies', watch: 'views' };
function lineText(action, qty) {
  const noun = action === 'watch' ? 'view' : action;
  return qty === 1 ? `1 ${noun}` : `${qty} ${PLURALS[action] || noun + 's'}`;
}

// "40 likes, 1 comment" for a list of { action, quantity }
export function linesText(lines) {
  return lines.map((l) => lineText(l.action, l.quantity)).join(', ');
}

const naira = (n) => '₦' + Math.round(Number(n) || 0).toLocaleString('en-NG');
const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || 'there';

// What the admin sends the client so they can pay for the order.
export function paymentMessage({ name, platform, lines, total, url }) {
  const what = lines.map((l) => lineText(l.action, l.quantity)).join(', ');
  return [
    `Hi ${firstName(name)}, this is Primeloop.`,
    '',
    `Here is your ${platformLabel(platform)} order: ${what}. Total: ${naira(total)}.`,
    '',
    `Pay securely here (card, transfer or USSD): ${url}`,
    '',
    'As soon as the payment is confirmed, real people start on it, and you can watch it live on your dashboard. Thank you!',
  ].join('\n');
}

// What the admin sends once an order paid another way has been started.
export function startedMessage({ name, platform, lines, total }) {
  const what = lines.map((l) => lineText(l.action, l.quantity)).join(', ');
  return [
    `Hi ${firstName(name)}, this is Primeloop.`,
    '',
    `We have received your payment of ${naira(total)} and started your ${platformLabel(platform)} order: ${what}.`,
    '',
    'You can watch it live: log in with this email at https://primeloop.app/client-login (we send a one-click link, there is no password). Thank you!',
  ].join('\n');
}

export function whatsappHrefFor(number, text) {
  const digits = whatsappDigits(number);
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : null;
}
