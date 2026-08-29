import Link from 'next/link';
import { CalendarClock, Twitter, Github } from 'lucide-react';

const footerLinks = {
  product: [
    { label: '機能', href: '/#features' },
    { label: '使い方', href: '/#how-it-works' },
    { label: '料金', href: '/pricing' },
    { label: 'アプリを開く', href: '/app' },
  ],
  company: [
    { label: 'について', href: '#' },
    { label: 'ブログ', href: '#' },
    { label: 'お問い合わせ', href: '#' },
  ],
  legal: [
    { label: '利用規約', href: '#' },
    { label: 'プライバシーポリシー', href: '#' },
    { label: '特定商取引法に基づく表記', href: '#' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600">
                <CalendarClock className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">
                TaskSync<span className="text-sky-500"> AI</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              カレンダーとタスクの構造的バッティングを解消する、
              AI駆動の統合タスク管理プラットフォーム。
            </p>
            <div className="mt-4 flex gap-3">
              <Link
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Twitter className="h-4 w-4" />
              </Link>
              <Link
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Github className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold">プロダクト</h4>
            <ul className="mt-4 space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">会社</h4>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">法規</h4>
            <ul className="mt-4 space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border/60 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 TaskSync AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
