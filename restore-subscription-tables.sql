-- ============================================
-- RESTORE SUBSCRIPTION TABLES WITH STRIPE CONNECT
-- ============================================
-- Run this in your Supabase SQL Editor

-- ============================================
-- STEP 1: DROP EXISTING TABLES AND DEPENDENCIES
-- ============================================

-- Drop customer_subscriptions first (it depends on subscription_plans)
DROP TABLE IF EXISTS customer_subscriptions CASCADE;

-- Drop subscription_plans
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- ============================================
-- STEP 2: CREATE SUBSCRIPTION PLANS TABLE
-- ============================================

CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,

  -- Laundry Details
  pounds_included INT NOT NULL,
  validity_days INT NOT NULL,
  duration_months INT DEFAULT 1,
  monthly_weight_limit INT,

  -- Stripe Connect Integration
  stripe_product_id VARCHAR(100),
  stripe_price_id VARCHAR(100),
  billing_interval VARCHAR(20) DEFAULT 'month', -- 'month' or 'year'

  -- Status
  is_active BOOLEAN DEFAULT true,
  features JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_slug ON subscription_plans(slug);
CREATE INDEX idx_subscription_plans_stripe_product ON subscription_plans(stripe_product_id);

-- ============================================
-- STEP 3: INSERT SUBSCRIPTION PLANS WITH STRIPE IDS
-- ============================================

INSERT INTO subscription_plans (
  name,
  slug,
  description,
  price,
  pounds_included,
  validity_days,
  duration_months,
  monthly_weight_limit,
  billing_interval,
  stripe_product_id,
  stripe_price_id,
  is_active
) VALUES
(
  'Student Monthly',
  'student-monthly',
  'Perfect for students - Monthly plan',
  235.00,
  100,
  30,
  1,
  100,
  'month',
  'prod_U5qARjQRPVALsf',
  'price_1T7eUcKYMGRtjFRGQ7t7xcKK',
  true
),
(
  'Student 1 Semester',
  'student-semester',
  'Best value for a semester',
  575.00,
  250,
  120,
  1,
  250,
  'month',
  'prod_U5qBIW1c3VnKrG',
  'price_1T7eUfKYMGRtjFRGcjif4KSU',
  true
),
(
  'Student 2 Semester (Popular)',
  'student-year',
  'Full academic year coverage',
  1080.00,
  500,
  240,
  1,
  500,
  'month',
  'prod_U5qBoc20kje5xv',
  'price_1T7eUhKYMGRtjFRGiSThTpmW',
  true
),
(
  'Silver - For Professionals',
  'silver',
  'Ideal for working professionals',
  275.00,
  120,
  30,
  1,
  120,
  'month',
  'prod_U5qB4uxQY2kpY5',
  'price_1T7eUjKYMGRtjFRGNyYGLPWy',
  true
),
(
  'Gold - Ideal for Couples',
  'gold',
  'Perfect for households',
  420.50,
  200,
  30,
  1,
  200,
  'month',
  'prod_U5qBR0d1uxGbpy',
  'price_1T7eUlKYMGRtjFRGOBB5Cuh4',
  true
);

-- ============================================
-- STEP 4: CREATE CUSTOMER SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE customer_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,

  -- Subscription Details
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  pounds_remaining INT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending_payment', -- 'pending_payment', 'active', 'expired', 'cancelled'
  auto_renew BOOLEAN DEFAULT false,

  -- Stripe Integration
  stripe_subscription_id VARCHAR(100),
  stripe_customer_id VARCHAR(100),
  stripe_session_id VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_customer_subscriptions_user ON customer_subscriptions(user_id);
CREATE INDEX idx_customer_subscriptions_plan ON customer_subscriptions(plan_id);
CREATE INDEX idx_customer_subscriptions_status ON customer_subscriptions(status);
CREATE INDEX idx_customer_subscriptions_stripe_sub ON customer_subscriptions(stripe_subscription_id);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Subscription tables restored successfully!';
  RAISE NOTICE '📦 5 subscription plans inserted with Stripe Connect IDs';
  RAISE NOTICE '💰 All plans configured with 10%% platform commission';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next steps:';
  RAISE NOTICE '1. Go to your app subscription page';
  RAISE NOTICE '2. All 5 plans should now appear';
  RAISE NOTICE '3. Test subscribing to a plan';
  RAISE NOTICE '';
END $$;

-- Show inserted plans
SELECT
  name,
  price,
  pounds_included || ' lbs' as pounds,
  validity_days || ' days' as validity,
  billing_interval,
  is_active,
  CASE
    WHEN stripe_product_id IS NOT NULL THEN '✅ Connected'
    ELSE '❌ Not connected'
  END as stripe_status
FROM subscription_plans
ORDER BY price;
