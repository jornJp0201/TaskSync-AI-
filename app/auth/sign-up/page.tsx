'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, Lock, User, Eye, EyeOff, ShieldCheck, Check, ChevronDown, FileText } from 'lucide-react';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { signUpSchema, getAuthErrorMessage, type SignUpValues } from '@/lib/auth-validation';

export default function SignUpPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', privacy: false },
  });

  const password = watch('password') || '';

  const strengthChecks = [
    { label: '8文字以上', pass: password.length >= 8 },
    { label: '英字を含む', pass: /[A-Za-z]/.test(password) },
    { label: '数字を含む', pass: /[0-9]/.test(password) },
  ];

  const onSubmit = async (values: SignUpValues) => {
    setServerError(null);
    setSubmitting(true);

    try {
      const { getSupabaseBrowser } = await import('@/lib/supabase-browser');
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { full_name: values.fullName },
        },
      });

      if (error) throw error;

      router.push('/app');
      router.refresh();
    } catch (error) {
      setServerError(getAuthErrorMessage(error));
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="新規登録"
      subtitle="無料でアカウントを作成してTaskSync AIを始める"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {serverError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
            {serverError}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="fullName">名前</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="fullName"
              type="text"
              placeholder="山田 太郎"
              autoComplete="name"
              className="pl-9"
              {...register('fullName')}
            />
          </div>
          {errors.fullName && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.fullName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">メールアドレス</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              className="pl-9"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">パスワード</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              className="px-9"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password ? (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.password.message}</p>
          ) : (
            <div className="flex flex-wrap gap-3 pt-1">
              {strengthChecks.map((check) => (
                <div
                  key={check.label}
                  className={`flex items-center gap-1 text-xs ${
                    check.pass
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground'
                  }`}
                >
                  <span
                    className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${
                      check.pass
                        ? 'bg-emerald-100 dark:bg-emerald-900'
                        : 'bg-muted'
                    }`}
                  >
                    {check.pass && <Check className="h-2 w-2" />}
                  </span>
                  {check.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">パスワード（確認）</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              className="px-9"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Privacy policy accordion */}
        <div className="rounded-lg border border-border/60">
          <button
            type="button"
            onClick={() => setPrivacyOpen(!privacyOpen)}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium hover:bg-muted/50"
          >
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            プライバシーポリシー
            <ChevronDown
              className={`ml-auto h-4 w-4 text-muted-foreground transition-transform ${privacyOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {privacyOpen && (
            <div className="border-t border-border/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              <h4 className="mb-2 font-semibold text-foreground">個人情報の取り扱いについて</h4>
              <p className="mb-2">
                本サービスは、インターンシップの一環として開発されたポートフォリオ作品です。登録いただいた個人情報は以下の目的でのみ利用します。
              </p>
              <ul className="mb-2 list-inside list-disc space-y-1">
                <li>アカウント識別のための名前・メールアドレスの保管</li>
                <li>サービス内でのタスク・スケジュールデータの管理</li>
                <li>認証・ログインセッションの維持</li>
              </ul>
              <p className="mb-2">
                取得した情報は第三者に提供することはなく、サービスの提供および機能の検証目的のみに使用します。データは暗号化されて保存され、通信もSSL/TLSで保護されています。
              </p>
              <p className="mb-2">
                ご本人から削除の申し出があった場合、速やかにアカウントおよび関連データを削除します。お問い合わせは登録メールアドレスより行ってください。
              </p>
              <p className="text-muted-foreground/80">
                本サービスは課金を行いません。料金プランの表示は作品の構成上のデモであり、実際に決済が発生することはありません。
              </p>
            </div>
          )}
        </div>

        {/* Privacy consent checkbox */}
        <div className="space-y-2">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="privacy"
              onCheckedChange={(checked) => setValue('privacy', checked === true, { shouldValidate: true })}
              className="mt-0.5"
            />
            <Label htmlFor="privacy" className="text-sm leading-relaxed font-normal cursor-pointer">
              <span>上記の</span>{' '}
              <button
                type="button"
                onClick={() => setPrivacyOpen(true)}
                className="font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400"
              >
                プライバシーポリシー
              </button>
              <span>の内容を確認し、個人情報の取り扱いに同意します</span>
            </Label>
          </div>
          {errors.privacy && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.privacy.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              アカウント作成中...
            </>
          ) : (
            'アカウントを作成'
          )}
        </Button>

        <div className="flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50/50 px-4 py-2.5 text-xs text-sky-700 dark:border-sky-900 dark:bg-sky-950/20 dark:text-sky-300">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          通信は暗号化され、パスワードは安全に保存されます
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        既にアカウントをお持ちですか？{' '}
        <Link href="/auth/sign-in" className="font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400">
          ログイン
        </Link>
      </p>
    </AuthShell>
  );
}
