/**
 * 構造化ログユーティリティ
 *
 * JSON形式でログを出力する軽量ロガー。外部ライブラリ不要。
 * - error / warn → stderr
 * - info / debug → stdout
 *
 * LOG_LEVEL 環境変数で出力レベルを制御（デフォルト: production=info, それ以外=debug）
 */

const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const CURRENT_LEVEL =
  LOG_LEVELS[process.env.LOG_LEVEL] ??
  (process.env.NODE_ENV === 'production' ? LOG_LEVELS.info : LOG_LEVELS.debug);

/**
 * ログエントリを JSON 文字列にフォーマットする。
 * @param {'error'|'warn'|'info'|'debug'} level
 * @param {string} message
 * @param {object} [meta]
 * @returns {string}
 */
const formatLog = (level, message, meta = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(Object.keys(meta).length > 0 ? { meta } : {}),
  };
  return JSON.stringify(entry);
};

export const logger = {
  /**
   * エラーログ（常に出力）
   * @param {string} message
   * @param {object} [meta]
   */
  error: (message, meta = {}) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.error) {
      process.stderr.write(formatLog('error', message, meta) + '\n');
    }
  },

  /**
   * 警告ログ
   * @param {string} message
   * @param {object} [meta]
   */
  warn: (message, meta = {}) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.warn) {
      process.stderr.write(formatLog('warn', message, meta) + '\n');
    }
  },

  /**
   * 情報ログ（本番でも出力）
   * @param {string} message
   * @param {object} [meta]
   */
  info: (message, meta = {}) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.info) {
      process.stdout.write(formatLog('info', message, meta) + '\n');
    }
  },

  /**
   * デバッグログ（開発環境のみ出力）
   * @param {string} message
   * @param {object} [meta]
   */
  debug: (message, meta = {}) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.debug) {
      process.stdout.write(formatLog('debug', message, meta) + '\n');
    }
  },
};
