import LegalLayout from './LegalLayout';

export default function RefundPage() {
  return (
    <LegalLayout
      title="Refund & Cancellation Policy"
      subtitle="When you can cancel, how refunds work, and what to do if something's wrong with your order."
      effective="August 24, 2026"
    >
      <h2>Cancelling an order</h2>
      <ul>
        <li>
          <strong>Before pickup</strong> — you can cancel any time from the app or by calling us.
          No charge, no questions.
        </li>
        <li>
          <strong>After pickup, before cleaning begins</strong> — cancel by messaging us in the
          app or emailing <a href="mailto:support@amanicleaners.com">support@amanicleaners.com</a>.
          We'll deliver your items back to you at no charge.
        </li>
        <li>
          <strong>After cleaning starts</strong> — we can't cancel a cleaning that's already in
          progress, but any un-started items in your order can still be cancelled.
        </li>
      </ul>

      <h2>Refund eligibility</h2>
      <p>You are eligible for a full refund if any of the following happens:</p>
      <ul>
        <li>We damage, shrink, or lose an item due to our error.</li>
        <li>Your items come back stained or improperly cleaned and we cannot fix it in a re-clean.</li>
        <li>Delivery is late by more than 48 hours beyond our promised time, through no fault of yours.</li>
        <li>We charged an amount that differs from the itemized receipt without your consent.</li>
      </ul>

      <p>You are eligible for a partial refund if:</p>
      <ul>
        <li>Only some items in a multi-item order are affected.</li>
        <li>A subscription includes services you did not use in a given cycle (pro-rated at our discretion).</li>
      </ul>

      <h2>What is not refundable</h2>
      <ul>
        <li>Damage caused by pre-existing wear, hidden defects, or manufacturer errors.</li>
        <li>Dye migration or shrinkage on items whose care labels warned against our process, when we followed the label.</li>
        <li>Items left unclaimed for more than 90 days after we notified you they were ready.</li>
        <li>Items you asked us to clean at your risk after we recommended against it in writing.</li>
      </ul>

      <h2>How to request a refund</h2>
      <ol>
        <li>Open the app and go to your order under <strong>Track</strong>.</li>
        <li>Tap <strong>Report an issue</strong> and describe what happened. Attach photos if the issue is visible.</li>
        <li>You can also email <a href="mailto:support@amanicleaners.com">support@amanicleaners.com</a> with your order reference code (starts with "AC-").</li>
      </ol>

      <h2>How long refunds take</h2>
      <ul>
        <li>We respond to every request within 2 business days.</li>
        <li>Once approved, refunds are issued to the original payment method through Stripe.</li>
        <li>Stripe typically posts the refund to your bank or card statement within 5–10 business days.</li>
      </ul>

      <h2>Subscription cancellations</h2>
      <ul>
        <li>Cancel any time from Account → Subscriptions. Cancellation takes effect at the end of the current billing period.</li>
        <li>We do not pro-rate mid-cycle cancellations by default. If you have an unusual situation, email us and we'll do our best to make it right.</li>
      </ul>

      <h2>Contact</h2>
      <p>
        Amani's Cleaners, 840 Lawrence Ave W, Toronto, ON M6A 1C4, Canada.<br />
        <a href="mailto:support@amanicleaners.com">support@amanicleaners.com</a>
      </p>
    </LegalLayout>
  );
}
