'use client';

import { useState, useCallback, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  Clock,
  MapPin,
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  Upload,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CalendarEvent } from '@/lib/types';
import { EVENT_TYPE_CONFIG } from '@/lib/types';
import { EventDialog, EventEditButton } from '@/components/app/event-dialog';
import { deleteEvent } from '@/lib/data-access';
import {
  getGCalStatus,
  syncFromGoogle,
  exportEventToGoogle,
  deleteFromGoogle,
  type GCalStatus,
} from '@/lib/google-calendar';

interface TimelineViewProps {
  events: CalendarEvent[];
  date: Date;
  onEventCreated: (event: CalendarEvent) => void;
  onEventUpdated: (event: CalendarEvent) => void;
  onEventDeleted: (eventId: string) => void;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6:00 - 21:00
const HOUR_HEIGHT = 56; // px per hour

export function TimelineView({
  events,
  date,
  onEventCreated,
  onEventUpdated,
  onEventDeleted,
}: TimelineViewProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [gcalStatus, setGcalStatus] = useState<GCalStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  useEffect(() => {
    getGCalStatus()
      .then(setGcalStatus)
      .catch(() => {});
  }, []);

  const dateStr = format(date, 'yyyy-MM-dd');

  const dayEvents = events.filter((e) => e.start_time.startsWith(dateStr));

  const getEventPosition = (event: CalendarEvent) => {
    const start = parseISO(event.start_time);
    const end = parseISO(event.end_time);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const top = (startHour - 6) * HOUR_HEIGHT;
    const height = (endHour - startHour) * HOUR_HEIGHT;
    return { top, height };
  };

  const currentTimeTop = (() => {
    const now = new Date();
    if (format(now, 'yyyy-MM-dd') !== dateStr) return null;
    const currentHour = now.getHours() + now.getMinutes() / 60;
    if (currentHour < 6 || currentHour > 21) return null;
    return (currentHour - 6) * HOUR_HEIGHT;
  })();

  const handleDelete = useCallback(
    async (eventId: string, googleEventId?: string) => {
      setBusyId(eventId);
      try {
        if (googleEventId && gcalStatus?.connected) {
          await deleteFromGoogle(googleEventId).catch(() => {});
        }
        await deleteEvent(eventId);
        onEventDeleted(eventId);
      } catch (err) {
        console.error('Failed to delete event:', err);
      } finally {
        setBusyId(null);
      }
    },
    [onEventDeleted, gcalStatus]
  );

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const result = await syncFromGoogle();
      setSyncMsg(`${result.imported}件の予定をインポートしました`);
      setTimeout(() => setSyncMsg(null), 4000);
    } catch (err) {
      setSyncMsg(err instanceof Error ? err.message : '同期に失敗しました');
    } finally {
      setSyncing(false);
    }
  }, []);

  const handleExportToGoogle = useCallback(
    async (eventId: string) => {
      setExportingId(eventId);
      try {
        const result = await exportEventToGoogle(eventId);
        const updatedEvent = events.find((e) => e.id === eventId);
        if (updatedEvent) {
          onEventUpdated({
            ...updatedEvent,
            google_event_id: result.google_event_id,
          });
        }
        setSyncMsg('Googleカレンダーにエクスポートしました');
        setTimeout(() => setSyncMsg(null), 4000);
      } catch (err) {
        setSyncMsg(err instanceof Error ? err.message : 'エクスポートに失敗しました');
      } finally {
        setExportingId(null);
      }
    },
    [events, onEventUpdated]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-sky-500" />
          <h2 className="text-sm font-semibold">タイムライン</h2>
          {gcalStatus?.connected && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="h-2.5 w-2.5" />
              Google連携中
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {syncMsg && (
            <span className="text-xs text-muted-foreground">{syncMsg}</span>
          )}
          {gcalStatus?.connected && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 px-2 text-xs"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              同期
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            {format(date, 'M月d日(E)', { locale: ja })}
          </span>
          <EventDialog
            date={date}
            onCreated={onEventCreated}
            onUpdated={onEventUpdated}
            trigger={
              <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs">
                <Plus className="h-3.5 w-3.5" />
                追加
              </Button>
            }
          />
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto scrollbar-thin">
        <div className="relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
          {HOURS.map((hour, i) => (
            <div
              key={hour}
              className="absolute left-0 right-0 flex items-start"
              style={{ top: i * HOUR_HEIGHT }}
            >
              <div className="w-14 shrink-0 pr-2 text-right text-xs font-medium text-muted-foreground">
                {hour}:00
              </div>
              <div className="flex-1 border-t border-border/40" />
            </div>
          ))}

          {currentTimeTop !== null && (
            <div
              className="absolute left-14 right-0 z-10 flex items-center"
              style={{ top: currentTimeTop }}
            >
              <div className="ml-1 h-2.5 w-2.5 rounded-full border-2 border-rose-500 bg-background" />
              <div className="h-px flex-1 bg-rose-500" />
            </div>
          )}

          {dayEvents.map((event) => {
            const { top, height } = getEventPosition(event);
            const config = EVENT_TYPE_CONFIG[event.type];
            const isFromGoogle = !!event.google_event_id;
            return (
              <div
                key={event.id}
                className={`group absolute left-16 right-2 overflow-hidden rounded-lg border ${config.bg} ${config.color} px-3 py-1.5 text-xs shadow-sm transition-all hover:shadow-md`}
                style={{ top: top + 2, height: height - 4 }}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <div className={`h-2 w-2 shrink-0 rounded-full ${config.dot}`} />
                    <span className="truncate font-semibold">{event.title}</span>
                    {isFromGoogle && (
                      <span className="shrink-0 rounded bg-white/40 px-1 text-[8px] font-medium dark:bg-black/30">
                        G
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    {gcalStatus?.connected && !isFromGoogle && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportToGoogle(event.id);
                        }}
                        disabled={exportingId === event.id}
                        className="flex h-6 w-6 items-center justify-center rounded text-current transition-all hover:bg-sky-200/50 dark:hover:bg-sky-900/30"
                        title="Googleカレンダーにエクスポート"
                      >
                        {exportingId === event.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Upload className="h-3 w-3" />
                        )}
                      </button>
                    )}
                    <EventEditButton
                      event={event}
                      date={date}
                      onUpdated={onEventUpdated}
                    />
                    {busyId === event.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(event.id, event.google_event_id ?? undefined);
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded text-current transition-all hover:bg-red-200/50 dark:hover:bg-red-900/30"
                        title="削除"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                {height > 40 && (
                  <div className="mt-1 flex items-center gap-2 text-[10px] opacity-80">
                    <span>
                      {format(parseISO(event.start_time), 'HH:mm')} -{' '}
                      {format(parseISO(event.end_time), 'HH:mm')}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        {event.location}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {dayEvents.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  この日の予定はありません
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  「追加」ボタンから予定を登録できます
                </p>
                {gcalStatus?.connected && (
                  <p className="mt-1 text-xs text-sky-600 dark:text-sky-400">
                    「同期」でGoogleカレンダーから取り込めます
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
