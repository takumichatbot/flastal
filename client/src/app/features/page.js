'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  CreditCard, Lock, Palette, MessageCircle, Flower, PiggyBank,
  CheckCircle2, ArrowRight, Zap, ShieldCheck, Heart, Sparkles,
  Smartphone, Users, Globe, BarChart3, ChevronRight, Search // Searchを追加
} from 'lucide-react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- 🪄 MAGIC COMPONENTS ---

const Reveal = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
  >
    {children}
  </motion.div>
);

const FeatureSection = ({ id, title, icon: Icon, color, image, desc, details, reverse = false }) => {
  const colors = {
    purple: "from-purple-500 to-indigo-600 bg-purple-50 text-purple-600",
    emerald: "from-emerald-500 to-teal-600 bg-emerald-50 text-emerald-600",
    pink: "from-pink-500 to-rose-600 bg-pink-50 text-pink-600",
    sky: "from-sky-500 to-blue-600 bg-sky-50 text-sky-600",
    amber: "from-amber-500 to-orange-600 bg-amber-50 text-amber-600",
    green: "from-green-500 to-emerald-600 bg-green-50 text-green-600",
  };

  return (
    <section id={id} className="py-24 border-b border-slate-50 last:border-none overflow-hidden">
      <div className="container mx-auto px-6">
        <div className={cn("grid lg:grid-cols-2 gap-16 items-center", reverse && "lg:flex-row-reverse")}>
          <Reveal>
            <div className={cn("inline-flex items-center gap-3 px-4 py-2 rounded-2xl mb-6 font-bold text-sm", colors[color].split(' ')[2], colors[color].split(' ')[3])}>
              <Icon size={20} />
              <span>{title}</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-8 leading-tight">
              {desc}
            </h2>
            <ul className="space-y-4 mb-10">
              {details.map((item, i) => (
                <li key={i} className="flex gap-4 items-start text-slate-600 leading-relaxed">
                  <div className={cn("mt-1.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white bg-gradient-to-r shadow-lg", colors[color].split(' ').slice(0,2).join(' '))}>
                    <CheckCircle2 size={12} />
                  </div>
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="relative">
              <div className={cn("absolute -inset-4 rounded-[40px] opacity-20 blur-2xl", colors[color].split(' ')[2])} />
              <div className="relative bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden aspect-[4/3] flex items-center justify-center p-8">
                <div className={cn("w-full h-full rounded-3xl bg-gradient-to-br flex flex-col items-center justify-center gap-6 text-white", colors[color].split(' ').slice(0,2).join(' '))}>
                  <Icon size={80} strokeWidth={1.5} className="animate-bounce-slow" />
                  <div className="text-center">
                    <p className="font-black text-2xl uppercase tracking-tighter italic">Flastal OS v2.0</p>
                    <p className="text-xs opacity-80 font-mono tracking-widest">ENCRYPTED SYSTEM 1024-BIT</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

// --- 👑 MAIN PAGE COMPONENT ---

export default function FeaturesPage() {
  const featureData = [
    {
      id: "payment",
      title: "集金システム",
      color: "purple",
      icon: CreditCard,
      desc: "企画の成功率を最大化する柔軟な決済",
      details: [
        "All-in / All-or-Nothing の切り替えが自由自在。企画の趣旨に合わせた最適な募集が可能。",
        "クレジットカード、コンビニ決済、銀行振込に対応。全ての決済を自動で突合管理。",
        "支払期限のリマインドをシステムから自動送信。主催者の「催促しづらい」という悩みを解消。"
      ]
    },
    {
      id: "privacy",
      title: "匿名配送・プライバシー",
      color: "emerald",
      icon: Lock,
      desc: "住所も本名も知られずに「推し」に贈る",
      details: [
        "主催者の個人情報は FLSTAL 運営が厳重に管理。お花屋さんには配送に必要な情報のみ伝達。",
        "参加者（支援者）は完全にハンドルネームで参加可能。SNSアカウントのみで完結する安全な繋がり。",
        "法的要件に基づいた本人確認（KYC）のみを裏側で行い、表側は徹底した匿名性を担保。"
      ],
      reverse: true
    },
    {
      id: "illust",
      title: "神絵師マッチング",
      color: "pink",
      icon: Palette,
      desc: "理想のイラストを、理想のクリエイターと",
      details: [
        "サイト内でイラストの公募が可能。特定の絵師への直接依頼や指名オーダーにも対応。",
        "イラストパネル制作に必要な解像度や納品形式のガイドラインを完備。クリエイターとの齟齬を防ぐ。",
        "謝礼の支払いは FLSTAL が仲介。納品確認後の支払い（エスクロー決済）でクリエイターも安心。"
      ]
    },
    {
      id: "chat",
      title: "限定チャット",
      color: "sky",
      icon: MessageCircle,
      desc: "企画を磨き上げる、閉ざされた会議室",
      details: [
        "支援者のみが入室できるクローズドな空間。推しにバレないよう、徹底したサプライズ相談が可能。",
        "お花屋さんへのデザイン指示やラフ案の共有、参加者同士の多数決投票機能も搭載。",
        "イベント当日までのワクワク感を共有し、コミュニティとしての熱量を最大化。"
      ],
      reverse: true
    },
    {
      id: "matching",
      title: "花屋マッチング",
      color: "amber",
      icon: Flower,
      desc: "あなたの「こだわり」を具現化するプロを探す",
      details: [
        "バルーン装飾、LED装飾、ペーパーアイテムなど、特殊技能を持つフローリストを全国から検索。",
        "過去の「推し活」フラスタの実績写真を一覧表示。得意ジャンルがひと目で分かる。",
        "装飾品の持ち込みや、会場への事前確認代行など、オタク特有のルールを熟知した店舗のみ提携。"
      ]
    },
    {
      id: "report",
      title: "自動報告レポート",
      color: "green",
      icon: PiggyBank,
      desc: "1円単位の透明性が、次なる信頼を生む",
      details: [
        "企画終了後、支援総額から必要経費を差し引いた内訳を自動でレポート化。入力ミスを防止。",
        "領収書の写真アップロード機能。参加者全員がいつでも閲覧でき、収支の透明性を証明。",
        "お花屋さんから届いた完成写真や、会場での設置写真をアルバム形式で永続保存。"
      ],
      reverse: true
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* --- HERO --- */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent)]" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold text-xs uppercase tracking-widest mb-8"
          >
            <Sparkles size={16} />
            <span>Flastal OS Evolution</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-7xl font-black mb-8 leading-tight tracking-tighter"
          >
            「贈りたい」を、<br/>
            最強のテクノロジーで支える。
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-12"
          >
            FLASTALは単なる集金サイトではありません。<br/>
            企画、クリエイティブ、物流、そして透明性。推し活に必要な全てのピースを最適化します。
          </motion.p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {featureData.map((f, i) => (
              <motion.a
                key={f.id}
                href={`#${f.id}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + (i * 0.05) }}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
              >
                <f.icon className="mx-auto mb-3 text-slate-400 group-hover:text-white transition-colors" size={24} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{f.title}</span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* --- FEATURE SECTIONS --- */}
      {featureData.map((feature, i) => (
        <FeatureSection key={feature.id} {...feature} />
      ))}

      {/* --- CTA --- */}
      <section className="py-32 bg-slate-50 overflow-hidden relative">
        <div className="container mx-auto px-6 text-center relative z-10">
          <Reveal>
            <div className="bg-white rounded-[60px] p-12 md:p-24 shadow-2xl border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-20 opacity-5 -mr-10 -mt-10"><Heart size={400} /></div>
              <h2 className="text-3xl md:text-6xl font-black text-slate-800 mb-8 tracking-tighter">
                準備はいい？<br/>次はあなたの番。
              </h2>
              <p className="text-slate-500 text-lg mb-12 max-w-xl mx-auto font-medium">
                最強の機能を味方につけて、世界に一つだけのフラスタを推しに届けよう。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/projects/create">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-pink-500 text-white px-12 py-5 rounded-full text-xl font-black shadow-xl shadow-pink-200 flex items-center justify-center gap-2 group">
                    無料で企画を立てる <Sparkles size={20} />
                  </motion.button>
                </Link>
                <Link href="/projects">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-slate-900 text-white px-12 py-5 rounded-full text-xl font-black shadow-xl shadow-slate-200 flex items-center justify-center gap-2 group">
                    他の企画を見る <Search size={20} />
                  </motion.button>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* --- GLOBAL STYLES --- */}
      <style jsx global>{`
        .animate-bounce-slow {
          animation: bounce-slow 4s infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-10%); }
          50% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}