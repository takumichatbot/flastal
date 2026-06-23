/**
 * 金額を日本円フォーマットで表示するユーティリティ
 */

/**
 * 数値を日本円形式にフォーマット（例: 12345 → "12,345"）
 */
export function formatAmount(amount) {
  if (amount == null || isNaN(amount)) return '0';
  return Number(amount).toLocaleString('ja-JP');
}

/**
 * ¥記号付き金額文字列（例: 12345 → "¥12,345"）
 */
export function formatPrice(amount) {
  return `¥${formatAmount(amount)}`;
}

/**
 * Reactコンポーネント用 金額表示（tabular-nums適用）
 * 使い方: <PriceDisplay amount={12345} />
 */
export function PriceDisplay({ amount, showSymbol = true, className = '' }) {
  return (
    <span className={`tabular-nums ${className}`}>
      {showSymbol && <span className="text-slate-400 font-normal">¥</span>}
      <span className="font-bold">{formatAmount(amount)}</span>
    </span>
  );
}
