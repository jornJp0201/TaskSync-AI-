/*
# Create tasks, projects, calendar_events, and study_logs tables

## Overview
Creates the four core data tables for TaskSync AI. All tables are
owner-scoped (user_id) with RLS policies so each authenticated user
can only access their own rows. Owner columns default to auth.uid()
so inserts that omit user_id still satisfy RLS.

## New Tables

### projects
- id (uuid, PK)
- user_id (uuid, NOT NULL, DEFAULT auth.uid(), FK -> auth.users ON DELETE CASCADE)
- name (text, NOT NULL)
- color (text, default '#0ea5e9')
- icon (text, nullable)
- created_at (timestamptz, default now())

### tasks
- id (uuid, PK)
- user_id (uuid, NOT NULL, DEFAULT auth.uid(), FK -> auth.users ON DELETE CASCADE)
- title (text, NOT NULL)
- description (text, nullable)
- priority (text, NOT NULL, default 'medium', CHECK in low/medium/high/urgent)
- status (text, NOT NULL, default 'todo', CHECK in todo/in_progress/done)
- estimated_minutes (int, NOT NULL, default 30)
- actual_minutes (int, nullable)
- due_date (date, nullable)
- project_id (uuid, nullable, FK -> projects ON DELETE SET NULL)
- tags (text[], default '{}')
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())

### calendar_events
- id (uuid, PK)
- user_id (uuid, NOT NULL, DEFAULT auth.uid(), FK -> auth.users ON DELETE CASCADE)
- title (text, NOT NULL)
- start_time (timestamptz, NOT NULL)
- end_time (timestamptz, NOT NULL)
- type (text, NOT NULL, default 'work', CHECK in meeting/work/personal/study/break)
- location (text, nullable)
- is_fixed (boolean, default true)
- created_at (timestamptz, default now())

### study_logs
- id (uuid, PK)
- user_id (uuid, NOT NULL, DEFAULT auth.uid(), FK -> auth.users ON DELETE CASCADE)
- task_id (uuid, nullable, FK -> tasks ON DELETE SET NULL)
- date (date, NOT NULL)
- minutes (int, NOT NULL, CHECK > 0)
- category (text, NOT NULL, default 'その他')
- memo (text, nullable)
- created_at (timestamptz, default now())

## Security
- RLS enabled on ALL four tables.
- Each table has 4 policies (SELECT/INSERT/UPDATE/DELETE) scoped to
  TO authenticated with auth.uid() = user_id ownership checks.
- No policies for anon role (app requires sign-in).

## Indexes
- tasks(user_id) — frequent lookup by owner
- tasks(due_date) — sorting by deadline
- tasks(status) — filtering by status
- calendar_events(user_id, start_time) — timeline queries
- study_logs(user_id, date) — analytics queries
- projects(user_id) — lookup by owner

## Triggers
- tasks_update_updated_at: auto-update updated_at on row update
*/

-- ===== projects =====
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#0ea5e9',
  icon text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_projects" ON projects;
CREATE POLICY "select_own_projects" ON projects FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_projects" ON projects;
CREATE POLICY "insert_own_projects" ON projects FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_projects" ON projects;
CREATE POLICY "update_own_projects" ON projects FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_projects" ON projects;
CREATE POLICY "delete_own_projects" ON projects FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- ===== tasks =====
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  estimated_minutes integer NOT NULL DEFAULT 30,
  actual_minutes integer,
  due_date date,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tasks" ON tasks;
CREATE POLICY "select_own_tasks" ON tasks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tasks" ON tasks;
CREATE POLICY "insert_own_tasks" ON tasks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tasks" ON tasks;
CREATE POLICY "update_own_tasks" ON tasks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tasks" ON tasks;
CREATE POLICY "delete_own_tasks" ON tasks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- ===== calendar_events =====
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  type text NOT NULL DEFAULT 'work' CHECK (type IN ('meeting', 'work', 'personal', 'study', 'break')),
  location text,
  is_fixed boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_events" ON calendar_events;
CREATE POLICY "select_own_events" ON calendar_events FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_events" ON calendar_events;
CREATE POLICY "insert_own_events" ON calendar_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_events" ON calendar_events;
CREATE POLICY "update_own_events" ON calendar_events FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_events" ON calendar_events;
CREATE POLICY "delete_own_events" ON calendar_events FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_events_user_start ON calendar_events(user_id, start_time);

-- ===== study_logs =====
CREATE TABLE IF NOT EXISTS study_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  date date NOT NULL,
  minutes integer NOT NULL CHECK (minutes > 0),
  category text NOT NULL DEFAULT 'その他',
  memo text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_study_logs" ON study_logs;
CREATE POLICY "select_own_study_logs" ON study_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_study_logs" ON study_logs;
CREATE POLICY "insert_own_study_logs" ON study_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_study_logs" ON study_logs;
CREATE POLICY "update_own_study_logs" ON study_logs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_study_logs" ON study_logs;
CREATE POLICY "delete_own_study_logs" ON study_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_study_logs_user_date ON study_logs(user_id, date);

-- ===== trigger for tasks.updated_at =====
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tasks_update_updated_at ON tasks;
CREATE TRIGGER tasks_update_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
