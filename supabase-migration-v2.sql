-- ============================================
-- MIGRATION V2: Add missing columns to users table
-- Run this in Supabase SQL Editor AFTER the initial schema and RLS fix
-- ============================================

-- Add driver-specific fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS vehicle VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS license_plate VARCHAR(20);

-- Add staff-specific fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10, 2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add customer address field (direct on user for convenience)
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;

-- Fix phone constraint - make nullable for admin-created users
-- (customers who register normally will still provide phone)
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE users ALTER COLUMN phone DROP DEFAULT;

-- Fix first_name/last_name - make nullable for flexibility
ALTER TABLE users ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE users ALTER COLUMN last_name DROP NOT NULL;

-- Drop unique constraint on phone if it exists (allows null phones)
-- This is needed because multiple users with NULL phone would violate unique
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_key;

-- Re-add unique constraint that allows nulls (PostgreSQL handles this correctly)
-- NULL values are not considered equal, so multiple NULLs are allowed
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique ON users(phone) WHERE phone IS NOT NULL AND phone != '';

-- ============================================
-- Verify the changes
-- ============================================
-- Run this to confirm: SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;
