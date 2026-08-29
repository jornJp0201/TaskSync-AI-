'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Database,
  Shield,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Loader2,
  Search,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Eye,
  Table2,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useAuth } from '@/components/auth/auth-provider';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  plan: string;
  is_admin: boolean;
  created_at: string;
}

interface TableData {
  name: string;
  rows: Record<string, unknown>[];
  columns: string[];
}

const BROWSABLE_TABLES = [
  'profiles',
  'projects',
  'tasks',
  'calendar_events',
  'study_logs',
  'github_issues',
  'ai_suggestions',
  'ai_prompts',
];

export default function AdminPage() {
  const { profile } = useAuth();
  const supabase = getSupabaseBrowser();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // DB browser state
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, plan, is_admin, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers((data ?? []) as AdminUser[]);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast({ description: 'ユーザー一覧の取得に失敗しました', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleAdmin = async (userId: string, currentAdmin: boolean) => {
    setUpdatingId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentAdmin })
        .eq('id', userId);
      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_admin: !currentAdmin } : u))
      );
      toast({
        description: currentAdmin ? '管理者権限を削除しました' : '管理者権限を付与しました',
      });
    } catch (err) {
      console.error('Failed to update admin status:', err);
      toast({ description: '権限の更新に失敗しました', variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const browseTable = async (tableName: string) => {
    setTableLoading(true);
    setSelectedTable(tableName);
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(50)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as Record<string, unknown>[];
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
      setTableData({ name: tableName, rows, columns });
    } catch (err) {
      console.error('Failed to browse table:', err);
      setTableData({ name: tableName, rows: [], columns: [] });
    } finally {
      setTableLoading(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    search
      ? u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.full_name?.toLowerCase().includes(search.toLowerCase()) ?? false)
      : true
  );

  const adminCount = users.filter((u) => u.is_admin).length;
  const planCounts = {
    free: users.filter((u) => u.plan === 'free').length,
    pro: users.filter((u) => u.plan === 'pro').length,
    ultra: users.filter((u) => u.plan === 'ultra').length,
  };

  return (
    <div className="mx-auto max-w-5xl flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-lg dark:from-slate-600 dark:to-slate-800">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">管理者ダッシュボード</h1>
          <p className="text-sm text-muted-foreground">
            ユーザー管理とデータベース閲覧
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <Users className="h-5 w-5 text-sky-500" />
          <p className="mt-2 text-2xl font-bold">{users.length}</p>
          <p className="text-xs text-muted-foreground">総ユーザー数</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
          <p className="mt-2 text-2xl font-bold">{adminCount}</p>
          <p className="text-xs text-muted-foreground">管理者</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <Crown className="h-5 w-5 text-amber-500" />
          <p className="mt-2 text-2xl font-bold">{planCounts.pro + planCounts.ultra}</p>
          <p className="text-xs text-muted-foreground">有料プラン</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <Database className="h-5 w-5 text-violet-500" />
          <p className="mt-2 text-2xl font-bold">{BROWSABLE_TABLES.length}</p>
          <p className="text-xs text-muted-foreground">閲覧可能テーブル</p>
        </div>
      </div>

      {/* User Management */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-500" />
              <CardTitle className="text-base">ユーザー管理</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
              )}
              更新
            </Button>
          </div>
          <CardDescription>
            ユーザーの管理者権限を切り替えできます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="メールまたは名前で検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              該当するユーザーがいません
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 p-3 transition-colors hover:bg-muted/20"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold ${
                        user.is_admin
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                      }`}
                    >
                      {(user.full_name || user.email).slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {user.full_name || user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={user.plan === 'free' ? 'secondary' : 'default'}
                      className="text-xs"
                    >
                      {user.plan === 'free' ? 'Free' : user.plan === 'pro' ? 'Pro' : 'Ultra'}
                    </Badge>
                    {user.is_admin && (
                      <Badge variant="outline" className="gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="h-3 w-3" />
                        管理者
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant={user.is_admin ? 'outline' : 'default'}
                      className="h-8 gap-1.5"
                      onClick={() => toggleAdmin(user.id, user.is_admin)}
                      disabled={updatingId === user.id || user.id === profile?.id}
                    >
                      {updatingId === user.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : user.is_admin ? (
                        <>
                          <ShieldOff className="h-3.5 w-3.5" />
                          権限削除
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5" />
                          管理者にする
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {profile && (
            <p className="text-xs text-muted-foreground">
              自分自身の管理者権限は変更できません
            </p>
          )}
        </CardContent>
      </Card>

      {/* Database Browser */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-violet-500" />
            <CardTitle className="text-base">データベース閲覧</CardTitle>
          </div>
          <CardDescription>
            テーブルのデータを確認できます（読み取り専用・最大50件）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Table list */}
          <div className="flex flex-wrap gap-2">
            {BROWSABLE_TABLES.map((table) => (
              <button
                key={table}
                onClick={() => {
                  if (expandedTable === table) {
                    setExpandedTable(null);
                    setSelectedTable(null);
                    setTableData(null);
                  } else {
                    setExpandedTable(table);
                    browseTable(table);
                  }
                }}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  expandedTable === table
                    ? 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300'
                    : 'border-border/60 bg-card text-muted-foreground hover:bg-muted/30'
                }`}
              >
                <Table2 className="h-3.5 w-3.5" />
                {table}
                {expandedTable === table ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            ))}
          </div>

          {/* Table data */}
          {selectedTable && (
            <div className="rounded-xl border border-border/60 overflow-hidden">
              {tableLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                </div>
              ) : !tableData || tableData.rows.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                  <Eye className="mr-2 h-4 w-4" />
                  データがありません
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/30">
                        {tableData.columns.map((col) => (
                          <th
                            key={col}
                            className="px-3 py-2 text-left font-mono font-medium text-muted-foreground whitespace-nowrap"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.rows.map((row, i) => (
                        <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                          {tableData.columns.map((col) => {
                            const value = row[col];
                            const displayValue =
                              value === null
                                ? 'NULL'
                                : typeof value === 'object'
                                ? JSON.stringify(value).slice(0, 60)
                                : String(value).slice(0, 80);
                            return (
                              <td
                                key={col}
                                className="px-3 py-2 font-mono text-muted-foreground whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis"
                              >
                                {displayValue}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="border-t border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    {tableData.rows.length}件表示中（最大50件）
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link to schema */}
      <Link href="/app/admin/schema">
        <Card className="border-border/60 transition-colors hover:border-sky-300 hover:bg-sky-50/30 dark:hover:border-sky-800 dark:hover:bg-sky-950/20">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950/40">
              <Database className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">スキーマ定義を確認</p>
              <p className="text-xs text-muted-foreground">
                ER図とテーブル定義の詳細を表示します
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
