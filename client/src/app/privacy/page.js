'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { 
  FiDatabase, FiCheckCircle, FiTarget, FiShare2, 
  FiLock, FiGlobe, FiMail, FiArrowLeft, FiShield 
} from 'react-icons/fi';

// 実際のコンテンツ（動的フックが含まれる可能性がある部分）
function PrivacyPolicyContent() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-700">
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link href="/" className="flex items-center text-sm text-slate-500 hover:text-indigo-600 transition-colors">
          <FiArrowLeft className="mr-1" /> トップページに戻る
        </Link>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm ring-1 ring-slate-100">
        <div className="border-b border-slate-200 pb-6 mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl mb-4">
            <FiShield size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            プライバシーポリシー
          </h1>
          <p className="text-sm text-slate-500">当サービスにおける個人情報の取り扱いについて</p>
        </div>

        <div className="space-y-12">
          {/* 1. 取得する個人情報 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center mb-4 border-l-4 border-indigo-500 pl-3">
              <FiDatabase className="mr-2 text-indigo-500" /> 1. 取得する個人情報
            </h2>
            <p className="mb-4 text-sm text-slate-600">当サービスは、適法かつ公正な手段により取得します。</p>
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <ul className="grid md:grid-cols-2 gap-4 text-sm text-slate-700">
                <li className="flex items-start"><FiCheckCircle className="mr-2 mt-0.5 text-indigo-400 shrink-0"/>氏名、ニックネーム</li>
                <li className="flex items-start"><FiCheckCircle className="mr-2 mt-0.5 text-indigo-400 shrink-0"/>メールアドレス、電話番号</li>
                <li className="flex items-start"><FiCheckCircle className="mr-2 mt-0.5 text-indigo-400 shrink-0"/>配送先住所</li>
                <li className="flex items-start"><FiCheckCircle className="mr-2 mt-0.5 text-indigo-400 shrink-0"/>決済情報</li>
                <li className="flex items-start"><FiCheckCircle className="mr-2 mt-0.5 text-indigo-400 shrink-0"/>お問い合わせ内容</li>
                <li className="flex items-start"><FiCheckCircle className="mr-2 mt-0.5 text-indigo-400 shrink-0"/>その他任意入力情報</li>
              </ul>
            </div>
          </section>

          {/* 2. 利用目的 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center mb-4 border-l-4 border-indigo-500 pl-3">
              <FiTarget className="mr-2 text-indigo-500" /> 2. 個人情報の利用目的
            </h2>
            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <tbody className="bg-white divide-y divide-slate-200">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700 w-1/3 bg-slate-50/50">サービスの提供</td>
                    <td className="px-6 py-4 text-slate-600">利用登録、本人確認、料金請求のため。</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700 w-1/3 bg-slate-50/50">商品の配送・連絡</td>
                    <td className="px-6 py-4 text-slate-600">フラワースタンド等の手配、緊急連絡のため。</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 中略：デザインと構成はユーザー提示のまま維持 */}
          
          <div className="mt-12 pt-8 border-t border-slate-100 text-center">
            <h3 className="text-lg font-bold text-slate-800 mb-2">個人情報に関するお問い合わせ</h3>
            <Link href="/contact" className="inline-flex items-center px-8 py-3 bg-slate-800 text-white font-bold rounded-full hover:bg-slate-900 transition-colors shadow-lg">
              <FiMail className="mr-2" /> お問い合わせフォーム
            </Link>
            <p className="mt-8 text-xs text-slate-400">制定：2025年12月17日</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// メインエクスポート：必ずSuspenseで包む
export default function PrivacyPolicyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    }>
      <PrivacyPolicyContent />
    </Suspense>
  );
}