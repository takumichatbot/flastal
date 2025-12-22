'use client';

// Next.js のプリレンダリング（事前ビルド）を完全に無効化する
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { FiCheckCircle, FiArrowRight, FiShoppingBag, FiLoader } from 'react-icons/fi';
import confetti from 'canvas-confetti';

/**
 * [ロジック本体]
 * useSearchParams フックを削除し、window オブジェクトから直接取得
 */
function SuccessPageInner() {
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sid = params.get('session_id');
      if (sid) {
        setSessionId(sid);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ec4899', '#8b5cf6', '#3b82f6']
        });
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-10 text-center border border-slate-100 relative overflow-hidden">
        <div className="relative z-10">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <FiCheckCircle size={48} />
          </div>

          <h1 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">決済完了</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            ポイントのチャージが正常に完了しました。
          </p>

          {sessionId && (
            <div className="bg-slate-50 rounded-2xl p-4 mb-8 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transaction ID</p>
              <p className="text-xs text-slate-500 font-mono break-all">{sessionId}</p>
            </div>
          )}

          <div className="space-y-4">
            <Link href="/mypage" className="flex items-center justify-center gap-2 w-full py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-900 transition-all shadow-lg">
              マイページへ <FiArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * [メインエクスポート]
 */
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <FiLoader className="w-10 h-10 text-pink-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium tracking-widest">LOADING...</p>
      </div>
    }>
      <SuccessPageInner />
    </Suspense>
  );
}