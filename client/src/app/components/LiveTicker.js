"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiActivity, FiGift, FiTruck, FiCheckCircle, FiTrendingUp } from 'react-icons/fi';

// 表示するログのダミーデータ
// ※本来はAPIから「最新のアクション5件」などを取得します
const TICKER_LOGS = [
  { id: 1, type: 'pledge', text: 'たった今、Aさんが『〇〇生誕祭』に3,000pt支援しました！', icon: <FiGift /> },
  { id: 2, type: 'production', text: 'お花屋さんが『全国ツアー東京公演』の制作を開始しました💐', icon: <FiCheckCircle /> },
  { id: 3, type: 'delivery', text: '『△△周年ライブ』のフラスタが会場に搬入されました🚚', icon: <FiTruck /> },
  { id: 4, type: 'goal', text: '🔥『××卒業企画』が目標金額を達成しました！開催決定！', icon: <FiTrendingUp /> },
  { id: 5, type: 'new', text: '新着企画『夏の野外フェス祝い』が立ち上がりました✨', icon: <FiActivity /> },
];

export default function LiveTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 4秒ごとに切り替え
    const interval = setInterval(() => {
      setIsVisible(false); // 一旦消す（フェードアウト）
      
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % TICKER_LOGS.length);
        setIsVisible(true); // 次の文字を出現させる（フェードイン）
      }, 500); // 0.5秒待機

    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const currentLog = TICKER_LOGS[currentIndex];

  // タイプごとの色設定
  const getIconColor = (type) => {
    switch(type) {
      case 'pledge': return 'text-pink-400';
      case 'goal': return 'text-red-500';
      case 'production': return 'text-green-400';
      case 'delivery': return 'text-blue-400';
      default: return 'text-yellow-400';
    }
  };

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 overflow-hidden relative h-10 flex items-center">
      <div className="container mx-auto px-4 flex items-center gap-3">
        
        {/* LIVEバッジ */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="text-[10px] font-bold tracking-widest text-slate-400">LIVE</span>
        </div>

        {/* 流れるテキスト部分 */}
        <div className={`flex-1 flex items-center gap-2 transition-all duration-500 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <span className={`text-lg ${getIconColor(currentLog.type)}`}>
            {currentLog.icon}
          </span>
          <p className="text-xs sm:text-sm font-medium truncate w-full">
            {currentLog.text}
          </p>
        </div>

        {/* 右側のCTA（任意） */}
        <Link href="/projects" className="hidden sm:block text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition-colors whitespace-nowrap">
          すべての動きを見る &rarr;
        </Link>

      </div>
    </div>
  );
}