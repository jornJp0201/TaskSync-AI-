'use client';

import { getSupabaseBrowser } from '@/lib/supabase-browser';
import type {
  Task,
  Project,
  CalendarEvent,
  StudyLog,
  Priority,
  TaskStatus,
  EventType,
} from '@/lib/types';

const supabase = getSupabaseBrowser();

// ===== Tasks =====

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function createTask(input: {
  title: string;
  description?: string;
  priority: Priority;
  estimated_minutes: number;
  due_date?: string;
  project_id?: string;
  tags?: string[];
}): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: input.title,
      description: input.description ?? null,
      priority: input.priority,
      estimated_minutes: input.estimated_minutes,
      due_date: input.due_date ?? null,
      project_id: input.project_id ?? null,
      tags: input.tags ?? [],
    })
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatus
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

export async function updateTask(
  id: string,
  input: {
    title: string;
    description?: string;
    priority: Priority;
    estimated_minutes: number;
    due_date?: string;
    project_id?: string;
    tags?: string[];
  }
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      title: input.title,
      description: input.description ?? null,
      priority: input.priority,
      estimated_minutes: input.estimated_minutes,
      due_date: input.due_date ?? null,
      project_id: input.project_id ?? null,
      tags: input.tags ?? [],
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

// ===== Projects =====

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Project[];
}

export async function createProject(input: {
  name: string;
  color?: string;
}): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: input.name,
      color: input.color ?? '#0ea5e9',
    })
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

// ===== Calendar Events =====

export async function fetchEventsByDate(date: Date): Promise<CalendarEvent[]> {
  const dateStr = format(date, 'yyyy-MM-dd');
  const startOfDay = `${dateStr}T00:00:00`;
  const endOfDay = `${dateStr}T23:59:59`;

  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return (data ?? []) as CalendarEvent[];
}

export async function createEvent(input: {
  title: string;
  start_time: string;
  end_time: string;
  type: EventType;
  location?: string;
}): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      title: input.title,
      start_time: input.start_time,
      end_time: input.end_time,
      type: input.type,
      location: input.location ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as CalendarEvent;
}

export async function updateEvent(
  id: string,
  input: {
    title: string;
    start_time: string;
    end_time: string;
    type: EventType;
    location?: string;
  }
): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from('calendar_events')
    .update({
      title: input.title,
      start_time: input.start_time,
      end_time: input.end_time,
      type: input.type,
      location: input.location ?? null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as CalendarEvent;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ===== Study Logs =====

export async function fetchStudyLogs(): Promise<StudyLog[]> {
  const { data, error } = await supabase
    .from('study_logs')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as StudyLog[];
}

export async function createStudyLog(input: {
  date: string;
  minutes: number;
  category: string;
  memo?: string;
  task_id?: string;
}): Promise<StudyLog> {
  const { data, error } = await supabase
    .from('study_logs')
    .insert({
      date: input.date,
      minutes: input.minutes,
      category: input.category,
      memo: input.memo ?? null,
      task_id: input.task_id ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as StudyLog;
}

export async function deleteStudyLog(id: string): Promise<void> {
  const { error } = await supabase.from('study_logs').delete().eq('id', id);
  if (error) throw error;
}

// ===== helper =====

function format(d: Date, fmt: string): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  if (fmt === 'yyyy-MM-dd') return `${yyyy}-${mm}-${dd}`;
  return `${yyyy}-${mm}-${dd}`;
}
