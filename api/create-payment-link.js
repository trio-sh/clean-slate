// Vercel Serverless Function for Creating Stripe Payment Links
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

    // Create a Stripe payment link
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
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        order_id: orderId,
        customer_email: customerEmail || '',
        customer_name: customerName || '',
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.VITE_APP_URL || 'https://amaniscleaners.com'}/order-confirmation?order_id=${orderId}`,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_creation: 'if_required',
      payment_method_types: ['card'],
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
