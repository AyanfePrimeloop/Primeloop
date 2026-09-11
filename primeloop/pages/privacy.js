import Logo from '../components/Logo';

export default function Privacy() {
  return (
    <div className="app" style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Logo size={28} />
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Privacy Policy</h1>
      </div>
      <div className="section" style={{ padding: '24px 28px', fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)' }}>
        <p style={{ fontSize: 12, color: 'var(--ink-mute)' }}>Last updated: [DATE]</p>

        <h3 style={{ color: 'var(--ink)' }}>1. What we collect</h3>
        <ul>
          <li><strong>Clients:</strong> email address, order details, post links, payment records</li>
          <li><strong>Engagers:</strong> name, WhatsApp number, email, bank account details, social
            media page names/links, screenshots submitted as proof of task completion</li>
          <li><strong>Everyone:</strong> basic usage data (pages visited, general device/browser info)</li>
        </ul>

        <h3 style={{ color: 'var(--ink)' }}>2. Why we collect it</h3>
        <p>
          To operate the platform: creating your account, processing payments, verifying task
          completion, paying Engagers, communicating with you about your orders or tasks, and
          preventing fraud (including detecting the same social media page being registered
          under multiple accounts).
        </p>

        <h3 style={{ color: 'var(--ink)' }}>3. Who we share it with</h3>
        <p>We share data only with the service providers needed to run Primeloop:</p>
        <ul>
          <li><strong>Paystack</strong> — processes payments and payouts</li>
          <li><strong>Supabase</strong> — hosts our database and handles login/authentication</li>
          <li><strong>Anthropic (Claude)</strong> — automatically checks submitted screenshots
            against what a task required, where AI verification is enabled</li>
          <li><strong>Resend</strong> — delivers account and login emails</li>
          <li><strong>Meta (WhatsApp Business)</strong> — delivers task alert messages, where enabled</li>
        </ul>
        <p>We do not sell your personal data to anyone.</p>

        <h3 style={{ color: 'var(--ink)' }}>4. How long we keep it</h3>
        <p>
          We keep account and transaction records for as long as your account is active and for
          a reasonable period afterward, as needed for tax, accounting, and fraud-prevention
          purposes (including keeping a permanent record of which social media pages have been
          registered, to prevent the same page being reused across accounts).
        </p>

        <h3 style={{ color: 'var(--ink)' }}>5. Your rights</h3>
        <p>
          Under the Nigeria Data Protection Act/Regulation (NDPA/NDPR), you have the right to
          request access to the personal data we hold about you, ask us to correct inaccurate
          data, and request deletion of your data (subject to our legal and operational need to
          retain certain records, such as payment history). Contact us via the WhatsApp button
          on our site to make a request.
        </p>

        <h3 style={{ color: 'var(--ink)' }}>6. Security</h3>
        <p>
          We use industry-standard measures to protect your data, including encrypted
          connections, access controls restricting who can view sensitive data (like bank
          details) to only what's needed, and secure password/login handling through Supabase.
          No system is 100% secure, and we can't guarantee absolute security.
        </p>

        <h3 style={{ color: 'var(--ink)' }}>7. Screenshots</h3>
        <p>
          Screenshots submitted as proof of engagement are stored to support verification and
          dispute resolution, and may be reviewed by our admin team or automated AI checks.
        </p>

        <h3 style={{ color: 'var(--ink)' }}>8. Changes to this policy</h3>
        <p>We may update this policy from time to time; the "Last updated" date above will change accordingly.</p>

        <h3 style={{ color: 'var(--ink)' }}>9. Contact</h3>
        <p>Questions about this policy or your data can be sent via the WhatsApp button on our site.</p>

        <div style={{ marginTop: 24, padding: 14, background: 'var(--warn-soft)', borderRadius: 8, fontSize: 12.5, color: 'var(--warn)' }}>
          This is a starting template, not legal advice. Have a Nigerian-licensed lawyer review
          it against current NDPA/NDPR requirements before relying on it — data protection law
          is an area where getting it wrong carries real regulatory risk.
        </div>
      </div>
    </div>
  );
}
