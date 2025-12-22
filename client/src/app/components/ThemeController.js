"use client";

// Next.js 15 ビルドエラー回避
export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';

// 季節ごとの設定
const SEASON_CONFIG = {
  spring: { className: 'theme-spring', icon: '🌸', color: '#fbcfe8', label: 'Spring' },
  summer: { className: 'theme-summer', icon: '✨', color: '#bae6fd', label: 'Summer' },
  autumn: { className: 'theme-autumn', icon: '🍂', color: '#fed7aa', label: 'Autumn' },
  winter: { className: 'theme-winter', icon: '❄️', color: '#e2e8f0', label: 'Winter' },
};

function ThemeControllerContent() {
  const [currentSeason, setCurrentSeason] = useState(null);
  const [particles, setParticles] = useState([]);

  // 季節の判定ロジック
  useEffect(() => {
    let seasonKey = 'winter';

    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const debugSeason = params.get('season');

      if (debugSeason && SEASON_CONFIG[debugSeason]) {
        seasonKey = debugSeason;
      } else {
        const month = new Date().getMonth() + 1; // 1-12
        if (month >= 3 && month <= 5) seasonKey = 'spring';
        else if (month >= 6 && month <= 8) seasonKey = 'summer';
        else if (month >= 9 && month <= 11) seasonKey = 'autumn';
      }
    }

    applySeason(seasonKey);
  }, []);

  const applySeason = (seasonKey) => {
    setCurrentSeason(seasonKey);
    if (typeof document !== 'undefined') {
      const body = document.body;
      Object.values(SEASON_CONFIG).forEach(cfg => body.classList.remove(cfg.className));
      body.classList.add(SEASON_CONFIG[seasonKey].className);
    }
  };

  // エフェクト（パーティクル）の生成
  useEffect(() => {
    if (!currentSeason || typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const particleCount = 12; 
    const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      animationDuration: 10 + Math.random() * 20 + 's',
      animationDelay: Math.random() * 5 + 's',
      fontSize: 10 + Math.random() * 10 + 'px',
      opacity: 0.3 + Math.random() * 0.5,
    }));

    setParticles(newParticles);
  }, [currentSeason]);

  if (!currentSeason || particles.length === 0) return null;

  const config = SEASON_CONFIG[currentSeason];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute top-[-20px] animate-fall"
          style={{
            left: p.left,
            fontSize: p.fontSize,
            opacity: p.opacity,
            animationDuration: p.animationDuration,
            animationDelay: p.animationDelay,
            color: config.color,
            textShadow: '0 0 5px rgba(255,255,255,0.5)'
          }}
        >
          {config.icon}
        </div>
      ))}

      <style jsx global>{`
        @keyframes fall {
          0% { transform: translateY(-10vh) translateX(0px) rotate(0deg); }
          50% { transform: translateX(20px) rotate(180deg); }
          100% { transform: translateY(110vh) translateX(-20px) rotate(360deg); }
        }
        .animate-fall {
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
}

export default function ThemeController() {
  return (
    <Suspense fallback={null}>
      <ThemeControllerContent />
    </Suspense>
  );
}