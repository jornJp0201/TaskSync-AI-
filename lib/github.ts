'use client';

import { getSupabaseBrowser } from '@/lib/supabase-browser';
import type { GitHubIssue } from '@/lib/types';

const supabase = getSupabaseBrowser();

export interface GitHubStatus {
  connected: boolean;
  username: string | null;
}

function getFunctionUrl(path: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  return `${url}/functions/v1/github-sync${path}`;
}

function getAuthHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function callEdgeFunction(path: string, body?: unknown): Promise<unknown> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
  };
  const session = await supabase.auth.getSession();
  if (session.data.session?.access_token) {
    headers['Authorization'] = `Bearer ${session.data.session.access_token}`;
  }

  const res = await fetch(getFunctionUrl(path), {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      const json = JSON.parse(text);
      msg = json.error || text;
    } catch {
      // keep raw text
    }
    throw new Error(msg || `GitHub API error (${res.status})`);
  }

  return res.json();
}

export function buildGitHubOAuthUrl(): string {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '';
  const redirectUri = `${window.location.origin}/auth/github-callback`;
  const scope = 'repo read:org';
  return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
}

export async function getGitHubStatus(): Promise<GitHubStatus> {
  try {
    const result = await callEdgeFunction('/status') as GitHubStatus;
    return result;
  } catch {
    return { connected: false, username: null };
  }
}

export async function storeGitHubToken(code: string): Promise<{ username: string | null }> {
  const result = await callEdgeFunction('/callback', { code }) as { username: string | null };
  return result;
}

export async function disconnectGitHub(): Promise<void> {
  await callEdgeFunction('/disconnect');
}

export async function syncGitHubIssues(): Promise<{ imported: number }> {
  const result = await callEdgeFunction('/sync-issues') as { imported: number };
  return result;
}

export async function fetchGitHubIssues(): Promise<GitHubIssue[]> {
  const { data, error } = await supabase
    .from('github_issues')
    .select('*')
    .eq('state', 'open')
    .order('updated_at_github', { ascending: false });
  if (error) throw error;
  return (data ?? []) as GitHubIssue[];
}

export async function convertIssueToTask(issue: GitHubIssue): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .insert({
      title: `[${issue.repo_full_name}] ${issue.title}`,
      description: issue.body?.slice(0, 500) ?? null,
      priority: issue.is_pr ? 'high' : 'medium',
      estimated_minutes: 60,
      tags: [...issue.labels, 'github', issue.repo_full_name],
      github_issue_id: issue.github_id,
    });
  if (error) throw error;
}
