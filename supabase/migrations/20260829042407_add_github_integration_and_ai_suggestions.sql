/*
# Add GitHub Integration and AI Suggestion Storage

1. New Tables
- `github_tokens` — stores GitHub OAuth tokens per user
- `github_repos` — cached repository metadata
- `github_issues` — issues/PRs fetched from GitHub
- `ai_suggestions` — AI-generated schedule suggestions
- `ai_prompts` — user-submitted AI prompts and responses

2. Modified Tables
- `tasks` — add github_issue_id, parent_task_id, suggested_start_time, suggested_end_time

3. Security
- RLS enabled on all new tables, owner-scoped to authenticated users
*/

-- ===== github_tokens =====
CREATE TABLE IF NOT EXISTS github_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  github_username text,
  access_token text NOT NULL,
  scope text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE github_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_github_tokens" ON github_tokens;
CREATE POLICY "select_own_github_tokens" ON github_tokens FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_github_tokens" ON github_tokens;
CREATE POLICY "insert_own_github_tokens" ON github_tokens FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_github_tokens" ON github_tokens;
CREATE POLICY "update_own_github_tokens" ON github_tokens FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_github_tokens" ON github_tokens;
CREATE POLICY "delete_own_github_tokens" ON github_tokens FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== github_repos =====
CREATE TABLE IF NOT EXISTS github_repos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_id bigint NOT NULL,
  full_name text NOT NULL,
  name text NOT NULL,
  owner_login text NOT NULL,
  private boolean DEFAULT false,
  html_url text,
  description text,
  language text,
  stars integer DEFAULT 0,
  updated_at_github timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, repo_id)
);

ALTER TABLE github_repos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_github_repos" ON github_repos;
CREATE POLICY "select_own_github_repos" ON github_repos FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_github_repos" ON github_repos;
CREATE POLICY "insert_own_github_repos" ON github_repos FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_github_repos" ON github_repos;
CREATE POLICY "update_own_github_repos" ON github_repos FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_github_repos" ON github_repos;
CREATE POLICY "delete_own_github_repos" ON github_repos FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== github_issues =====
CREATE TABLE IF NOT EXISTS github_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  github_id bigint NOT NULL,
  repo_full_name text NOT NULL,
  number integer NOT NULL,
  title text NOT NULL,
  body text,
  state text DEFAULT 'open',
  is_pr boolean DEFAULT false,
  labels text[] DEFAULT '{}',
  assignee_login text,
  html_url text,
  due_date timestamptz,
  created_at_github timestamptz,
  updated_at_github timestamptz,
  fetched_at timestamptz DEFAULT now(),
  UNIQUE(user_id, github_id)
);

ALTER TABLE github_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_github_issues" ON github_issues;
CREATE POLICY "select_own_github_issues" ON github_issues FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_github_issues" ON github_issues;
CREATE POLICY "insert_own_github_issues" ON github_issues FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_github_issues" ON github_issues;
CREATE POLICY "update_own_github_issues" ON github_issues FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_github_issues" ON github_issues;
CREATE POLICY "delete_own_github_issues" ON github_issues FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== ai_suggestions =====
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'schedule',
  title text NOT NULL,
  description text NOT NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  suggested_start timestamptz,
  suggested_end timestamptz,
  confidence integer DEFAULT 80,
  applied boolean DEFAULT false,
  dismissed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_ai_suggestions" ON ai_suggestions;
CREATE POLICY "select_own_ai_suggestions" ON ai_suggestions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_ai_suggestions" ON ai_suggestions;
CREATE POLICY "insert_own_ai_suggestions" ON ai_suggestions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_ai_suggestions" ON ai_suggestions;
CREATE POLICY "update_own_ai_suggestions" ON ai_suggestions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_ai_suggestions" ON ai_suggestions;
CREATE POLICY "delete_own_ai_suggestions" ON ai_suggestions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== ai_prompts =====
CREATE TABLE IF NOT EXISTS ai_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  response text,
  context jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_ai_prompts" ON ai_prompts;
CREATE POLICY "select_own_ai_prompts" ON ai_prompts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_ai_prompts" ON ai_prompts;
CREATE POLICY "insert_own_ai_prompts" ON ai_prompts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_ai_prompts" ON ai_prompts;
CREATE POLICY "update_own_ai_prompts" ON ai_prompts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_ai_prompts" ON ai_prompts;
CREATE POLICY "delete_own_ai_prompts" ON ai_prompts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== Add columns to tasks =====
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'github_issue_id') THEN
    ALTER TABLE tasks ADD COLUMN github_issue_id bigint;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'parent_task_id') THEN
    ALTER TABLE tasks ADD COLUMN parent_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'suggested_start_time') THEN
    ALTER TABLE tasks ADD COLUMN suggested_start_time timestamptz;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'suggested_end_time') THEN
    ALTER TABLE tasks ADD COLUMN suggested_end_time timestamptz;
  END IF;
END $$;
