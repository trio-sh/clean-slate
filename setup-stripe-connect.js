// Script to create Stripe Connect account for Amani Cleaners
import Stripe from 'stripe';

// YOUR PIPILOT PLATFORM STRIPE SECRET KEY (with Stripe Connect enabled)
const PLATFORM_SECRET_KEY = 'YOUR_PIPILOT_STRIPE_SECRET_KEY_HERE';

const stripe = new Stripe(PLATFORM_SECRET_KEY);

async function createConnectedAccount() {
  try {
    console.log('🚀 Creating Stripe Connect account for Amani Cleaners...\n');

    // Create an Express connected account
    const account = await stripe.accounts.create({
      type: 'express', // or 'standard' for more control
      country: 'CA', // Canada
      email: 'amaniscleaners@example.com', // Amani's email
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'company',
      company: {
        name: "Amani's Cleaners",
      },
      business_profile: {
        mcc: '7210', // Laundry, Cleaning and Garment Services
        name: "Amani's Cleaners",
        product_description: 'Professional laundry and dry cleaning services',
        support_email: 'amaniscleaners@example.com',
        url: 'https://amanicleaners.com',
      },
    });

    console.log('✅ Connected account created successfully!\n');
    console.log('📌 Account Details:');
    console.log('   Account ID:', account.id);
    console.log('   Type:', account.type);
    console.log('   Email:', account.email);
    console.log('   Country:', account.country);
    console.log('   Charges Enabled:', account.charges_enabled);
    console.log('   Payouts Enabled:', account.payouts_enabled);

    // Generate account link for onboarding
    console.log('\n🔗 Creating onboarding link...');
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'https://amanicleaners.com/reauth',
      return_url: 'https://amanicleaners.com/return',
      type: 'account_onboarding',
    });

    console.log('\n✅ Onboarding link created!');
    console.log('   URL:', accountLink.url);
    console.log('\n⚠️  Send this link to Amani Cleaners to complete their Stripe onboarding.');
    console.log('   They will need to provide business details and bank account info.\n');

    console.log('📋 Add these to your .env file:');
    console.log(`STRIPE_PLATFORM_SECRET_KEY="${PLATFORM_SECRET_KEY}"`);
    console.log(`STRIPE_CONNECTED_ACCOUNT_ID="${account.id}"`);
    console.log(`STRIPE_PLATFORM_FEE_PERCENT="1"`); // Your commission percentage
    console.log(`STRIPE_PLATFORM_FEE_FIXED="0"`); // Fixed fee per transaction (in dollars)

    console.log('\n✨ Setup complete!');

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
    };
  } catch (error) {
    console.error('❌ Error creating connected account:', error.message);

    if (error.type === 'StripeAuthenticationError') {
      console.error('\n⚠️  Authentication failed. Make sure your Pipilot secret key has Stripe Connect enabled.');
      console.error('   Go to: https://dashboard.stripe.com/settings/connect');
    }

    throw error;
  }
}

// Run the setup
createConnectedAccount()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
