import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTA() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 to-blue-600 px-6 py-16 text-center shadow-2xl shadow-sky-500/20 sm:px-12 lg:px-16">
          <div className="absolute inset-0 bg-grid opacity-10" />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              計画倒れを、今日で終わりにしませんか？
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-sky-50">
              無料で始められて、クレジットカード不要。
              <br className="hidden sm:block" />
              あなたのペースに合わせたAI計画を今すぐ体験。
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                variant="secondary"
                className="h-12 bg-white px-8 text-base text-sky-600 hover:bg-sky-50"
                asChild
              >
                <Link href="/auth/sign-up">
                  無料で始める
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-white/30 px-8 text-base text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href="/pricing">料金を見る</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
