'use client';

// Next.js 15 ビルドエラー回避用
export const dynamic = 'force-dynamic';

import React, { Suspense, useEffect } from 'react';
import Link from 'next/link';

// lucide-reactに統一
import { 
  AlertTriangle, Info, ArrowLeft, Printer, 
  Calendar, Package, CheckSquare, HelpCircle, Loader2 
} from 'lucide-react';

// ★ ここにcn関数を定義（ビルドエラー回避と汎用性のため）
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function LegalCancelContent() {
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
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
        <Link href="/" className="flex items-center text-sm font-black text-slate-400 hover:text-pink-600 transition-colors uppercase tracking-widest bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-100">
          <ArrowLeft size={16} className="mr-1.5" /> トップページへ
        </Link>
        <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-black text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-all shadow-sm">
          <Printer size={16} /> ページを保存/印刷
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] shadow-sm border border-white">
        <div className="border-b border-slate-100 pb-8 mb-10 text-center">
          <h1 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tighter mb-3">キャンセル・返金ポリシー</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">最終改定日：2025年12月17日</p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-xl font-black text-slate-800 flex items-center mb-6 border-l-4 border-pink-500 pl-4">
              <Calendar className="mr-2 text-pink-500" size={24} /> 1. キャンセル料の発生基準
            </h2>
            <div className="overflow-hidden rounded-[2rem] border border-slate-100 shadow-sm bg-white">
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">キャンセル申請のタイミング</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">キャンセル料率</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50 text-sm">
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5 font-black text-slate-700">お届け 7日前 まで</td>
                    <td className="px-6 py-5"><span className="px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">無料 (0%)</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5 font-black text-slate-700">お届け 6日前 〜 4日前</td>
                    <td className="px-6 py-5"><span className="px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">ご支援総額の 50%</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5 font-black text-rose-500">お届け 3日前 〜 当日</td>
                    <td className="px-6 py-5"><span className="px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100 shadow-sm">ご支援総額の 100%</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-amber-50 p-8 rounded-[2rem] border border-amber-100 shadow-sm">
            <h2 className="text-lg font-black text-amber-800 flex items-center mb-4"><Package className="mr-2" size={20} /> 2. 特注資材費の実費請求について</h2>
            <p className="text-sm text-amber-900/80 leading-relaxed font-bold">キャンセル時期に関わらず、製作が開始されているパネルや特注花材の実費は全額請求となります。</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-800 flex items-center mb-6 border-l-4 border-pink-500 pl-4"><Info className="mr-2 text-pink-500" size={24} /> 3. 参加者（支援者）様への返金について</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <h3 className="font-black text-slate-800 mb-3 flex items-center gap-2"><CheckSquare size={18} className="text-emerald-500"/> 全額返金の場合</h3>
                <p className="text-sm text-slate-600 font-bold leading-relaxed">7日前までの中止であれば、システム利用料を除きポイント等で即時返還いたします。</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <h3 className="font-black text-slate-800 mb-3 flex items-center gap-2"><AlertTriangle size={18} className="text-amber-500"/> 一部返金の場合</h3>
                <p className="text-sm text-slate-600 font-bold leading-relaxed">発生したキャンセル料を差し引いた残額を、支援額に応じて按分返還いたします。</p>
              </div>
            </div>
          </section>

          <div className="mt-16 pt-10 border-t border-slate-100 text-center">
            <Link href="/contact" className="inline-flex items-center px-8 py-4 bg-slate-900 text-white font-black rounded-full hover:bg-pink-600 transition-all shadow-xl shadow-slate-200 text-sm gap-2">
              <HelpCircle size={18} /> お問い合わせフォームへ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LegalCancelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-12 h-12 text-pink-500 animate-spin" /></div>}>
      <LegalCancelContent />
    </Suspense>
  );
}