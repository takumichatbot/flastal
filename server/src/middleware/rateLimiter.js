import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedis } from '../config/redis.js';

const jsonHandler = (res, message) => {
  res.status(429).json({ message });
};

/**
 * REDIS_URL が設定されている場合は RedisStore を使用し、
 * 複数サーバーインスタンス間でレート制限カウンターを共有する。
 * 未設定の場合はデフォルトのメモリストアにフォールバック。
 */
function buildStore(prefix) {
  const redisClient = getRedis();
  if (!redisClient) return undefined; // メモリストア（フォールバック）

  return new RedisStore({
    // ioredis の sendCommand を rate-limit-redis の sendCommand インターフェースに適合させる
    sendCommand: (...args) => redisClient.call(...args),
    prefix: `rl:${prefix}:`,
  });
}

// 一般APIリクエスト: 15分に200回
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore('general'),
  handler: (req, res) => jsonHandler(res, 'リクエストが多すぎます。しばらくしてから再試行してください。'),
});

// ファイルアップロード: 1時間に30回
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore('upload'),
  handler: (req, res) => jsonHandler(res, 'アップロード回数の上限に達しました。1時間後に再試行してください。'),
});

// 支援・決済: 1時間に20回
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore('payment'),
  handler: (req, res) => jsonHandler(res, '決済リクエストが多すぎます。しばらくしてから再試行してください。'),
});

// AI生成系 (Gemini/Imagen): 1時間に10回
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore('ai'),
  handler: (req, res) => jsonHandler(res, 'AI機能の利用上限に達しました。1時間後に再試行してください。'),
});
