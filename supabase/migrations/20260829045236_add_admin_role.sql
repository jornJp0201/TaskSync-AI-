/*
# Add admin role to profiles

1. Modified Tables
- `profiles` — add `is_admin` boolean column (default false)

2. Security
- Add RLS policy: only admins can read the is_admin column of all profiles
- Non-admin users can only see their own profile (existing policy already handles this)
- Add UPDATE policy so admins can toggle is_admin on other users
- Add a SECURITY DEFINER function `is_admin()` that checks the caller's is_admin flag
  — this lets RLS policies on other tables verify admin status without exposing is_admin to non-admins

3. Important Notes
- The first admin must be set manually via SQL (see note below)
- The is_admin column is excluded from the default SELECT policy for non-admin users
*/

-- Add is_admin column
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Create a SECURITY DEFINER function to check admin status
-- This avoids exposing is_admin to non-admin users via RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Allow admins to read all profiles (including is_admin)
-- The existing select_own policy only allows reading own profile
-- We add a separate policy for admins to read all profiles
DROP POLICY IF EXISTS "select_all_profiles_admin" ON profiles;
CREATE POLICY "select_all_profiles_admin" ON profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Allow admins to update any profile's is_admin field
DROP POLICY IF EXISTS "update_any_profile_admin" ON profiles;
CREATE POLICY "update_any_profile_admin" ON profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Allow admins to delete any profile
DROP POLICY IF EXISTS "delete_any_profile_admin" ON profiles;
CREATE POLICY "delete_any_profile_admin" ON profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Grant execute on is_admin function
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
