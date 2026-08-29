import Link from 'next/link';
import { CalendarClock } from 'lucide-react';

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left: branding panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-sky-500 to-blue-700 lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <CalendarClock className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">
            TaskSync<span className="text-sky-200"> AI</span>
          </span>
        </Link>

        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight text-white">
            カレンダーとタスクの
            <br />
            構造的バッティングを解消
          </h2>
          <p className="mt-4 max-w-md text-sky-100">
            固定予定のタイムラインと未着手タスクのプールを分離したデュアル画面。
            AIが学習ログに基づく現実的な実行計画を自動生成・調整します。
          </p>
          <div className="mt-8 space-y-3">
            {[
              'デュアル画面で本当の空き時間を可視化',
              'AIが個人の消化ペースに合わせた計画を提案',
              '学習ログに基づく継続的な改善サイクル',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sky-50">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-sky-200">
          © 2026 TaskSync AI. All rights reserved.
        </p>
      </div>

      {/* Right: auth form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600">
                <CalendarClock className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">
                TaskSync<span className="text-sky-500"> AI</span>
              </span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
