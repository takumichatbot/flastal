'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { motion, AnimatePresence } from 'framer-motion';
import { SplashScreen } from '@capacitor/splash-screen';

export default function AppEntryPage() {
  const router = useRouter();
  const [phase, setPhase] = useState('logo'); // 'logo' | 'out'

  useEffect(() => {
    // スプラッシュスクリーンを手動で非表示（アニメーションが見えるように）
    SplashScreen.hide({ fadeOutDuration: 400 }).catch(() => {});

    sessionStorage.setItem('nativeApp', '1');

    let destination = '/login';
    try {
      const raw = localStorage.getItem('authToken');
      const token = raw ? raw.replace(/['"]+/g, '').trim() : null;
      if (token) {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          destination = '/mypage';
        }
      }
    } catch (_) {}

    const t1 = setTimeout(() => setPhase('out'), 1400);
    const t2 = setTimeout(() => router.replace(destination), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [router]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fff1f2 100%)' }}
    >
      {/* 背景の光の輪 */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 4, opacity: 0.15 }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
        className="absolute w-64 h-64 rounded-full bg-pink-400"
      />
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 2.5, opacity: 0.1 }}
        transition={{ duration: 1.4, delay: 0.1, ease: 'easeOut' }}
        className="absolute w-48 h-48 rounded-full bg-rose-300"
      />

      <AnimatePresence>
        {phase === 'logo' && (
          <motion.div
            key="logo"
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -16 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-5 relative z-10"
          >
            {/* アイコン */}
            <motion.div
              animate={{ rotate: [0, -8, 8, -4, 0] }}
              transition={{ duration: 1.2, delay: 0.3, ease: 'easeInOut' }}
              className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-2xl shadow-pink-300/50"
            >
              <span className="text-white text-4xl font-black tracking-tight">F</span>
            </motion.div>

            {/* ロゴ */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-4xl font-black text-pink-500 tracking-[0.12em]">FLASTAL</h1>
              <p className="text-xs font-bold text-pink-300 tracking-widest mt-1.5">推しにフラスタを贈ろう</p>
            </motion.div>

            {/* ローディングドット */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex gap-1.5"
            >
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, delay: i * 0.12, repeat: Infinity, repeatDelay: 0.4 }}
                  className="w-1.5 h-1.5 rounded-full bg-pink-300"
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
