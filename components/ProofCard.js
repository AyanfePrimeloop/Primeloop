import { timeAgo, isFresh } from '../lib/timeAgo';
import { Check } from './SiteIcons';
import { platformLabel } from '../lib/platformDomains';

// Live rows from the real database, or one clearly-labelled example while
// there is nothing real to show. Never invented numbers presented as real.
export default function ProofCard({ kind, rows, exampleText, exampleWhen }) {
  const live = rows.length > 0 && isFresh(rows[0].at);
  const title = kind === 'payouts' ? (live ? 'Live payouts' : rows.length ? 'Latest payouts' : 'Recent payouts') : (live ? 'Live verification' : rows.length ? 'Latest verification' : 'Recent verification');
  return (
    <div className={`s-proof${live ? '' : ' is-stale'}`} aria-label={title}>
      <div className="s-proof-head"><span className="s-dot" />{title}</div>
      {rows.length === 0 && (
        <div className="s-proof-row is-example">
          <span className="what"><Check size={14} color="var(--ink-mute)" /><span>Example: {exampleText}</span></span>
          <time>{exampleWhen}</time>
        </div>
      )}
      {rows.map((r, i) => (
        <div className="s-proof-row" key={i}>
          <span className="what">
            <Check size={14} color="var(--good)" />
            {kind === 'payouts' ? (
              <span><b className="s-num">₦{r.amount.toLocaleString()}</b> paid to {r.name}</span>
            ) : (
              <span><b>{platformLabel(r.platform)} {r.action}</b> verified</span>
            )}
          </span>
          <time>{timeAgo(r.at)}</time>
        </div>
      ))}
    </div>
  );
}
