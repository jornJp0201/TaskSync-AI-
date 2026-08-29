'use client';

import { useState, useEffect } from 'react';
import { Upload, Loader2, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Task } from '@/lib/types';
import { exportTaskToGoogle } from '@/lib/google-calendar';

interface TaskExportDialogProps {
  task: Task;
  onExported: (updatedTask: Task) => void;
}

export function TaskExportDialog({ task, onExported }: TaskExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('10:00');

  // Calculate default end time based on estimated minutes
  const defaultEnd = (() => {
    const [h, m] = startTime.split(':').map(Number);
    const total = h * 60 + m + task.estimated_minutes;
    const eh = Math.floor(total / 60);
    const em = total % 60;
    return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
  })();
  const [endTime, setEndTime] = useState(defaultEnd);

  useEffect(() => {
    if (open) {
      setError(null);
      const [h, m] = startTime.split(':').map(Number);
      const total = h * 60 + m + task.estimated_minutes;
      const eh = Math.floor(total / 60);
      const em = total % 60;
      setEndTime(`${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`);
    }
  }, [open, startTime, task.estimated_minutes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const startDateTime = `${date}T${startTime}:00`;
    const endDateTime = `${date}T${endTime}:00`;

    if (endDateTime <= startDateTime) {
      setError('終了時間は開始時間より後にしてください');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await exportTaskToGoogle(task.id, startDateTime, endDateTime);
      onExported({
        ...task,
        google_event_id: result.google_event_id,
      });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エクスポートに失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const alreadyExported = !!task.google_event_id;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-teal-100 hover:text-teal-600 dark:hover:bg-teal-950"
          title={alreadyExported ? 'Googleカレンダーに再エクスポート' : 'Googleカレンダーにエクスポート'}
        >
          {alreadyExported ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-500" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Googleカレンダーにエクスポート</DialogTitle>
        </DialogHeader>

        <div className="mb-4 rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-700 dark:bg-teal-950/30 dark:text-teal-300">
          タスク「{task.title}」をGoogleカレンダーに予定として追加します。
          タスクは青緑色で表示され、通常の予定と区別されます。
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="task-date">日付</Label>
            <Input
              id="task-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-start">開始時間</Label>
              <Input
                id="task-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-end">終了時間</Label>
              <Input
                id="task-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            見積もり時間: {task.estimated_minutes}分
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                キャンセル
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  エクスポート中...
                </>
              ) : alreadyExported ? (
                '更新'
              ) : (
                'エクスポート'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
