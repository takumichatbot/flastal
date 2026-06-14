// src/app/tokushoho/page.js
'use client';

import React from 'react';
import Link from 'next/link';
import {
  Printer, ArrowLeft, Briefcase, MapPin,
  Phone, CreditCard, RefreshCw, Clock
} from 'lucide-react';

export default function TokushohoPage() {

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-700">

      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-pink-500 transition-colors">
          <ArrowLeft size={15} /> トップページに戻る
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-pink-50 hover:text-pink-500 hover:border-pink-200 transition-all shadow-sm"
        >
          <Printer size={14} /> ページを保存/印刷
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-slate-100">

        <div className="border-b border-slate-100 pb-6 mb-10 text-center">
          <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-pink-100">
            <Briefcase size={26} className="text-pink-500" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            特定商取引法に基づく表記
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Law regarding Specified Commercial Transactions
          </p>
        </div>

        <div className="border border-slate-100 rounded-[1.5rem] overflow-hidden shadow-sm">
          <dl className="divide-y divide-slate-100">

            <TableRow
              icon={<Briefcase size={16} />}
              label="販売事業者名"
              value="FLASTAL運営事務局（KIREI-CHANNEL）"
            />

            <TableRow
              icon={<Briefcase size={16} />}
              label="運営統括責任者"
              value="齋藤香織"
            />

            <TableRow
              icon={<MapPin size={16} />}
              label="所在地"
              value={
                <>
                  〒170-0005<br />
                  東京都豊島区南大塚１丁目２２−２　CASA大塚１０１
                </>
              }
            />

            <TableRow
              icon={<Phone size={16} />}
              label="お問い合わせ先"
              value={
                <div className="space-y-1">
                  <p>電話番号：03-6764-4472</p>
                  <p>メールアドレス：support@flastal.com</p>
                  <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    ※お電話でのお問い合わせは受け付けておりません。お問い合わせフォームまたはメール、チャットにてご連絡ください。<br />
                    ※連絡先電話番号についても、上記メールアドレスへご請求いただければ、遅滞なく開示いたします。
                  </p>
                </div>
              }
            />

            <TableRow
              icon={<CreditCard size={16} />}
              label="販売価格"
              value="各プロジェクトページに記載された金額（表示価格は消費税を含みます）。"
            />

            <TableRow
              icon={<CreditCard size={16} />}
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
              icon={<Clock size={16} />}
              label="お支払い方法・時期"
              value={
                <div className="space-y-2">
                  <div>
                    <span className="font-bold text-slate-800">クレジットカード決済</span>
                    <p className="text-sm text-slate-600 mt-1">ご利用のクレジットカード会社の締日や契約内容に基づき引き落としが行われます。決済は支援申し込み時に確定します。</p>
                  </div>
                </div>
              }
            />

            <TableRow
              icon={<RefreshCw size={16} />}
              label="商品の引渡時期"
              value="各プロジェクトページに記載されたイベント開催日、またはリターンのお届け予定日に準じます。フラワースタンド等の祝花は、指定された日時に会場へ直接搬入されます。"
            />

            <TableRow
              icon={<RefreshCw size={16} />}
              label="返品・キャンセルについて"
              value={
                <div className="space-y-3">
                  <p>
                    本サービスの性質上（受注生産品および寄付的性質）、原則として支援確定後のお客様都合による返品・キャンセルはお受けできません。
                  </p>
                  <p>
                    ただし、イベントの中止や延期、またはやむを得ない事情による企画中止の場合は、キャンセル・返金ポリシーに基づき対応いたします。
                  </p>
                  <Link
                    href="/legal/cancel"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-pink-500 hover:text-pink-600 bg-pink-50 hover:bg-pink-100 px-3 py-1.5 rounded-xl border border-pink-100 transition-colors"
                  >
                    キャンセル・返金ポリシーを確認する
                  </Link>
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
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-pink-500 transition-colors">
            <ArrowLeft size={14} /> トップページへ戻る
          </Link>
        </div>

      </div>
    </div>
  );
}

function TableRow({ icon, label, value }) {
  return (
    <div className="flex flex-col md:flex-row bg-white">
      <dt className="md:w-1/3 lg:w-1/4 px-6 py-4 bg-slate-50 text-sm font-black text-slate-700 flex items-center gap-2 border-b md:border-b-0 md:border-r border-slate-100">
        {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
        {label}
      </dt>
      <dd className="md:w-2/3 lg:w-3/4 px-6 py-4 text-sm text-slate-600 leading-relaxed">
        {value}
      </dd>
    </div>
  );
}
