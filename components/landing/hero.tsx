import Link from 'next/link';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/50 via-background to-background dark:from-sky-950/20">
      <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
      <div className="absolute left-1/2 top-0 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-sky-400/20 to-blue-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="secondary"
            className="mb-6 animate-fade-up border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-medium text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            AIが学習ログから現実的な計画を自動生成
          </Badge>

          <h1 className="animate-fade-up text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            カレンダーとタスクの
            <br />
            <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
              構造的バッティング
            </span>
            を解消
          </h1>

          <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-balance text-lg text-muted-foreground delay-100">
            固定予定のタイムラインと未着手タスクのプールを完全に分離したデュアル画面。
            本当の空き時間を浮き彫りにし、AIがあなたのペースに合わせた実行計画を自動調整します。
          </p>

          <div className="mt-8 flex animate-fade-up flex-col items-center justify-center gap-3 delay-200 sm:flex-row">
            <Button size="lg" asChild className="h-12 px-8 text-base shadow-lg shadow-sky-500/25">
              <Link href="/auth/sign-up">
                無料で始める
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
              <Link href="/#how-it-works">使い方を見る</Link>
            </Button>
          </div>

          <div className="mt-8 flex animate-fade-up flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground delay-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-sky-500" />
              無料プランあり
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-sky-500" />
              クレジットカード不要
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-sky-500" />
              Web・スマホ対応
            </span>
          </div>
        </div>

        <div className="relative mx-auto mt-16 max-w-5xl animate-scale-in delay-500">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl shadow-sky-500/10">
            <div className="flex items-center gap-2 border-b border-border/60 bg-muted/50 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="ml-2 flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" />
                TaskSync AI - ダッシュボード
              </div>
            </div>
            <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
              <div className="border-r border-border/60 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Clock className="h-4 w-4 text-sky-500" />
                  タイムライン
                </div>
                <div className="space-y-2">
                  {[
                    { time: '09:00', title: '朝礼', color: 'bg-violet-100 dark:bg-violet-950/50', dot: 'bg-violet-500' },
                    { time: '11:00', title: '定例ミーティング', color: 'bg-violet-100 dark:bg-violet-950/50', dot: 'bg-violet-500' },
                    { time: '14:00', title: 'コーディング作業', color: 'bg-blue-100 dark:bg-blue-950/50', dot: 'bg-blue-500' },
                  ].map((item) => (
                    <div
                      key={item.time}
                      className={`flex items-center gap-3 rounded-lg ${item.color} px-3 py-2`}
                    >
                      <div className={`h-2 w-2 rounded-full ${item.dot}`} />
                      <span className="text-xs font-medium text-muted-foreground">
                        {item.time}
                      </span>
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Zap className="h-4 w-4 text-amber-500" />
                  タスクプール
                </div>
                <div className="space-y-2">
                  {[
                    { title: 'AWS SAA模擬試験', tag: '緊急', tagColor: 'text-red-600 bg-red-50 dark:bg-red-950/40' },
                    { title: 'API設計ドキュメント', tag: '高', tagColor: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40' },
                    { title: 'React リファクタリング', tag: '中', tagColor: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2"
                    >
                      <span className="text-sm font-medium">{item.title}</span>
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${item.tagColor}`}>
                        {item.tag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
