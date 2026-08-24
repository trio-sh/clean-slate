import LegalLayout from './LegalLayout';

export default function DeleteAccountPage() {
  return (
    <LegalLayout
      title="Delete your Amani's Cleaners account"
      subtitle="How to close your account and what happens to your data. This page is required by Google Play."
      effective="August 24, 2026"
    >
      <div className="not-prose rounded-2xl bg-navy-50 border border-navy-100 p-5 text-sm text-navy-900 mb-8">
        <strong>App:</strong> Amani's Cleaners &nbsp;·&nbsp;{' '}
        <strong>Publisher:</strong> Amani's Cleaners &nbsp;·&nbsp;{' '}
        <strong>Contact:</strong>{' '}
        <a href="mailto:support@amanicleaners.com" className="underline">
          support@amanicleaners.com
        </a>
      </div>

      <h2>Delete from the app</h2>
      <ol>
        <li>Open the Amani's Cleaners app.</li>
        <li>
          Tap the <strong>Account</strong> tab in the bottom navigation.
        </li>
        <li>
          Scroll to <strong>Settings</strong> and tap <strong>Delete my account</strong>.
        </li>
        <li>Confirm the second prompt. Deletion is immediate and cannot be undone.</li>
      </ol>

      <h2>Delete from the website</h2>
      <ol>
        <li>
          Sign in at <a href="https://amanicleaners.com/login">amanicleaners.com/login</a>.
        </li>
        <li>
          Open <a href="https://amanicleaners.com/account">Account</a> and scroll to{' '}
          <strong>Settings</strong>.
        </li>
        <li>Click <strong>Delete my account</strong> and confirm.</li>
      </ol>

      <h2>Can't sign in?</h2>
      <p>
        Email <a href="mailto:support@amanicleaners.com">support@amanicleaners.com</a> from the
        email address associated with your account. We reply within 2 business days and process
        the deletion within 7 days of verifying your identity.
      </p>

      <h2>What gets deleted immediately</h2>
      <p>The moment you confirm, all of the following are removed from our database:</p>
      <ul>
        <li>Your account (name, email, phone, hashed password, addresses)</li>
        <li>Your profile settings and preferences</li>
        <li>All future scheduled orders and subscriptions (subscriptions are also cancelled with Stripe)</li>
        <li>In-app messages between you and our team</li>
        <li>Saved payment methods (the tokens are removed from Stripe as well)</li>
      </ul>

      <h2>What we keep, and for how long</h2>
      <ul>
        <li>
          <strong>Order and invoice records</strong> — retained for at least 7 years after the
          order, to comply with Canadian tax, accounting, and consumer-protection law. These
          records are stored in a separate archive and are not used for marketing.
        </li>
        <li>
          <strong>Payment records at Stripe</strong> — Stripe retains transaction records under
          their own retention policy (typically 7 years) for financial-regulation reasons. Card
          numbers were never visible to us and are not affected.
        </li>
        <li>
          <strong>Anonymised server logs</strong> — retained up to 30 days for security and
          diagnostics, then rolled over. No account identifiers.
        </li>
      </ul>

      <h2>Deleting some data without deleting your account</h2>
      <p>You don't have to close your account to remove specific things:</p>
      <ul>
        <li>
          <strong>Saved addresses or payment methods</strong> — Account → Settings → tap any item
          and choose <strong>Remove</strong>.
        </li>
        <li>
          <strong>Message history with our team</strong> — Account → Messages → menu →{' '}
          <strong>Clear conversation</strong>.
        </li>
        <li>
          <strong>Marketing emails or SMS</strong> — Account → Notifications → toggle each off,
          or use the "unsubscribe" link at the bottom of any marketing message.
        </li>
        <li>
          <strong>Download your data first</strong> — email us and we'll send you a JSON export of
          everything we hold about you within 30 days, at no charge.
        </li>
      </ul>

      <h2>Contact</h2>
      <p>
        Amani's Cleaners, 840 Lawrence Ave W, Toronto, ON M6A 1C4, Canada.<br />
        <a href="mailto:support@amanicleaners.com">support@amanicleaners.com</a>
      </p>
    </LegalLayout>
  );
}
