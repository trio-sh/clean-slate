-- ============================================
-- CHECK EXISTING FUNCTIONS
-- ============================================
-- Run this FIRST to see what register_user functions exist in your database
-- This helps diagnose why the DROP is failing

-- Show ALL register_user function signatures
SELECT
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    oid::regprocedure as full_signature
FROM pg_proc
WHERE proname = 'register_user'
AND pg_function_is_visible(oid);

-- Show ALL login_with_email function signatures
SELECT
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    oid::regprocedure as full_signature
FROM pg_proc
WHERE proname = 'login_with_email'
AND pg_function_is_visible(oid);

-- Show ALL login_with_phone function signatures
SELECT
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    oid::regprocedure as full_signature
FROM pg_proc
WHERE proname = 'login_with_phone'
AND pg_function_is_visible(oid);

-- Show ALL update_user_password function signatures
SELECT
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    oid::regprocedure as full_signature
FROM pg_proc
WHERE proname = 'update_user_password'
AND pg_function_is_visible(oid);
