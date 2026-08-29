'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Link2,
  Palette,
  User,
  Crown,
  Sparkles,
  Loader2,
  Save,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Github,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/components/auth/auth-provider';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import {
  getGCalStatus,
  disconnectGCal,
  syncFromGoogle,
  buildOAuthUrl,
  type GCalStatus,
} from '@/lib/google-calendar';
import {
  getGitHubStatus,
  disconnectGitHub,
  syncGitHubIssues,
  buildGitHubOAuthUrl,
  type GitHubStatus,
} from '@/lib/github';

const planLabels: Record<string, string> = {
  free: 'Free プラン',
  pro: 'Pro プラン',
  ultra: 'Ultra プラン',
};

export default function SettingsPage() {
  const { profile, user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Google Calendar state
  const [gcalStatus, setGcalStatus] = useState<GCalStatus | null>(null);
  const [gcalLoading, setGcalLoading] = useState(true);
  const [gcalSyncing, setGcalSyncing] = useState(false);
  const [gcalSyncResult, setGcalSyncResult] = useState<string | null>(null);
  const [gcalError, setGcalError] = useState<string | null>(null);

  // GitHub state
  const [ghStatus, setGhStatus] = useState<GitHubStatus | null>(null);
  const [ghLoading, setGhLoading] = useState(true);
  const [ghSyncing, setGhSyncing] = useState(false);
  const [ghSyncResult, setGhSyncResult] = useState<string | null>(null);
  const [ghError, setGhError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  useEffect(() => {
    getGCalStatus()
      .then(setGcalStatus)
      .catch((err) => console.error('GCal status error:', err))
      .finally(() => setGcalLoading(false));
    getGitHubStatus()
      .then(setGhStatus)
      .catch((err) => console.error('GitHub status error:', err))
      .finally(() => setGhLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user!.id);

      if (error) throw error;

      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGCal = useCallback(() => {
    try {
      const url = buildOAuthUrl();
      window.location.href = url;
    } catch (err) {
      setGcalError(err instanceof Error ? err.message : '連携を開始できませんでした');
    }
  }, []);

  const handleDisconnectGCal = useCallback(async () => {
    setGcalLoading(true);
    try {
      await disconnectGCal();
      setGcalStatus({ connected: false, email: null });
    } catch (err) {
      setGcalError(err instanceof Error ? err.message : '切断に失敗しました');
    } finally {
      setGcalLoading(false);
    }
  }, []);

  const handleSyncGCal = useCallback(async () => {
    setGcalSyncing(true);
    setGcalError(null);
    setGcalSyncResult(null);
    try {
      const result = await syncFromGoogle();
      setGcalSyncResult(`${result.imported}件の予定をインポートしました`);
      setTimeout(() => setGcalSyncResult(null), 5000);
    } catch (err) {
      setGcalError(err instanceof Error ? err.message : '同期に失敗しました');
    } finally {
      setGcalSyncing(false);
    }
  }, []);

  const handleConnectGitHub = useCallback(() => {
    try {
      const url = buildGitHubOAuthUrl();
      window.location.href = url;
    } catch (err) {
      setGhError(err instanceof Error ? err.message : '連携を開始できませんでした');
    }
  }, []);

  const handleDisconnectGitHub = useCallback(async () => {
    setGhLoading(true);
    try {
      await disconnectGitHub();
      setGhStatus({ connected: false, username: null });
    } catch (err) {
      setGhError(err instanceof Error ? err.message : '切断に失敗しました');
    } finally {
      setGhLoading(false);
    }
  }, []);

  const handleSyncGitHub = useCallback(async () => {
    setGhSyncing(true);
    setGhError(null);
    setGhSyncResult(null);
    try {
      const result = await syncGitHubIssues();
      setGhSyncResult(`${result.imported}件のIssue/PRをインポートしました`);
      setTimeout(() => setGhSyncResult(null), 5000);
    } catch (err) {
      setGhError(err instanceof Error ? err.message : '同期に失敗しました');
    } finally {
      setGhSyncing(false);
    }
  }, []);

  const initials = (profile?.full_name || 'U').slice(0, 2).toUpperCase();
  const planLabel = profile ? planLabels[profile.plan] ?? 'Free プラン' : 'Free プラン';

  return (
    <div className="mx-auto max-w-3xl flex flex-col gap-4 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">設定</h1>
        <p className="text-sm text-muted-foreground">
          アカウントとアプリの設定を管理します
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-sky-500" />
            <CardTitle className="text-base">プロフィール</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-sky-100 text-xl font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" size="sm">
                画像を変更
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">
                JPG, PNG (最大2MB)
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">名前</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="名前を入力"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email ?? user?.email ?? ''}
                disabled
                className="bg-muted/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving || !fullName}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  保存
                </>
              )}
            </Button>
            {saved && (
              <span className="text-sm text-emerald-600 dark:text-emerald-400">
                保存しました
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-base">プラン</CardTitle>
            </div>
            <Badge variant="secondary">{planLabel}</Badge>
          </div>
          <CardDescription>
            現在は無料プランをご利用中です
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-xl border border-dashed border-sky-300 bg-sky-50/50 p-4 dark:border-sky-800 dark:bg-sky-950/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">Pro にアップグレード</p>
                <p className="text-xs text-muted-foreground">
                  広告なし＋AI提案＋外部カレンダー連携
                </p>
              </div>
            </div>
            <Button size="sm" asChild>
              <a href="/pricing">¥980/月</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-sky-500" />
            <CardTitle className="text-base">Googleカレンダー連携</CardTitle>
          </div>
          <CardDescription>
            予定のインポート・エクスポート、タスクのエクスポートが可能です
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {gcalError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
              <XCircle className="h-4 w-4 shrink-0" />
              {gcalError}
            </div>
          )}

          {gcalSyncResult && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {gcalSyncResult}
            </div>
          )}

          {gcalLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              連携状態を確認中...
            </div>
          ) : gcalStatus?.connected ? (
            <>
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">連携中</p>
                    <p className="text-xs text-muted-foreground">
                      {gcalStatus.email || 'Googleアカウント'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncGCal}
                  disabled={gcalSyncing}
                >
                  {gcalSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      同期中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-3.5 w-3.5" />
                      予定をインポート
                    </>
                  )}
                </Button>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnectGCal}
                  className="text-xs text-muted-foreground hover:text-red-600"
                >
                  連携を解除
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-dashed border-border bg-muted/20 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <CalendarCheck className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">未連携</p>
                  <p className="text-xs text-muted-foreground">
                    Googleカレンダーと連携して予定を同期できます
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={handleConnectGCal}>
                連携する
              </Button>
            </div>
          )}

          <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="mb-1 font-medium">連携について</p>
            <ul className="list-inside list-disc space-y-0.5">
              <li>Googleカレンダーの予定をTaskSync AIにインポートできます</li>
              <li>TaskSync AIの予定をGoogleカレンダーにエクスポートできます</li>
              <li>タスクをGoogleカレンダーにエクスポートすると、色が変わって予定と区別できます</li>
              <li>学習記録はGoogleカレンダーに同期されません</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Github className="h-4 w-4 text-slate-700 dark:text-slate-300" />
            <CardTitle className="text-base">GitHub連携</CardTitle>
          </div>
          <CardDescription>
            IssueやPRをタスクとして取り込み、AIスケジューリングに活用できます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ghError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
              <XCircle className="h-4 w-4 shrink-0" />
              {ghError}
            </div>
          )}

          {ghSyncResult && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {ghSyncResult}
            </div>
          )}

          {ghLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              連携状態を確認中...
            </div>
          ) : ghStatus?.connected ? (
            <>
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                    <Github className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">連携中</p>
                    <p className="text-xs text-muted-foreground">
                      @{ghStatus.username || 'GitHubユーザー'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncGitHub}
                  disabled={ghSyncing}
                >
                  {ghSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      同期中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-3.5 w-3.5" />
                      Issueを同期
                    </>
                  )}
                </Button>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnectGitHub}
                  className="text-xs text-muted-foreground hover:text-red-600"
                >
                  連携を解除
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-dashed border-border bg-muted/20 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Github className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">未連携</p>
                  <p className="text-xs text-muted-foreground">
                    GitHubのIssueやPRをタスクとして取り込めます
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={handleConnectGitHub}>
                連携する
              </Button>
            </div>
          )}

          <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="mb-1 font-medium">連携について</p>
            <ul className="list-inside list-disc space-y-0.5">
              <li>自分にアサインされたオープンなIssue/PRを取り込みます</li>
              <li>取り込んだIssueはタスクとしてタスクプールに変換できます</li>
              <li>GitHubのIssue情報がAIスケジューリングの参考データとして活用されます</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-rose-500" />
            <CardTitle className="text-base">通知設定</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {[
            { label: 'AIスケジュール提案', desc: '空き時間に最適なタスクを提案', defaultChecked: true },
            { label: '締め切り通知', desc: 'タスクの期限が近づくと通知', defaultChecked: true },
            { label: '休憩リマインダー', desc: '長時間作業時に休憩を提案', defaultChecked: false },
            { label: '週次レポート', desc: '毎週日曜日に学習サマリーを送信', defaultChecked: true },
          ].map((item, i) => (
            <div key={item.label}>
              {i > 0 && <Separator className="my-1" />}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch defaultChecked={item.defaultChecked} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-emerald-500" />
            <CardTitle className="text-base">その他の連携</CardTitle>
          </div>
          <CardDescription>
            その他の外部ツールとの連携（近日対応予定）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {[
            { label: 'Outlook Calendar', desc: 'Microsoftアカウント' },
            { label: 'Notion', desc: 'データベースと同期（Ultra）' },
          ].map((item, i) => (
            <div key={item.label}>
              {i > 0 && <Separator className="my-1" />}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  連携
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-violet-500" />
            <CardTitle className="text-base">表示設定</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium">ダークモード</p>
              <p className="text-xs text-muted-foreground">
                システム設定に従うか、手動で切り替えます
              </p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium">タイムラインの時間範囲</p>
              <p className="text-xs text-muted-foreground">
                表示する時間帯を6:00〜21:00から変更
              </p>
            </div>
            <Button variant="outline" size="sm">
              設定
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
