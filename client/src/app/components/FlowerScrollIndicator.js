"use client";
import { useEffect, useState } from 'react';
import { FiArrowUp } from 'react-icons/fi';

export default function FlowerScrollIndicator({ collected, target }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // 0除算防止と上限100%
  const safeTarget = target || 1; 
  const percentage = Math.min((collected / safeTarget) * 100, 100);

  // 達成率に応じたお花のアイコン変化
  const getFlowerIcon = () => {
    if (percentage >= 100) return "💐"; // 満開の花束
    if (percentage >= 80)  return "🌸"; // 桜（ほぼ満開）
    if (percentage >= 50)  return "🌹"; // バラ（咲いている）
    if (percentage >= 20)  return "🌷"; // チューリップ（つぼみ〜咲き始め）
    return "🌱"; // 双葉（まだこれから）
  };

  const getMessage = () => {
    if (percentage >= 100) return "目標達成！";
    if (percentage >= 80)  return "あと少し！";
    if (percentage >= 50)  return "折り返し";
    return "成長中";
  };

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
          const currentScroll = window.scrollY;
          const progress = totalHeight > 0 ? currentScroll / totalHeight : 0;
          
          setScrollProgress(progress);
          setIsVisible(currentScroll > 300); // 300pxスクロールしたら表示
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className={`fixed right-4 top-0 bottom-0 z-40 w-12 pointer-events-none transition-opacity duration-500 hidden lg:flex flex-col justify-center ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
       
       {/* レール (茎の軌道) */}
       <div className="absolute top-[10vh] bottom-[10vh] left-1/2 -translate-x-1/2 w-1 bg-slate-200/50 rounded-full backdrop-blur-sm"></div>
       
       {/* 伸びる茎 (プログレスバー) */}
       <div 
         className="absolute top-[10vh] left-1/2 -translate-x-1/2 w-1 bg-gradient-to-b from-green-300 to-green-600 rounded-full transition-all duration-100 ease-out shadow-[0_0_8px_rgba(34,197,94,0.4)]"
         style={{ height: `${Math.min(scrollProgress * 80, 80)}vh` }} // 画面の80%分だけ使う
       ></div>

       {/* 先端のお花 (スクロール位置に合わせて移動) */}
       <div 
         className="absolute left-1/2 -translate-x-1/2 transition-all duration-100 ease-out pointer-events-auto"
         style={{ top: `calc(10vh + ${Math.min(scrollProgress * 80, 80)}vh)` }}
       >
          <button 
            onClick={scrollToTop}
            className="relative -translate-x-1/2 -translate-y-1/2 group w-10 h-10 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          >
              {/* 通常時：お花アイコン */}
              <span className="text-3xl filter drop-shadow-md group-hover:opacity-0 transition-opacity duration-200 absolute">
                  {getFlowerIcon()}
              </span>

              {/* ホバー時：トップへ戻るアイコン */}
              <span className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-green-500 text-white rounded-full p-2 shadow-lg">
                  <FiArrowUp size={20} />
              </span>
              
              {/* 吹き出し (常に進捗を表示) */}
              <div className="absolute right-12 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur border border-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <p>{getMessage()}</p>
                  <p className="text-xs">{percentage.toFixed(0)}% 達成</p>
                  <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-white/90"></div>
              </div>
          </button>
       </div>

    </div>
  );
}