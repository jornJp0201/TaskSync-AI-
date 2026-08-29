'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  CalendarClock,
  LayoutDashboard,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Shield,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth/auth-provider';

const baseNavItems = [
  { href: '/app', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/app/analytics', label: '分析', icon: BarChart3 },
  { href: '/app/settings', label: '設定', icon: Settings },
];

const adminNavItems = [
  { href: '/app/admin', label: '管理者', icon: Shield },
  { href: '/app/admin/schema', label: 'スキーマ', icon: Database },
];

const planLabels: Record<string, string> = {
  free: 'Free プラン',
  pro: 'Pro プラン',
  ultra: 'Ultra プラン',
};

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();

  const displayName = profile?.full_name || 'ユーザー';
  const initials = displayName.slice(0, 2).toUpperCase();
  const planLabel = profile ? planLabels[profile.plan] ?? 'Free プラン' : 'Free プラン';

  const isAdmin = profile?.is_admin ?? false;
  const navItems = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems;

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border/60 px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/20">
            <CalendarClock className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            TaskSync<span className="text-sky-500"> AI</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const active =
            item.href === '/app'
              ? pathname === '/app'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/60 p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{planLabel}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="mt-1 w-full justify-start gap-3 text-sm text-muted-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          ログアウト
        </Button>
      </div>
    </div>
  );
}

export function MobileBackButton() {
  return (
    <Button variant="ghost" size="icon" asChild className="md:hidden">
      <Link href="/">
        <ChevronLeft className="h-5 w-5" />
      </Link>
    </Button>
  );
}
