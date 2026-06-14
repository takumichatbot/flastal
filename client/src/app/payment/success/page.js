'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Search, Sparkles, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import FloatingParticles from '@/app/components/FloatingParticles';

function SuccessPageInner() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, colors: ['#ec4899', '#f43f5e', '#a855f7', '#fbbf24', '#fff'] });
        setTimeout(() => confetti({ particleCount: 60, spread: 50, origin: { y: 0.55, x: 0.2 }, colors: ['#ec4899', '#a855f7'] }), 300);
        setTimeout(() => confetti({ particleCount: 60, spread: 50, origin: { y: 0.55, x: 0.8 }, colors: ['#f43f5e', '#fbbf24'] }), 500);
      }, 400);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-sky-50 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <FloatingParticles />

      {/* 背景の光 */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-200/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-200/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-[0_8px_40px_rgba(244,114,182,0.2)] border border-white p-8 md:p-12 text-center relative z-10 overflow-hidden"
      >
        {/* 背景装飾 */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-pink-100/60 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-sky-100/60 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          {/* アイコン */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
            className="w-24 h-24 bg-gradient-to-br from-pink-100 to-rose-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-pink-100"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <CheckCircle className="text-pink-500" size={44} strokeWidth={1.5} />
            </motion.div>
          </motion.div>

          {/* テキスト */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-50 border border-pink-100 rounded-full text-[10px] font-black text-pink-500 uppercase tracking-widest mb-4">
              <Sparkles size={10} /> Payment Complete
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mb-3">
              決済が完了しました！
            </h1>
            <p className="text-slate-500 font-bold text-sm leading-relaxed mb-8">
              ポイントのチャージが正常に完了しました。<br />
              引き続き FLASTAL での推し活をお楽しみください✨
            </p>
          </motion.div>


          {/* ボタン */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="flex flex-col gap-3"
          >
            <Link href="/mypage">
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 12px 30px rgba(244,114,182,0.35)" }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-2xl shadow-lg shadow-pink-200 transition-all"
              >
                マイページで確認する <ArrowRight size={18} />
              </motion.button>
            </Link>

            <Link href="/projects">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-4 bg-white text-slate-600 font-black rounded-2xl border-2 border-slate-100 hover:border-pink-200 hover:text-pink-600 transition-colors"
              >
                <Search size={16} /> 他の企画を探す
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-sky-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
        <p className="text-slate-400 text-sm font-bold tracking-widest">読み込み中...</p>
      </div>
    }>
      <SuccessPageInner />
    </Suspense>
  );
}
