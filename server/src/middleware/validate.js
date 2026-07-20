import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.errors.map(e => e.message).join(' / ');
    return res.status(400).json({ message });
  }
  req.body = result.data;
  next();
};

// ── Schemas ─────────────────────────────────────────────────────────────────

export const cheerSchema = z.object({
  message: z.string().min(1, 'メッセージを入力してください').max(500, 'メッセージは500文字以内で入力してください').trim(),
  guestName: z.string().max(50, 'お名前は50文字以内で入力してください').trim().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
});

export const registerSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  handleName: z.string().min(1, 'ユーザー名を入力してください').max(30, 'ユーザー名は30文字以内で入力してください').trim(),
});

export const pledgeSchema = z.object({
  projectId: z.string().min(1, 'projectIdが必要です'),
  amount: z.coerce.number().int().positive('金額は1円以上で入力してください').optional(),
  comment: z.string().max(200, 'コメントは200文字以内で入力してください').trim().optional(),
  tierId: z.string().optional(),
});

export const offerSchema = z.object({
  projectId: z.string().min(1, 'projectIdが必要です'),
  message: z.string().min(1, 'メッセージを入力してください').max(1000, 'メッセージは1000文字以内で入力してください').trim(),
  proposedAmount: z.number({ invalid_type_error: '金額を数値で入力してください' }).int().positive('金額は正の値で入力してください').optional(),
  estimatedDays: z.number().int().positive().optional(),
});
