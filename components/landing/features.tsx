import {
  Layers,
  Brain,
  Smartphone,
  TrendingUp,
  Bell,
  CalendarCheck,
} from 'lucide-react';

const features = [
  {
    icon: Layers,
    title: 'デュアル画面',
    description:
      '固定予定のタイムラインと未着手タスクのプールを完全分離。カレンダー画面を圧迫せず、本当の空き時間を一目で把握できます。',
    color: 'from-sky-500 to-blue-600',
  },
  {
    icon: Brain,
    title: 'AI自動スケジューリング',
    description:
      '学習記録ログから個人の実際の消化ペースを分析。現実的な実行計画を自動生成・調整し、計画倒れを防ぎます。',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: Smartphone,
    title: 'マルチデバイス連携',
    description:
      'PCで俯瞰・計画調整、スマホで素早いログ記録・AI通知。デバイス間でシームレスに同期し、いつでも最新の計画へアクセス。',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: TrendingUp,
    title: '生産性分析',
    description:
      '見積もり時間と実績時間の比較、カテゴリ別の学習時間推移を可視化。データに基づく継続的な改善をサポートします。',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: Bell,
    title: 'スマート通知',
    description:
      '締め切り接近、空き時間の検出、休憩の提案など、文脈を理解したAI通知でタイムリーに行動を促します。',
    color: 'from-rose-500 to-pink-600',
  },
  {
    icon: CalendarCheck,
    title: '外部カレンダー連携',
    description:
      'Google CalendarやOutlookと同期。既存のスケジュールを取り込み、TaskSync AI上で統合的に管理できます。',
    color: 'from-cyan-500 to-sky-600',
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            機能
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            計画倒れを防ぐ、6つのコア機能
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            タスクとカレンダーの構造的バッティングを解消し、
            現実的な実行計画を支えるすべてが揃っています
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-500/5"
            >
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}
              >
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
              <div className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-sky-500 to-blue-600 transition-transform duration-300 group-hover:scale-x-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
