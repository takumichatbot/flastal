'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  FiAlertTriangle, FiInfo, FiArrowLeft, FiPrinter, 
  FiCalendar, FiPackage, FiCheckSquare, FiHelpCircle, FiLoader 
} from 'react-icons/fi';

/**
 * [動的部分] 実際のポリシー本文とロジック
 */
function LegalCancelContent() {
  const searchParams = useSearchParams(); // ビルドエラーの直接原因をここに隔離
  
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-700">
      
      {/* ヘッダーナビゲーション */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link href="/" className="flex items-center text-sm text-slate-500 hover:text-pink-600 transition-colors">
          <FiArrowLeft className="mr-1" /> トップページに戻る
        </Link>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm"
        >
          <FiPrinter /> ページを保存/印刷
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm ring-1 ring-slate-100">
        
        {/* タイトルエリア */}
        <div className="border-b border-slate-200 pb-6 mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            キャンセル・返金ポリシー
          </h1>
          <p className="text-sm text-slate-500">
            最終改定日：2025年12月17日
          </p>
        </div>

        <div className="space-y-12">
          
          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center mb-4 border-l-4 border-pink-500 pl-3">
              <FiCalendar className="mr-2 text-pink-500" />
              1. キャンセル料の発生基準
            </h2>
            <p className="mb-4 leading-relaxed">
              企画成立後のお客様都合によるキャンセル（企画中止）は、お花のお届け予定日（納品日）を起算日として、以下のキャンセル料が発生します。
            </p>
            
            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/2">
                      キャンセル申請のタイミング
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/2">
                      キャンセル料率
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  <tr className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">
                      お届け <span className="text-blue-600">7日前</span> まで
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-700">
                        無料 (0%)
                      </span>
                      <p className="text-xs text-slate-400 mt-1 ml-1">※特注資材費の実費を除く</p>
                    </td>
                  </tr>
                  <tr className="hover:bg-yellow-50/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">
                      お届け <span className="text-yellow-600">6日前 〜 4日前</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-700">
                        ご支援総額の 50%
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-red-50/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">
                      お届け <span className="text-red-600">3日前 〜 当日</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-700">
                        ご支援総額の 100%
                      </span>
                      <p className="text-xs text-red-400 mt-1 ml-1 font-bold">※返金なし</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-amber-50 p-6 md:p-8 rounded-2xl border border-amber-100">
            <h2 className="text-lg font-bold text-amber-800 flex items-center mb-3">
              <FiPackage className="mr-2" />
              2. 特注資材費の実費請求について
            </h2>
            <p className="text-sm text-amber-900 leading-relaxed mb-4">
              キャンセル申請の時期に関わらず（7日前以前であっても）、以下の製作がすでにお花屋さんによって開始・発注されている場合は、
              <strong className="bg-amber-100 px-1 mx-1 rounded border border-amber-200">その実費を全額</strong>
              キャンセル料として加算請求いたします。
            </p>
            <div className="bg-white/60 p-4 rounded-xl">
              <ul className="list-none space-y-2 text-sm text-amber-900">
                <li className="flex items-start">
                  <FiAlertTriangle className="mr-2 mt-0.5 text-amber-500 shrink-0"/>
                  パネル類（お名札パネル、イラストパネル、等身大パネル等）の印刷・加工費
                </li>
                <li className="flex items-start">
                  <FiAlertTriangle className="mr-2 mt-0.5 text-amber-500 shrink-0"/>
                  特注バルーン（名入れ済み）、特殊リボン等の資材費
                </li>
                <li className="flex items-start">
                  <FiAlertTriangle className="mr-2 mt-0.5 text-amber-500 shrink-0"/>
                  特殊な花材（染めバラ、季節外の花材など）の仕入れ確定分
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center mb-4 border-l-4 border-pink-500 pl-3">
              <FiInfo className="mr-2 text-pink-500" />
              3. 参加者（支援者）様への返金について
            </h2>
            <p className="mb-4 leading-relaxed">
              企画が中止となった場合、参加者様への返金は以下のルールに基づいて自動的に行われます。
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-2">全額返金の場合</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  キャンセル料が発生しない期間（7日前まで）の中止であれば、システム利用料を除いた支援額全額をポイント等で即時返還いたします。
                </p>
              </div>
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-2">一部返金の場合</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  発生したキャンセル料（50%等 + 資材費）を差し引いた残額を、各支援者様の支援額割合に応じて按分し返還いたします。
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center mb-4 border-l-4 border-pink-500 pl-3">
              <FiCheckSquare className="mr-2 text-pink-500" />
              4. レギュレーション未確認によるトラブル
            </h2>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <p className="text-sm text-red-800 leading-relaxed font-bold">
                イベント主催者が発表する「フラワースタンド規定」を確認せずに注文し、
                結果として会場での受け取り拒否やお持ち帰りを命じられた場合、
                <span className="underline decoration-red-400 decoration-2 underline-offset-2 mx-1">代金の100%を請求し、返金は一切行いません</span>。
              </p>
            </div>
          </section>

          <div className="mt-12 pt-8 border-t border-slate-100 text-center">
            <Link 
              href="/contact" 
              className="inline-flex items-center px-6 py-3 bg-slate-800 text-white font-bold rounded-full hover:bg-slate-900 transition-colors shadow-lg hover:shadow-xl"
            >
              <FiHelpCircle className="mr-2" /> お問い合わせフォームへ
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

/**
 * [静的部分] メインエクスポート
 */
export default function LegalCancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <FiLoader className="w-10 h-10 text-pink-500 animate-spin" />
      </div>
    }>
      <LegalCancelContent />
    </Suspense>
  );
}