-- ============================================
-- MIGRATION 003: Authentication RPC Functions
-- ============================================
-- This migration adds the missing RPC functions for user registration and login
-- that the application code expects to exist in Supabase

-- ============================================
-- 1. FUNCTION: REGISTER USER
-- ============================================
-- Creates a new user account with email/phone and password
-- Returns the created user record

CREATE OR REPLACE FUNCTION register_user(
    p_email VARCHAR,
    p_password VARCHAR,
    p_first_name VARCHAR,
    p_last_name VARCHAR,
    p_phone VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    email VARCHAR,
    phone VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    role user_role,
    is_active BOOLEAN,
    is_verified BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_user_id UUID;
    v_normalized_phone VARCHAR;
    v_full_name VARCHAR;
BEGIN
    -- Generate new UUID for user
    v_user_id := gen_random_uuid();

    -- Normalize phone (remove non-digits, add country code if needed)
    IF p_phone IS NOT NULL AND p_phone != '' THEN
        v_normalized_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
        -- Add country code if not present (assume North America)
        IF length(v_normalized_phone) = 10 THEN
            v_normalized_phone := '1' || v_normalized_phone;
        END IF;
    ELSE
        v_normalized_phone := NULL;
    END IF;

    -- Create full name for profile
    v_full_name := TRIM(CONCAT(p_first_name, ' ', p_last_name));

    -- Insert new user
    INSERT INTO users (
        id,
        email,
        phone,
        first_name,
        last_name,
        password_hash,
        role,
        is_active,
        is_verified,
        first_order_discount_used,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        p_email,
        v_normalized_phone,
        p_first_name,
        p_last_name,
        p_password,  -- Password is already hashed by client
        'customer',
        true,
        false,
        false,
        NOW(),
        NOW()
    );

    -- Create corresponding profile record
    INSERT INTO profiles (
        id,
        user_id,
        email,
        phone,
        full_name,
        avatar_url,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        v_user_id,
        p_email,
        v_normalized_phone,
        v_full_name,
        NULL,
        NOW(),
        NOW()
    );

    -- Return the created user
    RETURN QUERY
    SELECT
        u.id,
        u.email,
        u.phone,
        u.first_name,
        u.last_name,
        u.role,
        u.is_active,
        u.is_verified,
        u.created_at
    FROM users u
    WHERE u.id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. FUNCTION: LOGIN WITH EMAIL
-- ============================================
-- Authenticates user with email and password
-- Returns user record if credentials are valid

CREATE OR REPLACE FUNCTION login_with_email(
    p_email VARCHAR,
    p_password VARCHAR
)
RETURNS TABLE (
    id UUID,
    email VARCHAR,
    phone VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    role user_role,
    depot_id UUID,
    is_active BOOLEAN,
    is_verified BOOLEAN,
    created_at TIMESTAMPTZ
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
        u.depot_id,
        u.is_active,
        u.is_verified,
        u.created_at
    FROM users u
    WHERE u.email = p_email
    AND u.password_hash = p_password
    AND u.is_active = true;

    -- If no user found, raise exception
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid email or password';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. FUNCTION: LOGIN WITH PHONE
-- ============================================
-- Authenticates user with phone number and password
-- Returns user record if credentials are valid

CREATE OR REPLACE FUNCTION login_with_phone(
    p_phone VARCHAR,
    p_password VARCHAR
)
RETURNS TABLE (
    id UUID,
    email VARCHAR,
    phone VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    role user_role,
    depot_id UUID,
    is_active BOOLEAN,
    is_verified BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_normalized_phone VARCHAR;
BEGIN
    -- Normalize phone number
    v_normalized_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
    IF length(v_normalized_phone) = 10 THEN
        v_normalized_phone := '1' || v_normalized_phone;
    END IF;

    RETURN QUERY
    SELECT
        u.id,
        u.email,
        u.phone,
        u.first_name,
        u.last_name,
        u.role,
        u.depot_id,
        u.is_active,
        u.is_verified,
        u.created_at
    FROM users u
    WHERE u.phone = v_normalized_phone
    AND u.password_hash = p_password
    AND u.is_active = true;

    -- If no user found, raise exception
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid phone number or password';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. FUNCTION: UPDATE USER PASSWORD
-- ============================================
-- Updates a user's password
-- Returns true if successful

CREATE OR REPLACE FUNCTION update_user_password(
    p_user_id UUID,
    p_password VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users
    SET password_hash = p_password,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. GRANT EXECUTE PERMISSIONS
-- ============================================
-- Allow authenticated and anonymous users to call these functions

GRANT EXECUTE ON FUNCTION register_user TO anon, authenticated;
GRANT EXECUTE ON FUNCTION login_with_email TO anon, authenticated;
GRANT EXECUTE ON FUNCTION login_with_phone TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_user_password TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify functions were created:
-- SELECT routine_name, routine_type
-- FROM information_schema.routines
-- WHERE routine_name IN ('register_user', 'login_with_email', 'login_with_phone', 'update_user_password')
-- AND routine_schema = 'public';
