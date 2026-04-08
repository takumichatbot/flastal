'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, Heart, Globe, Mail, Phone, MapPin } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      
      <div className="max-w-4xl mx-auto mb-8">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-sky-600 transition-colors">
          <ArrowLeft size={16} className="mr-1.5" /> トップページに戻る
        </Link>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* ビジョンセクション */}
        <div className="bg-gradient-to-br from-sky-900 to-slate-900 rounded-[2rem] p-10 md:p-16 text-white shadow-xl relative overflow-hidden text-center">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
            <div className="relative z-10">
                <Heart size={48} className="mx-auto text-pink-500 mb-6 drop-shadow-lg" />
                <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-6">推しへの想いを、<br className="md:hidden"/>花束に込めて。</h1>
                <p className="text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">
                    FLASTAL（フラスタル）は、ファンが一体となってフラワースタンド（フラスタ）を贈り、<br className="hidden md:block"/>
                    イベントを彩るためのクラウドファンディングプラットフォームです。<br/>
                    企画者、支援者、お花屋さん、そしてイラストレーターの皆様を繋ぎ、<br className="hidden md:block"/>
                    「想いを形にする」サポートをいたします。
                </p>
            </div>
        </div>

        {/* 会社概要セクション */}
        <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                <div className="bg-sky-50 p-3 rounded-2xl text-sky-600"><Building2 size={28}/></div>
                <h2 className="text-2xl font-black text-slate-800">運営会社情報</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Organization / 運営組織</p>
                        <p className="text-lg font-black text-slate-800">FLASTAL運営事務局 <span className="text-sm text-slate-500 font-bold">（KIREI-CHANNEL）</span></p>
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Representative / 代表者</p>
                        <p className="text-lg font-bold text-slate-800">齋藤 香織</p>
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><MapPin size={14}/> Location / 所在地</p>
                        <p className="font-bold text-slate-700 leading-relaxed">
                            〒174-0043<br/>東京都板橋区坂下3-6-1-113
                        </p>
                    </div>
                </div>

                <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Mail size={14}/> Email / メールアドレス</p>
                        <a href="mailto:support@flastal.com" className="font-bold text-sky-600 hover:underline">support@flastal.com</a>
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Phone size={14}/> Phone / 電話番号</p>
                        <p className="font-bold text-slate-700">03-6764-4472</p>
                        <p className="text-[10px] text-slate-500 mt-1">※原則としてお問い合わせはメールフォームにて承ります。</p>
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Globe size={14}/> Service / サービス内容</p>
                        <p className="font-bold text-slate-700 text-sm leading-relaxed">
                            ・フラワースタンド等祝花の手配、支援プラットフォームの運営<br/>
                            ・クリエイターと依頼者のマッチングサービス
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}