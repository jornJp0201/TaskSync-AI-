'use client';

import { useState } from 'react';
import { Split, Loader2 } from 'lucide-react';
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
import { splitTask } from '@/lib/ai-scheduler';
import type { Task } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface TaskSplitDialogProps {
  task: Task;
  onSplit?: (subtasks: { id: string; title: string }[]) => void;
}

export function TaskSplitDialog({ task, onSplit }: TaskSplitDialogProps) {
  const [open, setOpen] = useState(false);
  const [chunkMinutes, setChunkMinutes] = useState('60');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const numChunks = Math.ceil(task.estimated_minutes / (parseInt(chunkMinutes) || 60));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await splitTask(task.id, parseInt(chunkMinutes) || 60);
      toast({
        description: `${result.subtasks.length}個のサブタスクに分割しました`,
      });
      onSplit?.(result.subtasks);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分割に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-950"
          title="タスクを分割"
        >
          <Split className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>タスクを分割</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="text-sm font-medium">{task.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              見積もり時間: {task.estimated_minutes}分
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chunk-minutes">1分割あたりの時間（分）</Label>
            <Input
              id="chunk-minutes"
              type="number"
              min="15"
              max="240"
              step="15"
              value={chunkMinutes}
              onChange={(e) => setChunkMinutes(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {numChunks}個のサブタスクに分割されます
            </p>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">キャンセル</Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  分割中...
                </>
              ) : (
                '分割する'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
