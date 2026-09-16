import { supabaseAdmin } from '../../../lib/supabaseAdmin';

// Powers the "live payouts" ticker on the join page hero. Formats down to
// first name + last initial server-side — the engagers table stores full
// names, and this is a public, unauthenticated endpoint, so a full name
// never leaves the server here even though the existing (now-replaced)
// static "Paid out this week" block used to show that pattern already.
function shortName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/);
  if (parts.length < 2) return parts[0] || 'An engager';
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { data, error } = await supabaseAdmin
    .from('payouts')
    .select('amount, paid_at, engagers(full_name, tier)')
    .eq('status', 'paid')
    .not('paid_at', 'is', null)
    .order('paid_at', { ascending: false })
    .limit(6);
  if (error) return res.status(500).json({ error: error.message });

  const payouts = (data || [])
    .filter((p) => p.engagers)
    .map((p) => ({
      name: shortName(p.engagers.full_name),
      tier: p.engagers.tier,
      amount: Number(p.amount),
      at: p.paid_at,
    }));

  return res.status(200).json({ payouts });
}
