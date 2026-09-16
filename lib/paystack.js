// Thin wrapper around Paystack's REST API.
// Docs: https://paystack.com/docs/api/

const PAYSTACK_BASE = 'https://api.paystack.co';
const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

async function paystackFetch(path, options = {}) {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Paystack error on ${path}`);
  }
  return data;
}

// Client checkout: initialize a transaction, returns an authorization_url
// to redirect the client to for payment.
export async function initializeTransaction({ email, amountNaira, reference, metadata }) {
  return paystackFetch('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email,
      amount: Math.round(amountNaira * 100), // Paystack expects kobo
      reference,
      metadata,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/order-success`,
    }),
  });
}

// Call this from the webhook handler to double check a payment before
// trusting it — never create an order from the webhook payload alone.
export async function verifyTransaction(reference) {
  return paystackFetch(`/transaction/verify/${reference}`, { method: 'GET' });
}

// Engager payouts: Paystack requires a "transfer recipient" to be created
// once per bank account, then transfers reference that recipient code.
export async function createTransferRecipient({ name, accountNumber, bankCode }) {
  return paystackFetch('/transferrecipient', {
    method: 'POST',
    body: JSON.stringify({
      type: 'nuban',
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN',
    }),
  });
}

export async function initiateTransfer({ recipientCode, amountNaira, reason }) {
  return paystackFetch('/transfer', {
    method: 'POST',
    body: JSON.stringify({
      source: 'balance',
      amount: Math.round(amountNaira * 100),
      recipient: recipientCode,
      reason,
    }),
  });
}

// List Nigerian bank codes — needed when registering an engager's bank
// details, since Paystack needs the bank_code, not just the bank name.
export async function listBanks() {
  return paystackFetch('/bank?country=nigeria', { method: 'GET' });
}
