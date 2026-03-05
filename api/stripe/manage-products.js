// Vercel Serverless Function for Managing Stripe Products with Connect
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_PLATFORM_SECRET_KEY);

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await listProducts(req, res);
      case 'POST':
        return await createProduct(req, res);
      case 'PUT':
        return await updateProduct(req, res);
      case 'DELETE':
        return await deleteProduct(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Stripe product management error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

async function listProducts(req, res) {
  try {
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
      limit: 100,
    });

    // Get all prices for these products
    const productsWithPrices = await Promise.all(
      products.data.map(async (product) => {
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
        });

        return {
          ...product,
          prices: prices.data,
        };
      })
    );

    return res.status(200).json({
      success: true,
      products: productsWithPrices,
    });
  } catch (error) {
    throw error;
  }
}

async function createProduct(req, res) {
  try {
    const {
      name,
      description,
      poundsIncluded,
      validityDays,
      price,
      interval, // 'month' or 'year'
      currency = 'cad',
      metadata = {},
    } = req.body;

    // Validation
    if (!name || !price || !interval) {
      return res.status(400).json({
        error: 'Missing required fields: name, price, interval',
      });
    }

    // Create product
    const product = await stripe.products.create({
      name,
      description: description || `${poundsIncluded} lbs laundry service valid for ${validityDays} days`,
      metadata: {
        pounds_included: poundsIncluded?.toString() || '0',
        validity_days: validityDays?.toString() || '30',
        ...metadata,
      },
    });

    // Create price for the product
    const stripePrice = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(parseFloat(price) * 100), // Convert to cents
      currency: currency.toLowerCase(),
      recurring: {
        interval: interval, // 'month' or 'year'
      },
      metadata: {
        pounds_included: poundsIncluded?.toString() || '0',
        validity_days: validityDays?.toString() || '30',
      },
    });

    // Update product with default price
    await stripe.products.update(product.id, {
      default_price: stripePrice.id,
    });

    return res.status(201).json({
      success: true,
      product: {
        ...product,
        default_price: stripePrice,
      },
    });
  } catch (error) {
    throw error;
  }
}

async function updateProduct(req, res) {
  try {
    const { productId, name, description, metadata, active } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (active !== undefined) updateData.active = active;

    const product = await stripe.products.update(productId, updateData);

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    throw error;
  }
}

async function deleteProduct(req, res) {
  try {
    const { productId } = req.query;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Archive the product (Stripe doesn't allow deletion, only archiving)
    const product = await stripe.products.update(productId, {
      active: false,
    });

    return res.status(200).json({
      success: true,
      message: 'Product archived successfully',
      product,
    });
  } catch (error) {
    throw error;
  }
}
