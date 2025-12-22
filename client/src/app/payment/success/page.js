'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiCheck, FiHome, FiArrowRight } from 'react-icons/fi';

/**
 * 【動的部分】
 * useSearchParams() を使用するロジックのみをここに封じ込めます。
 */
function PaymentSuccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams(); // ビルドエラーの直接原因
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // 決済完了後の自動リダイレクト処理
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/mypage');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <>
      <h1 className="text-2xl font-extrabold text-gray-800 mb-2">決済が完了しました！</h1>
      <p className="text-gray-500 mb-8 text-sm leading-relaxed">
        ポイントのご購入ありがとうございます。<br/>
        アカウントに残高が反映されました。<br/>
        引き続き企画をお楽しみください。
      </p>

      <div className="space-y-3">
        <Link href="/mypage" className="group block w-full py-3.5 px-4 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
          <span>マイページで確認する</span>
          <FiArrowRight className="group-hover:translate-x-1 transition-transform"/>
        </Link>
        
        <Link href="/" className="block w-full py-3.5 px-4 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
          <FiHome size={18} /> トップページへ
        </Link>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100">
         <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-sky-400 rounded-full animate-pulse"></span>
            {countdown}秒後にマイページへ自動移動します...
         </p>
      </div>
    </>
  );
}

/**
 * 【静的部分】
 * ページの外枠（デザイン）を担当。
 * 動的部分を Suspense で囲むことで、ビルドエラーを確実に回避します。
 */
export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-gray-800 relative overflow-hidden">
      
      {/* 背景装飾 */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
         <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-sky-200 rounded-full blur-3xl opacity-20"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-green-200 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 relative z-10 animate-fadeInUp">
        
        {/* 上部アクセントバー */}
        <div className="h-2 bg-gradient-to-r from-sky-400 to-green-400 w-full"></div>

        <div className="p-8 md:p-10 text-center">
          
          <div className="mx-auto w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 rounded-full border-4 border-green-100 animate-ping opacity-20"></div>
            <FiCheck className="w-10 h-10 text-green-500" />
          </div>

          {/* ★ ここが最重要：Suspense で動的なロジックを完全に包む ★ */}
          <Suspense fallback={
            <div className="py-10 text-gray-400 flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-sky-500"></div>
              <p className="text-xs">情報を確認中...</p>
            </div>
          }>
            <PaymentSuccessInner />
          </Suspense>

        </div>
      </div>
    </div>
  );
}