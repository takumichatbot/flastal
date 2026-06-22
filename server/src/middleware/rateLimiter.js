import rateLimit from 'express-rate-limit';

const jsonHandler = (res, message) => {
  res.status(429).json({ message });
};

// 一般APIリクエスト: 15分に200回
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => jsonHandler(res, 'リクエストが多すぎます。しばらくしてから再試行してください。'),
});

// 認証系 (ログイン・登録): 15分に10回
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => jsonHandler(res, 'ログイン試行が多すぎます。15分後に再試行してください。'),
});

// ファイルアップロード: 1時間に30回
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => jsonHandler(res, 'アップロード回数の上限に達しました。1時間後に再試行してください。'),
});

// 支援・決済: 1時間に20回
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => jsonHandler(res, '決済リクエストが多すぎます。しばらくしてから再試行してください。'),
});

// AI生成系 (Gemini/Imagen): 1時間に10回
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => jsonHandler(res, 'AI機能の利用上限に達しました。1時間後に再試行してください。'),
});
