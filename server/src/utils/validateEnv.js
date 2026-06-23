/**
 * 起動時の必須環境変数バリデーション
 * app.js の全インポート後・app 初期化前に呼び出す。
 * 1つでも不足していれば即 process.exit(1) でサーバーを停止する。
 *
 * NOTE: logger は validateEnv より後に初期化されるため、ここでは
 *       process.stderr / process.stdout を直接使用する。
 */

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'FRONTEND_URL',
  'AWS_S3_BUCKET_NAME',  // S3ストレージ（画像アップロード等に必須）
];

/** 任意変数: 未設定でも起動は続行するが、一部機能が無効になる */
const OPTIONAL_ENV_VARS = [
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY', // Web Push 通知（未設定時は Push 無効）
  'VAPID_PRIVATE_KEY',            // Web Push 通知（未設定時は Push 無効）
  'REDIS_URL',                    // BullMQ / キャッシュ（未設定時はインプロセスフォールバック）
  'SENTRY_DSN',                   // エラートラッキング（未設定時は Sentry 無効）
];

export function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);
  if (missing.length > 0) {
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message: '[FATAL] 必須環境変数が設定されていません',
      meta: { missing },
    });
    process.stderr.write(entry + '\n');
    process.exit(1);
  }

  const missingOptional = OPTIONAL_ENV_VARS.filter(key => !process.env[key]);
  if (missingOptional.length > 0) {
    const warn = JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message: '[validateEnv] 任意環境変数が未設定（一部機能が無効）',
      meta: { missingOptional },
    });
    process.stdout.write(warn + '\n');
  }

  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    message: 'Required environment variables verified',
  });
  process.stdout.write(entry + '\n');
}
