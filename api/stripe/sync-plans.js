// Vercel Serverless Function for Syncing Stripe Products with Database
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch all active products from Stripe
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
      limit: 100,
    });

    const syncedPlans = [];
    const errors = [];

    for (const product of products.data) {
      try {
        // Get all prices for this product
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
        });

        // Use the default price or the first price
        const defaultPrice = prices.data.find(
          (p) => p.id === product.default_price?.id
        ) || prices.data[0];

        if (!defaultPrice) {
          errors.push({
            product: product.id,
            error: 'No active price found',
          });
          continue;
        }

        // Extract metadata
        const poundsIncluded = parseInt(
          product.metadata?.pounds_included || '0'
        );
        const validityDays = parseInt(
          product.metadata?.validity_days || '30'
        );

        // Prepare plan data
        const planData = {
          stripe_product_id: product.id,
          stripe_price_id: defaultPrice.id,
          name: product.name,
          description: product.description || '',
          price: defaultPrice.unit_amount / 100, // Convert from cents
          billing_interval: defaultPrice.recurring?.interval || 'month',
          pounds_included: poundsIncluded,
          validity_days: validityDays,
          is_active: product.active,
          features: [],
          updated_at: new Date().toISOString(),
        };

        // Check if plan already exists
        const { data: existing } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('stripe_product_id', product.id)
          .single();

        if (existing) {
          // Update existing plan
          const { data, error } = await supabase
            .from('subscription_plans')
            .update(planData)
            .eq('id', existing.id)
            .select()
            .single();

          if (error) throw error;
          syncedPlans.push({ action: 'updated', plan: data });
        } else {
          // Create new plan
          const { data, error } = await supabase
            .from('subscription_plans')
            .insert({
              ...planData,
              id: crypto.randomUUID(),
              created_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) throw error;
          syncedPlans.push({ action: 'created', plan: data });
        }
      } catch (productError) {
        errors.push({
          product: product.id,
          error: productError.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      synced: syncedPlans.length,
      plans: syncedPlans,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({
      error: 'Failed to sync plans',
      message: error.message,
    });
  }
}
