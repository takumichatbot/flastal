'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Search, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import { triggerPaymentConfetti } from '@/app/utils/confetti';
import FloatingParticles from '@/app/components/FloatingParticles';
import { triggerHaptic } from '@/app/hooks/useHaptics';

function SuccessPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

  useEffect(() => {
    // 決済完了後にルーターキャッシュを無効化し、マイページのポイント残高を最新化する
    router.refresh();

    // 決済成功の触覚フィードバック
    triggerHaptic('success');

    if (typeof window !== 'undefined') {
      const t1 = setTimeout(() => {
        triggerPaymentConfetti();
      }, 400);
      return () => clearTimeout(t1);
    }
  }, [router]);

  const handleInstagramShare = () => {
    // canvas で 9:16 のシェア画像を生成
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    // グラデーション背景
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
    gradient.addColorStop(0, '#fce7f3');
    gradient.addColorStop(0.5, '#fdf2f8');
    gradient.addColorStop(1, '#ede9fe');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);

    // テキスト
    ctx.fillStyle = '#9d174d';
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💐 フラスタを贈りました！', 540, 700);

    ctx.fillStyle = '#6b21a8';
    ctx.font = '48px sans-serif';
    ctx.fillText('FLASTAL', 540, 820);

    ctx.fillStyle = '#be185d';
    ctx.font = '40px sans-serif';
    ctx.fillText('flastal.com', 540, 900);

    // ダウンロード
    const link = document.createElement('a');
    link.download = 'flastal-share.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <FloatingParticles />

      {/* 背景の光 */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-200/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-rose-200/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full bg-white shadow-lg shadow-pink-100/40 rounded-[3rem] shadow-[0_8px_40px_rgba(244,114,182,0.2)] border border-white p-8 md:p-12 text-center relative z-10 overflow-hidden"
      >
        {/* 背景装飾 */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-pink-200/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-purple-200/30 rounded-full blur-2xl pointer-events-none" />

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

            {projectId && (
              <Link href={`/projects/${projectId}`}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-pink-50 text-pink-600 font-black rounded-2xl border-2 border-pink-100 hover:border-pink-300 hover:bg-pink-100 transition-colors"
                >
                  <ArrowLeft size={16} /> 企画ページに戻る
                </motion.button>
              </Link>
            )}

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

          {/* SNSシェアセクション */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="mt-6 space-y-3"
          >
            <p className="text-sm text-slate-500 text-center">みんなにシェアしよう！</p>

            {/* Instagram向けシェア画像ダウンロード */}
            <button
              onClick={handleInstagramShare}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm hover:shadow-lg hover:shadow-pink-200 transition-all duration-200"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Instagramシェア用画像をダウンロード
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
        <p className="text-slate-400 text-sm font-bold tracking-widest">読み込み中...</p>
      </div>
    }>
      <SuccessPageInner />
    </Suspense>
  );
}
