export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type EventType = 'meeting' | 'work' | 'personal' | 'study' | 'break';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: TaskStatus;
  estimated_minutes: number;
  actual_minutes: number | null;
  due_date: string | null;
  project_id: string | null;
  tags: string[];
  google_event_id: string | null;
  google_color_id: string | null;
  github_issue_id: number | null;
  parent_task_id: string | null;
  suggested_start_time: string | null;
  suggested_end_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string | null;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  start_time: string;
  end_time: string;
  type: EventType;
  location: string | null;
  is_fixed: boolean;
  google_event_id: string | null;
  created_at: string;
}

export interface StudyLog {
  id: string;
  user_id: string;
  task_id: string | null;
  date: string;
  minutes: number;
  category: string;
  memo: string | null;
  created_at: string;
}

export interface AISuggestion {
  id: string;
  user_id: string;
  type: 'schedule' | 'reschedule' | 'break' | 'review';
  title: string;
  description: string;
  task_id: string | null;
  suggested_start: string | null;
  suggested_end: string | null;
  confidence: number;
  applied: boolean;
  dismissed: boolean;
  created_at: string;
}

export interface GitHubIssue {
  id: string;
  user_id: string;
  github_id: number;
  repo_full_name: string;
  number: number;
  title: string;
  body: string | null;
  state: string;
  is_pr: boolean;
  labels: string[];
  assignee_login: string | null;
  html_url: string | null;
  due_date: string | null;
  created_at_github: string | null;
  updated_at_github: string | null;
  fetched_at: string;
}

export interface AIPrompt {
  id: string;
  prompt: string;
  response: string | null;
  created_at: string;
}

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; bg: string; border: string }
> = {
  urgent: {
    label: '緊急',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/40',
    border: 'border-red-200 dark:border-red-900',
  },
  high: {
    label: '高',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    border: 'border-orange-200 dark:border-orange-900',
  },
  medium: {
    label: '中',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-900',
  },
  low: {
    label: '低',
    color: 'text-slate-500 dark:text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-900/40',
    border: 'border-slate-200 dark:border-slate-800',
  },
};

export const EVENT_TYPE_CONFIG: Record<
  EventType,
  { label: string; color: string; dot: string; bg: string }
> = {
  meeting: {
    label: '会議',
    color: 'text-violet-700 dark:text-violet-300',
    dot: 'bg-violet-500',
    bg: 'bg-violet-100 dark:bg-violet-950/50',
  },
  work: {
    label: '業務',
    color: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-950/50',
  },
  personal: {
    label: '個人',
    color: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-100 dark:bg-emerald-950/50',
  },
  study: {
    label: '学習',
    color: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    bg: 'bg-amber-100 dark:bg-amber-950/50',
  },
  break: {
    label: '休憩',
    color: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800/50',
  },
};
