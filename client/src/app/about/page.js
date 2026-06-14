'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Heart, Globe, Mail, Phone, MapPin, Sparkles } from 'lucide-react';

const Reveal = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FFFDFE] font-sans text-slate-800 pb-16">

      {/* ヒーローセクション */}
      <section className="relative overflow-hidden bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 text-white py-20 md:py-32 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_60%)]" />
        <div className="absolute -bottom-1 left-0 right-0 h-16 bg-[#FFFDFE]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <Reveal>
            <div className="mb-6">
              <Link href="/" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-bold transition-colors bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/20 mb-8">
                <ArrowLeft size={14} /> トップページに戻る
              </Link>
            </div>
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-5xl mb-6 inline-block"
            >
              🌸
            </motion.div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-6 leading-tight">
              推しへの想いを、<br/>花束に込めて。
            </h1>
            <p className="text-white/80 font-medium leading-relaxed max-w-2xl mx-auto text-base md:text-lg">
              FLASTAL（フラスタル）は、ファンが一体となってフラワースタンドを贈り、<br className="hidden md:block"/>
              イベントを彩るためのクラウドファンディングプラットフォームです。
            </p>
          </Reveal>
        </div>
      </section>

      {/* ミッションセクション */}
      <section className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {[
            { icon: Heart, title: "想いを形に", desc: "ファン同士が集まって、推しへの感謝を世界に一つだけのフラスタという形にします。", color: "bg-pink-50 text-pink-500 border-pink-100" },
            { icon: Sparkles, title: "安心・安全", desc: "匿名参加・自動集金・お花屋さんへの直接手配まで、すべてFLASTALが責任をもって行います。", color: "bg-amber-50 text-amber-500 border-amber-100" },
            { icon: Globe, title: "つながりを育む", desc: "企画者・支援者・クリエイター・会場をつなぎ、推し活のエコシステムを豊かにします。", color: "bg-emerald-50 text-emerald-500 border-emerald-100" },
          ].map((item, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className={`rounded-3xl p-6 border h-full ${item.color.split(' ')[0]} ${item.color.split(' ')[2]}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${item.color.split(' ')[0]} ${item.color.split(' ')[1]}`}>
                  <item.icon size={22} />
                </div>
                <h3 className="font-black text-slate-800 text-base mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* 会社概要 */}
        <Reveal>
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100 px-8 py-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-pink-100">
                <Building2 size={20} className="text-pink-500" />
              </div>
              <h2 className="text-xl font-black text-slate-800">運営会社情報</h2>
            </div>

            <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                {[
                  { label: "Organization / 運営組織", value: "FLASTAL運営事務局（KIREI-CHANNEL）" },
                  { label: "Representative / 代表者",  value: "齋藤 香織" },
                ].map((row, i) => (
                  <div key={i}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{row.label}</p>
                    <p className="font-black text-slate-800">{row.value}</p>
                  </div>
                ))}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <MapPin size={11} /> Location / 所在地
                  </p>
                  <p className="font-medium text-slate-700 leading-relaxed text-sm">
                    〒170-0005<br/>東京都豊島区南大塚１丁目２２−２<br/>CASA大塚１０１
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 space-y-5 border border-slate-100">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Mail size={11} /> Email
                  </p>
                  <a href="mailto:support@flastal.com" className="font-bold text-pink-500 hover:text-pink-600 hover:underline underline-offset-2 text-sm">
                    support@flastal.com
                  </a>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Phone size={11} /> Phone
                  </p>
                  <p className="font-bold text-slate-700 text-sm">03-6764-4472</p>
                  <p className="text-[10px] text-slate-400 mt-1">※お問い合わせはメールフォームにて承ります。</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Globe size={11} /> Service
                  </p>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed">
                    ・フラワースタンド等祝花の手配、支援プラットフォームの運営<br/>
                    ・クリエイターと依頼者のマッチングサービス
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* お問い合わせCTA */}
        <Reveal delay={0.1} className="mt-8">
          <Link href="/contact" className="block">
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-6 text-white flex items-center justify-between shadow-lg shadow-pink-200"
            >
              <div>
                <p className="font-black text-lg">ご質問・ご相談はこちら</p>
                <p className="text-white/70 text-sm font-medium mt-0.5">お気軽にお問い合わせください</p>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <Mail size={20} />
              </div>
            </motion.div>
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
