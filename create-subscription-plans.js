// Create Amani Cleaners Subscription Plans in Stripe
import Stripe from 'stripe';

const stripe = new Stripe('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');
const CONNECTED_ACCOUNT = 'acct_1T7c8PKYMGRtjFRG';

const plans = [
  {
    name: 'Student Monthly',
    description: 'Perfect for students - Monthly plan',
    price: 235,
    pounds_included: 100,
    validity_days: 30,
    interval: 'month',
  },
  {
    name: 'Student 1 Semester',
    description: 'Best value for a semester',
    price: 575,
    pounds_included: 250,
    validity_days: 120,
    interval: 'month',
  },
  {
    name: 'Student 2 Semester (Popular)',
    description: 'Full academic year coverage',
    price: 1080,
    pounds_included: 500,
    validity_days: 240,
    interval: 'month',
  },
  {
    name: 'Silver - For Professionals',
    description: 'Ideal for working professionals',
    price: 275,
    pounds_included: 120,
    validity_days: 30,
    interval: 'month',
  },
  {
    name: 'Gold - Ideal for Couples',
    description: 'Perfect for households',
    price: 420.5,
    pounds_included: 200,
    validity_days: 30,
    interval: 'month',
  },
];

async function createPlans() {
  console.log('🚀 Creating subscription plans in Stripe...\n');
  console.log(`Connected Account: ${CONNECTED_ACCOUNT}\n`);

  const createdPlans = [];

  for (const plan of plans) {
    try {
      console.log(`Creating: ${plan.name}...`);

      // Create product
      const product = await stripe.products.create(
        {
          name: plan.name,
          description: plan.description,
          metadata: {
            pounds_included: plan.pounds_included.toString(),
            validity_days: plan.validity_days.toString(),
          },
        },
        {
          stripeAccount: CONNECTED_ACCOUNT,
        }
      );

      console.log(`  ✅ Product created: ${product.id}`);

      // Create price
      const price = await stripe.prices.create(
        {
          product: product.id,
          unit_amount: Math.round(plan.price * 100), // Convert to cents
          currency: 'cad',
          recurring: {
            interval: plan.interval,
          },
          metadata: {
            pounds_included: plan.pounds_included.toString(),
            validity_days: plan.validity_days.toString(),
          },
        },
        {
          stripeAccount: CONNECTED_ACCOUNT,
        }
      );

      console.log(`  ✅ Price created: ${price.id}`);

      // Set as default price
      await stripe.products.update(
        product.id,
        {
          default_price: price.id,
        },
        {
          stripeAccount: CONNECTED_ACCOUNT,
        }
      );

      console.log(`  ✅ Set as default price`);

      createdPlans.push({
        name: plan.name,
        product_id: product.id,
        price_id: price.id,
        price: plan.price,
        pounds: plan.pounds_included,
      });

      console.log(`  ✨ ${plan.name} - Complete!\n`);
    } catch (error) {
      console.error(`  ❌ Error creating ${plan.name}:`, error.message);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ PLAN CREATION COMPLETE!\n');

  console.log('📋 Created Plans Summary:\n');
  createdPlans.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`);
    console.log(`   Product: ${p.product_id}`);
    console.log(`   Price: ${p.price_id}`);
    console.log(`   Amount: $${p.price} CAD`);
    console.log(`   Pounds: ${p.pounds} lbs\n`);
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('🎯 Next Steps:');
  console.log('1. Go to Admin Dashboard → Plans');
  console.log('2. Click "Sync with Stripe" button');
  console.log('3. All plans will appear in your database!\n');

  console.log('💰 Commission Setup:');
  console.log('You earn 10% on every subscription automatically!');
  console.log('Example: $235 subscription = You get $23.50, Amani gets $211.50\n');

  return createdPlans;
}

createPlans()
  .then(() => {
    console.log('✨ Done!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed:', error.message);
    process.exit(1);
  });
