// src/app/legal/cancel/page.js
'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense, useEffect } from 'react';
import Link from 'next/link';

import { 
  AlertTriangle, Info, ArrowLeft, Printer, 
  Calendar, Package, CheckSquare, HelpCircle, Loader2 
} from 'lucide-react';

function LegalCancelContent() {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-700">
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
        <Link href="/" className="flex items-center text-sm font-black text-slate-400 hover:text-pink-600 transition-colors uppercase tracking-widest bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-100">
          <ArrowLeft size={16} className="mr-1.5" /> トップページへ
        </Link>
        <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-black text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-all shadow-sm">
          <Printer size={16} /> ポリシーを保存/印刷
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] shadow-sm border border-white">
        <div className="border-b border-slate-100 pb-8 mb-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl mb-4 shadow-inner border border-white">
            <AlertTriangle size={40} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter mb-3">
            キャンセル・返金ポリシー
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancellation Policy</p>
        </div>

        <div className="space-y-12">
          
          <section className="bg-sky-50 p-8 rounded-[2rem] border border-sky-100 shadow-sm">
            <h2 className="text-lg font-black text-sky-800 flex items-center mb-3">
                <Info className="mr-2" size={24} /> 基本方針
            </h2>
            <p className="text-sm text-sky-700 leading-relaxed font-bold">
                本サービスにおいて提供されるフラワースタンド（祝花）やイラストパネルは、イベントに合わせた「受注生産品」および「寄付的性質」を持つため、<strong className="text-rose-600 px-1">原則として支援完了後のお客さま都合によるキャンセル・返金はお受けできません。</strong>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-800 flex items-center mb-6 border-l-4 border-pink-500 pl-4">
              <Calendar className="mr-2 text-pink-500" size={24} /> 1. イベント中止等に伴うキャンセル料
            </h2>
            <p className="mb-4 text-sm font-bold text-slate-500">主催者都合によるイベント中止・延期等の場合、進行状況に応じて以下の基準が適用されます。</p>
            <div className="overflow-hidden rounded-[2rem] border border-slate-100 shadow-sm bg-white">
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">企画中止のタイミング</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">返金について</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50 text-sm">
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5 font-black text-slate-700">お花等の制作開始 <span className="text-emerald-500">前</span></td>
                    <td className="px-6 py-5 font-bold text-slate-600">システム手数料を除き、全額返金</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5 font-black text-rose-500">お花・イラストの制作開始 <span className="text-rose-500">後</span></td>
                    <td className="px-6 py-5 font-bold text-rose-600">実費が発生しているため、原則返金不可</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-amber-50 p-8 rounded-[2rem] border border-amber-100 shadow-sm">
            <h2 className="text-lg font-black text-amber-800 flex items-center mb-3">
                <Package className="mr-2" size={20} /> 2. 会場都合による搬入不可について
            </h2>
            <p className="text-sm text-amber-900/80 leading-relaxed font-bold">
                イベント直前になって、会場や主催者から「フラスタの受け取り辞退」等の通達があった場合であっても、すでに制作準備に入っている場合は実費が全額請求となり、返金はいたしかねます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-800 flex items-center mb-6 border-l-4 border-pink-500 pl-4">
                <CheckSquare className="mr-2 text-pink-500" size={24} /> 3. プロジェクト不成立の場合
            </h2>
            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <p className="text-sm text-slate-600 font-bold leading-relaxed">
                    「All-or-Nothing（目標達成型）」のプロジェクトにおいて、募集期間内に目標金額に達しなかった場合は、企画は自動的に中止となり、<span className="text-emerald-600">支援金は全額自動で返金（または決済のお取り消し）が行われます。</span>
                </p>
            </div>
          </section>

          <div className="mt-16 pt-10 border-t border-slate-100 text-center">
            <Link href="/contact" className="inline-flex items-center px-8 py-4 bg-slate-900 text-white font-black rounded-full hover:bg-pink-600 transition-all shadow-xl shadow-slate-200 text-sm gap-2">
              <HelpCircle size={18} /> お問い合わせフォームへ
            </Link>
            <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">制定：2025年12月17日</p>
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