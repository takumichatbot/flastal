'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { 
  FiDatabase, FiCheckCircle, FiTarget, FiShare2, 
  FiLock, FiGlobe, FiMail, FiArrowLeft, FiShield 
} from 'react-icons/fi';

/**
 * [動的部分の隔離]
 * 実際のプライバシーポリシーのコンテンツです。
 * Next.js 15では、useSearchParamsや特定のブラウザ依存フックが
 * 含まれる可能性がある場合、このようにコンポーネントを分離して
 * 呼び出し元でSuspenseで囲む必要があります。
 */
function PrivacyPolicyContent() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-700">
      
      {/* ヘッダーナビゲーション */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link href="/" className="flex items-center text-sm text-slate-500 hover:text-indigo-600 transition-colors">
          <FiArrowLeft className="mr-1" /> トップページに戻る
        </Link>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm ring-1 ring-slate-100">
        
        {/* タイトルエリア */}
        <div className="border-b border-slate-200 pb-6 mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl mb-4">
            <FiShield size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            プライバシーポリシー
          </h1>
          <p className="text-sm text-slate-500">
            当サービスにおける個人情報の取り扱いについて
          </p>
        </div>

        <div className="space-y-12">
          
          {/* 1. 取得する個人情報 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center mb-4 border-l-4 border-indigo-500 pl-3">
              <FiDatabase className="mr-2 text-indigo-500" />
              1. 取得する個人情報
            </h2>
            <p className="mb-4 text-sm text-slate-600">
              当サービスは、サービスの提供にあたり、以下の情報を適法かつ公正な手段により取得します。
            </p>
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <ul className="grid md:grid-cols-2 gap-4 text-sm text-slate-700">
                <li className="flex items-start">
                  <FiCheckCircle className="mr-2 mt-0.5 text-indigo-400 shrink-0"/>
                  氏名、ニックネーム（ハンドルネーム）
                </li>
                <li className="flex items-start">
                  <FiCheckCircle className="mr-2 mt-0.5 text-indigo-400 shrink-0"/>
                  メールアドレス、電話番号
                </li>
                <li className="flex items-start">
                  <FiCheckCircle className="mr-2 mt-0.5 text-indigo-400 shrink-0"/>
                  配送先住所（郵便番号を含む）
                </li>
                <li className="flex items-start">
                  <FiCheckCircle className="mr-2 mt-0.5 text-indigo-400 shrink-0"/>
                  クレジットカード情報等の決済情報
                </li>
                <li className="flex items-start">
                  <FiCheckCircle className="mr-2 mt-0.5 text-indigo-400 shrink-0"/>
                  お問い合わせ内容、通信履歴
                </li>
                <li className="flex items-start">
                  <FiCheckCircle className="mr-2 mt-0.5 text-indigo-400 shrink-0"/>
                  その他ユーザーが任意に入力した情報
                </li>
              </ul>
            </div>
          </section>

          {/* 2. 利用目的 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center mb-4 border-l-4 border-indigo-500 pl-3">
              <FiTarget className="mr-2 text-indigo-500" />
              2. 個人情報の利用目的
            </h2>
            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <tbody className="bg-white divide-y divide-slate-200 text-sm">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700 w-1/3 bg-slate-50/50">サービスの提供</td>
                    <td className="px-6 py-4 text-slate-600">
                      本サービスの利用登録、本人確認、利用料金の請求のため。
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700 w-1/3 bg-slate-50/50">商品の配送・連絡</td>
                    <td className="px-6 py-4 text-slate-600">
                      フラワースタンド等の手配、配送、および配送に関する緊急連絡のため。
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700 w-1/3 bg-slate-50/50">サポート</td>
                    <td className="px-6 py-4 text-slate-600">
                      お問い合わせへの対応、トラブル解決、規約変更等の重要なお知らせのため。
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700 w-1/3 bg-slate-50/50">安全対策</td>
                    <td className="px-6 py-4 text-slate-600">
                      不正利用の防止、スパム行為の対策、利用規約違反への対応のため。
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. 第三者提供 */}
          <section className="bg-indigo-50 p-6 md:p-8 rounded-2xl border border-indigo-100 shadow-inner">
            <h2 className="text-lg font-bold text-indigo-900 flex items-center mb-3">
              <FiShare2 className="mr-2" />
              3. 個人情報の第三者提供について
            </h2>
            <p className="text-sm text-indigo-800 leading-relaxed mb-4">
              当サービスは、原則としてユーザーの同意なく個人情報を第三者に提供しません。ただし、本サービスの性質上、以下の提携先に対して必要最小限の範囲で情報を提供する場合があります。
            </p>
            <div className="bg-white/70 p-4 rounded-xl shadow-sm border border-indigo-100">
              <ul className="space-y-3 text-sm text-indigo-900">
                <li className="flex items-start">
                  <span className="font-bold min-w-[110px] block shrink-0">お花屋さん：</span>
                  <span>商品の制作・配送、宛名の記載、納品確認のために必要な情報（配送先、氏名、メッセージ等）を提供します。</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold min-w-[110px] block shrink-0">イベント会場：</span>
                  <span>搬入・設置・回収の調整、およびセキュリティ上の理由から、主催者または会場管理者へ納品者情報を提供する場合があります。</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold min-w-[110px] block shrink-0">決済代行会社：</span>
                  <span>クレジットカード決済等の処理に必要な情報を、決済代行会社（Stripe等）へ提供します。</span>
                </li>
              </ul>
            </div>
          </section>

          {/* 4. 安全管理措置 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center mb-4 border-l-4 border-indigo-500 pl-3">
              <FiLock className="mr-2 text-indigo-500" />
              4. 安全管理措置
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              当サービスは、個人情報の漏洩、滅失または毀損の防止その他の個人情報の安全管理のために、必要かつ適切な措置を講じます。
              通信はすべてSSL/TLSにより暗号化され、データベースへのアクセス権限は厳重に管理されています。
            </p>
          </section>

          {/* 5. Cookie等 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center mb-4 border-l-4 border-indigo-500 pl-3">
              <FiGlobe className="mr-2 text-indigo-500" />
              5. Cookie（クッキー）等の利用
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              当サービスでは、利便性の向上やアクセス解析（Google Analytics等）のためにCookieおよび類似技術を使用することがあります。
              ブラウザの設定によりCookieを無効にすることも可能ですが、その場合、サービスの一部機能が利用できなくなる可能性があります。
            </p>
          </section>

          {/* 6. お問い合わせ */}
          <div className="mt-12 pt-8 border-t border-slate-100 text-center">
            <h3 className="text-lg font-bold text-slate-800 mb-2">個人情報に関するお問い合わせ</h3>
            <p className="text-slate-600 text-sm mb-6">
              個人情報の開示、訂正、削除、利用停止等のご請求、または本ポリシーに関するご質問は、以下のお問い合わせ窓口までご連絡ください。
            </p>
            
            <Link 
              href="/contact" 
              className="inline-flex items-center px-8 py-3 bg-slate-800 text-white font-bold rounded-full hover:bg-slate-900 transition-colors shadow-lg hover:shadow-xl"
            >
              <FiMail className="mr-2" /> お問い合わせフォーム
            </Link>
            
            <p className="mt-8 text-xs text-slate-400">
              制定：2025年12月17日
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

// --- メインエクスポート ---
/**
 * Pageコンポーネント
 * 内部でPrivacyPolicyContentをSuspenseで包むことで、
 * Renderなどのホスティング環境でのビルドエラー(Missing Suspense with CSR bailout)を回避します。
 */
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