'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { storeGitHubToken } from '@/lib/github';

export default function GitHubCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) {
      setStatus('error');
      setErrorMsg('認証コードが見つかりません');
      return;
    }

    storeGitHubToken(code)
      .then(() => {
        setStatus('success');
        setTimeout(() => router.push('/app/settings'), 1500);
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
            <p className="text-sm text-muted-foreground">GitHub連携を処理中...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="text-sm font-medium">GitHub連携が完了しました</p>
            <p className="text-xs text-muted-foreground">設定ページに移動します...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="h-10 w-10 text-red-500" />
            <p className="text-sm font-medium text-red-600">連携に失敗しました</p>
            {errorMsg && <p className="text-xs text-muted-foreground">{errorMsg}</p>}
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
