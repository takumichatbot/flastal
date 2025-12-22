'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiCheckCircle, FiArrowRight, FiShoppingBag, FiLoader } from 'react-icons/fi';
import confetti from 'canvas-confetti';

// Next.jsのビルドエラー（Prerenderエラー）を回避するため、動的レンダリングを強制
export const dynamic = 'force-dynamic';

/**
 * [動的部分] 決済成功の表示とロジック本体
 */
function PaymentSuccessInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const sid = searchParams.get('session_id');
    if (sid) {
      setSessionId(sid);
      // お祝いの紙吹雪演出
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ec4899', '#8b5cf6', '#3b82f6']
      });
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-10 text-center border border-slate-100 relative overflow-hidden">
        {/* 背景装飾 */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-50 rounded-full opacity-50"></div>
        
        <div className="relative z-10">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner animate-bounce-short">
            <FiCheckCircle size={48} />
          </div>

          <h1 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">
            決済が完了しました！
          </h1>
          
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
            <Link 
              href="/mypage" 
              className="flex items-center justify-center gap-2 w-full py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-900 transition-all transform hover:-translate-y-1 shadow-lg"
            >
              マイページで確認する <FiArrowRight />
            </Link>
            
            <Link 
              href="/projects" 
              className="flex items-center justify-center gap-2 w-full py-4 bg-white text-slate-600 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all"
            >
              <FiShoppingBag /> 他の企画を探す
            </Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-short {
          animation: bounce-short 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * [静的部分] メインエクスポート
 * Next.js 15 のビルド要件を満たすため Suspense で隔離
 */
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <FiLoader className="w-10 h-10 text-pink-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium tracking-widest">CONFIRMING PAYMENT...</p>
      </div>
    }>
      <PaymentSuccessInner />
    </Suspense>
  );
}