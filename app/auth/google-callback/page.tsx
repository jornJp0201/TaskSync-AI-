'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { exchangeOAuthCode } from '@/lib/google-calendar';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) {
      setStatus('error');
      setErrorMsg('認証コードが見つかりません');
      return;
    }

    exchangeOAuthCode(code)
      .then(() => {
        setStatus('success');
        setTimeout(() => {
          router.push('/app/settings');
        }, 2000);
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : '連携に失敗しました');
      });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {status === 'loading' && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-sky-500" />
            <p className="text-sm text-muted-foreground">Googleカレンダーと連携中...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="text-sm font-medium">連携が完了しました</p>
            <p className="text-xs text-muted-foreground">設定ページに移動します...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="h-10 w-10 text-red-500" />
            <p className="text-sm font-medium">連携に失敗しました</p>
            <p className="text-xs text-muted-foreground">{errorMsg}</p>
            <button
              onClick={() => router.push('/app/settings')}
              className="mt-2 text-sm text-sky-600 hover:underline"
            >
              設定ページに戻る
            </button>
          </>
        )}
      </div>
    </div>
  );
}
