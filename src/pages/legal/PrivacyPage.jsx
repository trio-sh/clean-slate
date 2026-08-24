import LegalLayout from './LegalLayout';

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How Amani's Cleaners collects, uses, and protects the information you share with us."
      effective="August 24, 2026"
    >
      <p>
        Amani's Cleaners ("we", "us", "our") operates the website{' '}
        <a href="https://amanicleaners.com">amanicleaners.com</a> and the Amani's Cleaners Android
        app (together, the "Service"). This Privacy Policy explains what personal information we
        collect, why we collect it, and how we handle it.
      </p>

      <h2>1. Information we collect</h2>

      <h3>Information you give us</h3>
      <ul>
        <li>
          <strong>Account information</strong> — name, email address, phone number, and a password
          when you register.
        </li>
        <li>
          <strong>Order information</strong> — pickup and delivery addresses, garment items and
          quantities, special instructions, and pickup/delivery time preferences.
        </li>
        <li>
          <strong>Payment information</strong> — processed by our payment provider, Stripe. We do
          not see or store your full credit or debit card details on our servers; we only receive a
          token and non-sensitive metadata like the last four digits, brand, and expiry.
        </li>
        <li>
          <strong>Communications</strong> — messages you send us through the in-app chat, email,
          SMS, or WhatsApp for customer support.
        </li>
      </ul>

      <h3>Information we collect automatically</h3>
      <ul>
        <li>
          <strong>Usage data</strong> — pages viewed, actions taken, and features used, to
          diagnose issues and improve the Service.
        </li>
        <li>
          <strong>Device and technical data</strong> — device model, operating system, browser,
          language, and IP address (used to detect fraud and localise service).
        </li>
        <li>
          <strong>Approximate location</strong> — derived from the address you enter, never from
          your device's GPS. We do not request precise location permission.
        </li>
      </ul>

      <h2>2. How we use your information</h2>
      <ul>
        <li>Provide and operate the Service (place, fulfill, deliver, and support your orders).</li>
        <li>Authenticate your account and prevent fraud.</li>
        <li>Send transactional messages (order confirmations, pickup/delivery updates, receipts).</li>
        <li>
          Send service updates about your account. We only send marketing communications with
          your consent, and you can opt out at any time.
        </li>
        <li>Comply with legal obligations (tax records, disputes, regulatory requests).</li>
      </ul>

      <h2>3. Sharing with third parties</h2>
      <p>
        We only share your information with the vendors that make the Service work, and each of
        them is bound by contract not to use your data for their own purposes.
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> — database and authentication. Stores your account and orders.
        </li>
        <li>
          <strong>Stripe</strong> — payments and subscriptions. Handles cards; we never see them.
        </li>
        <li>
          <strong>Twilio and similar SMS/WhatsApp providers</strong> — sends transactional
          messages (pickup on the way, order ready).
        </li>
        <li>
          <strong>Delivery drivers</strong> — see the minimum information needed to complete the
          pickup or delivery (name, address, order contents, phone number for last-mile contact).
        </li>
        <li>
          <strong>Vercel</strong> — website hosting. Sees IP addresses and request metadata for
          delivering the site.
        </li>
      </ul>
      <p>
        We do <strong>not</strong> sell your personal data, rent it to advertisers, or share it
        with data brokers.
      </p>

      <h2>4. Data retention</h2>
      <ul>
        <li>Account information: for as long as your account exists.</li>
        <li>
          Order and payment records: kept for at least 7 years to comply with Canadian tax and
          accounting rules.
        </li>
        <li>
          Support conversations: kept for up to 2 years to help with follow-up requests.
        </li>
        <li>
          Server logs: retained for 30 days for security and diagnostics, then rolled over.
        </li>
      </ul>

      <h2>5. Your rights</h2>
      <p>
        You can request access to, correction of, or deletion of your personal information at any
        time. Ontario residents also have the rights described in Canada's PIPEDA. To exercise any
        of these rights:
      </p>
      <ul>
        <li>Sign in and open Account → Settings to update your details, or Delete my account.</li>
        <li>
          Email <a href="mailto:support@amanicleaners.com">support@amanicleaners.com</a> and we
          will respond within 30 days.
        </li>
        <li>
          Follow the step-by-step instructions on our{' '}
          <a href="/delete-account">Delete account</a> page.
        </li>
      </ul>

      <h2>6. Security</h2>
      <ul>
        <li>All network traffic uses TLS (HTTPS).</li>
        <li>Passwords are hashed and salted; we never store them in plain text.</li>
        <li>Database access is scoped per-user by row-level security policies.</li>
        <li>Payment card details are handled by Stripe and never touch our servers.</li>
      </ul>

      <h2>7. Children</h2>
      <p>
        Amani's Cleaners is intended for adults (18+). We do not knowingly collect information
        from anyone under 13. If you believe a child has an account, contact us and we will delete
        it.
      </p>

      <h2>8. International transfers</h2>
      <p>
        Our infrastructure providers (Supabase, Stripe, Vercel) may process your data in Canada,
        the United States, and other regions where they operate. They are contractually required
        to protect your data at a standard equivalent to Canadian law.
      </p>

      <h2>9. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. If we make material changes, we will
        update the effective date above and, where practical, notify you in-app or by email before
        the changes take effect.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions or requests: <a href="mailto:support@amanicleaners.com">support@amanicleaners.com</a>
        .<br />
        Amani's Cleaners, 840 Lawrence Ave W, Toronto, ON M6A 1C4, Canada.
      </p>
    </LegalLayout>
  );
}
