'use client';

import { useState } from 'react';
import {
  Database,
  Key,
  Link2,
  Table2,
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  CheckSquare,
  FolderKanban,
  BookOpen,
  Github,
  Sparkles,
  MessageSquare,
  CalendarClock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  pk: boolean;
  default: string | null;
  fk?: string | null;
}

interface TableInfo {
  name: string;
  icon: typeof Database;
  description: string;
  columns: ColumnInfo[];
}

const tables: TableInfo[] = [
  {
    name: 'profiles',
    icon: User,
    description: 'ユーザープロフィール情報。Supabaseのauth.usersと1対1で紐づきます。プラン（free/pro/ultra）で機能制限を管理します。',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, pk: true, default: null, fk: 'auth.users.id' },
      { name: 'email', type: 'text', nullable: false, pk: false, default: null },
      { name: 'full_name', type: 'text', nullable: true, pk: false, default: null },
      { name: 'avatar_url', type: 'text', nullable: true, pk: false, default: null },
      { name: 'plan', type: 'text', nullable: false, pk: false, default: "'free'", },
      { name: 'created_at', type: 'timestamptz', nullable: true, pk: false, default: 'now()' },
      { name: 'updated_at', type: 'timestamptz', nullable: true, pk: false, default: 'now()' },
    ],
  },
  {
    name: 'projects',
    icon: FolderKanban,
    description: 'タスクをグループ化するプロジェクト。ユーザーごとに作成され、色とアイコンで識別します。',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, pk: true, default: 'gen_random_uuid()' },
      { name: 'user_id', type: 'uuid', nullable: false, pk: false, default: 'auth.uid()', fk: 'auth.users.id' },
      { name: 'name', type: 'text', nullable: false, pk: false, default: null },
      { name: 'color', type: 'text', nullable: false, pk: false, default: "'#0ea5e9'" },
      { name: 'icon', type: 'text', nullable: true, pk: false, default: null },
      { name: 'created_at', type: 'timestamptz', nullable: true, pk: false, default: 'now()' },
    ],
  },
  {
    name: 'tasks',
    icon: CheckSquare,
    description: 'タスクの本体。優先度・ステータス・見積もり時間を持ち、プロジェクトに所属します。GitHub Issue由来のタスクはgithub_issue_idで紐づき、分割されたサブタスクはparent_task_idで親タスクを参照します。',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, pk: true, default: 'gen_random_uuid()' },
      { name: 'user_id', type: 'uuid', nullable: false, pk: false, default: 'auth.uid()', fk: 'auth.users.id' },
      { name: 'title', type: 'text', nullable: false, pk: false, default: null },
      { name: 'description', type: 'text', nullable: true, pk: false, default: null },
      { name: 'priority', type: 'text', nullable: false, pk: false, default: "'medium'" },
      { name: 'status', type: 'text', nullable: false, pk: false, default: "'todo'" },
      { name: 'estimated_minutes', type: 'integer', nullable: false, pk: false, default: '30' },
      { name: 'actual_minutes', type: 'integer', nullable: true, pk: false, default: null },
      { name: 'due_date', type: 'date', nullable: true, pk: false, default: null },
      { name: 'project_id', type: 'uuid', nullable: true, pk: false, default: null, fk: 'projects.id' },
      { name: 'tags', type: 'text[]', nullable: true, pk: false, default: "'{}'" },
      { name: 'google_event_id', type: 'text', nullable: true, pk: false, default: null },
      { name: 'google_color_id', type: 'text', nullable: true, pk: false, default: null },
      { name: 'github_issue_id', type: 'bigint', nullable: true, pk: false, default: null },
      { name: 'parent_task_id', type: 'uuid', nullable: true, pk: false, default: null, fk: 'tasks.id (自己参照)' },
      { name: 'suggested_start_time', type: 'timestamptz', nullable: true, pk: false, default: null },
      { name: 'suggested_end_time', type: 'timestamptz', nullable: true, pk: false, default: null },
      { name: 'created_at', type: 'timestamptz', nullable: true, pk: false, default: 'now()' },
      { name: 'updated_at', type: 'timestamptz', nullable: true, pk: false, default: 'now()' },
    ],
  },
  {
    name: 'calendar_events',
    icon: CalendarClock,
    description: 'カレンダーの予定（固定スケジュール）。会議・業務・個人・学習・休憩の5タイプがあり、Googleカレンダーからインポートした予定はgoogle_event_idで重複管理します。',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, pk: true, default: 'gen_random_uuid()' },
      { name: 'user_id', type: 'uuid', nullable: false, pk: false, default: 'auth.uid()', fk: 'auth.users.id' },
      { name: 'title', type: 'text', nullable: false, pk: false, default: null },
      { name: 'start_time', type: 'timestamptz', nullable: false, pk: false, default: null },
      { name: 'end_time', type: 'timestamptz', nullable: false, pk: false, default: null },
      { name: 'type', type: 'text', nullable: false, pk: false, default: "'work'" },
      { name: 'location', type: 'text', nullable: true, pk: false, default: null },
      { name: 'is_fixed', type: 'boolean', nullable: false, pk: false, default: 'true' },
      { name: 'google_event_id', type: 'text', nullable: true, pk: false, default: null },
      { name: 'created_at', type: 'timestamptz', nullable: true, pk: false, default: 'now()' },
    ],
  },
  {
    name: 'study_logs',
    icon: BookOpen,
    description: '学習記録ログ。タスクに紐づけることもでき、日付・時間・カテゴリ・メモを記録します。AIスケジューリングの参考データとして活用されます。',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, pk: true, default: 'gen_random_uuid()' },
      { name: 'user_id', type: 'uuid', nullable: false, pk: false, default: 'auth.uid()', fk: 'auth.users.id' },
      { name: 'task_id', type: 'uuid', nullable: true, pk: false, default: null, fk: 'tasks.id' },
      { name: 'date', type: 'date', nullable: false, pk: false, default: null },
      { name: 'minutes', type: 'integer', nullable: false, pk: false, default: null },
      { name: 'category', type: 'text', nullable: false, pk: false, default: null },
      { name: 'memo', type: 'text', nullable: true, pk: false, default: null },
      { name: 'created_at', type: 'timestamptz', nullable: true, pk: false, default: 'now()' },
    ],
  },
  {
    name: 'google_calendar_tokens',
    icon: Calendar,
    description: 'Googleカレンダー連携のOAuthトークン。ユーザーごとに1レコードで、アクセストークン・リフレッシュトークンを管理します。',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, pk: true, default: 'gen_random_uuid()' },
      { name: 'user_id', type: 'uuid', nullable: false, pk: false, default: 'auth.uid()', fk: 'auth.users.id' },
      { name: 'access_token', type: 'text', nullable: false, pk: false, default: null },
      { name: 'refresh_token', type: 'text', nullable: true, pk: false, default: null },
      { name: 'expires_at', type: 'timestamptz', nullable: true, pk: false, default: null },
      { name: 'email', type: 'text', nullable: true, pk: false, default: null },
      { name: 'created_at', type: 'timestamptz', nullable: true, pk: false, default: 'now()' },
      { name: 'updated_at', type: 'timestamptz', nullable: true, pk: false, default: 'now()' },
    ],
  },
  {
    name: 'github_tokens',
    icon: Github,
    description: 'GitHub連携のOAuthトークン。ユーザーごとに1レコード（UNIQUE制約）。アクセストークンとスコープ、GitHubユーザー名を保存します。',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, pk: true, default: 'gen_random_uuid()' },
      { name: 'user_id', type: 'uuid', nullable: false, pk: false, default: 'auth.uid()', fk: 'auth.users.id' },
      { name: 'github_username', type: 'text', nullable: true, pk: false, default: null },
      { name: 'access_token', type: 'text', nullable: false, pk: false, default: null },
      { name: 'scope', type: 'text', nullable: true, pk: false, default: null },
      { name: 'created_at', type: 'timestamptz', nullable: true, pk: false, default: 'now()' },
      { name: 'updated_at', type: 'timestamptz', nullable: true, pk: false, default: 'now()' },
    ],
  },
  {
    name: 'github_repos',
    icon: Github,
    description: 'GitHubリポジトリのキャッシュ。ユーザーがアクセス可能なリポジトリのメタデータを保存します。',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, pk: true, default: 'gen_random_uuid()' },
      { name: 'user_id', type: 'uuid', nullable: false, pk: false, default: 'auth.uid()', fk: 'auth.users.id' },
      { name: 'repo_id', type: 'bigint', nullable: false, pk: false, default: null },
      { name: 'full_name', type: 'text', nullable: false, pk: false, default: null },
      { name: 'name', type: 'text', nullable: false, pk: false, default: null },
      { name: 'owner_login', type: 'text', nullable: false, pk: false, default: null },
      { name: 'private', type: 'boolean', nullable: false, pk: false, default: 'false' },
      { name: 'html_url', type: 'text', nullable: true, pk: false, default: null },
      { name: 'description', type: 'text', nullable: true, pk: false, default: null },
      { name: 'language', type: 'text', nullable: true, pk: false, default: null },
      { name: 'stars', type: 'integer', nullable: false, pk: false, default: '0' },
      { name: 'updated_at_github', type: 'timestamptz', nullable: true, pk: false, default: null },
      { name: 'created_at', type: 'timestamptz', nullable: true, pk: false, default: 'now()' },
    ],
  },
  {
    name: 'github_issues',
    icon: Github,
    description: 'GitHubから取得したIssue/PRのキャッシュ。自分にアサインされたオープンなIssueを保存し、タスクに変換できます。',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, pk: true, default: 'gen_random_uuid()' },
      { name: 'user_id', type: 'uuid', nullable: false, pk: false, default: 'auth.uid()', fk: 'auth.users.id' },
      { name: 'github_id', type: 'bigint', nullable: false, pk: false, default: null },
      { name: 'repo_full_name', type: 'text', nullable: false, pk: false, default: null },
      { name: 'number', type: 'integer', nullable: false, pk: false, default: null },
      { name: 'title', type: 'text', nullable: false, pk: false, default: null },
      { name: 'body', type: 'text', nullable: true, pk: false, default: null },
      { name: 'state', type: 'text', nullable: false, pk: false, default: "'open'" },
      { name: 'is_pr', type: 'boolean', nullable: false, pk: false, default: 'false' },
      { name: 'labels', type: 'text[]', nullable: false, pk: false, default: "'{}'" },
      { name: 'assignee_login', type: 'text', nullable: true, pk: false, default: null },
      { name: 'html_url', type: 'text', nullable: true, pk: false, default: null },
      { name: 'due_date', type: 'timestamptz', nullable: true, pk: false, default: null },
      { name: 'created_at_github', type: 'timestamptz', nullable: true, pk: false, default: null },
      { name: 'updated_at_github', type: 'timestamptz', nullable: true, pk: false, default: null },
      { name: 'fetched_at', type: 'timestamptz', nullable: true, pk: false, default: 'now()' },
    ],
  },
  {
    name: 'ai_suggestions',
    icon: Sparkles,
    description: 'AIが生成したスケジュール提案。タスクをどの空き時間に配置すべきかの提案を保存し、適用済み（applied）・却下済み（dismissed）で状態管理します。',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, pk: true, default: 'gen_random_uuid()' },
      { name: 'user_id', type: 'uuid', nullable: false, pk: false, default: 'auth.uid()', fk: 'auth.users.id' },
      { name: 'type', type: 'text', nullable: false, pk: false, default: "'schedule'" },
      { name: 'title', type: 'text', nullable: false, pk: false, default: null },
      { name: 'description', type: 'text', nullable: false, pk: false, default: null },
      { name: 'task_id', type: 'uuid', nullable: true, pk: false, default: null, fk: 'tasks.id' },
      { name: 'suggested_start', type: 'timestamptz', nullable: true, pk: false, default: null },
      { name: 'suggested_end', type: 'timestamptz', nullable: true, pk: false, default: null },
      { name: 'confidence', type: 'integer', nullable: false, pk: false, default: '80' },
      { name: 'applied', type: 'boolean', nullable: false, pk: false, default: 'false' },
      { name: 'dismissed', type: 'boolean', nullable: false, pk: false, default: 'false' },
      { name: 'created_at', type: 'timestamptz', nullable: true, pk: false, default: 'now()' },
    ],
  },
  {
    name: 'ai_prompts',
    icon: MessageSquare,
    description: 'ユーザーがAIアシスタントに送信したプロンプトと応答の履歴。コンテキスト（タスク・予定のスナップショット）もJSONで保存します。',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, pk: true, default: 'gen_random_uuid()' },
      { name: 'user_id', type: 'uuid', nullable: false, pk: false, default: 'auth.uid()', fk: 'auth.users.id' },
      { name: 'prompt', type: 'text', nullable: false, pk: false, default: null },
      { name: 'response', type: 'text', nullable: true, pk: false, default: null },
      { name: 'context', type: 'jsonb', nullable: true, pk: false, default: null },
      { name: 'created_at', type: 'timestamptz', nullable: true, pk: false, default: 'now()' },
    ],
  },
];

const relationships: { from: string; to: string; label: string }[] = [
  { from: 'profiles', to: 'auth.users', label: '1:1 (id)' },
  { from: 'projects', to: 'auth.users', label: 'N:1 (user_id)' },
  { from: 'tasks', to: 'auth.users', label: 'N:1 (user_id)' },
  { from: 'tasks', to: 'projects', label: 'N:1 (project_id)' },
  { from: 'tasks', to: 'tasks', label: '自己参照 (parent_task_id)' },
  { from: 'calendar_events', to: 'auth.users', label: 'N:1 (user_id)' },
  { from: 'study_logs', to: 'auth.users', label: 'N:1 (user_id)' },
  { from: 'study_logs', to: 'tasks', label: 'N:1 (task_id)' },
  { from: 'google_calendar_tokens', to: 'auth.users', label: '1:1 (user_id)' },
  { from: 'github_tokens', to: 'auth.users', label: '1:1 (user_id)' },
  { from: 'github_repos', to: 'auth.users', label: 'N:1 (user_id)' },
  { from: 'github_issues', to: 'auth.users', label: 'N:1 (user_id)' },
  { from: 'ai_suggestions', to: 'auth.users', label: 'N:1 (user_id)' },
  { from: 'ai_suggestions', to: 'tasks', label: 'N:1 (task_id)' },
  { from: 'ai_prompts', to: 'auth.users', label: 'N:1 (user_id)' },
];

function TableNode({ table, x, y }: { table: TableInfo; x: number; y: number }) {
  const Icon = table.icon;
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        width="200"
        height={40 + table.columns.length * 18}
        rx="8"
        fill="white"
        stroke="#cbd5e1"
        strokeWidth="1.5"
      />
      <rect width="200" height="32" rx="8" fill="#0ea5e9" />
      <rect y="24" width="200" height="8" fill="#0ea5e9" />
      <foreignObject x="8" y="4" width="184" height="24">
        <div className="flex items-center gap-1.5 text-white text-xs font-semibold">
          <Icon className="h-3.5 w-3.5" />
          {table.name}
        </div>
      </foreignObject>
      {table.columns.map((col, i) => (
        <foreignObject key={col.name} x="4" y={36 + i * 18} width="192" height="16">
          <div className="flex items-center gap-1 text-[10px]">
            {col.pk && <Key className="h-2.5 w-2.5 text-amber-500" />}
            {col.fk && <Link2 className="h-2.5 w-2.5 text-sky-500" />}
            <span className={col.pk ? 'font-bold text-slate-800' : 'text-slate-600'}>
              {col.name}
            </span>
            <span className="ml-auto text-slate-400">{col.type}</span>
          </div>
        </foreignObject>
      ))}
    </g>
  );
}

export default function SchemaPage() {
  const [expanded, setExpanded] = useState<string | null>('tasks');

  const toggle = (name: string) => setExpanded(expanded === name ? null : name);

  // Layout positions for ER diagram
  const positions: Record<string, { x: number; y: number }> = {
    profiles: { x: 20, y: 20 },
    projects: { x: 280, y: 20 },
    tasks: { x: 280, y: 220 },
    calendar_events: { x: 20, y: 200 },
    study_logs: { x: 540, y: 220 },
    google_calendar_tokens: { x: 20, y: 420 },
    github_tokens: { x: 280, y: 520 },
    github_repos: { x: 540, y: 420 },
    github_issues: { x: 540, y: 620 },
    ai_suggestions: { x: 20, y: 620 },
    ai_prompts: { x: 280, y: 720 },
  };

  return (
    <div className="mx-auto max-w-5xl flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">データベーススキーマ</h1>
        <p className="text-sm text-muted-foreground">
          TaskSync AIの全テーブル定義とER図
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <Database className="h-5 w-5 text-sky-500" />
          <p className="mt-2 text-2xl font-bold">11</p>
          <p className="text-xs text-muted-foreground">テーブル数</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <Link2 className="h-5 w-5 text-emerald-500" />
          <p className="mt-2 text-2xl font-bold">15</p>
          <p className="text-xs text-muted-foreground">リレーション数</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <Key className="h-5 w-5 text-amber-500" />
          <p className="mt-2 text-2xl font-bold">11</p>
          <p className="text-xs text-muted-foreground">主キー</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <Table2 className="h-5 w-5 text-violet-500" />
          <p className="mt-2 text-2xl font-bold">11</p>
          <p className="text-xs text-muted-foreground">RLS有効</p>
        </div>
      </div>

      {/* ER Diagram */}
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">ER図</h2>
        <div className="overflow-x-auto">
          <svg width="760" height="900" className="min-w-[760px]">
            {/* Connection lines */}
            {relationships.map((rel, i) => {
              const from = positions[rel.from];
              const to = positions[rel.to];
              if (!from || !to) return null;
              const x1 = from.x + 100;
              const y1 = from.y + 20;
              const x2 = to.x + 100;
              const y2 = to.y + 20;
              const isSelfRef = rel.from === rel.to;
              if (isSelfRef) {
                return (
                  <g key={i}>
                    <path
                      d={`M ${x1 + 100} ${y1 + 40} Q ${x1 + 160} ${y1 + 20} ${x1 + 100} ${y1 + 80}`}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />
                    <text x={x1 + 170} y={y1 + 50} className="text-[8px] fill-slate-400">
                      {rel.label}
                    </text>
                  </g>
                );
              }
              return (
                <g key={i}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#94a3b8"
                    strokeWidth="1"
                    strokeDasharray="3 2"
                  />
                </g>
              );
            })}

            {/* Table nodes */}
            {tables.map((table) => {
              const pos = positions[table.name];
              if (!pos) return null;
              return <TableNode key={table.name} table={table} x={pos.x} y={pos.y} />;
            })}

            {/* auth.users node */}
            <g transform="translate(280, 0)">
              <rect width="200" height="28" rx="8" fill="#64748b" />
              <foreignObject x="8" y="4" width="184" height="20">
                <div className="flex items-center gap-1.5 text-white text-xs font-semibold">
                  <User className="h-3.5 w-3.5" />
                  auth.users (Supabase)
                </div>
              </foreignObject>
            </g>
          </svg>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Key className="h-3 w-3 text-amber-500" />
            主キー
          </span>
          <span className="flex items-center gap-1">
            <Link2 className="h-3 w-3 text-sky-500" />
            外部キー
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            テーブルヘッダー
          </span>
        </div>
      </div>

      {/* Relationship list */}
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">リレーション一覧</h2>
        <div className="space-y-1.5">
          {relationships.map((rel, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <Badge variant="secondary" className="font-mono">{rel.from}</Badge>
              <span className="text-muted-foreground">→</span>
              <Badge variant="secondary" className="font-mono">{rel.to}</Badge>
              <span className="text-muted-foreground">{rel.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table details */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">テーブル詳細</h2>
        {tables.map((table) => {
          const Icon = table.icon;
          const isOpen = expanded === table.name;
          return (
            <div key={table.name} className="rounded-2xl border border-border/60 bg-card overflow-hidden">
              <button
                onClick={() => toggle(table.name)}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/30"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950/40">
                  <Icon className="h-4.5 w-4.5 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-mono text-sm font-semibold">{table.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{table.description}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {table.columns.length}カラム
                </Badge>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {isOpen && (
                <div className="border-t border-border/60">
                  <p className="px-4 py-3 text-sm text-muted-foreground">{table.description}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border/60 bg-muted/30">
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">カラム名</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">型</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">制約</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">デフォルト</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">外部キー</th>
                        </tr>
                      </thead>
                      <tbody>
                        {table.columns.map((col) => (
                          <tr key={col.name} className="border-b border-border/30 last:border-0">
                            <td className="px-4 py-2 font-mono font-medium">
                              <div className="flex items-center gap-1.5">
                                {col.pk && <Key className="h-3 w-3 text-amber-500" />}
                                {col.fk && <Link2 className="h-3 w-3 text-sky-500" />}
                                {col.name}
                              </div>
                            </td>
                            <td className="px-4 py-2 font-mono text-muted-foreground">{col.type}</td>
                            <td className="px-4 py-2">
                              {col.pk && <Badge variant="outline" className="text-[10px]">PK</Badge>}
                              {!col.pk && !col.nullable && (
                                <Badge variant="outline" className="text-[10px]">NOT NULL</Badge>
                              )}
                              {col.nullable && !col.pk && (
                                <span className="text-[10px] text-muted-foreground">NULL可</span>
                              )}
                            </td>
                            <td className="px-4 py-2 font-mono text-muted-foreground">
                              {col.default ?? '-'}
                            </td>
                            <td className="px-4 py-2 font-mono text-sky-600 dark:text-sky-400">
                              {col.fk ?? '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* RLS note */}
      <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/30 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/10">
        <h2 className="mb-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          セキュリティ（Row Level Security）
        </h2>
        <p className="text-xs text-muted-foreground">
          全11テーブルでRLS（行レベルセキュリティ）が有効化されています。
          各テーブルにはCRUD（作成・読取・更新・削除）ごとに4つのポリシーが定義されており、
          ユーザーは自分のデータ（<code className="font-mono text-emerald-600">auth.uid() = user_id</code>）のみアクセス可能です。
          <code className="font-mono text-emerald-600"> user_id</code>カラムには
          <code className="font-mono text-emerald-600"> DEFAULT auth.uid()</code>が設定され、
          フロントエンドからの挿入時にユーザーIDが自動付与されます。
        </p>
      </div>
    </div>
  );
}
