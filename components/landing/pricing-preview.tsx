import Link from 'next/link';
import { Check, Sparkles, Users, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const plans = [
  {
    name: 'Free',
    price: '0',
    period: '円/月',
    description: '基本機能で始める。広告表示あり。',
    icon: Sparkles,
    accent: false,
    features: [
      'デュアル画面（タイムライン＋タスクプール）',
      'タスク管理（最大50件）',
      '基本カレンダー機能',
      '学習ログ記録',
      '広告表示あり',
    ],
    cta: '無料で始める',
  },
  {
    name: 'Pro',
    price: '980',
    period: '円/月',
    description: '広告なし＋外部連携＋標準AI提案。',
    icon: Sparkles,
    accent: true,
    badge: '人気',
    features: [
      'Freeの全機能',
      '広告非表示',
      '外部カレンダー連携（Google/Outlook）',
      '標準AIスケジュール提案',
      'タスク管理（無制限）',
      '週次レポート',
    ],
    cta: 'Proを始める',
  },
  {
    name: 'Ultra',
    price: '1,980',
    period: '円/月',
    description: '高度AI自動再調整＋ツール連携。',
    icon: Sparkles,
    accent: false,
    features: [
      'Proの全機能',
      'リアルタイムAI自動再スケジューリング',
      'GitHub / Notion 連携',
      '高度な生産性分析レポート',
      '優先サポート',
    ],
    cta: 'Ultraを始める',
  },
];

const teamPlan = {
  name: 'Team',
  price: '1,000',
  period: '円/ID/月',
  description: '企業・スクール向け管理ダッシュボード。',
  icon: Building2,
  features: [
    'Pro の全機能',
    '管理者ダッシュボード',
    '受講生・社員の学習進捗可視化',
    'AIによる進捗サポート',
    'チーム分析レポート',
    'SSO認証（オプション）',
  ],
  cta: 'チームプランのお問い合わせ',
};

export function PricingPreview() {
  return (
    <section id="pricing" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            料金
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            あなたの使い方に合わせたプラン
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            まずは無料で始めて、必要に応じてアップグレード
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border bg-card p-6 transition-all hover:shadow-xl ${
                plan.accent
                  ? 'border-sky-500 shadow-lg shadow-sky-500/10 lg:-translate-y-2'
                  : 'border-border/60'
              }`}
            >
              {plan.badge && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-500 text-white">
                  {plan.badge}
                </Badge>
              )}
              <div className="mb-4">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">¥{plan.price}</span>
                <span className="ml-1 text-sm text-muted-foreground">
                  {plan.period}
                </span>
              </div>
              <ul className="mb-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.accent ? 'default' : 'outline'}
                className="w-full"
                asChild
              >
                <Link href="/auth/sign-up">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-r from-slate-50 to-sky-50 dark:from-slate-900/50 dark:to-sky-950/30">
          <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">{teamPlan.name}ライセンス</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {teamPlan.description}
              </p>
              <div className="mt-3">
                <span className="text-3xl font-bold">¥{teamPlan.price}</span>
                <span className="ml-1 text-sm text-muted-foreground">
                  {teamPlan.period}
                </span>
              </div>
            </div>
            <div className="lg:col-span-1">
              <ul className="space-y-3">
                {teamPlan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-end lg:col-span-1">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/pricing">{teamPlan.cta}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
