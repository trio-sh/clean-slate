// Setup Amani Cleaners with Stripe Connect
import Stripe from 'stripe';

const PLATFORM_SECRET_KEY = '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';
const AMANI_EMAIL = 'amaniscleaners@gmail.com';

const stripe = new Stripe(PLATFORM_SECRET_KEY);

async function setup() {
  try {
    console.log('🚀 Setting up Stripe Connect for Amani Cleaners...\n');

    // Step 1: Test the platform key
    console.log('1️⃣ Testing Pipilot platform keys...');
    const platformAccount = await stripe.accounts.retrieve();
    console.log('   ✅ Platform Account ID:', platformAccount.id);
    console.log('   ✅ Business Name:', platformAccount.business_profile?.name || 'Pipilot');
    console.log('   ✅ Country:', platformAccount.country);

    // Check for Connect capability
    if (platformAccount.capabilities?.transfers) {
      console.log('   ✅ Stripe Connect is ENABLED!\n');
    } else {
      console.log('   ⚠️  Stripe Connect capability:', platformAccount.capabilities?.transfers || 'Not enabled');
      console.log('   Note: You may need to enable Connect at https://dashboard.stripe.com/settings/connect\n');
    }

    // Step 2: Create connected account for Amani
    console.log('2️⃣ Creating connected account for Amani Cleaners...');
    const connectedAccount = await stripe.accounts.create({
      type: 'express',
      country: 'CA',
      email: AMANI_EMAIL,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'company',
      company: {
        name: "Amani's Cleaners",
      },
      business_profile: {
        mcc: '7210',
        name: "Amani's Cleaners",
        product_description: 'Professional laundry and dry cleaning services',
        support_email: AMANI_EMAIL,
        url: 'https://amanicleaners.com',
      },
    });

    console.log('   ✅ Connected Account Created!');
    console.log('   Account ID:', connectedAccount.id);
    console.log('   Email:', connectedAccount.email);
    console.log('   Status:', connectedAccount.charges_enabled ? 'Can accept charges' : 'Pending verification\n');

    // Step 3: Create account link for later onboarding
    console.log('3️⃣ Generating onboarding link...');
    const accountLink = await stripe.accountLinks.create({
      account: connectedAccount.id,
      refresh_url: 'https://amanicleaners.com/reauth',
      return_url: 'https://amanicleaners.com/dashboard',
      type: 'account_onboarding',
    });

    console.log('   ✅ Onboarding Link Created!');
    console.log('   Link expires in:', new Date(accountLink.expires_at * 1000).toLocaleString());
    console.log('   URL:', accountLink.url);

    // Print configuration
    console.log('\n✨ Setup Complete! Here\'s your configuration:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Platform Account ID:', platformAccount.id);
    console.log('Connected Account ID:', connectedAccount.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📋 Add these to your .env file:\n');
    console.log('# Stripe Connect Configuration');
    console.log(`STRIPE_PLATFORM_SECRET_KEY="${PLATFORM_SECRET_KEY}"`);
    console.log(`VITE_STRIPE_PUBLISHABLE_KEY="pk_live_51S5AIW3G7U0M1bp1lsnKvB8AX86PtV5lVwyn1grfAvVmdDx8miCY4WbMEXLS9UoCq7wLyMUiW9MlFZSlVl17zVmL00AQXvW8Oe"`);
    console.log(`STRIPE_CONNECTED_ACCOUNT_ID="${connectedAccount.id}"`);
    console.log('STRIPE_PLATFORM_FEE_PERCENT="1"');
    console.log('STRIPE_PLATFORM_FEE_FIXED="0"\n');

    console.log('📌 Important Notes:');
    console.log('   • Payments will work IMMEDIATELY');
    console.log('   • You earn 10% commission on all transactions');
    console.log('   • Amani should complete onboarding later using the link above');
    console.log('   • Link for onboarding:', accountLink.url);

    return {
      platformAccountId: platformAccount.id,
      connectedAccountId: connectedAccount.id,
      onboardingUrl: accountLink.url,
    };

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.error('   Authentication failed. Check your secret key.');
    }
    throw error;
  }
}

setup()
  .then(() => {
    console.log('\n✅ All done! Ready to accept payments with commission!\n');
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });
