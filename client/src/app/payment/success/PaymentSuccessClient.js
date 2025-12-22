'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // searchParamsを使う場合
import { FiCheck, FiHome, FiArrowRight } from 'react-icons/fi';

export default function PaymentSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams(); // ここでパラメータを取得
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // 自動リダイレクトタイマー
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-gray-800 relative overflow-hidden">
      
      {/* 背景装飾 */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
         <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-sky-200 rounded-full blur-3xl opacity-20"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-green-200 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 relative z-10">
        <div className="h-2 bg-gradient-to-r from-sky-400 to-green-400 w-full"></div>

        <div className="p-8 md:p-10 text-center">
          <div className="mx-auto w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 relative">
            <FiCheck className="w-10 h-10 text-green-500" />
          </div>

          <h1 className="text-2xl font-extrabold text-gray-800 mb-2">決済が完了しました！</h1>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">
            ポイントのご購入ありがとうございます。<br/>
            アカウントに残高が反映されました。
          </p>

          <div className="space-y-3">
            <Link href="/mypage" className="group block w-full py-3.5 px-4 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
              <span>マイページで確認する</span>
              <FiArrowRight />
            </Link>
            
            <Link href="/" className="block w-full py-3.5 px-4 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <FiHome size={18} /> トップページへ
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
             <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-sky-400 rounded-full animate-pulse"></span>
                {countdown}秒後に自動移動します...
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}