'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { motion, AnimatePresence } from 'framer-motion';
import { SplashScreen } from '@capacitor/splash-screen';

const LETTERS = 'FLASTAL'.split('');

export default function AppEntryPage() {
  const router = useRouter();
  const [phase, setPhase] = useState('in'); // 'in' | 'hold' | 'out'

  useEffect(() => {
    SplashScreen.hide({ fadeOutDuration: 0 }).catch(() => {});
    sessionStorage.setItem('nativeApp', '1');

    const onboardingDone = localStorage.getItem('onboardingDone');
    let destination = onboardingDone ? '/login' : '/onboarding';
    try {
      const token = window.__flastalToken || null;
      if (token) {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) destination = '/mypage';
      }
    } catch (_) {}

    const t1 = setTimeout(() => setPhase('hold'), 2000);
    const t2 = setTimeout(() => setPhase('out'), 2800);
    const t3 = setTimeout(() => router.replace(destination), 3300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [router]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #fff0f6 0%, #fce7f3 30%, #fdf2f8 60%, #fff5f7 100%)',
        zIndex: 9999,
      }}
    >
      {/* 背景: やわらかい光の輪（3D 奥行き感） */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 3.5, opacity: phase === 'out' ? 0 : [0, 0.35, 0.18] }}
        transition={{ duration: 2.2, ease: 'easeOut', times: [0, 0.4, 1] }}
        className="absolute w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(251,113,133,0.4) 0%, rgba(236,72,153,0.15) 40%, transparent 70%)' }}
      />
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 2.2, opacity: phase === 'out' ? 0 : [0, 0.25, 0.12] }}
        transition={{ duration: 1.8, delay: 0.2, ease: 'easeOut', times: [0, 0.4, 1] }}
        className="absolute w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.5) 0%, transparent 65%)' }}
      />

      {/* 浮遊パーティクル（花びら風） */}
      {[
        { size: 6, x: '-30%', y: '-35%', delay: 0.8, duration: 2.5 },
        { size: 4, x: '35%',  y: '-40%', delay: 1.0, duration: 3.0 },
        { size: 8, x: '-40%', y: '30%',  delay: 1.2, duration: 2.8 },
        { size: 5, x: '40%',  y: '35%',  delay: 0.9, duration: 2.6 },
        { size: 3, x: '10%',  y: '-50%', delay: 1.4, duration: 3.2 },
        { size: 7, x: '-15%', y: '45%',  delay: 1.1, duration: 2.4 },
      ].map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0, x: p.x, y: p.y }}
          animate={{
            opacity: phase === 'out' ? 0 : [0, 0.7, 0.5],
            scale: [0, 1, 0.9],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut', times: [0, 0.5, 1] }}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size * 4,
            height: p.size * 4,
            background: 'linear-gradient(135deg, rgba(251,113,133,0.6), rgba(244,114,182,0.4))',
          }}
        />
      ))}

      {/* メインコンテンツ */}
      <AnimatePresence>
        {phase !== 'out' && (
          <motion.div
            key="content"
            exit={{ opacity: 0, scale: 0.94, y: -16, filter: 'blur(12px)' }}
            transition={{ duration: 0.5, ease: [0.4, 0, 1, 1] }}
            className="flex flex-col items-center gap-8 relative z-10"
          >
            {/* アイコン: 3D Y軸フリップ + ガラスカード */}
            <motion.div
              initial={{ rotateY: -90, opacity: 0, scale: 0.6 }}
              animate={{ rotateY: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{ perspective: '1000px' }}
            >
              {/* 外側のガラスカード */}
              <motion.div
                animate={{ rotateZ: [0, 2, -2, 1, 0] }}
                transition={{ duration: 4, delay: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="relative"
                style={{ perspective: '800px' }}
              >
                <div
                  className="w-32 h-32 rounded-[2.8rem] flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,240,246,0.9) 50%, rgba(255,255,255,0.85) 100%)',
                    boxShadow: '0 0 0 1px rgba(244,114,182,0.2), 0 8px 32px rgba(236,72,153,0.25), 0 32px 80px rgba(244,114,182,0.15), inset 0 1px 0 rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  {/* シマースイープ */}
                  <motion.div
                    initial={{ x: '-150%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 0.75, delay: 0.9, ease: 'easeInOut' }}
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      width: '55%',
                      background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.7) 50%, transparent 80%)',
                    }}
                  />
                  {/* アイコン画像 */}
                  <img
                    src="/icon-512x512.png"
                    alt="FLASTAL"
                    width={76}
                    height={76}
                    style={{ borderRadius: '16px', position: 'relative', zIndex: 1 }}
                  />
                </div>

                {/* カードの影（3D 奥行き） */}
                <motion.div
                  initial={{ opacity: 0, scaleX: 0.6 }}
                  animate={{ opacity: 0.15, scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-4 rounded-full"
                  style={{ background: 'radial-gradient(ellipse, rgba(236,72,153,0.6), transparent 70%)', filter: 'blur(6px)' }}
                />
              </motion.div>
            </motion.div>

            {/* ロゴ文字: 3D X軸で1文字ずつ */}
            <div style={{ perspective: '600px' }} className="flex items-baseline gap-[1px]">
              {LETTERS.map((letter, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 28, rotateX: -70, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.65 + i * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    display: 'inline-block',
                    fontSize: 42,
                    fontWeight: 900,
                    background: 'linear-gradient(160deg, #db2777 0%, #ec4899 40%, #f472b6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '0.1em',
                    transformOrigin: 'bottom center',
                    filter: 'drop-shadow(0 2px 8px rgba(236,72,153,0.3))',
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            {/* サブタイトル */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.6, ease: 'easeOut' }}
              style={{
                color: 'rgba(190,24,93,0.6)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.26em',
              }}
            >
              推しにフラスタを贈ろう
            </motion.p>

            {/* ローディングライン */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{
                scaleX: phase === 'hold' ? 1 : 0.55,
                opacity: phase === 'out' ? 0 : 0.6,
              }}
              transition={{
                duration: phase === 'hold' ? 0.7 : 1.0,
                delay: phase === 'hold' ? 0 : 1.5,
                ease: 'easeInOut',
              }}
              className="h-[2px] rounded-full origin-left"
              style={{
                width: 72,
                background: 'linear-gradient(90deg, transparent, #ec4899, rgba(244,114,182,0.5), transparent)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
