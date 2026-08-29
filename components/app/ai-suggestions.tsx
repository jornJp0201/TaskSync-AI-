'use client';

import {
  Sparkles,
  CalendarPlus,
  RefreshCw,
  Coffee,
  TrendingUp,
  X,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { AISuggestion } from '@/lib/types';

const iconMap = {
  schedule: CalendarPlus,
  reschedule: RefreshCw,
  break: Coffee,
  review: TrendingUp,
};

const colorMap = {
  schedule: 'from-sky-500 to-blue-600',
  reschedule: 'from-amber-500 to-orange-600',
  break: 'from-emerald-500 to-teal-600',
  review: 'from-violet-500 to-purple-600',
};

interface AISuggestionsProps {
  suggestions: AISuggestion[];
}

export function AISuggestions({ suggestions }: AISuggestionsProps) {
  return (
    <div className="rounded-2xl border border-sky-200/60 bg-gradient-to-br from-sky-50/50 to-blue-50/30 p-4 dark:border-sky-900/40 dark:from-sky-950/20 dark:to-blue-950/10">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/20">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">AI提案</h3>
          <p className="text-xs text-muted-foreground">
            学習ログに基づく最適化された計画
          </p>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border/60 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            学習ログを記録すると、AIが最適なスケジュールを提案します
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {suggestions.slice(0, 3).map((suggestion) => {
          const Icon = iconMap[suggestion.type];
          const color = colorMap[suggestion.type];
          return (
            <div
              key={suggestion.id}
              className="group rounded-xl border border-border/60 bg-card p-3 transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${color} shadow-sm`}
                >
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="truncate text-sm font-semibold">
                      {suggestion.title}
                    </h4>
                    <button className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {suggestion.description}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <Progress
                          value={suggestion.confidence}
                          className="h-1.5"
                        />
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {suggestion.confidence}%
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1 px-2 text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400"
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
