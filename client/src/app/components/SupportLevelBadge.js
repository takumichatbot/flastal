import React from 'react';
import { FiAward, FiStar, FiInfo } from 'react-icons/fi';
import { FaCrown, FaMedal } from 'react-icons/fa'; // 存在感のあるアイコンを使用

// ランクごとのスタイル設定
const RANK_CONFIG = {
  'Gold': {
    label: 'Gold Supporter',
    icon: <FaCrown />,
    // ゴールドのグラデーション + 光沢ボーダー
    className: 'bg-gradient-to-r from-yellow-100 via-amber-200 to-yellow-100 text-amber-800 border-yellow-400',
    iconColor: 'text-amber-600',
    description: '累計100,000pt以上支援した伝説のサポーター',
    shimmer: true, // キラキラアニメーション有効
  },
  'Silver': {
    label: 'Silver Supporter',
    icon: <FaMedal />,
    // シルバーのグラデーション
    className: 'bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 text-slate-700 border-slate-300',
    iconColor: 'text-slate-500',
    description: '累計50,000pt以上支援した熟練サポーター',
    shimmer: false,
  },
  'Bronze': {
    label: 'Bronze Supporter',
    icon: <FaMedal />,
    // ブロンズのグラデーション
    className: 'bg-gradient-to-r from-orange-50 via-orange-100 to-orange-50 text-orange-800 border-orange-200',
    iconColor: 'text-orange-700',
    description: '累計10,000pt以上支援した熱心なサポーター',
    shimmer: false,
  },
  'Fan': {
    label: 'Fan',
    icon: <FiStar />,
    // シンプルなファンバッジ
    className: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    iconColor: 'text-indigo-400',
    description: '推しを応援する素敵なファン',
    shimmer: false,
  },
};

/**
 * 支援者ランクバッジ
 * @param {string} level - ランク名 ('Gold', 'Silver', 'Bronze', 'Fan' etc.)
 * @param {boolean} showLabel - ラベルテキストを表示するか (デフォルト: true)
 * @param {string} size - サイズ 'sm' | 'md' (デフォルト: 'md')
 */
export default function SupportLevelBadge({ level, showLabel = true, size = 'md' }) {
  // 未定義のレベルが来たら 'Fan' にフォールバック
  const safeLevel = RANK_CONFIG[level] ? level : 'Fan';
  const config = RANK_CONFIG[safeLevel];

  // サイズごとのクラス
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';
  const iconSize = size === 'sm' ? 'text-[10px]' : 'text-sm';

  return (
    <div className="relative group inline-block">
      
      {/* バッジ本体 */}
      <div 
        className={`
          inline-flex items-center justify-center rounded-full border font-bold shadow-sm transition-transform group-hover:scale-105 cursor-help
          ${config.className} 
          ${sizeClasses}
          ${config.shimmer ? 'animate-shimmer bg-[length:200%_100%]' : ''}
        `}
      >
        <span className={`${config.iconColor} ${iconSize} drop-shadow-sm`}>
          {config.icon}
        </span>
        
        {showLabel && (
          <span className="tracking-tight whitespace-nowrap">
            {config.label}
          </span>
        )}
      </div>

      {/* ホバー時のツールチップ */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 hidden group-hover:block z-50 animate-fadeIn">
        <div className="bg-slate-800 text-white text-xs rounded-lg p-2 shadow-xl relative text-center">
          <p className="font-bold mb-0.5 text-yellow-400">{config.label}</p>
          <p className="opacity-90 leading-tight text-[10px]">{config.description}</p>
          {/* 吹き出しの三角 */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
        </div>
      </div>

    </div>
  );
}