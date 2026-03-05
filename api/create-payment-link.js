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

    // Calculate platform fee (commission)
    const feePercent = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT) || 0;
    const feeFixed = parseFloat(process.env.STRIPE_PLATFORM_FEE_FIXED) || 0;
    const totalAmountInCents = Math.round(amount * 100);
    const applicationFeeAmount = Math.round((amount * feePercent / 100 + feeFixed) * 100); // in cents

    // Create a Stripe Checkout Session with Connect (supports platform fees)
    const session = await stripe.checkout.sessions.create({
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
      // Stripe Connect: Destination charge with application fee
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: process.env.STRIPE_CONNECTED_ACCOUNT_ID,
        },
      },
    });

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
