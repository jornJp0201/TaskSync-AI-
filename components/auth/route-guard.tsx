'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  // Track whether we've ever seen a valid session. This prevents redirecting
  // during a transient null-session event (e.g. token refresh) — we only
  // redirect if we never had a session to begin with.
  const hadSession = useRef(false);

  useEffect(() => {
    if (session) {
      hadSession.current = true;
    }
    if (!loading && !session && !hadSession.current) {
      router.replace('/auth/sign-in');
    }
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
