'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function PaymentSuccessPage() {
  // useEffect(() => {
  //   // 将来的に、ここでコンバージョンをトラッキングするなどの処理を追加できます
  // }, []);

  return (
    <div className="bg-sky-50 min-h-screen flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full p-8 sm:p-12 border rounded-xl shadow-md text-center">
        
        {/* Checkmark Icon */}
        <div className="w-24 h-24 bg-sky-100 rounded-full p-4 flex items-center justify-center mx-auto mb-6">
          <svg className="w-16 h-16 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>

        <h1 className="text-4xl font-bold text-sky-600 mb-4">ありがとうございます！</h1>
        <p className="text-lg text-gray-600 mb-8">ポイントの購入が完了しました。</p>
        
        <Link href="/mypage">
          <span className="inline-block px-8 py-3 font-semibold text-white bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors cursor-pointer">
            マイページでポイントを確認する
          </span>
        </Link>
      </div>
    </div>
  );
}
