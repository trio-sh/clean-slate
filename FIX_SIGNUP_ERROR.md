# Fix Signup Error - Missing Profile Record Creation

## Problem
Users trying to sign up receive the exact error:
```
value in column "id" of relation "profiles" violates not-null constraint
```

**Status**: Login works perfectly fine, only signup is broken.

## Root Cause
Your database has TWO related tables:
- `users` table - stores user authentication data
- `profiles` table - stores user profile data (id, user_id, username, avatar_url, bio, etc.)

The `register_user()` function was:
1. ✅ Creating user record in `users` table successfully
2. ❌ **NOT creating** the corresponding profile record in `profiles` table

When the profile record is missing, the database tries to create it with a NULL `id` value, which violates the NOT NULL constraint on the `id` column.

## The Fix
The updated `register_user()` function now:
1. Creates user in `users` table
2. **Creates matching profile in `profiles` table** with:
   - `id` = gen_random_uuid() (generates unique ID)
   - `user_id` = references the new user
   - `full_name` = first_name + last_name
   - `email`, `phone`, timestamps

## Solution
You need to run the migration file to create these missing functions in your Supabase database.

### Steps to Fix:

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to: **SQL Editor** (in the left sidebar)

2. **Run the Migration**
   - Click "New Query" button
   - Copy the entire contents of: `migrations/003_add_auth_functions.sql`
   - Paste it into the SQL editor
   - Click "Run" button

3. **Verify the Functions Were Created**
   Run this query to confirm:
   ```sql
   SELECT routine_name, routine_type
   FROM information_schema.routines
   WHERE routine_name IN ('register_user', 'login_with_email', 'login_with_phone', 'update_user_password')
   AND routine_schema = 'public';
   ```

   You should see 4 functions listed.

4. **Test User Registration**
   - Go to your app's signup page
   - Try creating a new account
   - It should work without errors now

## What These Functions Do

### `register_user()`
- Creates a new user account in the `users` table
- Generates a unique UUID for the user
- Normalizes phone numbers (adds country code if needed)
- Stores password hash (hashed by client before sending)
- Sets default role as 'customer'
- Returns the created user data

### `login_with_email()`
- Validates email and password
- Returns user data if credentials match
- Throws error if invalid

### `login_with_phone()`
- Validates phone number and password
- Normalizes phone number before checking
- Returns user data if credentials match
- Throws error if invalid

### `update_user_password()`
- Updates a user's password hash
- Updates the `updated_at` timestamp
- Returns true if successful

## Important Notes

- These functions use `SECURITY DEFINER` which means they run with the permissions of the user who created them (bypassing RLS)
- Passwords are expected to be pre-hashed by the client (SHA-256)
- Phone numbers are automatically normalized (digits only, with country code)
- Anonymous users can register and login (functions have `anon` grant)

## Alternative: Demo Mode

If you can't access Supabase right now, you can test in demo mode:
1. Open browser console
2. Run: `localStorage.setItem('amani_mode', 'demo')`
3. Refresh the page
4. All data will be stored locally in IndexedDB (no Supabase needed)
