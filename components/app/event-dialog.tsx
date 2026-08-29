'use client';

import { useState, useEffect } from 'react';
import { Plus, Loader2, Pencil } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createEvent, updateEvent } from '@/lib/data-access';
import type { CalendarEvent, EventType } from '@/lib/types';
import { EVENT_TYPE_CONFIG } from '@/lib/types';

interface EventDialogProps {
  date: Date;
  editEvent?: CalendarEvent | null;
  onCreated: (event: CalendarEvent) => void;
  onUpdated: (event: CalendarEvent) => void;
  trigger?: React.ReactNode;
}

export function EventDialog({
  date,
  editEvent,
  onCreated,
  onUpdated,
  trigger,
}: EventDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateStr = date.toISOString().slice(0, 10);
  const isEdit = !!editEvent;

  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [type, setType] = useState<EventType>('work');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (open && editEvent) {
      setTitle(editEvent.title);
      const s = new Date(editEvent.start_time);
      const e = new Date(editEvent.end_time);
      setStartTime(
        `${String(s.getHours()).padStart(2, '0')}:${String(s.getMinutes()).padStart(2, '0')}`
      );
      setEndTime(
        `${String(e.getHours()).padStart(2, '0')}:${String(e.getMinutes()).padStart(2, '0')}`
      );
      setType(editEvent.type);
      setLocation(editEvent.location ?? '');
    } else if (open && !editEvent) {
      setTitle('');
      setStartTime('09:00');
      setEndTime('10:00');
      setType('work');
      setLocation('');
    }
    setError(null);
  }, [open, editEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('タイトルを入力してください');
      return;
    }

    const startDateTime = `${dateStr}T${startTime}:00`;
    const endDateTime = `${dateStr}T${endTime}:00`;

    if (endDateTime <= startDateTime) {
      setError('終了時間は開始時間より後にしてください');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (isEdit && editEvent) {
        const updated = await updateEvent(editEvent.id, {
          title: title.trim(),
          start_time: startDateTime,
          end_time: endDateTime,
          type,
          location: location.trim() || undefined,
        });
        onUpdated(updated);
      } else {
        const created = await createEvent({
          title: title.trim(),
          start_time: startDateTime,
          end_time: endDateTime,
          type,
          location: location.trim() || undefined,
        });
        onCreated(created);
      }
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
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
            予定を追加
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? '予定を編集' : '新規予定'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="event-title">タイトル</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="会議、作業、勉強など"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-start">開始時間</Label>
              <Input
                id="event-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-end">終了時間</Label>
              <Input
                id="event-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>種類</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as EventType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(EVENT_TYPE_CONFIG) as EventType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {EVENT_TYPE_CONFIG[t].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-location">場所（任意）</Label>
              <Input
                id="event-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Zoom, 会議室A"
              />
            </div>
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
                  保存中...
                </>
              ) : isEdit ? (
                '更新'
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

export function EventEditButton({
  event,
  date,
  onUpdated,
}: {
  event: CalendarEvent;
  date: Date;
  onUpdated: (event: CalendarEvent) => void;
}) {
  return (
    <EventDialog
      date={date}
      editEvent={event}
      onCreated={() => {}}
      onUpdated={onUpdated}
      trigger={
        <button
          className="flex h-6 w-6 items-center justify-center rounded text-current opacity-0 transition-all hover:bg-black/10 dark:hover:bg-white/10"
          title="編集"
          onClick={(e) => e.stopPropagation()}
        >
          <Pencil className="h-3 w-3" />
        </button>
      }
    />
  );
}
