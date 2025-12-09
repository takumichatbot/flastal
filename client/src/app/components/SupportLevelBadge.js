import React from 'react';

// 💡 支援者レベルごとの設定
const levelConfig = {
  // Gold (100,000pt~)
  'Gold': { icon: '🏆', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  // Silver (50,000pt~)
  'Silver': { icon: '🥈', color: 'bg-gray-200 text-gray-700 border-gray-300' },
  // Bronze (10,000pt~)
  'Bronze': { icon: '🥉', color: 'bg-amber-800/10 text-amber-900 border-amber-900/30' },
  // デフォルト
  'Fan': { icon: '⭐', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
};

/**
 * 支援者レベルのバッジを表示するコンポーネント
 * @param {string} level - ユーザーの現在のレベル名 (Gold, Silver, Bronzeなど)
 */
export default function SupportLevelBadge({ level }) {
  // レベルが未設定または不明な場合は 'Fan' を使用
  const currentLevel = level && levelConfig[level] ? level : 'Fan';
  const { icon, color } = levelConfig[currentLevel];
  
  return (
    <div className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border ${color} shadow-sm`}>
      <span>{icon}</span>
      <span>{currentLevel}サポーター</span>
    </div>
  );
}