// Stripe Integration Utility
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

/**
 * Create a payment link for an order
 * @param {Object} params - Payment link parameters
 * @param {string} params.orderId - Order ID
 * @param {number} params.amount - Amount in dollars
 * @param {string} params.currency - Currency code (default: 'cad')
 * @param {string} params.customerEmail - Customer email
 * @param {string} params.customerName - Customer name
 * @param {string} params.description - Payment description
 * @returns {Promise<Object>} - Payment link data
 */
export async function createPaymentLink({
  orderId,
  amount,
  currency = 'cad',
  customerEmail,
  customerName,
  description,
}) {
  try {
    const response = await fetch('/api/create-payment-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        amount,
        currency,
        customerEmail,
        customerName,
        description,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create payment link');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating payment link:', error);
    throw error;
  }
}

/**
 * Create a Stripe Checkout session for subscriptions
 * @param {Object} params - Checkout parameters
 * @param {string} params.planId - Subscription plan ID
 * @param {string} params.planName - Plan name
 * @param {number} params.price - Price in dollars
 * @param {string} params.interval - Billing interval ('month' or 'year')
 * @param {string} params.customerId - Customer ID
 * @param {string} params.customerEmail - Customer email
 * @param {string} params.successUrl - Success redirect URL
 * @param {string} params.cancelUrl - Cancel redirect URL
 * @returns {Promise<Object>} - Checkout session data
 */
export async function createSubscriptionCheckout({
  planId,
  planName,
  price,
  interval,
  customerId,
  customerEmail,
  successUrl,
  cancelUrl,
}) {
  try {
    const response = await fetch('/api/create-subscription-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId,
        planName,
        price,
        interval,
        customerId,
        customerEmail,
        successUrl,
        cancelUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Redirect to Stripe Checkout
 * @param {string} sessionId - Stripe Checkout Session ID
 */
export async function redirectToCheckout(sessionId) {
  const stripe = await stripePromise;
  const { error } = await stripe.redirectToCheckout({ sessionId });

  if (error) {
    console.error('Error redirecting to checkout:', error);
    throw error;
  }
}

/**
 * Subscribe to a plan
 * @param {Object} plan - Subscription plan object
 * @param {string} customerId - Customer ID
 * @param {string} customerEmail - Customer email
 */
export async function subscribeToPlan(plan, customerId, customerEmail) {
  try {
    // Ensure billing_interval exists, default to 'month' if not set
    const interval = plan.billing_interval || plan.interval || 'month';

    console.log('Subscribing to plan:', {
      planId: plan.id,
      planName: plan.name,
      price: plan.price,
      interval,
      billing_interval: plan.billing_interval
    });

    const { sessionUrl } = await createSubscriptionCheckout({
      planId: plan.id,
      planName: plan.name,
      price: plan.price,
      interval: interval,
      customerId,
      customerEmail,
    });

    // Redirect to Stripe Checkout
    window.location.href = sessionUrl;
  } catch (error) {
    console.error('Error subscribing to plan:', error);
    throw error;
  }
}

export default stripePromise;
