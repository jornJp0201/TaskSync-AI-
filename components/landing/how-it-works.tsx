import { Clock, ListTodo, Sparkles, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    icon: Clock,
    step: '01',
    title: 'タイムラインに固定予定を表示',
    description:
      '会議、業務、ランチなど動かせない予定をタイムラインに配置。これが「使える時間」の基準になります。',
  },
  {
    icon: ListTodo,
    step: '02',
    title: 'タスクプールに未着手タスクを集約',
    description:
      'カレンダーを汚さず、タスクはプールエリアに蓄積。優先度と見積もり時間を設定しておくだけで準備完了。',
  },
  {
    icon: Sparkles,
    step: '03',
    title: 'AIが空き時間を検出して提案',
    description:
      'タイムラインの空き時間とタスクの優先度・見積もりを照合し、最適な配置を自動提案。学習ログから現実的なペースで調整します。',
  },
  {
    icon: CheckCircle2,
    step: '04',
    title: '実績を記録して継続的に改善',
    description:
      'スマホからサクッと作業ログを記録。蓄積されたデータが次回のAI提案の精度を高め、計画倒れを防ぎます。',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-muted/30 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            使い方
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            4ステップで始まる計画実行サイクル
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div key={step.step} className="relative">
              {i < steps.length - 1 && (
                <div className="absolute left-full top-12 hidden h-px w-full bg-gradient-to-r from-border to-transparent lg:block" />
              )}
              <div className="relative rounded-2xl border border-border/60 bg-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/40">
                    <step.icon className="h-5 w-5 text-sky-500" />
                  </div>
                  <span className="text-2xl font-bold text-muted-foreground/30">
                    {step.step}
                  </span>
                </div>
                <h3 className="text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
