'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!loading && profile) {
      setChecked(true);
      if (!profile.is_admin) {
        router.replace('/app');
      }
    }
  }, [loading, profile, router]);

  if (loading || !checked) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          <p className="text-sm text-muted-foreground">権限を確認中...</p>
        </div>
      </div>
    );
  }

  if (!profile?.is_admin) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <ShieldAlert className="h-10 w-10 text-red-500" />
          <p className="text-sm font-medium text-red-600">アクセス権限がありません</p>
          <p className="text-xs text-muted-foreground">管理者のみアクセスできます</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
