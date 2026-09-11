import Logo from '../components/Logo';

export default function Terms() {
  return (
    <div className="app" style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Logo size={28} />
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Terms of Service</h1>
      </div>
      <div className="section" style={{ padding: '24px 28px', fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)' }}>
        <p style={{ fontSize: 12, color: 'var(--ink-mute)' }}>Last updated: [DATE] — Effective for all use of Primeloop.</p>

        <h3 style={{ color: 'var(--ink)' }}>1. What Primeloop is</h3>
        <p>
          Primeloop ("we", "us", "the platform") connects clients who want engagement on their
          social media posts ("Clients") with individuals who complete engagement tasks in
          exchange for payment ("Engagers"). We are a facilitator of these connections and
          payments — we do not own or control the social media platforms involved (Facebook,
          Instagram, TikTok, YouTube, X), and engagement is performed by independent Engagers,
          not by Primeloop directly.
        </p>

        <h3 style={{ color: 'var(--ink)' }}>2. Eligibility</h3>
        <p>
          You must be at least 18 years old to use Primeloop as a Client or an Engager. By
          registering, you confirm the information you provide (name, contact details, bank
          details, social media account ownership) is accurate and belongs to you.
        </p>

        <h3 style={{ color: 'var(--ink)' }}>3. For Clients</h3>
        <p>
          You agree to pay the listed price for the engagement package you select before any
          task is created. You confirm you have the right to request engagement on the post link
          you submit, and that it does not violate any law or the terms of the social media
          platform it's hosted on. Engagement is delivered by real, independent Engagers within
          the estimated timeframe shown, subject to Engager availability.
        </p>

        <h3 style={{ color: 'var(--ink)' }}>4. For Engagers</h3>
        <p>
          You are an independent participant, not an employee of Primeloop. You are responsible
          for any taxes owed on income earned through the platform. You agree to:
        </p>
        <ul>
          <li>Only submit proof of engagement you personally, genuinely completed</li>
          <li>Never submit false, duplicated, reused, or AI-generated proof</li>
          <li>Register only social media pages/accounts you personally own and control</li>
          <li>Not register the same page/account under more than one Primeloop account</li>
        </ul>
        <p>
          Violating these terms may result in a warning, forfeiture of the related payment,
          and/or permanent dismissal from the platform, at Primeloop's discretion.
        </p>

        <h3 style={{ color: 'var(--ink)' }}>5. Payments</h3>
        <p>
          Client payments are processed via Paystack. Engager payouts are made weekly via bank
          transfer to the account details the Engager provides, once verified. Primeloop is not
          responsible for delays caused by incorrect bank details, Paystack service issues, or
          the Engager's bank.
        </p>

        <h3 style={{ color: 'var(--ink)' }}>6. Refunds</h3>
        <p>See our separate Refund Policy for the full terms governing refunds.</p>

        <h3 style={{ color: 'var(--ink)' }}>7. Prohibited use</h3>
        <p>
          You may not use Primeloop for any unlawful purpose, to harass or defraud others, to
          submit content that infringes someone else's rights, or to attempt to manipulate,
          exploit, or reverse-engineer the platform's verification systems.
        </p>

        <h3 style={{ color: 'var(--ink)' }}>8. Limitation of liability</h3>
        <p>
          Primeloop provides the platform "as is." We are not liable for actions taken by social
          media platforms against a Client's account or post (including removal, flagging, or
          restriction), for indirect or consequential losses, or for the accuracy of Engager-
          submitted proof beyond our verification process. Our total liability to you for any
          claim is limited to the amount you paid us in the 3 months before the claim arose.
        </p>

        <h3 style={{ color: 'var(--ink)' }}>9. Changes to these terms</h3>
        <p>
          We may update these terms from time to time. Continued use of Primeloop after a change
          means you accept the updated terms.
        </p>

        <h3 style={{ color: 'var(--ink)' }}>10. Governing law</h3>
        <p>These terms are governed by the laws of the Federal Republic of Nigeria.</p>

        <h3 style={{ color: 'var(--ink)' }}>11. Contact</h3>
        <p>Questions about these terms can be sent via the WhatsApp button on our site.</p>

        <div style={{ marginTop: 24, padding: 14, background: 'var(--warn-soft)', borderRadius: 8, fontSize: 12.5, color: 'var(--warn)' }}>
          This is a starting template, not legal advice. Have a Nigerian-licensed lawyer review
          and finalize this before relying on it, especially the payment, liability, and refund
          sections — those carry real financial and legal weight.
        </div>
      </div>
    </div>
  );
}
