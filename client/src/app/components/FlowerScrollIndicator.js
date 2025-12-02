"use client";
import { useEffect, useState } from 'react';

export default function FlowerScrollIndicator({ collected, target }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // 達成率 (0〜100)
  const percentage = Math.min((collected / target) * 100, 100);

  // 達成率に応じたお花のアイコン変化
  const getFlowerIcon = () => {
    if (percentage >= 100) return "💐"; // 達成！
    if (percentage >= 80)  return "🌸"; // もう少し
    if (percentage >= 50)  return "🌹"; // 半分
    if (percentage >= 20)  return "🌷"; // 咲き始め
    return "🌱"; // まだまだ
  };

  const getMessage = () => {
    if (percentage >= 100) return "祝・達成！";
    if (percentage >= 80)  return "あと少し！";
    if (percentage >= 50)  return "折り返し！";
    return "成長中...";
  };

  useEffect(() => {
    const handleScroll = () => {
      // 画面の高さに対するスクロール位置の割合 (0.0 〜 1.0)
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const currentScroll = window.scrollY;
      const progress = totalHeight > 0 ? currentScroll / totalHeight : 0;
      
      setScrollProgress(progress);
      
      // 最初は隠しておいて、少しスクロールしたら表示
      setIsVisible(currentScroll > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // スマホでは邪魔になる可能性があるので、md以上（PC/タブレット）のみ表示のスタイルにします
  // ※スマホも出したい場合は 'hidden md:block' を削除してください
  return (
    <div className={`fixed top-0 right-0 h-full w-16 z-40 pointer-events-none transition-opacity duration-500 hidden md:block ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
       
       {/* 背景のレール */}
       <div className="absolute top-0 right-6 w-1 h-full bg-slate-100/50 rounded-full backdrop-blur-sm"></div>
       
       {/* 伸びる茎 (緑色のバー) */}
       <div 
         className="absolute top-0 right-6 w-1 bg-gradient-to-b from-green-300 to-green-500 rounded-full transition-all duration-100 ease-out shadow-[0_0_10px_rgba(34,197,94,0.5)]"
         style={{ height: `${scrollProgress * 100}%` }}
       >
         {/* 先端のお花 (現在位置) */}
         <div className="absolute bottom-0 right-1/2 translate-x-1/2 translate-y-1/2 flex items-center justify-center">
            
            {/* お花アイコン */}
            <div className="relative group pointer-events-auto cursor-help">
                <div className="text-3xl filter drop-shadow-md animate-bounce-slow transform transition-transform hover:scale-125">
                    {getFlowerIcon()}
                </div>
                
                {/* ホバー時の吹き出し */}
                <div className="absolute right-10 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-green-700">
                    現在 {percentage.toFixed(0)}%
                </div>
            </div>

         </div>
       </div>

       {/* ゴール地点 (100%の位置) */}
       {percentage < 100 && (
           <div className="absolute bottom-10 right-6 translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
       )}
       
       {/* 固定メッセージ */}
       <div className="absolute bottom-4 right-1 text-[10px] font-bold text-gray-400 writing-vertical-rl tracking-widest opacity-50">
          {getMessage()}
       </div>
    </div>
  );
}