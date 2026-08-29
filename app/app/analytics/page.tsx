'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  Clock,
  TrendingUp,
  Target,
  Award,
  Calendar,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { WeeklyStudyChart, CategoryChart, ProductivityChart } from '@/components/app/charts';
import { StudyLogCreateDialog } from '@/components/app/study-log-dialog';
import { useAuth } from '@/components/auth/auth-provider';
import { fetchStudyLogs, deleteStudyLog } from '@/lib/data-access';
import type { StudyLog } from '@/lib/types';

const CATEGORY_COLORS: Record<string, string> = {
  開発: '#0ea5e9',
  AWS: '#f59e0b',
  執筆: '#10b981',
  英語: '#8b5cf6',
  その他: '#64748b',
};

const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchStudyLogs()
      .then(setLogs)
      .catch((err) => console.error('Failed to load study logs:', err))
      .finally(() => setLoading(false));
  }, [user]);

  const handleLogCreated = useCallback((log: StudyLog) => {
    setLogs((prev) => [log, ...prev]);
  }, []);

  const handleLogDeleted = useCallback(async (id: string) => {
    setBusyId(id);
    try {
      await deleteStudyLog(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error('Failed to delete study log:', err);
    } finally {
      setBusyId(null);
    }
  }, []);

  // Weekly data: last 7 days
  const weeklyData = useMemo(() => {
    const today = new Date();
    const result = WEEKDAYS.map((day, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - today.getDay() + i + 1);
      const dateStr = d.toISOString().slice(0, 10);
      const dayMinutes = logs
        .filter((l) => l.date === dateStr)
        .reduce((sum, l) => sum + l.minutes, 0);
      return { day, minutes: dayMinutes, target: 180 };
    });
    return result;
  }, [logs]);

  // Category distribution
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    logs.forEach((l) => {
      map.set(l.category, (map.get(l.category) ?? 0) + l.minutes);
    });
    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] ?? '#64748b',
    }));
  }, [logs]);

  // Productivity: estimated vs actual from tasks (weekly buckets)
  const productivityData = useMemo(() => {
    const today = new Date();
    const weeks: { week: string; estimated: number; actual: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const wStart = new Date(today);
      wStart.setDate(today.getDate() - i * 7 - today.getDay());
      const wEnd = new Date(wStart);
      wEnd.setDate(wStart.getDate() + 7);

      const wLogs = logs.filter((l) => {
        const d = new Date(l.date);
        return d >= wStart && d < wEnd;
      });
      const actual = wLogs.reduce((s, l) => s + l.minutes, 0);
      weeks.push({
        week: `W${4 - i}`,
        estimated: 600,
        actual,
      });
    }
    return weeks;
  }, [logs]);

  // Summary stats
  const totalMinutes = logs.reduce((s, l) => s + l.minutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const targetTotal = weeklyData.reduce((s, d) => s + d.target, 0);
  const achievementRate = totalMinutes > 0
    ? Math.min(100, Math.round((totalMinutes / targetTotal) * 100))
    : 0;

  // Streak
  const streak = useMemo(() => {
    const dates = new Set(logs.map((l) => l.date));
    let count = 0;
    const d = new Date();
    while (dates.has(d.toISOString().slice(0, 10))) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [logs]);

  const summaryStats = [
    {
      icon: Clock,
      label: '総学習時間',
      value: totalHours,
      unit: '時間',
      change: logs.length > 0 ? '記録あり' : '—',
      color: 'text-sky-500',
      bg: 'bg-sky-50 dark:bg-sky-950/30',
    },
    {
      icon: Target,
      label: '目標達成率',
      value: String(achievementRate),
      unit: '%',
      change: logs.length > 0 ? '' : '—',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      icon: TrendingUp,
      label: '記録数',
      value: String(logs.length),
      unit: '件',
      change: '',
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
    },
    {
      icon: Award,
      label: '連続学習日数',
      value: String(streak),
      unit: '日',
      change: streak > 0 ? '継続中' : '',
      color: 'text-violet-500',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
    },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">分析</h1>
          <p className="text-sm text-muted-foreground">
            学習記録ログと生産性データに基づく分析ダッシュボード
          </p>
        </div>
        <StudyLogCreateDialog onCreated={handleLogCreated} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summaryStats.map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                {stat.change && (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold">
                {stat.value}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  {stat.unit}
                </span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">週間学習時間</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyStudyChart data={weeklyData} />
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">目標達成率</span>
              <span className="font-semibold">{achievementRate}%</span>
            </div>
            <Progress value={achievementRate} className="mt-1.5 h-2" />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">カテゴリ別学習時間</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryChart data={categoryData} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">見積もり vs 実績（週次推移）</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductivityChart data={productivityData} />
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">学習記録ログ</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-center">
              <div>
                <Calendar className="mx-auto h-10 w-10 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">
                  学習記録がまだありません。「記録を追加」から始めましょう
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="group flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/30">
                    <Calendar className="h-4 w-4 text-sky-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {format(new Date(log.date), 'M月d日(E)', { locale: ja })}
                      </span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {log.category}
                      </span>
                    </div>
                    {log.memo && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {log.memo}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-sm font-bold text-sky-600 dark:text-sky-400">
                      {log.minutes}
                    </span>
                    <span className="text-xs text-muted-foreground">分</span>
                  </div>
                  <button
                    onClick={() => handleLogDeleted(log.id)}
                    disabled={busyId === log.id}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950 group-hover:opacity-100 disabled:opacity-50"
                    title="削除"
                  >
                    {busyId === log.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
