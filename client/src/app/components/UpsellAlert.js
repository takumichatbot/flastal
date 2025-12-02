"use client";
import { FiTrendingUp, FiGift, FiStar } from 'react-icons/fi';

export default function UpsellAlert({ target, collected }) {
  const remaining = target - collected;
  const progress = (collected / target) * 100;

  // 達成済みなら表示しない（またはネクストゴール案内）
  if (remaining <= 0) return null;

  // まだ全然集まっていない場合も表示しない（プレッシャーになるため）
  // 目標の50%を超えたあたりから表示するのが効果的
  if (progress < 50) return null;

  let message = "";
  let icon = <FiTrendingUp />;
  let colorClass = "bg-blue-50 border-blue-200 text-blue-800";

  // 残額に応じたメッセージの出し分け
  if (remaining <= 3000) {
    // 超目前！ (緊急度MAX)
    message = `🔥 あと ${remaining.toLocaleString()} ptで目標達成です！あなたの支援で決めませんか？`;
    colorClass = "bg-red-50 border-red-200 text-red-800 animate-pulse"; // 赤で点滅
    icon = <FiStar className="text-xl" />;
  } else if (remaining <= 10000) {
    // もう一息
    message = `✨ あと ${remaining.toLocaleString()} ptで達成！お花をさらに豪華にできます。`;
    colorClass = "bg-orange-50 border-orange-200 text-orange-800";
    icon = <FiGift className="text-xl" />;
  } else {
    // 半分過ぎたあたり
    message = `あと ${remaining.toLocaleString()} pt！目標達成が見えてきました！`;
    colorClass = "bg-indigo-50 border-indigo-200 text-indigo-800";
  }

  return (
    <div className={`p-4 rounded-xl border-2 shadow-sm flex items-center gap-3 mb-6 transition-all duration-500 ${colorClass}`}>
      <div className="p-2 bg-white rounded-full shadow-sm shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-bold text-sm md:text-base">
          {message}
        </p>
        <p className="text-xs opacity-80 mt-0.5">
          現在 {progress.toFixed(0)}% 達成中
        </p>
      </div>
    </div>
  );
}