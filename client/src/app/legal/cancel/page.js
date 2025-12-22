'use client';

// Next.js 15 ビルドエラー回避用
export const dynamic = 'force-dynamic';

import React, { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { 
  FiAlertTriangle, FiInfo, FiArrowLeft, FiPrinter, 
  FiCalendar, FiPackage, FiCheckSquare, FiHelpCircle, FiLoader 
} from 'react-icons/fi';

function LegalCancelContent() {
  // useEffect内以外でURLパラメータに依存しないように修正
  useEffect(() => {
    if (typeof window !== 'undefined') {
       // 必要があればここで window.location.search を解析
    }
  }, []);
  
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-24 px-4 sm:px-6 lg:px-8 font-sans text-slate-700">
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link href="/" className="flex items-center text-sm text-slate-500 hover:text-pink-600 transition-colors">
          <FiArrowLeft className="mr-1" /> トップページに戻る
        </Link>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
          <FiPrinter /> ページを保存/印刷
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm ring-1 ring-slate-100">
        <div className="border-b border-slate-200 pb-6 mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">キャンセル・返金ポリシー</h1>
          <p className="text-sm text-slate-500">最終改定日：2025年12月17日</p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center mb-4 border-l-4 border-pink-500 pl-3">
              <FiCalendar className="mr-2 text-pink-500" /> 1. キャンセル料の発生基準
            </h2>
            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">キャンセル申請のタイミング</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">キャンセル料率</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  <tr>
                    <td className="px-6 py-4 text-sm font-bold">お届け 7日前 まで</td>
                    <td className="px-6 py-4"><span className="px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-700">無料 (0%)</span></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-bold">お届け 6日前 〜 4日前</td>
                    <td className="px-6 py-4"><span className="px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-700">ご支援総額の 50%</span></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-bold text-red-600">お届け 3日前 〜 当日</td>
                    <td className="px-6 py-4"><span className="px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-700">ご支援総額の 100%</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
            <h2 className="text-lg font-bold text-amber-800 flex items-center mb-3"><FiPackage className="mr-2" /> 2. 特注資材費の実費請求について</h2>
            <p className="text-sm text-amber-900 leading-relaxed">キャンセル時期に関わらず、製作が開始されているパネルや特注花材の実費は全額請求となります。</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center mb-4 border-l-4 border-pink-500 pl-3"><FiInfo className="mr-2 text-pink-500" /> 3. 参加者（支援者）様への返金について</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-2">全額返金の場合</h3>
                <p className="text-sm text-slate-600">7日前までの中止であれば、システム利用料を除きポイント等で即時返還いたします。</p>
              </div>
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-2">一部返金の場合</h3>
                <p className="text-sm text-slate-600">発生したキャンセル料を差し引いた残額を、支援額に応じて按分返還いたします。</p>
              </div>
            </div>
          </section>

          <div className="mt-12 pt-8 border-t border-slate-100 text-center">
            <Link href="/contact" className="inline-flex items-center px-6 py-3 bg-slate-800 text-white font-bold rounded-full hover:bg-slate-900 shadow-lg">
              <FiHelpCircle className="mr-2" /> お問い合わせフォームへ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LegalCancelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><FiLoader className="w-10 h-10 text-pink-500 animate-spin" /></div>}>
      <LegalCancelContent />
    </Suspense>
  );
}