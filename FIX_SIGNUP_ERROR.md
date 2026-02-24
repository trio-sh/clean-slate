# Fix Signup Error - Remove Database Triggers Creating Profiles

## Problem
Users trying to sign up receive the exact error:
```
value in column "id" of relation "profiles" violates not-null constraint
```

**Status**: Login works fine, only signup is broken.

**Even after updating register_user(), error persists!**

## Root Cause: DATABASE TRIGGERS!

There are **database triggers** automatically creating profile records when users are inserted!

Common Supabase trigger names:
- `on_auth_user_created`
- `handle_new_user`
- `create_profile_for_new_user`

These triggers fire AFTER user INSERT and try to create a profile record automatically.

**The Problem**: The profiles table is NOT even used by your application!
- ✅ `updateProfile()` updates the **users** table, NOT profiles
- ✅ All user data stored in **users** table
- ❌ NO code reads from or writes to profiles table

## The Solution: Remove the Triggers!

### Quick Fix (Copy & Run This)

**Open Supabase SQL Editor and run:**

```sql
-- Drop all profile-creating triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON users CASCADE;
DROP TRIGGER IF EXISTS handle_new_user ON users CASCADE;
DROP TRIGGER IF EXISTS create_profile_for_new_user ON users CASCADE;
DROP TRIGGER IF EXISTS auto_create_profile ON users CASCADE;
DROP TRIGGER IF EXISTS insert_profile_for_user ON users CASCADE;

-- Drop trigger functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_profile_for_new_user() CASCADE;
DROP FUNCTION IF EXISTS auto_create_profile() CASCADE;
DROP FUNCTION IF EXISTS insert_profile_for_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
```

### Verify It Worked

Run this to check no triggers remain:
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'users';
```

Should return **0 rows** if successful.

### Test Signup

1. Go to your app's signup page
2. Try creating a new account
3. Should work now! ✅

## If Still Getting Errors

### Step 1: Find What's Creating Profiles

```sql
-- See all triggers on users table
SELECT trigger_name, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users';

-- Find functions that insert into profiles
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_type = 'FUNCTION'
AND routine_definition ILIKE '%INSERT%profiles%';
```

### Step 2: Manually Drop Them

If you find other triggers/functions, drop them:
```sql
DROP TRIGGER IF EXISTS <trigger_name> ON users CASCADE;
DROP FUNCTION IF EXISTS <function_name>() CASCADE;
```

## Complete Investigation (Optional)

If you want to see everything before removing:

1. Open Supabase SQL Editor
2. Copy ALL of `migrations/004_FIND_AND_REMOVE_PROFILE_TRIGGERS.sql`
3. Run it step by step
4. It will show you what exists, then remove it

## Summary

✅ **The fix**: Remove database triggers auto-creating profiles
✅ **Why**: Profiles table not used by application
✅ **Result**: Signup works without profile headaches

No more "null value in profiles" errors! 🎉
