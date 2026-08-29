'use client';

import { CheckCircle2, Clock, Zap, TrendingUp } from 'lucide-react';

interface StatsBarProps {
  totalTasks: number;
  doneToday: number;
  totalEstimate: number;
  freeTime: number;
}

export function StatsBar({ totalTasks, doneToday, totalEstimate, freeTime }: StatsBarProps) {
  const stats = [
    {
      icon: Zap,
      label: '未着手タスク',
      value: totalTasks,
      unit: '件',
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
    },
    {
      icon: CheckCircle2,
      label: '今日完了',
      value: doneToday,
      unit: '件',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      icon: Clock,
      label: '推定作業時間',
      value: totalEstimate,
      unit: '分',
      color: 'text-sky-500',
      bg: 'bg-sky-50 dark:bg-sky-950/30',
    },
    {
      icon: TrendingUp,
      label: '空き時間',
      value: freeTime,
      unit: '分',
      color: 'text-violet-500',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3"
        >
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-lg font-bold leading-tight">
              {stat.value}
              <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                {stat.unit}
              </span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
