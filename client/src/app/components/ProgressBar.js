'use client';
import { motion } from 'framer-motion';

/**
 * CF達成率バー（プロジェクト全体で統一）
 * @param {number} value - 0〜100以上
 * @param {string} className - 外側コンテナのクラス
 * @param {boolean} animate - アニメーションON/OFF（デフォルトtrue）
 */
export function ProgressBar({ value = 0, className = '', animate = true }) {
  const pct = Math.min(Math.max(value, 0), 100);
  const isAchieved = value >= 100;

  const bar = (
    <div
      className="h-full rounded-full"
      style={{
        width: `${pct}%`,
        background: isAchieved
          ? 'linear-gradient(to right, #34d399, #2dd4bf)'   // emerald→teal（達成）
          : 'linear-gradient(to right, #f472b6, #fb7185)',  // pink→rose（未達成）
        minWidth: pct > 0 ? '4px' : '0',
      }}
    />
  );

  return (
    <div className={`relative h-2 bg-slate-100 rounded-full overflow-hidden ${className}`}>
      {animate ? (
        <motion.div
          className="h-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            background: isAchieved
              ? 'linear-gradient(to right, #34d399, #2dd4bf)'
              : 'linear-gradient(to right, #f472b6, #fb7185)',
            minWidth: pct > 0 ? '4px' : '0',
            borderRadius: '9999px',
          }}
        />
      ) : bar}
    </div>
  );
}
