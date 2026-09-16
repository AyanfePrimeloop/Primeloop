// Short "time ago" labels for the live-activity tickers — deliberately
// coarse (no seconds precision beyond "just now") since these are public
// marketing widgets, not a precision timestamp display.
export function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Whether a timestamp is fresh enough to justify a pulsing "LIVE" indicator.
// Past this window the widget should read as "recent", not "live" — an old
// timestamp next to a pulsing dot looks like a fake activity feed.
export function isFresh(isoString, withinMs = 2 * 60 * 60 * 1000) {
  return Date.now() - new Date(isoString).getTime() < withinMs;
}
