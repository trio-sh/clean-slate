// Vercel Serverless Function for Creating Stripe Payment Links with Connect
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
    const transferAmount = totalAmountInCents - applicationFeeAmount; // Amount that goes to connected account

    // Create a Stripe payment link with Connect
    const paymentLink = await stripe.paymentLinks.create({
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
            unit_amount: totalAmountInCents, // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        order_id: orderId,
        customer_email: customerEmail || '',
        customer_name: customerName || '',
        platform_fee: applicationFeeAmount.toString(),
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.VITE_APP_URL || 'https://amanicleaners.com'}/order-confirmation?order_id=${orderId}`,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_creation: 'if_required',
      payment_method_types: ['card'],
      // Stripe Connect: Transfer funds to connected account (platform keeps the difference as fee)
      payment_intent_data: {
        transfer_data: {
          destination: process.env.STRIPE_CONNECTED_ACCOUNT_ID,
          amount: transferAmount, // Connected account receives this amount
        },
      },
    });

    return res.status(200).json({
      success: true,
      paymentLink: paymentLink.url,
      paymentLinkId: paymentLink.id,
    });
  } catch (error) {
    console.error('Stripe payment link creation error:', error);
    return res.status(500).json({
      error: 'Failed to create payment link',
      message: error.message,
    });
  }
}
