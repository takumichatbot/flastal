'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { motion, AnimatePresence } from 'framer-motion';
import { SplashScreen } from '@capacitor/splash-screen';
import Image from 'next/image';

const LETTERS = 'FLASTAL'.split('');

export default function AppEntryPage() {
  const router = useRouter();
  const [phase, setPhase] = useState('in'); // 'in' | 'hold' | 'out'

  useEffect(() => {
    SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {});
    sessionStorage.setItem('nativeApp', '1');

    const onboardingDone = localStorage.getItem('onboardingDone');
    let destination = onboardingDone ? '/login' : '/onboarding';
    try {
      const raw = localStorage.getItem('authToken');
      const token = raw ? raw.replace(/['"]+/g, '').trim() : null;
      if (token) {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) destination = '/mypage';
      }
    } catch (_) {}

    const t1 = setTimeout(() => setPhase('hold'), 2200);
    const t2 = setTimeout(() => setPhase('out'), 3000);
    const t3 = setTimeout(() => router.replace(destination), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [router]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0c0008 0%, #1a0012 40%, #0a0006 70%, #130008 100%)' }}
    >
      {/* グロー: 背景の光のリング */}
      <motion.div
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: 6, opacity: phase === 'out' ? 0 : [0, 0.18, 0.10] }}
        transition={{ duration: 2.5, ease: 'easeOut', times: [0, 0.35, 1] }}
        className="absolute w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, #f472b6 0%, #be185d 40%, transparent 70%)' }}
      />
      <motion.div
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: 3.5, opacity: phase === 'out' ? 0 : [0, 0.12, 0.06] }}
        transition={{ duration: 2.0, delay: 0.2, ease: 'easeOut', times: [0, 0.4, 1] }}
        className="absolute w-36 h-36 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, #e879f9 0%, transparent 70%)' }}
      />

      {/* メインコンテンツ */}
      <AnimatePresence>
        {phase !== 'out' && (
          <motion.div
            key="content"
            exit={{ opacity: 0, scale: 0.96, y: -12, filter: 'blur(8px)' }}
            transition={{ duration: 0.5, ease: [0.4, 0, 1, 1] }}
            className="flex flex-col items-center gap-7 relative z-10"
          >
            {/* アイコン: 3D フリップ + シマー */}
            <motion.div
              initial={{ rotateY: -90, opacity: 0, scale: 0.7 }}
              animate={{ rotateY: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              style={{ perspective: '900px' }}
            >
              <div
                className="w-28 h-28 rounded-[2.4rem] flex items-center justify-center relative overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, #f472b6 0%, #ec4899 35%, #be185d 70%, #9d174d 100%)',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 0 80px rgba(236,72,153,0.55), 0 24px 64px rgba(0,0,0,0.6)',
                }}
              >
                {/* シマースイープ */}
                <motion.div
                  initial={{ x: '-150%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 0.7, delay: 0.85, ease: 'easeInOut' }}
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    width: '60%',
                    background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.28) 50%, transparent 80%)',
                  }}
                />
                <Image
                  src="/icon-512x512.png"
                  alt="FLASTAL"
                  width={72}
                  height={72}
                  className="relative z-10 rounded-xl"
                  priority
                />
              </div>
            </motion.div>

            {/* ロゴ文字: 1文字ずつ 3D で登場 */}
            <div
              className="flex items-baseline"
              style={{ gap: 1, perspective: '500px' }}
            >
              {LETTERS.map((letter, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 32, rotateX: -80 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{
                    duration: 0.55,
                    delay: 0.6 + i * 0.075,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    display: 'inline-block',
                    fontSize: 40,
                    fontWeight: 900,
                    color: '#ffffff',
                    letterSpacing: '0.13em',
                    textShadow: '0 0 40px rgba(236,72,153,0.9), 0 0 80px rgba(236,72,153,0.4), 0 2px 8px rgba(0,0,0,0.6)',
                    transformOrigin: 'bottom center',
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            {/* サブタイトル */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.45, duration: 0.6, ease: 'easeOut' }}
              style={{
                color: 'rgba(255,255,255,0.38)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
              }}
            >
              推しにフラスタを贈ろう
            </motion.p>

            {/* 下部ライン: ロード感演出 */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: phase === 'hold' ? 1 : 0.6, opacity: phase === 'out' ? 0 : 0.5 }}
              transition={{ duration: phase === 'hold' ? 0.8 : 1.2, delay: phase === 'hold' ? 0 : 1.6, ease: 'easeInOut' }}
              className="h-px rounded-full origin-left"
              style={{
                width: 80,
                background: 'linear-gradient(90deg, transparent, #f472b6, transparent)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
