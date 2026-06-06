// Vercel Serverless Function for Creating Stripe Checkout Sessions with Connect
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_PLATFORM_SECRET_KEY);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, amount, currency = 'cad', customerEmail, customerName, description } = req.body;

    // Validation
    if (!orderId || !amount) {
      return res.status(400).json({ error: 'Missing required fields: orderId and amount' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const connectedAccountId = process.env.STRIPE_CONNECTED_ACCOUNT_ID;
    if (!connectedAccountId) {
      return res.status(500).json({ error: 'Stripe Connect account is not configured' });
    }

    // Calculate platform fee (commission)
    const feePercent = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT) || 0;
    const feeFixed = parseFloat(process.env.STRIPE_PLATFORM_FEE_FIXED) || 0;
    const totalAmountInCents = Math.round(amount * 100);
    const applicationFeeAmount = Math.round((amount * feePercent / 100 + feeFixed) * 100); // in cents

    // Build payment_intent_data. Only include an application fee when there is one
    // (Stripe rejects application_fee_amount: 0).
    const paymentIntentData = {};
    if (applicationFeeAmount > 0) {
      paymentIntentData.application_fee_amount = applicationFeeAmount;
    }

    // Create a Stripe Checkout Session as a DIRECT CHARGE on the connected account.
    //
    // This is the same pattern used by the rest of the Connect integration
    // (create-subscription-checkout, manage-products, manage-prices, sync-plans):
    // the session is created on the connected account via the `stripeAccount`
    // option, and the platform collects its commission via `application_fee_amount`.
    //
    // A direct charge only requires the connected account to have `card_payments`
    // active. The previous implementation used a destination charge
    // (`transfer_data.destination`), which additionally requires the destination
    // account to have the `transfers` capability active — that capability is only
    // granted after the connected account completes full onboarding, so transfers
    // to an un-onboarded account fail with:
    //   "Your destination account needs to have at least one of the following
    //    capabilities enabled: transfers, crypto_transfers, or legacy_payments."
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: description || `Order #${orderId}`,
                metadata: {
                  order_id: orderId,
                },
              },
              unit_amount: totalAmountInCents,
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.VITE_APP_URL || 'https://amanicleaners.com'}/order-confirmation?order_id=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.VITE_APP_URL || 'https://amanicleaners.com'}/order?cancelled=true`,
        customer_email: customerEmail,
        metadata: {
          order_id: orderId,
          customer_name: customerName || '',
          platform_fee: applicationFeeAmount.toString(),
        },
        ...(Object.keys(paymentIntentData).length > 0
          ? { payment_intent_data: paymentIntentData }
          : {}),
      },
      {
        // Direct charge: the session and payment live on the connected account.
        stripeAccount: connectedAccountId,
      }
    );

    return res.status(200).json({
      success: true,
      paymentLink: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Stripe checkout session creation error:', error);
    return res.status(500).json({
      error: 'Failed to create payment link',
      message: error.message,
    });
  }
}
