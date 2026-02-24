# Fix Signup Error - Remove Unused Profiles Table from Signup

## Problem
Users trying to sign up receive the exact error:
```
value in column "id" of relation "profiles" violates not-null constraint
```

**Status**: Login works perfectly fine, only signup is broken.

## Root Cause
The `register_user()` function was trying to create records in the `profiles` table, which caused errors.

**BUT HERE'S THE THING**: After checking the entire codebase, **the profiles table is NOT used anywhere!**

Evidence:
- ✅ `updateProfile()` in stores/index.js updates the **users** table (line 84), NOT profiles
- ✅ AccountPage uses `updateProfile()` which updates **users** table
- ✅ All user data is stored in the **users** table
- ❌ NO code actually reads from or writes to the profiles table

The profiles table exists in the database schema but the application doesn't use it.

## The Solution (SIMPLE!)
**Just don't create profile records during signup!**

The updated `register_user()` function now:
1. ✅ Creates user in `users` table (all we need!)
2. ❌ Does NOT create profiles table record (not needed)

That's it! No more profiles headache.

## Solution
You need to run the migration file to **replace the buggy `register_user` function** with the simple fixed version.

**Important**: The migration will:
1. Drop the existing buggy `register_user()` function
2. Create the new fixed version that ONLY creates users (no profiles!)

### Steps to Fix:

**IMPORTANT**: If you got the error "function name 'register_user' is not unique", follow these steps:

**Step 1: (Optional) Check Existing Functions**
This helps you see what's currently in your database:
   - Open Supabase SQL Editor
   - Copy contents of: `migrations/003_CHECK_EXISTING_FUNCTIONS.sql`
   - Paste and Run
   - You'll see all existing function signatures

**Step 2: Run the Migration**
The migration now uses an advanced DROP approach that removes ALL versions of the functions:
   1. Open Supabase SQL Editor (if not already open)
   2. Click "New Query" button
   3. Copy the **entire contents** of: `migrations/003_add_auth_functions.sql`
   4. Paste it into the SQL editor
   5. Click "Run" button

The migration uses DO blocks to:
- Find ALL versions of register_user/login_with_email/login_with_phone/update_user_password
- Drop each one automatically regardless of signature
- Then create the new fixed versions

3. **Verify the Functions Were Created**
   Run this query to confirm:
   ```sql
   SELECT routine_name, routine_type, routine_definition
   FROM information_schema.routines
   WHERE routine_name = 'register_user'
   AND routine_schema = 'public';
   ```

   You should see the `register_user` function listed. Check the definition to confirm it includes the profile INSERT statement.

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
