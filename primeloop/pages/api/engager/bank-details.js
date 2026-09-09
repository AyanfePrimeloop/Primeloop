import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireEngager } from '../../../lib/requireEngager';
import { listBanks, createTransferRecipient } from '../../../lib/paystack';

// GET  -> { banks: [...] } — the list of Nigerian banks for the dropdown
// POST -> body: { bankCode, bankName, accountNumber } — saves bank details
//         and creates the Paystack recipient needed for automatic payouts
export default async function handler(req, res) {
  const auth = await requireEngager(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });

  if (req.method === 'GET') {
    try {
      const result = await listBanks();
      return res.status(200).json({ banks: result.data || [] });
    } catch (e) {
      return res.status(500).json({ error: 'Could not load bank list: ' + e.message });
    }
  }

  if (req.method === 'POST') {
    const { bankCode, bankName, accountNumber } = req.body;
    if (!bankCode || !bankName || !accountNumber) {
      return res.status(400).json({ error: 'Missing bank details' });
    }

    try {
      const recipient = await createTransferRecipient({
        name: auth.engager.full_name,
        accountNumber,
        bankCode,
      });
      if (!recipient.status) {
        return res.status(400).json({ error: recipient.message || 'Paystack rejected these bank details' });
      }

      const { data: updated, error } = await supabaseAdmin
        .from('engagers')
        .update({
          bank_name: bankName,
          bank_account_number: accountNumber,
          bank_account_name: recipient.data.details?.account_name || auth.engager.full_name,
          paystack_recipient_code: recipient.data.recipient_code,
        })
        .eq('id', auth.engager.id)
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ engager: updated });
    } catch (e) {
      return res.status(500).json({ error: 'Could not verify bank details with Paystack: ' + e.message });
    }
  }

  return res.status(405).end();
}
