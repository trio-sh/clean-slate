-- ============================================
-- FIND AND REMOVE PROFILE-CREATING TRIGGERS
-- ============================================
-- This finds and removes any database triggers that automatically
-- create profile records when users are inserted

-- ============================================
-- STEP 1: FIND ALL TRIGGERS ON USERS TABLE
-- ============================================
-- Run this first to see what triggers exist

SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
ORDER BY trigger_name;

-- ============================================
-- STEP 2: FIND FUNCTIONS THAT CREATE PROFILES
-- ============================================
-- Look for functions that insert into profiles table

SELECT
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_type = 'FUNCTION'
AND routine_definition ILIKE '%INSERT%profiles%'
ORDER BY routine_name;

-- ============================================
-- STEP 3: DROP ALL PROFILE-CREATING TRIGGERS
-- ============================================
-- This removes triggers that auto-create profiles

-- Drop common Supabase trigger names
DROP TRIGGER IF EXISTS on_auth_user_created ON users CASCADE;
DROP TRIGGER IF EXISTS handle_new_user ON users CASCADE;
DROP TRIGGER IF EXISTS create_profile_for_new_user ON users CASCADE;
DROP TRIGGER IF EXISTS auto_create_profile ON users CASCADE;
DROP TRIGGER IF EXISTS insert_profile_for_user ON users CASCADE;

-- Drop any trigger functions that create profiles
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_profile_for_new_user() CASCADE;
DROP FUNCTION IF EXISTS auto_create_profile() CASCADE;
DROP FUNCTION IF EXISTS insert_profile_for_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================
-- STEP 4: VERIFY TRIGGERS ARE GONE
-- ============================================
-- Run this to confirm no triggers remain on users table

SELECT
    trigger_name,
    event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'users';

-- Should return no rows if triggers are successfully removed
