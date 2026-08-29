'use client';

import { Check, Sparkles, Zap, Crown, Building2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

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
      '週次サマリー',
      '広告表示あり',
    ],
    cta: '無料で始める',
    note: 'クレジットカード不要',
  },
  {
    name: 'Pro',
    price: '980',
    period: '円/月',
    description: '広告なし＋外部連携＋標準AI提案。',
    icon: Zap,
    accent: true,
    badge: '人気',
    features: [
      'Freeの全機能',
      '広告非表示',
      '外部カレンダー連携（Google / Outlook）',
      '標準AIスケジュール提案',
      'タスク管理（無制限）',
      '週次生産性レポート',
      'スマート通知',
    ],
    cta: '機能を試す',
    note: '実際の課金は発生しません',
  },
  {
    name: 'Ultra',
    price: '1,980',
    period: '円/月',
    description: '高度AI自動再調整＋ツール連携。',
    icon: Crown,
    accent: false,
    features: [
      'Proの全機能',
      'リアルタイムAI自動再スケジューリング',
      'GitHub / Notion 連携',
      '高度な生産性分析レポート',
      '作業パターン分析',
      '優先サポート',
      'API アクセス',
    ],
    cta: '機能を試す',
    note: '実際の課金は発生しません',
  },
];

const teamFeatures = [
  'Pro の全機能',
  '管理者ダッシュボード',
  '受講生・社員の学習進捗可視化',
  'AIによる進捗サポート',
  'チーム分析レポート',
  'メンバー権限管理',
  'SSO認証（オプション）',
];

const faqs = [
  {
    q: '無料プランから有料プランにアップグレードできますか？',
    a: 'いつでもアップグレード可能です。アップグレード後は即座に追加機能が利用可能になります。ダウングレードも次回請求サイクルから適用されます。',
  },
  {
    q: '解約はいつでもできますか？',
    a: 'はい、いつでも解約できます。解約後は期間終了までプランが有効で、その後は自動的にFreeプランに移行します。',
  },
  {
    q: 'チームライセンスの最小人数はありますか？',
    a: '5IDからご利用いただけます。それ以上の规模でも柔軟に対応可能です。お気軽にお問い合わせください。',
  },
  {
    q: '学生割引はありますか？',
    a: '学生向けの特別価格をご用意しています。学生メールアドレスでの登録でProプランが半額になります。',
  },
];

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/50 to-background dark:from-sky-950/20">
          <div className="absolute inset-0 bg-grid opacity-20 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                料金プラン
              </p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
                あなたの使い方に合わせたプラン
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                まずは無料で始めて、必要に応じてアップグレード。
                <br className="hidden sm:block" />
                いつでも変更・解約可能です。
              </p>
              <div className="mx-auto mt-6 flex max-w-xl items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-5 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                <Info className="h-4 w-4 shrink-0" />
                <span>本サービスはインターンシップで制作したポートフォリオ作品です。料金表示はデモ目的であり、実際の課金は一切発生しません。すべての機能を無料でご利用いただけます。</span>
              </div>
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
                    <div
                      className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl ${
                        plan.accent
                          ? 'bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/20'
                          : 'bg-muted'
                      }`}
                    >
                      <plan.icon
                        className={`h-6 w-6 ${
                          plan.accent ? 'text-white' : 'text-muted-foreground'
                        }`}
                      />
                    </div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>
                  <div className="mb-1">
                    <span className="text-4xl font-bold">¥{plan.price}</span>
                    <span className="ml-1 text-sm text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>
                  <p className="mb-6 text-xs text-muted-foreground">{plan.note}</p>
                  <ul className="mb-6 flex-1 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check
                          className={`mt-0.5 h-4 w-4 shrink-0 ${
                            plan.accent ? 'text-sky-500' : 'text-emerald-500'
                          }`}
                        />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.accent ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => {}}
                  >
                    {plan.cta}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-slate-50 to-sky-50 dark:from-slate-900/50 dark:to-sky-950/30">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-8 lg:p-10">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 shadow-lg">
                    <Building2 className="h-7 w-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">Team ライセンス</h2>
                  <p className="mt-2 text-muted-foreground">
                    企業やスクール向けに、受講生・社員の学習進捗や作業ログをAIで可視化・サポートする管理ダッシュボード機能を提供します。
                  </p>
                  <div className="mt-6">
                    <span className="text-4xl font-bold">¥1,000</span>
                    <span className="ml-1 text-sm text-muted-foreground">
                      / ID / 月
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    最小5IDから / 年額契約で20%OFF
                  </p>
                  <Button className="mt-6" size="lg" onClick={() => {}}>
                    お問い合わせ
                  </Button>
                </div>
                <div className="border-t border-border/40 p-8 lg:border-l lg:border-t-0 lg:p-10">
                  <ul className="space-y-4">
                    {teamFeatures.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm">
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-950/40">
                          <Check className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                        </div>
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-muted/30 py-16 lg:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              よくある質問
            </h2>
            <div className="mt-10 space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-border/60 bg-card p-5"
                >
                  <h3 className="text-base font-semibold">{faq.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
