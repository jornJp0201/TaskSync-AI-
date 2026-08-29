import { z } from 'zod';

export const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(1, 'パスワードを入力してください')
    .min(8, 'パスワードは8文字以上で入力してください'),
});

export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .min(1, '名前を入力してください')
      .max(50, '名前は50文字以内で入力してください'),
    email: z
      .string()
      .min(1, 'メールアドレスを入力してください')
      .email('有効なメールアドレスを入力してください'),
    password: z
      .string()
      .min(1, 'パスワードを入力してください')
      .min(8, 'パスワードは8文字以上で入力してください')
      .regex(/[A-Za-z]/, '英字を1文字以上含めてください')
      .regex(/[0-9]/, '数字を1文字以上含めてください'),
    confirmPassword: z.string().min(1, 'パスワード（確認）を入力してください'),
    privacy: z.boolean().refine((v) => v === true, 'プライバシーポリシーへの同意が必要です'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  });

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;

export function getAuthErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('Invalid login credentials')) {
    return 'メールアドレスまたはパスワードが正しくありません';
  }
  if (message.includes('User already registered')) {
    return 'このメールアドレスは既に登録されています';
  }
  if (message.includes('Email rate limit')) {
    return 'リクエストが多すぎます。しばらく待ってから再度お試しください';
  }
  if (message.includes('Password should be')) {
    return 'パスワードは8文字以上で、英字と数字を含めてください';
  }
  if (message.includes('fetch')) {
    return 'ネットワークエラーが発生しました。接続を確認してください';
  }
  return 'エラーが発生しました。しばらく待ってから再度お試しください';
}
