import LegalLayout from './LegalLayout';

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="The rules for using amanicleaners.com and the Amani's Cleaners app."
      effective="August 24, 2026"
    >
      <p>
        These Terms of Service (the "Terms") govern your access to and use of the Amani's Cleaners
        website, mobile app, and services (collectively the "Service"), operated by Amani's
        Cleaners ("we", "us", "our"). By using the Service you agree to these Terms.
      </p>

      <h2>1. Who can use the Service</h2>
      <ul>
        <li>You must be at least 18 years old to place an order or hold an account.</li>
        <li>You must provide accurate information and keep it up to date.</li>
        <li>You are responsible for keeping your account credentials secure.</li>
      </ul>

      <h2>2. Service area</h2>
      <p>
        Amani's Cleaners currently serves the Greater Toronto Area. Pickup and delivery are
        subject to your address being inside our service zone. If you place an order outside our
        service area we will contact you to cancel and refund.
      </p>

      <h2>3. Orders and pricing</h2>
      <ul>
        <li>
          Prices displayed on the site are estimates based on typical items. Final pricing is
          determined at intake, based on the actual items, weight, and services requested.
        </li>
        <li>You will receive an itemized receipt after intake and before final charge.</li>
        <li>
          Pickup and delivery are free within our service area. Rush service, specialty items,
          and additional trips may carry extra fees, which will be shown clearly before charge.
        </li>
        <li>
          If your final price differs materially from the estimate you saw at order time, you may
          cancel the order at no cost before we begin cleaning.
        </li>
      </ul>

      <h2>4. Turnaround</h2>
      <p>
        Our standard turnaround is 48 hours for most services. Complex items (wedding gowns, area
        rugs, leather) require additional time and will be quoted individually. Actual times
        depend on weather, traffic, and volume; we will notify you if there is a delay.
      </p>

      <h2>5. Payment</h2>
      <ul>
        <li>Payment is authorized at intake and captured on delivery.</li>
        <li>Subscriptions renew automatically at the interval you selected (weekly or monthly).</li>
        <li>All payments are processed by Stripe under Stripe's terms and privacy policy.</li>
      </ul>

      <h2>6. Cancellations and refunds</h2>
      <p>
        See the <a href="/refund">Refund policy</a> for cancellation windows, refund eligibility,
        and how to request one.
      </p>

      <h2>7. Care and liability</h2>
      <ul>
        <li>
          We treat every garment with professional care. Our team follows manufacturer care
          labels; if a label is missing or ambiguous we may contact you before proceeding.
        </li>
        <li>
          We are not responsible for items with pre-existing damage, unlabelled hidden defects,
          or non-fastness of dyes on items we could not reasonably identify.
        </li>
        <li>
          If we damage or lose an item due to our error, we will refund or replace it at the
          lesser of (a) the fair depreciated value of the item, or (b) ten times the cleaning
          charge for that item, up to a maximum of C$500 per item, in line with the standard
          practice of the International Fabricare Institute.
        </li>
        <li>
          Special-value items (over C$500) must be declared at intake and are cleaned only with
          your written agreement to the risk.
        </li>
      </ul>

      <h2>8. Unclaimed items</h2>
      <p>
        Items left with us for more than 90 days after we notify you that they are ready may be
        donated or disposed of at our discretion. We will send at least two reminders before
        doing so.
      </p>

      <h2>9. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for anything unlawful, fraudulent, or harmful.</li>
        <li>Send us items containing weapons, drugs, hazardous materials, or contraband.</li>
        <li>Interfere with, probe, or overload our infrastructure.</li>
        <li>Impersonate any person or misrepresent your affiliation.</li>
      </ul>

      <h2>10. Intellectual property</h2>
      <p>
        The site, app, and all content are the property of Amani's Cleaners or our licensors. You
        may use the Service for its intended purpose. You may not copy, modify, reverse engineer,
        or redistribute any part of it without our written consent.
      </p>

      <h2>11. Termination</h2>
      <p>
        You may close your account at any time from the app or by emailing us. We may suspend or
        terminate accounts that violate these Terms, with as much notice as circumstances allow.
      </p>

      <h2>12. Disclaimer and limitation of liability</h2>
      <p>
        The Service is provided on an "as is" and "as available" basis. To the maximum extent
        permitted by Ontario law, our aggregate liability arising out of or relating to the
        Service is limited to the greater of C$500 or the amount you paid us for the specific
        order at issue in the twelve months before the claim. Nothing in these Terms limits any
        right that cannot be limited under applicable consumer-protection law.
      </p>

      <h2>13. Governing law</h2>
      <p>
        These Terms are governed by the laws of the Province of Ontario and the applicable
        federal laws of Canada. Any dispute will be resolved in the courts of Ontario, unless the
        parties agree in writing to another venue or method.
      </p>

      <h2>14. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. Material changes will be announced in-app or
        by email before they take effect. Continued use of the Service after the effective date
        constitutes acceptance of the updated Terms.
      </p>

      <h2>15. Contact</h2>
      <p>
        Amani's Cleaners, 840 Lawrence Ave W, Toronto, ON M6A 1C4, Canada.<br />
        <a href="mailto:support@amanicleaners.com">support@amanicleaners.com</a>
      </p>
    </LegalLayout>
  );
}
