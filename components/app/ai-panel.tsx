'use client';

import { useState, useCallback } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  CalendarPlus,
  Coffee,
  TrendingUp,
  X,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  sendAIPrompt,
  type ScheduleSuggestion,
} from '@/lib/ai-scheduler';
import type { Task, CalendarEvent, AISuggestion } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

interface AIPanelProps {
  tasks: Task[];
  events: CalendarEvent[];
  suggestions: AISuggestion[];
  onSuggestionApplied?: (suggestion: AISuggestion) => void;
  onSuggestionDismissed?: (id: string) => void;
}

const suggestionIcons = {
  schedule: CalendarPlus,
  reschedule: TrendingUp,
  break: Coffee,
  review: MessageSquare,
};

const suggestionColors = {
  schedule: 'from-sky-500 to-blue-600',
  reschedule: 'from-amber-500 to-orange-600',
  break: 'from-emerald-500 to-teal-600',
  review: 'from-violet-500 to-purple-600',
};

export function AIPanel({
  tasks,
  events,
  suggestions,
  onSuggestionApplied,
  onSuggestionDismissed,
}: AIPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [scheduleSuggestions, setScheduleSuggestions] = useState<ScheduleSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSendPrompt = useCallback(async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    setScheduleSuggestions([]);

    try {
      const result = await sendAIPrompt(prompt.trim(), { tasks, events });
      setResponse(result.response);
      if (result.suggestions) {
        setScheduleSuggestions(result.suggestions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AIリクエストに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [prompt, loading, tasks, events]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
  };

  const quickPrompts = [
    '今日のスケジュールを組んで',
    'タスクの優先度を分析して',
    '空き時間を教えて',
  ];

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-sky-200/60 bg-gradient-to-br from-sky-50/50 to-blue-50/30 p-4 dark:border-sky-900/40 dark:from-sky-950/20 dark:to-blue-950/10">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/20">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">AIアシスタント</h3>
          <p className="text-xs text-muted-foreground">
            スケジュールやタスクについて質問・指示できます
          </p>
        </div>
      </div>

      {/* Prompt input */}
      <div className="flex gap-2">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="AIに指示を送る... (例: 今日のスケジュールを組んで)"
          rows={2}
          className="resize-none text-sm"
          disabled={loading}
        />
        <Button
          size="icon"
          onClick={handleSendPrompt}
          disabled={loading || !prompt.trim()}
          className="h-10 w-10 shrink-0"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-1.5">
        {quickPrompts.map((qp) => (
          <button
            key={qp}
            onClick={() => {
              setPrompt(qp);
            }}
            disabled={loading}
            className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-sky-300 hover:text-sky-600 dark:hover:border-sky-700"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}

      {/* AI Response */}
      {response && (
        <div className="rounded-xl border border-border/60 bg-card p-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-sky-500" />
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">AIの回答</span>
          </div>
          <p className="text-xs leading-relaxed text-foreground">{response}</p>
        </div>
      )}

      {/* Schedule suggestions from AI */}
      {scheduleSuggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">スケジュール提案</p>
          {scheduleSuggestions.map((s, i) => (
            <div
              key={i}
              className="group rounded-xl border border-border/60 bg-card p-3 transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 shadow-sm">
                  <CalendarPlus className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-semibold">{s.task_title}</h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {format(parseISO(s.suggested_start), 'HH:mm', { locale: ja })}
                    〜{format(parseISO(s.suggested_end), 'HH:mm', { locale: ja })}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.reason}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={s.confidence} className="h-1.5 flex-1" />
                    <span className="text-[10px] font-medium text-muted-foreground">{s.confidence}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stored suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2 border-t border-border/40 pt-2">
          <p className="text-xs font-medium text-muted-foreground">保存された提案</p>
          {suggestions.slice(0, 3).map((s) => {
            const Icon = suggestionIcons[s.type] || Sparkles;
            const color = suggestionColors[s.type] || 'from-sky-500 to-blue-600';
            return (
              <div
                key={s.id}
                className="group rounded-xl border border-border/60 bg-card p-3 transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${color} shadow-sm`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="truncate text-sm font-semibold">{s.title}</h4>
                      <button
                        onClick={() => onSuggestionDismissed?.(s.id)}
                        className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <Progress value={s.confidence} className="h-1.5" />
                          <span className="text-[10px] font-medium text-muted-foreground">{s.confidence}%</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1 px-2 text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400"
                        onClick={() => onSuggestionApplied?.(s)}
                      >
                        適用
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
