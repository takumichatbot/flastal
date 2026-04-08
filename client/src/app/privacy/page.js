// src/app/privacy/page.js
'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { 
  Database, CheckCircle, Target, ArrowLeft, ShieldCheck, Mail, Info
} from 'lucide-react'; // lucide-reactに統一

function PrivacyPolicyContent() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-700">
      
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
        <Link href="/" className="flex items-center text-sm font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-100">
          <ArrowLeft size={16} className="mr-1.5" /> トップページへ
        </Link>
      </div>

      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] shadow-sm border border-white">
        
        <div className="border-b border-slate-100 pb-8 mb-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl mb-4 shadow-inner border border-white">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter mb-3">
            プライバシーポリシー
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Privacy Policy</p>
        </div>

        <div className="space-y-12">
          
          <section className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 font-medium text-sm leading-relaxed">
            <p>
                FLASTAL運営事務局（KIREI-CHANNEL）（以下、「当事務局」といいます。）は、本ウェブサイト上で提供するサービス「FLASTAL」（以下、「本サービス」といいます。）における、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシーを定めます。
            </p>
          </section>

          {/* 1. 取得する個人情報 */}
          <section>
            <h2 className="text-xl font-black text-slate-900 flex items-center mb-6 border-l-4 border-indigo-500 pl-4">
              <Database className="mr-2 text-indigo-500" size={24} /> 1. 取得する個人情報
            </h2>
            <p className="mb-4 text-sm font-bold text-slate-500">当サービスは、適法かつ公正な手段により以下の情報を取得します。</p>
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
              <ul className="grid md:grid-cols-2 gap-4 text-sm font-bold text-slate-700">
                <li className="flex items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm"><CheckCircle className="mr-2 text-indigo-400 shrink-0" size={18}/> 氏名、ニックネーム</li>
                <li className="flex items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm"><CheckCircle className="mr-2 text-indigo-400 shrink-0" size={18}/> メールアドレス、電話番号</li>
                <li className="flex items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm"><CheckCircle className="mr-2 text-indigo-400 shrink-0" size={18}/> 配送先・イベント会場情報</li>
                <li className="flex items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm"><CheckCircle className="mr-2 text-indigo-400 shrink-0" size={18}/> 決済・お支払い情報</li>
                <li className="flex items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm"><CheckCircle className="mr-2 text-indigo-400 shrink-0" size={18}/> お問い合わせ内容</li>
                <li className="flex items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm"><CheckCircle className="mr-2 text-indigo-400 shrink-0" size={18}/> その他任意入力情報</li>
              </ul>
            </div>
          </section>

          {/* 2. 利用目的 */}
          <section>
            <h2 className="text-xl font-black text-slate-900 flex items-center mb-6 border-l-4 border-indigo-500 pl-4">
              <Target className="mr-2 text-indigo-500" size={24} /> 2. 個人情報の利用目的
            </h2>
            <div className="overflow-hidden rounded-[2rem] border border-slate-100 shadow-sm bg-white">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <tbody className="bg-white divide-y divide-slate-50">
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5 font-black text-slate-700 w-1/3 bg-slate-50/80 border-r border-slate-100">サービスの提供</td>
                    <td className="px-6 py-5 text-slate-600 font-medium">利用登録、本人確認、クラウドファンディングの支援管理、決済処理のため。</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5 font-black text-slate-700 w-1/3 bg-slate-50/80 border-r border-slate-100">手配・業務遂行</td>
                    <td className="px-6 py-5 text-slate-600 font-medium">フラワースタンドやイラストの手配のため、必要な範囲で企画者・花屋・クリエイター間で情報を共有します。</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5 font-black text-slate-700 w-1/3 bg-slate-50/80 border-r border-slate-100">ご連絡</td>
                    <td className="px-6 py-5 text-slate-600 font-medium">お問い合わせへの回答、メンテナンスや重要なお知らせを送付するため。</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. 第三者提供 */}
          <section>
            <h2 className="text-xl font-black text-slate-900 flex items-center mb-6 border-l-4 border-indigo-500 pl-4">
              <Info className="mr-2 text-indigo-500" size={24} /> 3. 個人情報の第三者提供
            </h2>
            <p className="mb-4 text-sm font-medium text-slate-600 leading-relaxed">
              当事務局は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく第三者に個人情報を提供することはありません。
            </p>
            <ul className="list-disc list-outside pl-5 space-y-2 text-sm text-slate-500 font-medium bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <li>決済処理のため、決済代行事業者（Stripe等）に情報を提供する場合</li>
                <li>本サービスの提供において、プロジェクト関係者間で業務遂行に必要な情報を共有する場合</li>
                <li>法令に基づく場合、または人の生命、身体等の保護のために必要がある場合</li>
            </ul>
          </section>
          
          <div className="mt-16 pt-10 border-t border-slate-100 text-center bg-indigo-50/50 p-8 rounded-[2rem] border border-indigo-100">
            <h3 className="text-lg font-black text-indigo-900 mb-4">個人情報に関するお問い合わせ</h3>
            <Link href="/contact" className="inline-flex items-center px-8 py-3.5 bg-indigo-600 text-white font-black rounded-full hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 gap-2">
              <Mail size={18} /> お問い合わせフォームへ
            </Link>
            <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">制定：2025年12月17日</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// メインエクスポート：Suspenseで包む
export default function PrivacyPolicyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500"></div>
      </div>
    }>
      <PrivacyPolicyContent />
    </Suspense>
  );
}