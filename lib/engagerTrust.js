// Decides whether an engager has earned enough trust to have most of their
// proof approved automatically (with random spot-checks) instead of every
// screenshot being checked. Built from real review history, so it cannot be
// gamed by just signing up.
//
// Trusted means all of:
//   - at least TRUST_MIN_APPROVED approved submissions (default 20),
//   - rejected submissions are at most TRUST_MAX_REJECT_RATE of decided ones
//     (default 5%),
//   - no rejection in the last TRUST_QUIET_DAYS days (default 14).
// One recent rejection is enough to put someone back on full checking.

function num(name, fallback) {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v >= 0 ? v : fallback;
}

export function isTrusted({ approved, rejected, recentRejected }, cfg = {}) {
  const minApproved = cfg.minApproved ?? num('TRUST_MIN_APPROVED', 20);
  const maxRate = cfg.maxRejectRate ?? num('TRUST_MAX_REJECT_RATE', 0.05);
  if (approved < minApproved) return false;
  if (recentRejected > 0) return false;
  const decided = approved + rejected;
  return decided > 0 && rejected / decided <= maxRate;
}

export async function getEngagerTrust(supabaseAdmin, engagerId) {
  const quietDays = num('TRUST_QUIET_DAYS', 14);
  const since = new Date(Date.now() - quietDays * 24 * 60 * 60 * 1000).toISOString();
  const count = async (build) => {
    const { count: c, error } = await build(
      supabaseAdmin.from('submissions').select('id', { count: 'exact', head: true }).eq('engager_id', engagerId)
    );
    if (error) throw error;
    return c || 0;
  };
  try {
    const [approved, rejected, recentRejected] = await Promise.all([
      count((q) => q.eq('final_status', 'approved')),
      count((q) => q.eq('final_status', 'rejected')),
      count((q) => q.eq('final_status', 'rejected').gte('submitted_at', since)),
    ]);
    return { trusted: isTrusted({ approved, rejected, recentRejected }), approved, rejected, recentRejected };
  } catch {
    // If history can't be read, never extend trust.
    return { trusted: false, approved: 0, rejected: 0, recentRejected: 0 };
  }
}
