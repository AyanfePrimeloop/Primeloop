import { useState, useEffect } from 'react';
import { useRequireRole, authedFetch } from '../../lib/authClient';
import Logo from '../../components/Logo';

export default function BankDetails() {
  const { loading, me } = useRequireRole('engager');
  const [banks, setBanks] = useState([]);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!loading) {
      authedFetch('/api/engager/bank-details')
        .then((r) => r.json())
        .then((d) => setBanks(d.banks || []));
    }
  }, [loading]);

  async function save() {
    if (!bankCode || !accountNumber) {
      setResult({ error: 'Choose a bank and enter your account number.' });
      return;
    }
    setSaving(true);
    const bankName = banks.find((b) => b.code === bankCode)?.name || '';
    const res = await authedFetch('/api/engager/bank-details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bankCode, bankName, accountNumber }),
    });
    const data = await res.json();
    setSaving(false);
    setResult(data);
  }

  if (loading) return <div className="app"><p style={{ padding: 20 }}>Loading...</p></div>;

  const alreadySaved = me?.engager?.paystack_recipient_code;

  return (
    <div className="app" style={{ maxWidth: 460 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Logo size={28} />
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Bank details</h1>
      </div>
      <p style={{ color: 'var(--ink-soft)', fontSize: 13.5 }}>
        This is where your weekly payout gets sent. We verify it with your bank before saving.
      </p>

      {alreadySaved && !result && (
        <div className="section" style={{ padding: 20, background: 'var(--good-soft)', marginBottom: 16 }}>
          <p style={{ color: 'var(--good)', margin: 0, fontSize: 13.5 }}>
            Bank details on file: {me.engager.bank_name} — {me.engager.bank_account_number} ({me.engager.bank_account_name})
          </p>
          <p style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 6 }}>You can update these below if needed.</p>
        </div>
      )}

      <div className="section">
        <div style={{ padding: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>Bank</label>
            <select style={{ width: '100%' }} value={bankCode} onChange={(e) => setBankCode(e.target.value)}>
              <option value="">Select your bank</option>
              {banks.map((b) => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>Account number</label>
            <input style={{ width: '100%' }} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} maxLength={10} placeholder="0123456789" />
          </div>
          <button className="btn primary" style={{ width: '100%' }} onClick={save} disabled={saving}>
            {saving ? 'Verifying with your bank...' : 'Save bank details'}
          </button>
          {result?.error && <p style={{ color: 'var(--warn)', fontSize: 13, marginTop: 10 }}>{result.error}</p>}
          {result?.engager && (
            <p style={{ color: 'var(--good)', fontSize: 13, marginTop: 10 }}>
              Saved — verified as {result.engager.bank_account_name}. You're set up for automatic payouts.
            </p>
          )}
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: 14 }}>
        <a href="/engager/dashboard" style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>Back to dashboard</a>
      </p>
    </div>
  );
}
