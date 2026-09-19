// Builds the text an admin pastes into the Primeloop WhatsApp Channel.
// WhatsApp Channels can't be posted to by the app, so the admin page gives a
// one-click "copy and open the Channel" instead. Plain text on purpose: the
// Channel shows it exactly as written.
import { platformLabel } from './platformDomains';

const SITE = 'https://primeloop.app';

function line(t) {
  const left = Math.max(0, (t.quantity_needed || 0) - (t.quantity_filled || 0));
  const action = `${t.action}${left > 1 ? 's' : ''}`;
  return `• ${platformLabel(t.platform)}: ${left} ${action} at ₦${t.price_per_unit} each (${t.task_code})`;
}

/** Digest of open tasks that still need engagements. */
export function buildChannelPost(tasks) {
  const open = (tasks || []).filter((t) => t.status === 'open' && t.quantity_needed > (t.quantity_filled || 0));
  if (!open.length) return '';
  const shown = open.slice(0, 12);
  const more = open.length - shown.length;
  return [
    `New tasks are open on Primeloop (${open.length}):`,
    '',
    ...shown.map(line),
    more > 0 ? `…and ${more} more.` : null,
    '',
    `Claim yours: ${SITE}/engager/dashboard`,
  ]
    .filter((l) => l !== null)
    .join('\n');
}
