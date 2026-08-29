/*
# Create profiles table for user accounts

## Overview
Creates a `profiles` table that extends Supabase's built-in `auth.users` with
application-specific user data (display name, avatar URL, plan tier).

## New Tables
- `profiles`
  - `id` (uuid, primary key) — references `auth.users(id)`, cascading delete
  - `email` (text, not null) — denormalized from auth.users for convenience
  - `full_name` (text, nullable) — user's display name
  - `avatar_url` (text, nullable) — profile image URL
  - `plan` (text, not null, default 'free') — subscription tier: free | pro | ultra
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

## Security
- RLS enabled on `profiles`.
- SELECT: authenticated users can read only their own profile.
- INSERT: authenticated users can insert only their own profile (auth.uid() = id).
- UPDATE: authenticated users can update only their own profile.
- DELETE: authenticated users can delete only their own profile.
- The `plan` column is protected: users cannot escalate their own plan via
  direct updates — a trigger enforces that only the `full_name` and `avatar_url`
  columns are user-editable. Plan changes must come through a privileged path.

## Trigger
- `handle_new_user`: automatically creates a profile row when a new user signs up
  via Supabase Auth. Fires on INSERT to `auth.users`.
- `update_updated_at`: auto-updates `updated_at` on every row update.
- `protect_plan_column`: prevents users from changing their own `plan` or `email`
  through direct UPDATE — only `full_name` and `avatar_url` are user-writable.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'ultra')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_update_updated_at ON profiles;
CREATE TRIGGER profiles_update_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Protect plan and email columns from user-side updates
CREATE OR REPLACE FUNCTION public.protect_plan_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow full_name and avatar_url to be changed by the user
  -- email and plan are preserved from the existing row
  NEW.email = OLD.email;
  NEW.plan = OLD.plan;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_columns ON profiles;
CREATE TRIGGER profiles_protect_columns
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_plan_column();
