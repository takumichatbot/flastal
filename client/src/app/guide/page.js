'use client';

import React from 'react';
import Link from 'next/link';
import {
  Search, Users, Pencil, Heart, Camera,
  ArrowRight, Info, ArrowLeft, CheckCircle2
} from 'lucide-react';

export default function GuidePage() {
  const steps = [
    {
      icon: <Search className="text-pink-500" size={32} />,
      title: "1. イベントを探す・企画を立てる",
      desc: "「イベント情報局」から推しのイベントを探すか、新しくイベントを登録して企画（プロジェクト）を立ち上げます。目標金額やどんなフラスタにしたいかを決めましょう。",
      color: "bg-pink-50 border-pink-200"
    },
    {
      icon: <Users className="text-pink-500" size={32} />,
      title: "2. 参加者（支援者）を募る",
      desc: "企画が公開されたら、X（旧Twitter）などでシェアして参加者を募集します。FLASTALなら面倒なDMでのやり取りや個人情報の管理は不要ですべて自動で行われます。",
      color: "bg-pink-50 border-pink-200"
    },
    {
      icon: <Pencil className="text-emerald-500" size={32} />,
      title: "3. お花屋さん・絵師さんとマッチング",
      desc: "予算の目処が立ったら、FLASTALに登録しているプロのお花屋さんに依頼（オファー）を出します。パネルのイラストが必要な場合は神絵師さんを募集することもできます。",
      color: "bg-emerald-50 border-emerald-200"
    },
    {
      icon: <Heart className="text-rose-500" size={32} />,
      title: "4. お支払いと制作",
      desc: "目標金額に達成したらお支払い（決済）が行われます。集まったお金はFLASTALが安全に預かり、お花屋さんへの支払いもシステム経由で行われるため金銭トラブルの心配がありません。",
      color: "bg-rose-50 border-rose-200"
    },
    {
      icon: <Camera className="text-amber-500" size={32} />,
      title: "5. 当日！推しに想いが届く",
      desc: "イベント当日、お花屋さんが会場にフラスタを搬入します。完成したフラスタの写真はサイト上でも共有され、参加者みんなで完成の喜びを分かち合えます！",
      color: "bg-amber-50 border-amber-200"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-16 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto px-6">

        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-black text-slate-400 hover:text-pink-500 transition-colors uppercase tracking-widest bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
            <ArrowLeft size={14} /> トップページに戻る
          </Link>
        </div>

        <div className="text-center mb-16">
          <span className="text-pink-500 font-black tracking-widest text-sm uppercase bg-pink-50 px-4 py-1.5 rounded-full mb-4 inline-block">
            How to use FLASTAL
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
            FLASTALの使い方
          </h1>
          <p className="text-slate-600 md:text-lg font-medium leading-relaxed max-w-2xl mx-auto">
            推しの特別な日に、ファンみんなでとびきりのフラスタを贈ろう。<br className="hidden md:block"/>
            企画の立ち上げからお花屋さんへの発注、集金まで、<br className="hidden md:block"/>
            FLASTALならすべて安全・簡単に行えます。
          </p>
        </div>

        <div className="space-y-6 mb-16 relative before:absolute before:inset-0 before:ml-[2.25rem] md:before:ml-1/2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
          {steps.map((step, index) => (
            <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group" style={{animationDelay: `${index * 150}ms`}}>
              <div className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-white bg-white shadow-lg shrink-0 md:order-1 md:group-odd:-ml-8 md:group-even:-mr-8 z-10">
                {step.icon}
              </div>
              <div className={`w-[calc(100%-5rem)] md:w-[calc(50%-3rem)] p-6 rounded-3xl border-2 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white ${step.color}`}>
                <h3 className="text-lg md:text-xl font-black text-slate-800 mb-3">{step.title}</h3>
                <p className="text-slate-600 text-sm font-medium leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 mb-16 shadow-sm">
          <h4 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
            <Info className="text-pink-500" size={24} /> 企画を立てる前のお願い
          </h4>
          <ul className="space-y-3 text-slate-600 text-sm font-medium">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
              <span>必ずイベントの<strong>公式レギュレーション（フラスタの受け入れ可否やサイズ規定）</strong>を確認してください。</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
              <span>目標金額は無理のない範囲で設定しましょう。お花屋さんの参考価格ページも確認できます。</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
              <span>企画を立ち上げたら、責任を持って最後まで進行をお願いします！（FLASTAL運営も全力でサポートします）</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/events" className="flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
            開催中のイベントを探す
          </Link>
          <Link href="/projects/create" className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-2xl hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 shadow-md">
            新しく企画を立ち上げる <ArrowRight size={16} />
          </Link>
        </div>

      </div>
    </div>
  );
}
