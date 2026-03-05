// Test Stripe Keys Validity
import Stripe from 'stripe';

// Keys from .env
const PUBLISHABLE_KEY = 'pk_live_51Stc4lRfPPNSyjKgYRfzsFr5nRlv63lyFCkkT1K00A0tZh7GPFJtutz0k6XFDkXhwAX08IHU9AK8Zg1KJxMDP9S900LOrlKAlW';
const SECRET_KEY = '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';

async function testKeys() {
  console.log('🔍 Testing Stripe Keys...\n');

  // Test Publishable Key
  console.log('📋 Publishable Key:');
  console.log('   ' + PUBLISHABLE_KEY);

  if (PUBLISHABLE_KEY.startsWith('pk_live_')) {
    console.log('   ✅ Format: Valid (Live mode)');
  } else if (PUBLISHABLE_KEY.startsWith('pk_test_')) {
    console.log('   ⚠️  Format: Valid (Test mode)');
  } else {
    console.log('   ❌ Format: Invalid');
  }

  console.log('\n📋 Secret Key:');
  console.log('   ' + SECRET_KEY.substring(0, 20) + '...' + SECRET_KEY.substring(SECRET_KEY.length - 6));

  if (SECRET_KEY.startsWith('sk_live_')) {
    console.log('   ✅ Format: Valid (Live mode)');
  } else if (SECRET_KEY.startsWith('sk_test_')) {
    console.log('   ⚠️  Format: Valid (Test mode)');
  } else {
    console.log('   ❌ Format: Invalid');
  }

  // Test Secret Key by making API call
  console.log('\n🧪 Testing Secret Key with API call...');
  const stripe = new Stripe(SECRET_KEY);

  try {
    // Try to retrieve account information
    const account = await stripe.accounts.retrieve();

    console.log('   ✅ SECRET KEY IS VALID!\n');
    console.log('📌 Account Details:');
    console.log('   Account ID:', account.id);
    console.log('   Business Name:', account.business_profile?.name || 'Not set');
    console.log('   Email:', account.email || 'Not set');
    console.log('   Country:', account.country);
    console.log('   Charges Enabled:', account.charges_enabled);
    console.log('   Payouts Enabled:', account.payouts_enabled);
    console.log('   Type:', account.type);

    // Check if Stripe Connect is enabled
    console.log('\n🔗 Stripe Connect Status:');
    if (account.capabilities?.card_payments) {
      console.log('   ✅ Card Payments:', account.capabilities.card_payments);
    }
    if (account.capabilities?.transfers) {
      console.log('   ✅ Transfers (Connect):', account.capabilities.transfers);
    } else {
      console.log('   ⚠️  Stripe Connect NOT enabled on this account');
      console.log('   You need to enable Connect for the platform model to work.');
    }

    return { valid: true, account };

  } catch (error) {
    console.log('   ❌ SECRET KEY IS INVALID!\n');
    console.log('Error Details:');
    console.log('   Type:', error.type);
    console.log('   Code:', error.code);
    console.log('   Message:', error.message);

    if (error.code === 'api_key_expired') {
      console.log('\n⚠️  This key has been REVOKED by Stripe (likely due to .env being pushed to GitHub)');
      console.log('   You need to generate a NEW secret key from: https://dashboard.stripe.com/apikeys');
    }

    return { valid: false, error };
  }
}

// Run the test
testKeys()
  .then((result) => {
    if (result.valid) {
      console.log('\n✨ Your Stripe keys are working!');
    } else {
      console.log('\n❌ Your Stripe keys need to be replaced.');
      console.log('   Go to https://dashboard.stripe.com/apikeys to generate new ones.');
    }
    process.exit(result.valid ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  });
