// Script to create and configure Stripe webhook endpoint
import Stripe from 'stripe';

const stripe = new Stripe('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');

const WEBHOOK_URL = 'https://amanicleaners.com/api/stripe-webhook';

// Events to listen for
const WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.trial_will_end',
  'invoice.paid',
  'invoice.payment_failed',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
];

async function setupWebhook() {
  try {
    console.log('🔍 Checking for existing webhooks...');

    // List existing webhooks
    const existingWebhooks = await stripe.webhookEndpoints.list();

    // Check if webhook already exists for this URL
    const existingWebhook = existingWebhooks.data.find(
      webhook => webhook.url === WEBHOOK_URL
    );

    if (existingWebhook) {
      console.log('✅ Webhook already exists!');
      console.log('\n📌 Webhook Details:');
      console.log('   ID:', existingWebhook.id);
      console.log('   URL:', existingWebhook.url);
      console.log('   Status:', existingWebhook.status);
      console.log('   Events:', existingWebhook.enabled_events.length);

      // Update if needed
      console.log('\n🔄 Updating webhook events...');
      const updatedWebhook = await stripe.webhookEndpoints.update(
        existingWebhook.id,
        {
          enabled_events: WEBHOOK_EVENTS,
        }
      );

      console.log('✅ Webhook updated successfully!');
      console.log('\n⚠️  Note: The webhook signing secret is not returned for existing webhooks.');
      console.log('   If you need the signing secret, you must:');
      console.log('   1. Go to https://dashboard.stripe.com/webhooks');
      console.log('   2. Click on your webhook endpoint');
      console.log('   3. Click "Reveal" next to "Signing secret"');
      console.log('   4. Add it to your .env file as STRIPE_WEBHOOK_SECRET');

      return updatedWebhook;
    }

    // Create new webhook
    console.log('📝 Creating new webhook endpoint...');
    const webhook = await stripe.webhookEndpoints.create({
      url: WEBHOOK_URL,
      enabled_events: WEBHOOK_EVENTS,
      api_version: '2024-12-18.acacia', // Latest API version
    });

    console.log('\n✅ Webhook created successfully!');
    console.log('\n📌 Webhook Details:');
    console.log('   ID:', webhook.id);
    console.log('   URL:', webhook.url);
    console.log('   Status:', webhook.status);
    console.log('   Events:', webhook.enabled_events.length);

    console.log('\n🔑 Webhook Signing Secret:');
    console.log('   ' + webhook.secret);

    console.log('\n📋 Add this to your .env file:');
    console.log(`   STRIPE_WEBHOOK_SECRET="${webhook.secret}"`);

    console.log('\n✅ Webhook configuration complete!');
    console.log('\n📚 Events configured:');
    WEBHOOK_EVENTS.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event}`);
    });

    return webhook;
  } catch (error) {
    console.error('❌ Error setting up webhook:', error.message);

    if (error.type === 'StripeAuthenticationError') {
      console.error('\n⚠️  Authentication failed. Please check your Stripe secret key.');
    } else if (error.type === 'StripeConnectionError') {
      console.error('\n⚠️  Connection error. Please check your internet connection.');
    }

    throw error;
  }
}

// Run the setup
setupWebhook()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  });
