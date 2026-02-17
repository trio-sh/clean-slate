-- ============================================
-- AMANI'S CLEANERS - MIGRATION SCRIPT
-- ============================================
-- Run this SQL to add authentication and required field updates
-- to an existing Supabase database
-- 
-- Version: 1.1.0
-- Last Updated: 2025

-- ============================================
-- 1. ADD PASSWORD_HASH TO USERS TABLE
-- ============================================
-- This column stores SHA-256 hash of password for phone-based login
-- (we don't use Supabase phone auth, we use custom password)

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(64);

COMMENT ON COLUMN users.password_hash IS 'SHA-256 hash for phone-based login (not Supabase Auth)';

-- ============================================
-- 2. MAKE PHONE REQUIRED AND UNIQUE
-- ============================================
-- Note: Run data cleanup first if you have NULL phones

-- First, update any NULL phones (you may want to customize this)
-- UPDATE users SET phone = 'PLACEHOLDER_' || id::text WHERE phone IS NULL;

-- Then add constraints
ALTER TABLE users 
ALTER COLUMN phone SET NOT NULL;

-- Add unique constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_phone_key' 
        AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_phone_key UNIQUE (phone);
    END IF;
END $$;

-- ============================================
-- 3. UPDATE ORDERS TABLE WITH CUSTOMER FIELDS
-- ============================================

-- Add customer fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(200);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_guest_order BOOLEAN DEFAULT false;

-- Add address text fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- Add order type
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'pickup';

-- Add tax and total columns (our app uses these names)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total DECIMAL(10, 2) DEFAULT 0;

-- Add discount columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code VARCHAR(50);

-- Add notes fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reference_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_instructions TEXT;

-- Add out_for_delivery timestamp
ALTER TABLE orders ADD COLUMN IF NOT EXISTS out_for_delivery_at TIMESTAMPTZ;

-- ============================================
-- 4. CREATE INDEX FOR PHONE LOOKUP
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_phone_lookup ON users(phone);

-- ============================================
-- 5. FUNCTION: AUTHENTICATE BY PHONE
-- ============================================
-- This function validates phone + password_hash for custom phone login

CREATE OR REPLACE FUNCTION authenticate_by_phone(
    p_phone VARCHAR,
    p_password_hash VARCHAR
)
RETURNS TABLE (
    user_id UUID,
    email VARCHAR,
    phone VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    role user_role,
    is_verified BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.phone,
        u.first_name,
        u.last_name,
        u.role,
        u.is_verified
    FROM users u
    WHERE u.phone = p_phone
    AND u.password_hash = p_password_hash
    AND u.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. FUNCTION: UPDATE PASSWORD HASH
-- ============================================

CREATE OR REPLACE FUNCTION update_password_hash(
    p_user_id UUID,
    p_password_hash VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users 
    SET password_hash = p_password_hash,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. RLS POLICIES FOR PHONE AUTH
-- ============================================

-- Allow users to view their own password_hash (needed for verification)
DROP POLICY IF EXISTS "Users can view own profile with hash" ON users;
CREATE POLICY "Users can view own profile with hash" ON users 
FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own password_hash
DROP POLICY IF EXISTS "Users can update own password" ON users;
CREATE POLICY "Users can update own password" ON users 
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- 8. UPDATE DEMO USERS WITH PASSWORD HASH
-- ============================================
-- Password is 'demo123', SHA-256 hash:
-- d3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791

UPDATE users 
SET password_hash = 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791'
WHERE email IN (
    'admin@amanicleaners.com',
    'driver@amanicleaners.com', 
    'staff@amanicleaners.com',
    'customer@example.com'
);

-- ============================================
-- 9. VERIFY CHANGES
-- ============================================

-- Check users table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check orders table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Check demo user has password_hash
SELECT email, phone, first_name, last_name, 
       CASE WHEN password_hash IS NOT NULL THEN 'SET' ELSE 'NOT SET' END as password_status
FROM users
WHERE role IN ('admin', 'driver', 'staff', 'customer')
LIMIT 10;
