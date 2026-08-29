'use client';

import { getSupabaseBrowser } from '@/lib/supabase-browser';
import type { AISuggestion, AIPrompt, Task, CalendarEvent } from '@/lib/types';

const supabase = getSupabaseBrowser();

function getFunctionUrl(path: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  return `${url}/functions/v1/ai-scheduler${path}`;
}

async function callEdgeFunction(path: string, body?: unknown): Promise<unknown> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const session = await supabase.auth.getSession();
  if (session.data.session?.access_token) {
    headers['Authorization'] = `Bearer ${session.data.session.access_token}`;
  } else {
    headers['Authorization'] = `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
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
    throw new Error(msg || `AI API error (${res.status})`);
  }

  return res.json();
}

export interface ScheduleSuggestion {
  task_id: string;
  task_title: string;
  suggested_start: string;
  suggested_end: string;
  reason: string;
  confidence: number;
}

export interface ScheduleResult {
  suggestions: ScheduleSuggestion[];
  gaps: { start: string; end: string; duration_minutes: number }[];
  summary: string;
}

export async function generateSchedule(
  tasks: Task[],
  events: CalendarEvent[],
  date: Date
): Promise<ScheduleResult> {
  const dateStr = date.toISOString().split('T')[0];
  const result = await callEdgeFunction('/schedule', {
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      estimated_minutes: t.estimated_minutes,
      due_date: t.due_date,
      status: t.status,
    })),
    events: events.map((e) => ({
      start_time: e.start_time,
      end_time: e.end_time,
      title: e.title,
    })),
    date: dateStr,
  }) as ScheduleResult;
  return result;
}

export async function splitTask(
  taskId: string,
  chunkMinutes: number
): Promise<{ subtasks: { id: string; title: string }[] }> {
  const result = await callEdgeFunction('/split-task', {
    taskId,
    chunkMinutes,
  }) as { subtasks: { id: string; title: string }[] };
  return result;
}

export async function sendAIPrompt(
  prompt: string,
  context?: { tasks?: Task[]; events?: CalendarEvent[] }
): Promise<{ response: string; suggestions?: ScheduleSuggestion[] }> {
  const result = await callEdgeFunction('/prompt', {
    prompt,
    context: context
      ? {
          tasks: context.tasks?.map((t) => ({
            title: t.title,
            priority: t.priority,
            estimated_minutes: t.estimated_minutes,
            due_date: t.due_date,
            status: t.status,
          })),
          events: context.events?.map((e) => ({
            start_time: e.start_time,
            end_time: e.end_time,
            title: e.title,
          })),
        }
      : undefined,
  }) as { response: string; suggestions?: ScheduleSuggestion[] };
  return result;
}

export async function fetchAISuggestions(): Promise<AISuggestion[]> {
  const { data, error } = await supabase
    .from('ai_suggestions')
    .select('*')
    .eq('dismissed', false)
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) throw error;
  return (data ?? []) as AISuggestion[];
}

export async function dismissAISuggestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('ai_suggestions')
    .update({ dismissed: true })
    .eq('id', id);
  if (error) throw error;
}

export async function applyAISuggestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('ai_suggestions')
    .update({ applied: true })
    .eq('id', id);
  if (error) throw error;
}

export async function fetchAIPrompts(): Promise<AIPrompt[]> {
  const { data, error } = await supabase
    .from('ai_prompts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []) as AIPrompt[];
}
