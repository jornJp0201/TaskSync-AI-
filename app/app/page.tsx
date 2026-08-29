'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatePickerBar } from '@/components/app/date-picker-bar';
import { TimelineView } from '@/components/app/timeline-view';
import { TaskPool } from '@/components/app/task-pool';
import { AIPanel } from '@/components/app/ai-panel';
import { StatsBar } from '@/components/app/stats-bar';
import { useAuth } from '@/components/auth/auth-provider';
import {
  fetchTasks,
  fetchProjects,
  fetchEventsByDate,
} from '@/lib/data-access';
import {
  generateSchedule,
  fetchAISuggestions,
  dismissAISuggestion,
  type ScheduleResult,
} from '@/lib/ai-scheduler';
import type { Task, Project, CalendarEvent, AISuggestion } from '@/lib/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<ScheduleResult | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [taskData, projectData, eventData, suggestionData] = await Promise.all([
        fetchTasks(),
        fetchProjects(),
        fetchEventsByDate(currentDate),
        fetchAISuggestions().catch(() => []),
      ]);
      setTasks(taskData);
      setProjects(projectData);
      setEvents(eventData);
      setSuggestions(suggestionData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const activeTasks = tasks.filter((t) => t.status !== 'done');
  const doneToday = tasks.filter((t) => t.status === 'done').length;
  const totalEstimate = activeTasks.reduce(
    (sum, t) => sum + t.estimated_minutes,
    0
  );

  const busyMinutes = events.reduce((sum, e) => {
    const start = new Date(e.start_time);
    const end = new Date(e.end_time);
    return sum + (end.getTime() - start.getTime()) / 60000;
  }, 0);
  const freeTime = Math.max(0, 480 - busyMinutes);

  const handleTaskCreated = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
  };

  const handleTaskUpdated = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleEventCreated = (event: CalendarEvent) => {
    setEvents((prev) =>
      [...prev, event].sort((a, b) =>
        a.start_time.localeCompare(b.start_time)
      )
    );
  };

  const handleEventUpdated = (updated: CalendarEvent) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e)).sort((a, b) =>
        a.start_time.localeCompare(b.start_time)
      )
    );
  };

  const handleEventDeleted = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const handleGenerateSchedule = async () => {
    setScheduling(true);
    try {
      const result = await generateSchedule(activeTasks, events, currentDate);
      setScheduleResult(result);
      const newSuggestions = await fetchAISuggestions().catch(() => []);
      setSuggestions(newSuggestions);
    } catch (err) {
      console.error('Failed to generate schedule:', err);
    } finally {
      setScheduling(false);
    }
  };

  const handleDismissSuggestion = async (id: string) => {
    await dismissAISuggestion(id);
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ダッシュボード</h1>
          <p className="text-sm text-muted-foreground">
            {format(currentDate, 'yyyy年M月d日(E)', { locale: ja })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="h-9 gap-1.5 bg-gradient-to-r from-sky-500 to-blue-600"
            onClick={handleGenerateSchedule}
            disabled={scheduling || activeTasks.length === 0}
          >
            {scheduling ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                スケジュール生成中...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                AIスケジュール生成
              </>
            )}
          </Button>
          <DatePickerBar date={currentDate} onChange={setCurrentDate} />
        </div>
      </div>

      {scheduleResult && (
        <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50/50 px-4 py-3 text-sm text-sky-700 dark:border-sky-900 dark:bg-sky-950/20 dark:text-sky-300">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span className="flex-1">{scheduleResult.summary}</span>
          <button
            onClick={() => setScheduleResult(null)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            閉じる
          </button>
        </div>
      )}

      <StatsBar
        totalTasks={activeTasks.length}
        doneToday={doneToday}
        totalEstimate={totalEstimate}
        freeTime={Math.round(freeTime)}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="h-[600px] overflow-hidden rounded-2xl border border-border/60 bg-card">
            <TimelineView
              events={events}
              date={currentDate}
              onEventCreated={handleEventCreated}
              onEventUpdated={handleEventUpdated}
              onEventDeleted={handleEventDeleted}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <AIPanel
            tasks={tasks}
            events={events}
            suggestions={suggestions}
            onSuggestionDismissed={handleDismissSuggestion}
          />
          <div className="h-[400px] overflow-hidden rounded-2xl border border-border/60 bg-card lg:h-[500px]">
            <TaskPool
              tasks={tasks}
              projects={projects}
              onTaskCreated={handleTaskCreated}
              onTaskUpdated={handleTaskUpdated}
              onTaskDeleted={handleTaskDeleted}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 py-3 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" />
        AIが空き時間を検出し、タスクプールから最適なタスクを提案します
      </div>
    </div>
  );
}
