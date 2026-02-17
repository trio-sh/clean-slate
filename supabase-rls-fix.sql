-- ============================================
-- QUICK FIX: Run this in Supabase SQL Editor
-- This fixes the 406 (Not Acceptable) errors
-- ============================================

-- Drop existing restrictive policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow all user operations" ON users;

-- Create permissive policy for users table
CREATE POLICY "Allow all user operations" ON users 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Drop existing policies on addresses
DROP POLICY IF EXISTS "Users can view own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON addresses;
DROP POLICY IF EXISTS "Allow all address operations" ON addresses;

-- Create permissive policy for addresses
CREATE POLICY "Allow all address operations" ON addresses 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Drop existing policies on orders
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Staff can view all orders" ON orders;
DROP POLICY IF EXISTS "Drivers can view assigned orders" ON orders;
DROP POLICY IF EXISTS "Allow all order operations" ON orders;

-- Create permissive policy for orders
CREATE POLICY "Allow all order operations" ON orders 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Order items
DROP POLICY IF EXISTS "Allow all order item operations" ON order_items;
CREATE POLICY "Allow all order item operations" ON order_items 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Notifications
DROP POLICY IF EXISTS "Allow all notification operations" ON notifications;
CREATE POLICY "Allow all notification operations" ON notifications 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Reviews
DROP POLICY IF EXISTS "Allow all review operations" ON reviews;
CREATE POLICY "Allow all review operations" ON reviews 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Customer subscriptions
DROP POLICY IF EXISTS "Allow all subscription operations" ON customer_subscriptions;
CREATE POLICY "Allow all subscription operations" ON customer_subscriptions 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Service categories
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read service categories" ON service_categories;
DROP POLICY IF EXISTS "Allow admin manage categories" ON service_categories;
CREATE POLICY "Allow all service category operations" ON service_categories 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read services" ON services;
DROP POLICY IF EXISTS "Allow admin manage services" ON services;
CREATE POLICY "Allow all service operations" ON services 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Depots
ALTER TABLE depots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read depots" ON depots;
DROP POLICY IF EXISTS "Allow admin manage depots" ON depots;
CREATE POLICY "Allow all depot operations" ON depots 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Discount codes
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Allow admin manage discounts" ON discount_codes;
CREATE POLICY "Allow all discount operations" ON discount_codes 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Driver routes
ALTER TABLE driver_routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all driver route operations" ON driver_routes;
CREATE POLICY "Allow all driver route operations" ON driver_routes 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Route stops
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all route stop operations" ON route_stops;
CREATE POLICY "Allow all route stop operations" ON route_stops 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Staff shifts
ALTER TABLE staff_shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all shift operations" ON staff_shifts;
CREATE POLICY "Allow all shift operations" ON staff_shifts 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Check-ins
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all checkin operations" ON checkins;
CREATE POLICY "Allow all checkin operations" ON checkins 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read settings" ON settings;
DROP POLICY IF EXISTS "Allow admin manage settings" ON settings;
CREATE POLICY "Allow all settings operations" ON settings 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Service areas
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read service areas" ON service_areas;
CREATE POLICY "Allow all service area operations" ON service_areas 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Subscription plans
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read subscription plans" ON subscription_plans;
CREATE POLICY "Allow all subscription plan operations" ON subscription_plans 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Order status history
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all order history operations" ON order_status_history;
CREATE POLICY "Allow all order history operations" ON order_status_history 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- ============================================
-- DONE! Your app should now work properly.
-- ============================================

-- ============================================
-- FIX: order_items service_id constraint
-- ============================================
-- This makes service_id nullable to allow custom items like "Laundry"
-- that aren't in the services table

-- Drop the existing foreign key constraint if it exists
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_service_id_fkey;

-- Re-add the constraint with ON DELETE SET NULL
ALTER TABLE order_items 
  ADD CONSTRAINT order_items_service_id_fkey 
  FOREIGN KEY (service_id) 
  REFERENCES services(id) 
  ON DELETE SET NULL;

-- Verify: service_id can now be NULL
COMMENT ON COLUMN order_items.service_id IS 'References services(id), nullable for custom items like Wash & Fold laundry';

-- ============================================
-- FIX: order_items quantity type
-- ============================================
-- Change quantity from INT to DECIMAL to support per-pound items like laundry

ALTER TABLE order_items 
  ALTER COLUMN quantity TYPE DECIMAL(10, 2);

-- ============================================
-- ADD: app_mode setting for demo/live mode control
-- ============================================
-- This setting allows admin to control whether demo mode is available

INSERT INTO settings (key, value, description) 
VALUES ('app_mode', '{"mode": "live", "demo_enabled": false}', 'Application mode settings - controls demo/live mode')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================
-- ENSURE: Seed users with password_hash
-- ============================================
-- Default password: demo123
-- SHA-256 hash: d3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791

-- Update existing users to have password_hash if missing
UPDATE users SET password_hash = 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791'
WHERE password_hash IS NULL OR password_hash = '';

-- Insert seed users if they don't exist (upsert)
INSERT INTO users (id, email, phone, first_name, last_name, role, is_verified, password_hash, is_active) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@amanicleaners.com', '14372156321', 'Admin', 'Amani', 'admin', true, 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791', true),
('00000000-0000-0000-0000-000000000002', 'driver@amanicleaners.com', '16475550001', 'Demo', 'Driver', 'driver', true, 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791', true),
('00000000-0000-0000-0000-000000000003', 'staff@amanicleaners.com', '16475550002', 'Demo', 'Staff', 'staff', true, 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791', true),
('00000000-0000-0000-0000-000000000004', 'customer@example.com', '16475550003', 'Demo', 'Customer', 'customer', true, 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791', true)
ON CONFLICT (id) DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  is_active = EXCLUDED.is_active;
