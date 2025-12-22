'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation'; // useSearchParamsを削除
import Link from 'next/link';
import { FiCheckCircle, FiArrowRight, FiShoppingBag, FiLoader } from 'react-icons/fi';
import confetti from 'canvas-confetti';

// 強制的に動的レンダリング設定
export const dynamic = 'force-dynamic';

function PaymentSuccessInner() {
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    // Next.jsのフックではなく、ブラウザ標準のAPIでクエリを取得する
    // これによりビルド時のエラーを完全に回避できます
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
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-50 rounded-full opacity-50"></div>
        <div className="relative z-10">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <FiCheckCircle size={48} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">決済が完了しました！</h1>
          <p className="text-slate-500 mb-8 leading-relaxed font-medium">
            ポイントのチャージが正常に完了しました。<br />
            引き続きFLASTALでの推し活をお楽しみください。
          </p>
          {sessionId && (
            <div className="bg-slate-50 rounded-2xl p-4 mb-8 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transaction ID</p>
              <p className="text-xs text-slate-500 font-mono break-all">{sessionId}</p>
            </div>
          )}
          <div className="space-y-4">
            <Link href="/mypage" className="flex items-center justify-center gap-2 w-full py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-900 transition-all shadow-lg">
              マイページで確認する <FiArrowRight />
            </Link>
            <Link href="/projects" className="flex items-center justify-center gap-2 w-full py-4 bg-white text-slate-600 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all">
              <FiShoppingBag /> 他の企画を探す
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><FiLoader className="animate-spin text-pink-500" size={40} /></div>}>
      <PaymentSuccessInner />
    </Suspense>
  );
}