/*
# Add Google Calendar sync support

## Overview
Adds a `google_calendar_tokens` table to store each user's Google OAuth
tokens (access + refresh) for Google Calendar API integration.
Also adds columns to `calendar_events` and `tasks` to track sync state
with Google Calendar (google_event_id for events, google_event_id +
color_id for tasks exported to Google Calendar).

## New Tables
### google_calendar_tokens
- id (uuid, PK)
- user_id (uuid, NOT NULL, DEFAULT auth.uid(), FK -> auth.users ON DELETE CASCADE)
- access_token (text, NOT NULL)
- refresh_token (text, NOT NULL)
- token_expires_at (timestamptz, NOT NULL)
- google_email (text, nullable) — the Google account email for display
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())

## Modified Tables
### calendar_events
- Added column: google_event_id (text, nullable) — stores the Google Calendar
  event ID when an event is synced from/to Google Calendar. Used to avoid
  duplicate imports and to support bi-directional updates.

### tasks
- Added column: google_event_id (text, nullable) — stores the Google Calendar
  event ID when a task is exported to Google Calendar.
- Added column: google_color_id (text, nullable, default '9') — Google Calendar
  color ID for tasks (default '9' = blue-green, distinct from event colors).

## Security
- RLS enabled on google_calendar_tokens.
- 4 owner-scoped policies (SELECT/INSERT/UPDATE/DELETE) with auth.uid() = user_id.
- google_calendar_tokens is NOT accessible to anon role.

## Indexes
- google_calendar_tokens(user_id) — lookup by owner (unique, one token set per user)
- calendar_events(google_event_id) — lookup during sync
- tasks(google_event_id) — lookup during sync
*/

-- ===== google_calendar_tokens =====
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  google_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_gcal_tokens" ON google_calendar_tokens;
CREATE POLICY "select_own_gcal_tokens" ON google_calendar_tokens FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_gcal_tokens" ON google_calendar_tokens;
CREATE POLICY "insert_own_gcal_tokens" ON google_calendar_tokens FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_gcal_tokens" ON google_calendar_tokens;
CREATE POLICY "update_own_gcal_tokens" ON google_calendar_tokens FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_gcal_tokens" ON google_calendar_tokens;
CREATE POLICY "delete_own_gcal_tokens" ON google_calendar_tokens FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_gcal_tokens_user ON google_calendar_tokens(user_id);

-- ===== add sync columns to calendar_events =====
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_events' AND column_name = 'google_event_id'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN google_event_id text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_events_google_event_id ON calendar_events(google_event_id);

-- ===== add sync columns to tasks =====
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'google_event_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN google_event_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'google_color_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN google_color_id text DEFAULT '9';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tasks_google_event_id ON tasks(google_event_id);
