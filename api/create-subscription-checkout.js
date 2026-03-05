// Vercel Serverless Function for Creating Stripe Subscription Checkout Sessions with Connect
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_PLATFORM_SECRET_KEY);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      planId,
      planName,
      price,
      interval, // 'month' or 'year'
      customerId,
      customerEmail,
      successUrl,
      cancelUrl,
    } = req.body;

    // Validation
    if (!planId || !planName || !price || !interval) {
      return res.status(400).json({
        error: 'Missing required fields: planId, planName, price, interval',
      });
    }

    if (!['month', 'year'].includes(interval)) {
      return res.status(400).json({
        error: 'Invalid interval. Must be "month" or "year"',
      });
    }

    // Create or retrieve Stripe product
    let product;
    try {
      // Try to retrieve existing product by metadata (from connected account)
      const products = await stripe.products.list(
        {
          limit: 100,
        },
        {
          stripeAccount: process.env.STRIPE_CONNECTED_ACCOUNT_ID,
        }
      );
      product = products.data.find((p) => p.metadata.plan_id === planId);

      if (!product) {
        // Create new product if not found (on connected account)
        product = await stripe.products.create(
          {
            name: planName,
            metadata: {
              plan_id: planId,
            },
          },
          {
            stripeAccount: process.env.STRIPE_CONNECTED_ACCOUNT_ID,
          }
        );
      }
    } catch (error) {
      console.error('Product creation error:', error);
      throw error;
    }

    // Create or retrieve price
    let stripePrice;
    try {
      const prices = await stripe.prices.list(
        {
          product: product.id,
          active: true,
          limit: 100,
        },
        {
          stripeAccount: process.env.STRIPE_CONNECTED_ACCOUNT_ID,
        }
      );

      // Find matching price
      stripePrice = prices.data.find(
        (p) =>
          p.unit_amount === Math.round(price * 100) &&
          p.recurring?.interval === interval
      );

      if (!stripePrice) {
        // Create new price if not found (on connected account)
        stripePrice = await stripe.prices.create(
          {
            product: product.id,
            unit_amount: Math.round(price * 100), // Convert to cents
            currency: 'cad',
            recurring: {
              interval: interval,
            },
            metadata: {
              plan_id: planId,
            },
          },
          {
            stripeAccount: process.env.STRIPE_CONNECTED_ACCOUNT_ID,
          }
        );
      }
    } catch (error) {
      console.error('Price creation error:', error);
      throw error;
    }

    // Calculate platform fee percentage
    const feePercent = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT) || 0;

    // Create checkout session with Stripe Connect
    const sessionParams = {
      mode: 'subscription',
      line_items: [
        {
          price: stripePrice.id,
          quantity: 1,
        },
      ],
      success_url:
        successUrl ||
        `${process.env.VITE_APP_URL || 'https://amanicleaners.com'}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        cancelUrl ||
        `${process.env.VITE_APP_URL || 'https://amanicleaners.com'}/subscriptions`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      // Note: customer_creation is not needed in subscription mode - Stripe creates customers automatically
      metadata: {
        plan_id: planId,
        customer_id: customerId || '',
        platform_fee_percent: feePercent.toString(),
      },
      // Stripe Connect: Take application fee on recurring payments
      subscription_data: {
        application_fee_percent: feePercent,
        metadata: {
          plan_id: planId,
        },
      },
    };

    // Add customer email if provided
    if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }

    const session = await stripe.checkout.sessions.create(
      sessionParams,
      {
        stripeAccount: process.env.STRIPE_CONNECTED_ACCOUNT_ID,
      }
    );

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      sessionUrl: session.url,
    });
  } catch (error) {
    console.error('Stripe checkout session creation error:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
    });
  }
}
