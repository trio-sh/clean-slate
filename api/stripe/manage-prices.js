// Vercel Serverless Function for Managing Stripe Prices with Connect
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_PLATFORM_SECRET_KEY);

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await listPrices(req, res);
      case 'POST':
        return await createPrice(req, res);
      case 'PUT':
        return await updatePrice(req, res);
      case 'DELETE':
        return await deactivatePrice(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Stripe price management error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

async function listPrices(req, res) {
  try {
    const { productId } = req.query;

    const params = {
      active: true,
      limit: 100,
    };

    if (productId) {
      params.product = productId;
    }

    const prices = await stripe.prices.list(params, {
      stripeAccount: process.env.STRIPE_CONNECTED_ACCOUNT_ID,
    });

    return res.status(200).json({
      success: true,
      prices: prices.data,
    });
  } catch (error) {
    throw error;
  }
}

async function createPrice(req, res) {
  try {
    const {
      productId,
      amount,
      currency = 'cad',
      interval, // 'month' or 'year'
      metadata = {},
    } = req.body;

    if (!productId || !amount || !interval) {
      return res.status(400).json({
        error: 'Missing required fields: productId, amount, interval',
      });
    }

    const price = await stripe.prices.create(
      {
        product: productId,
        unit_amount: Math.round(parseFloat(amount) * 100), // Convert to cents
        currency: currency.toLowerCase(),
        recurring: {
          interval: interval,
        },
        metadata,
      },
      {
        stripeAccount: process.env.STRIPE_CONNECTED_ACCOUNT_ID,
      }
    );

    return res.status(201).json({
      success: true,
      price,
    });
  } catch (error) {
    throw error;
  }
}

async function updatePrice(req, res) {
  try {
    const { priceId, metadata, active } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    // Note: Stripe prices are immutable except for metadata and active status
    const updateData = {};
    if (metadata !== undefined) updateData.metadata = metadata;
    if (active !== undefined) updateData.active = active;

    const price = await stripe.prices.update(priceId, updateData, {
      stripeAccount: process.env.STRIPE_CONNECTED_ACCOUNT_ID,
    });

    return res.status(200).json({
      success: true,
      price,
    });
  } catch (error) {
    throw error;
  }
}

async function deactivatePrice(req, res) {
  try {
    const { priceId } = req.query;

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    const price = await stripe.prices.update(
      priceId,
      {
        active: false,
      },
      {
        stripeAccount: process.env.STRIPE_CONNECTED_ACCOUNT_ID,
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Price deactivated successfully',
      price,
    });
  } catch (error) {
    throw error;
  }
}
