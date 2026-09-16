import { supabaseAdmin } from '../../../lib/supabaseAdmin';

// Deliberately returns only the amount — nothing else about the order —
// since this is called from the success page before the client has logged
// in at all, and a transaction amount alone isn't sensitive.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { reference } = req.query;
  if (!reference) return res.status(400).json({ error: 'Missing reference' });

  const { data } = await supabaseAdmin
    .from('orders')
    .select('amount_total, payment_status')
    .eq('paystack_reference', reference)
    .maybeSingle();

  if (!data) return res.status(404).json({ error: 'Order not found' });
  return res.status(200).json({ amount: data.amount_total, status: data.payment_status });
}
