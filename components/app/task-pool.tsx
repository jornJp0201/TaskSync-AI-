'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  Clock,
  Calendar,
  AlertTriangle,
  CircleDot,
  CheckCircle2,
  Filter,
  Trash2,
  Play,
  Check,
  RotateCcw,
  Loader2,
  Github,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { Task, Project } from '@/lib/types';
import { PRIORITY_CONFIG } from '@/lib/types';
import { TaskCreateDialog } from '@/components/app/task-create-dialog';
import { TaskEditDialog } from '@/components/app/task-edit-dialog';
import { TaskExportDialog } from '@/components/app/task-export-dialog';
import { TaskSplitDialog } from '@/components/app/task-split-dialog';
import { updateTaskStatus, deleteTask } from '@/lib/data-access';
import { getGCalStatus, type GCalStatus } from '@/lib/google-calendar';

interface TaskPoolProps {
  tasks: Task[];
  projects: Project[];
  onTaskCreated: (task: Task) => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

type FilterType = 'all' | 'todo' | 'in_progress' | 'urgent';

export function TaskPool({
  tasks,
  projects,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
}: TaskPoolProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [gcalStatus, setGcalStatus] = useState<GCalStatus | null>(null);

  useEffect(() => {
    getGCalStatus()
      .then(setGcalStatus)
      .catch(() => {});
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status !== 'done')
      .filter((t) => {
        if (filter === 'urgent') return t.priority === 'urgent';
        if (filter === 'todo') return t.status === 'todo';
        if (filter === 'in_progress') return t.status === 'in_progress';
        return true;
      })
      .filter((t) =>
        search ? t.title.toLowerCase().includes(search.toLowerCase()) : true
      )
      .sort((a, b) => {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        return order[a.priority] - order[b.priority];
      });
  }, [tasks, filter, search]);

  const getProject = (id: string | null) =>
    projects.find((p) => p.id === id);

  const getDueBadge = (dueDate: string | null) => {
    if (!dueDate) return null;
    const days = differenceInDays(parseISO(dueDate), new Date());
    if (days < 0)
      return { label: '期限超過', variant: 'destructive' as const };
    if (days === 0)
      return { label: '今日', variant: 'destructive' as const };
    if (days === 1)
      return { label: '明日', variant: 'secondary' as const };
    if (days <= 3)
      return { label: `${days}日後`, variant: 'secondary' as const };
    return null;
  };

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'すべて', count: tasks.filter((t) => t.status !== 'done').length },
    { key: 'urgent', label: '緊急', count: tasks.filter((t) => t.status !== 'done' && t.priority === 'urgent').length },
    { key: 'in_progress', label: '進行中', count: tasks.filter((t) => t.status === 'in_progress').length },
    { key: 'todo', label: '未着手', count: tasks.filter((t) => t.status === 'todo').length },
  ];

  const handleStatusChange = useCallback(
    async (task: Task, status: 'todo' | 'in_progress' | 'done') => {
      setBusyId(task.id);
      try {
        await updateTaskStatus(task.id, status);
        onTaskUpdated({ ...task, status });
      } catch (err) {
        console.error('Failed to update task status:', err);
      } finally {
        setBusyId(null);
      }
    },
    [onTaskUpdated]
  );

  const handleDelete = useCallback(
    async (task: Task) => {
      setBusyId(task.id);
      try {
        await deleteTask(task.id);
        onTaskDeleted(task.id);
      } catch (err) {
        console.error('Failed to delete task:', err);
      } finally {
        setBusyId(null);
      }
    },
    [onTaskDeleted]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/60 px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold">タスクプール</h2>
            <Badge variant="secondary" className="ml-1">
              {filteredTasks.length}件
            </Badge>
          </div>
          <TaskCreateDialog onCreated={onTaskCreated} />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Filter className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="タスクを検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                filter === f.key
                  ? 'bg-sky-500 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin p-3">
        {filteredTasks.length === 0 ? (
          <div className="flex h-full items-center justify-center py-20">
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">
                {tasks.length === 0
                  ? 'タスクを追加して始めましょう'
                  : '該当するタスクはありません'}
              </p>
            </div>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const priority = PRIORITY_CONFIG[task.priority];
            const project = getProject(task.project_id);
            const due = getDueBadge(task.due_date);
            return (
              <div
                key={task.id}
                className={`group rounded-xl border ${priority.border} ${priority.bg} p-3 transition-all hover:shadow-md`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${priority.color}`}>
                        {priority.label}
                      </span>
                      {task.status === 'in_progress' && (
                        <span className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                          進行中
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1 truncate text-sm font-semibold">
                      {task.title}
                    </h3>
                    {task.github_issue_id && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                        <Github className="h-3 w-3" />
                        GitHub Issue
                      </div>
                    )}
                    {task.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {task.description}
                      </p>
                    )}
                  </div>
                  {due && (
                    <Badge variant={due.variant} className="shrink-0 text-xs">
                      {due.variant === 'destructive' && (
                        <AlertTriangle className="mr-1 h-2.5 w-2.5" />
                      )}
                      {due.label}
                    </Badge>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-2">
                    {project && (
                      <span className="flex items-center gap-1">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        {project.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      約{task.estimated_minutes}分
                    </span>
                    {task.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(task.due_date), 'M/d', { locale: ja })}
                      </span>
                    )}
                    {task.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-muted px-1.5 py-0.5 text-[10px]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    {busyId === task.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        {task.status === 'todo' && (
                          <button
                            onClick={() => handleStatusChange(task, 'in_progress')}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-950"
                            title="進行中にする"
                          >
                            <Play className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {task.status === 'in_progress' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(task, 'todo')}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800"
                              title="未着手に戻す"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(task, 'done')}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-950"
                              title="完了にする"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        <TaskEditDialog task={task} onUpdated={onTaskUpdated} />
                        {gcalStatus?.connected && (
                          <TaskExportDialog
                            task={task}
                            onExported={onTaskUpdated}
                          />
                        )}
                        {task.estimated_minutes > 60 && (
                          <TaskSplitDialog task={task} onSplit={() => onTaskUpdated(task)} />
                        )}
                        <button
                          onClick={() => handleDelete(task)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950"
                          title="削除"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
