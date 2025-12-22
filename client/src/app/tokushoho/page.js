'use client';

import React from 'react';
import Link from 'next/link';
import { 
  FiPrinter, FiArrowLeft, FiBriefcase, FiMapPin, 
  FiPhone, FiCreditCard, FiRefreshCcw, FiClock 
} from 'react-icons/fi';

export default function TokushohoPage() {
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-700">
      
      {/* ヘッダーナビゲーション */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link href="/" className="flex items-center text-sm text-slate-500 hover:text-sky-600 transition-colors">
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
          <div className="flex justify-center mb-4">
            <div className="bg-sky-50 p-3 rounded-full">
                <FiBriefcase className="text-4xl text-sky-600" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            特定商取引法に基づく表記
          </h1>
          <p className="text-sm text-slate-500">
            Law regarding Specified Commercial Transactions
          </p>
        </div>

        {/* テーブルエリア */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <dl className="divide-y divide-slate-200">
            
            <TableRow 
              icon={<FiBriefcase/>} 
              label="販売事業者名" 
              value="FLASTAL運営事務局（または法人名）" 
            />
            
            <TableRow 
              icon={<FiBriefcase/>} 
              label="運営統括責任者" 
              value="山田 太郎（代表者名）" 
            />
            
            <TableRow 
              icon={<FiMapPin/>} 
              label="所在地" 
              value="〒100-0000 東京都千代田区..." 
            />
            
            <TableRow 
              icon={<FiPhone/>} 
              label="お問い合わせ先" 
              value={
                <div className="space-y-1">
                  <p>電話番号：03-0000-0000</p>
                  <p>メールアドレス：support@flastal.com</p>
                  <p className="text-xs text-slate-500 mt-1">
                    ※お電話でのお問い合わせは受け付けておりません。お問い合わせフォームまたはメールにてご連絡ください。<br/>
                    ※連絡先電話番号についても、上記メールアドレスへご請求いただければ、遅滞なく開示いたします。
                  </p>
                </div>
              } 
            />

            <TableRow 
              icon={<FiCreditCard/>} 
              label="販売価格" 
              value="各プロジェクトページに記載された金額（表示価格は消費税を含みます）。" 
            />

            <TableRow 
              icon={<FiCreditCard/>} 
              label="商品代金以外の必要料金" 
              value={
                <ul className="list-disc list-outside pl-4 space-y-1">
                  <li><strong>システム利用料：</strong> 支援1回につき220円（税込）</li>
                  <li><strong>決済手数料：</strong> コンビニ払い等の場合、所定の手数料が発生する場合があります。</li>
                  <li>インターネット接続料金その他の電気通信回線の通信に関する費用はお客様にてご負担ください。</li>
                </ul>
              } 
            />

            <TableRow 
              icon={<FiClock/>} 
              label="お支払い方法・時期" 
              value={
                <div className="space-y-2">
                  <div>
                    <span className="font-bold text-slate-800">クレジットカード決済</span>
                    <p className="text-sm">ご利用のクレジットカード会社の締日や契約内容に基づき引き落としが行われます。決済は支援申し込み時に確定します。</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">その他（PayPay等）</span>
                    <p className="text-sm">申し込み時にお支払いが確定します。</p>
                  </div>
                </div>
              } 
            />

            <TableRow 
              icon={<FiRefreshCcw/>} 
              label="商品の引渡時期" 
              value="各プロジェクトページに記載されたイベント開催日、またはリターンのお届け予定日に準じます。フラワースタンド等の祝花は、指定された日時に会場へ直接搬入されます。" 
            />

            <TableRow 
              icon={<FiRefreshCcw/>} 
              label="返品・キャンセルについて" 
              value={
                <div className="space-y-2">
                  <p>
                    本サービスの性質上（受注生産品および寄付的性質）、原則として支援確定後のお客様都合による返品・キャンセルはお受けできません。
                  </p>
                  <p>
                    ただし、イベントの中止や延期、またはやむを得ない事情による企画中止の場合は、
                    <Link href="/legal/cancel" className="text-sky-600 hover:underline mx-1">
                      キャンセル・返金ポリシー
                    </Link>
                    に基づき対応いたします。
                  </p>
                  <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                    ※ 詳しくは「キャンセル・返金ポリシー」をご確認ください。
                  </p>
                </div>
              } 
            />

            <TableRow 
              label="動作環境" 
              value="iOS、Android、Windows、macOSの各最新版のブラウザ（Google Chrome, Safari, Edge等）でご利用いただけます。" 
            />

          </dl>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-slate-500 hover:text-sky-600 transition-colors">
            トップページへ戻る
          </Link>
        </div>

      </div>
    </div>
  );
}

// 行コンポーネント (レスポンシブ対応)
function TableRow({ icon, label, value }) {
  return (
    <div className="flex flex-col md:flex-row bg-white">
      <dt className="md:w-1/3 lg:w-1/4 px-6 py-4 bg-slate-50 text-sm font-bold text-slate-700 flex items-center border-b md:border-b-0 md:border-r border-slate-100">
        {icon && <span className="mr-2 text-slate-400 text-lg">{icon}</span>}
        {label}
      </dt>
      <dd className="md:w-2/3 lg:w-3/4 px-6 py-4 text-sm text-slate-600 leading-relaxed">
        {value}
      </dd>
    </div>
  );
}