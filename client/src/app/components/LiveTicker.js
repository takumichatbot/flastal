"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiActivity, FiGift, FiTruck, FiCheckCircle, FiTrendingUp, FiInfo } from 'react-icons/fi';

// ダミーデータ (本番ではAPIから取得することを想定)
const TICKER_LOGS = [
  { id: 1, type: 'pledge', text: 'たった今、Aさんが『星野アイ生誕祭2025』に 10,000pt 支援しました！🎉', href: '/projects/1' },
  { id: 2, type: 'production', text: 'お花屋さんが『武道館ライブ』の制作を開始しました💐', href: '/projects/2' },
  { id: 3, type: 'goal', text: '🔥『デビュー5周年記念』が目標金額100%を達成しました！おめでとうございます！', href: '/projects/3' },
  { id: 4, type: 'new', text: '新着企画『夏の野外フェス祝い』が公開されました✨ 参加者募集中！', href: '/projects/4' },
  { id: 5, type: 'delivery', text: '『Zepp Tour Final』のフラスタが設置完了しました📸 現地写真公開中', href: '/projects/5' },
];

export default function LiveTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // 5秒ごとに切り替え
    const interval = setInterval(() => {
      setIsAnimating(true); // アニメーション開始 (退場)
      
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % TICKER_LOGS.length);
        setIsAnimating(false); // アニメーション終了 (入場)
      }, 500); // CSSのtransition時間と合わせる

    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentLog = TICKER_LOGS[currentIndex];

  // アイコンと色の定義
  const getLogStyle = (type) => {
    switch(type) {
      case 'pledge': return { icon: <FiGift />, color: 'text-pink-400', label: '支援' };
      case 'goal': return { icon: <FiTrendingUp />, color: 'text-orange-400', label: '達成' };
      case 'production': return { icon: <FiCheckCircle />, color: 'text-green-400', label: '進捗' };
      case 'delivery': return { icon: <FiTruck />, color: 'text-sky-400', label: '納品' };
      case 'new': return { icon: <FiActivity />, color: 'text-yellow-400', label: '新着' };
      default: return { icon: <FiInfo />, color: 'text-gray-400', label: '情報' };
    }
  };

  const style = getLogStyle(currentLog.type);

  return (
    <div className="bg-slate-900 border-b border-slate-800 h-10 overflow-hidden relative shadow-sm z-40">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        
        {/* 左側: LIVEインジケーター & テキスト */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          
          {/* LIVE バッジ */}
          <div className="flex items-center gap-2 shrink-0 bg-slate-800 py-1 px-2 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-bold tracking-widest text-slate-300 leading-none">LIVE</span>
          </div>

          {/* 流れるコンテンツ */}
          <div className="flex-1 overflow-hidden relative h-full flex items-center">
            <Link 
                href={currentLog.href}
                className={`flex items-center gap-3 text-xs sm:text-sm text-slate-200 hover:text-white hover:underline transition-all duration-500 transform w-full truncate cursor-pointer ${
                    isAnimating ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
                }`}
            >
                <span className={`flex items-center gap-1 font-bold ${style.color} shrink-0`}>
                    {style.icon}
                    <span className="hidden sm:inline text-[10px] border border-current px-1 rounded uppercase opacity-80">{style.label}</span>
                </span>
                <span className="truncate">{currentLog.text}</span>
            </Link>
          </div>
        </div>

        {/* 右側: リンク (PCのみ) */}
        <div className="hidden md:block shrink-0 ml-4 border-l border-slate-700 pl-4">
            <Link href="/projects" className="text-[10px] text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                View All <FiTrendingUp />
            </Link>
        </div>

      </div>
    </div>
  );
}