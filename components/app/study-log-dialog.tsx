'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createStudyLog } from '@/lib/data-access';
import type { StudyLog } from '@/lib/types';

const CATEGORIES = ['開発', 'AWS', '執筆', '英語', 'その他'];

interface StudyLogCreateDialogProps {
  onCreated: (log: StudyLog) => void;
  trigger?: React.ReactNode;
}

export function StudyLogCreateDialog({
  onCreated,
  trigger,
}: StudyLogCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [minutes, setMinutes] = useState('30');
  const [category, setCategory] = useState('開発');
  const [memo, setMemo] = useState('');

  const reset = () => {
    setDate(today);
    setMinutes('30');
    setCategory('開発');
    setMemo('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(minutes);
    if (!mins || mins <= 0) {
      setError('時間を1分以上入力してください');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const log = await createStudyLog({
        date,
        minutes: mins,
        category,
        memo: memo.trim() || undefined,
      });

      onCreated(log);
      reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '記録に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            記録を追加
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>学習記録を追加</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="log-date">日付</Label>
              <Input
                id="log-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="log-minutes">時間（分）</Label>
              <Input
                id="log-minutes"
                type="number"
                min="1"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>カテゴリ</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="log-memo">メモ（任意）</Label>
            <Textarea
              id="log-memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="今日の学びやメモ"
              rows={2}
            />
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
                  追加中...
                </>
              ) : (
                '追加'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
