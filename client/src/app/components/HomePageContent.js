'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  motion, useScroll, useTransform, useSpring, useInView, AnimatePresence, useMotionValue, useMotionTemplate
} from 'framer-motion';
import { 
  Heart, Sparkles, Zap, MessageCircle, Gift, 
  Calendar, Users, ShieldCheck, ChevronDown, 
  Star, Palette, Music, Camera, Mail, HelpCircle,
  ArrowRight, CheckCircle2, Search, Flower, Smile,
  CreditCard, Lock, Smartphone, Megaphone, Info
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// --- 🌸 Design System Components 🌸 ---

// グラデーションテキスト
const GradientText = ({ children, from = "from-pink-500", to = "to-rose-400", className }) => (
  <span className={cn("text-transparent bg-clip-text bg-gradient-to-r", from, to, className)}>
    {children}
  </span>
);

// セクション見出し（装飾付き）
const SectionHeader = ({ en, ja, desc, color = "pink" }) => {
  const colors = {
    pink: "from-pink-400 to-rose-400 text-pink-500",
    blue: "from-sky-400 to-blue-400 text-sky-500",
    purple: "from-purple-400 to-indigo-400 text-purple-500",
    green: "from-emerald-400 to-teal-400 text-emerald-500",
  };
  
  return (
    <div className="text-center mb-20 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <span className={cn("block font-bold tracking-[0.2em] uppercase text-sm mb-3", colors[color].split(" ").pop())}>
          ✨ {en}
        </span>
        <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-6 leading-tight">
          {ja}
        </h2>
        <div className={cn("h-1.5 w-24 mx-auto rounded-full bg-gradient-to-r mb-6", colors[color].split(" ")[0] + " " + colors[color].split(" ")[1])} />
        {desc && (
          <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed text-sm md:text-base">
            {desc}
          </p>
        )}
      </motion.div>
    </div>
  );
};

// ぷるぷるボタン (Advanced)
const KawaiiButton = ({ children, variant = "primary", icon: Icon, className, onClick }) => {
  const baseStyle = "relative px-8 py-4 rounded-full font-bold text-lg shadow-xl transition-all overflow-hidden group flex items-center justify-center gap-3";
  const variants = {
    primary: "bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 text-white shadow-pink-200 hover:shadow-pink-300 hover:scale-105",
    secondary: "bg-white text-slate-700 border-2 border-slate-100 hover:border-sky-300 hover:text-sky-500 hover:scale-105",
    outline: "bg-transparent border-2 border-white/30 text-white hover:bg-white/10"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      className={cn(baseStyle, variants[variant], className)}
      onClick={onClick}
    >
      {Icon && <Icon size={20} className={cn("transition-transform group-hover:rotate-12")} />}
      <span className="relative z-10">{children}</span>
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shine" />
      )}
    </motion.button>
  );
};

// ガラス風カード
const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/70 backdrop-blur-md border border-white/50 shadow-lg rounded-3xl p-6 relative overflow-hidden", className)}>
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
    <div className="relative z-10">{children}</div>
  </div>
);

// 背景装飾（浮遊する図形）
const FloatingShape = ({ type, color, top, left, right, bottom, size = 100, delay = 0 }) => (
  <motion.div
    className={cn("absolute opacity-30 pointer-events-none blur-3xl", color)}
    style={{ top, left, right, bottom, width: size, height: size, borderRadius: '40%' }}
    animate={{ 
      y: [0, -30, 0], 
      rotate: [0, 20, -20, 0],
      scale: [1, 1.1, 1]
    }}
    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay }}
  />
);

// --- 🚀 SECTIONS 🚀 ---

// 1. HERO SECTION: 圧倒的ファーストビュー
const HeroSection = () => {
  return (
    <section className="relative w-full min-h-[95vh] flex items-center justify-center overflow-hidden bg-slate-50">
      {/* Background Layer */}
      <div className="absolute inset-0 bg-[radial-gradient(#e0f2fe_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
      <FloatingShape color="bg-pink-300" top="-5%" left="-5%" size={400} />
      <FloatingShape color="bg-sky-300" bottom="-5%" right="-5%" size={400} delay={2} />
      <FloatingShape color="bg-yellow-200" top="40%" left="30%" size={200} delay={4} />

      <div className="container relative z-10 px-6 pt-20 grid lg:grid-cols-12 gap-12 items-center">
        {/* Left Content (7 cols) */}
        <div className="lg:col-span-7 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md border border-pink-100 mb-8 mx-auto lg:mx-0">
              <span className="flex h-2 w-2 rounded-full bg-pink-500 animate-ping" />
              <span className="text-xs font-bold text-slate-600 tracking-wide">推し活アップデート 2.0</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-800 leading-[1.1] mb-8 tracking-tight">
              愛を、<br/>
              <span className="relative inline-block">
                <span className="absolute inset-0 bg-gradient-to-r from-pink-200 to-rose-200 -rotate-2 rounded-lg blur-sm opacity-50" />
                <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">
                  可視化
                </span>
              </span>
              しよう。
            </h1>

            <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              FLASTAL（フラスタル）は、<br className="md:hidden"/>ファン有志で贈る「フラスタ企画」を<br/>
              <span className="font-bold text-slate-800 bg-pink-50 px-1">安全</span>・<span className="font-bold text-slate-800 bg-sky-50 px-1">簡単</span>・<span className="font-bold text-slate-800 bg-yellow-50 px-1">感動的</span>にする<br/>
              次世代クラウドファンディング・プラットフォームです。
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start mb-12">
              <Link href="/create">
                <KawaiiButton variant="primary" icon={Sparkles}>
                  無料で企画を立てる
                </KawaiiButton>
              </Link>
              <Link href="/projects">
                <KawaiiButton variant="secondary" icon={Search}>
                  企画を探す
                </KawaiiButton>
              </Link>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-6 text-sm font-bold text-slate-400">
              <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500"/> 集金トラブルゼロ</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500"/> 個人情報保護</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500"/> 未達時返金保証</span>
            </div>
          </motion.div>
        </div>

        {/* Right Visual (5 cols) - 3D Floats */}
        <div className="lg:col-span-5 relative h-[500px] lg:h-[700px] hidden md:block perspective-1000">
          {/* Main Visual Card */}
          <motion.div
            initial={{ rotateY: 30, rotateX: 10, opacity: 0 }}
            animate={{ rotateY: -10, rotateX: 5, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 z-20"
          >
            <div className="relative w-full h-full bg-white rounded-[40px] shadow-2xl border-4 border-white overflow-hidden">
               {/* Mock UI Header */}
               <div className="h-2/3 bg-[url('https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center relative group">
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                 <div className="absolute bottom-6 left-6 text-white">
                   <div className="flex gap-2 mb-2">
                     <span className="bg-pink-500 px-2 py-0.5 rounded text-[10px] font-bold">募集中</span>
                     <span className="bg-sky-500 px-2 py-0.5 rounded text-[10px] font-bold">#VTuber</span>
                   </div>
                   <h3 className="text-2xl font-bold leading-tight">星街すいせいさんへ<br/>銀河一のフラスタを！</h3>
                 </div>
               </div>
               {/* Mock UI Body */}
               <div className="p-6 bg-white h-1/3">
                 <div className="flex justify-between items-end mb-2">
                   <span className="text-3xl font-bold text-slate-800">¥125,000</span>
                   <span className="text-pink-500 font-bold">125% 達成!</span>
                 </div>
                 <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: "100%" }}
                     transition={{ duration: 2, delay: 1 }}
                     className="h-full bg-gradient-to-r from-pink-400 to-rose-500"
                   />
                 </div>
                 <div className="flex justify-between text-xs text-slate-400">
                   <span>サポーター: 48人</span>
                   <span>残り: 5日</span>
                 </div>
               </div>
            </div>
            
            {/* Floating Elements */}
            <motion.div 
              animate={{ y: [-10, 10, -10] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute -top-10 -right-10 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 z-30"
            >
              <div className="bg-sky-100 p-2 rounded-full text-sky-500"><Palette size={20} /></div>
              <div>
                <p className="text-xs text-slate-400">Illustrator</p>
                <p className="font-bold text-slate-700">神絵師決定！</p>
              </div>
            </motion.div>
            
            <motion.div 
              animate={{ y: [10, -10, 10] }}
              transition={{ repeat: Infinity, duration: 5, delay: 1 }}
              className="absolute -bottom-10 -left-10 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 z-30"
            >
              <div className="bg-emerald-100 p-2 rounded-full text-emerald-500"><ShieldCheck size={20} /></div>
              <div>
                <p className="text-xs text-slate-400">Status</p>
                <p className="font-bold text-slate-700">運営承認済み</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// 2. TICKER: 対応ジャンル無限スクロール
const TickerSection = () => {
  const genres = ["#地下アイドル", "#VTuber", "#歌い手", "#コンカフェ", "#声優イベント", "#2.5次元舞台", "#K-POP", "#e-Sports大会", "#生誕祭", "#周年ライブ", "#卒業公演"];
  
  return (
    <div className="bg-slate-900 py-6 overflow-hidden relative rotate-1 scale-105 border-y-4 border-pink-500">
      <motion.div 
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: [0, -1000] }}
        transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
      >
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-8">
            {genres.map((g, j) => (
              <span key={j} className="text-xl font-bold text-slate-400 flex items-center gap-2">
                <Star size={16} className="text-yellow-400" fill="currentColor" />
                {g}
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// 3. PAIN & SOLUTION: 従来の課題と解決
const ProblemSection = () => {
  return (
    <section className="py-24 bg-white relative">
      <div className="container mx-auto px-6">
        <SectionHeader 
          en="Pain & Solution" 
          ja="フラスタ企画の「大変」をゼロに"
          desc="SNSでのDM集金、個人情報の管理、お花屋さんへのオーダー...。主催者の負担になっていた作業を、FLASTALがすべて引き受けます。"
          color="blue"
        />

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Before */}
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 opacity-70 grayscale hover:grayscale-0 transition-all">
            <h3 className="text-xl font-bold text-slate-600 mb-6 flex items-center gap-2">
              <span className="bg-slate-200 px-2 rounded text-sm">従来のやり方</span>
              😰 大変すぎる...
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3 text-slate-500"><span className="text-red-400">×</span> DMで一人ひとり口座を教える手間</li>
              <li className="flex gap-3 text-slate-500"><span className="text-red-400">×</span> 未入金の催促が気まずい</li>
              <li className="flex gap-3 text-slate-500"><span className="text-red-400">×</span> 本名や住所がバレるリスク</li>
              <li className="flex gap-3 text-slate-500"><span className="text-red-400">×</span> 収支報告のエクセル管理が地獄</li>
            </ul>
          </div>

          {/* After (FLASTAL) */}
          <div className="bg-gradient-to-br from-white to-sky-50 p-8 rounded-3xl border-2 border-sky-100 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-sky-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">SOLUTION</div>
            <h3 className="text-xl font-bold text-sky-600 mb-6 flex items-center gap-2">
              <span className="bg-sky-100 px-2 rounded text-sm">FLASTALなら</span>
              ✨ 全部おまかせ！
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3 text-slate-700 font-bold"><CheckCircle2 className="text-sky-500" /> リンクをシェアするだけで集金完了</li>
              <li className="flex gap-3 text-slate-700 font-bold"><CheckCircle2 className="text-sky-500" /> クレカ・コンビニ払いで自動管理</li>
              <li className="flex gap-3 text-slate-700 font-bold"><CheckCircle2 className="text-sky-500" /> 完全匿名で安心安全</li>
              <li className="flex gap-3 text-slate-700 font-bold"><CheckCircle2 className="text-sky-500" /> 収支報告もワンクリックで公開</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

// 4. CULTURE: フラスタの種類解説（初心者＆文化教育）
const CultureSection = () => {
  const cultures = [
    {
      title: "フラワースタンド",
      eng: "Flower Stand",
      icon: "💐",
      desc: "ライブ会場のロビーを彩る、背の高いお花。バルーンやLEDで派手に装飾するのが定番。2段・連結など規模も様々。"
    },
    {
      title: "楽屋花（卓上）",
      eng: "Arrangement",
      icon: "🧺",
      desc: "楽屋や受付に飾るコンパクトなお花。スタンド禁止の会場や、個人的に想いを伝えたい時に最適。"
    },
    {
      title: "イラストパネル",
      eng: "Illustration Panel",
      icon: "🎨",
      desc: "神絵師に依頼した推しのイラストをパネル化してお花に添えます。特にVTuberや二次元界隈では必須級のアイテム！"
    },
    {
      title: "祭壇・デコ",
      eng: "Altar & Decor",
      icon: "🧸",
      desc: "お花だけでなく、ぬいぐるみ、グッズ、名札パネルなどを大量に盛り込んだ、愛の重さが伝わる独自のデザイン。"
    }
  ];

  return (
    <section className="py-24 bg-rose-50/50">
      <div className="container mx-auto px-6">
        <SectionHeader 
          en="Otaku Culture" 
          ja="どんなお花を贈る？" 
          desc="「フラスタ」と一口に言っても形は様々。会場のレギュレーション（規則）や予算に合わせて、最適な形を選ぼう。"
          color="pink"
        />

        <div className="grid md:grid-cols-4 gap-6">
          {cultures.map((c, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="bg-white rounded-3xl p-6 text-center border border-pink-100 shadow-sm hover:shadow-lg transition-all"
            >
              <div className="text-5xl mb-4">{c.icon}</div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">{c.title}</h3>
              <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-4">{c.eng}</p>
              <p className="text-sm text-slate-600 leading-relaxed text-left">
                {c.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// 5. FEATURES: Bento Grid (White Kawaii Ver)
const FeaturesSection = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <SectionHeader en="Features" ja="推し活専用の最強機能" color="purple" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 h-auto md:h-[800px]">
          {/* Main Feature: Crowdfunding Logic */}
          <div className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-[40px] p-10 flex flex-col relative overflow-hidden group hover:border-purple-200 transition-colors">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
              <CreditCard size={200} />
            </div>
            <div className="relative z-10">
              <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-xs font-bold mb-4 inline-block">CORE SYSTEM</span>
              <h3 className="text-3xl font-bold text-slate-800 mb-4">選べる2つの開催方式</h3>
              <p className="text-slate-600 mb-8 max-w-md">
                企画の規模や確実性に合わせて、クラウドファンディングの方式を選択できます。
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Zap size={18} className="text-yellow-500"/> All-in 方式</h4>
                  <p className="text-xs text-slate-500">目標金額に届かなくても、集まった分だけで実施。少額でも必ず贈りたい時に。</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><TargetIcon size={18} className="text-red-500"/> All-or-Nothing</h4>
                  <p className="text-xs text-slate-500">目標達成時のみ実施。未達なら全額返金。豪華なフラスタを目指す時に。</p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Community */}
          <div className="bg-sky-50 rounded-[40px] p-8 relative overflow-hidden group">
            <MessageCircle className="text-sky-200 absolute -bottom-4 -right-4 w-32 h-32 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">参加者限定チャット</h3>
            <p className="text-sm text-slate-600">
              企画参加者だけの秘密の会議室。<br/>
              サプライズの相談もSNSでバレずに進行可能。
            </p>
          </div>

          {/* Feature 3: Matching */}
          <div className="bg-pink-50 rounded-[40px] p-8 relative overflow-hidden group">
            <Flower className="text-pink-200 absolute -bottom-4 -right-4 w-32 h-32 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">花屋マッチング</h3>
            <p className="text-sm text-slate-600">
              オタク文化に理解のある提携フローリストを検索。<br/>
              「痛い」オーダーもプロが形にします。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// 6. SAFETY: 安心・安全
const SafetySection = () => {
  return (
    <section className="py-20 bg-emerald-50 border-y border-emerald-100">
      <div className="container mx-auto px-6 text-center">
         <SectionHeader en="Trust & Safety" ja="お金のことだから、誠実に" color="green" desc="FLASTALは、すべてのファンが安心して利用できる環境づくりを最優先しています。" />
         
         <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm">
              <Lock className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">完全匿名配送</h3>
              <p className="text-sm text-slate-500">
                お花屋さんへの発注はFLASTALが代行。主催者の個人情報が店舗や第三者に渡ることはありません。
              </p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm">
              <CreditCard className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">安全な決済</h3>
              <p className="text-sm text-slate-500">
                世界基準のStripe決済を採用。クレジットカード情報はサーバーに保存されず、安全に処理されます。
              </p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">運営の審査制</h3>
              <p className="text-sm text-slate-500">
                すべての企画は公開前に運営スタッフが目視で審査。詐欺や不適切な企画を未然に防ぎます。
              </p>
            </div>
         </div>
      </div>
    </section>
  );
};

// 7. PARTNERS: フローリスト＆絵師紹介
const PartnerSection = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <SectionHeader en="Partners" ja="プロフェッショナルと共に" desc="あなたの「こだわり」を実現する、提携パートナーたち。" color="purple" />
        
        <div className="grid md:grid-cols-2 gap-12">
          {/* Florists */}
          <div>
            <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
              <Flower className="text-pink-500" /> 提携フラワーショップ
            </h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-pink-50 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden">
                    {/* Placeholder Avatar */}
                    <div className="w-full h-full bg-slate-300" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700">Flower Shop SAKURA</h4>
                    <p className="text-xs text-slate-500">東京・神奈川対応 / バルーン得意 / メンカラ再現◎</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-right">
              <Link href="/florists" className="text-sm text-pink-500 font-bold hover:underline">もっと見る →</Link>
            </div>
          </div>

          {/* Illustrators */}
          <div>
            <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
              <Palette className="text-sky-500" /> 提携イラストレーター
            </h3>
            <div className="space-y-4">
               {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-sky-50 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-slate-300" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700">ぽっぷコーン先生</h4>
                    <p className="text-xs text-slate-500">デフォルメキャラ / 納期2週間 / パネルデータ作成可</p>
                  </div>
                </div>
              ))}
            </div>
             <div className="mt-4 text-right">
              <Link href="/creators" className="text-sm text-sky-500 font-bold hover:underline">もっと見る →</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// 8. SHOWCASE: 成功事例カルーセル
const ShowcaseSection = () => {
  return (
    <section className="py-24 bg-slate-900 text-white overflow-hidden">
      <div className="container mx-auto px-6 mb-12">
        <h2 className="text-3xl font-bold text-center">SUCCESS STORIES</h2>
        <p className="text-center text-slate-400 mt-2">想いが形になった瞬間</p>
      </div>
      
      {/* 簡易的な横スクロール表示 */}
      <div className="flex gap-6 overflow-x-auto px-6 pb-8 snap-x">
        {[1,2,3,4,5].map((i) => (
          <div key={i} className="snap-center shrink-0 w-[300px] md:w-[400px] bg-slate-800 rounded-3xl overflow-hidden shadow-xl border border-slate-700">
             <div className="h-48 bg-slate-700 relative">
               <div className="absolute inset-0 flex items-center justify-center text-slate-600">Project Image</div>
               <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-2 py-1 rounded text-xs text-white">#VTuber</div>
             </div>
             <div className="p-6">
               <h3 className="font-bold text-lg mb-2">◯◯ちゃん生誕祭2025</h3>
               <div className="flex justify-between text-sm text-slate-400 mb-4">
                 <span>総額: ¥240,000</span>
                 <span>参加: 85人</span>
               </div>
               <p className="text-xs text-slate-500 line-clamp-2">
                 みんなの協力のおかげで、バルーンアーチ付きの特大フラスタを贈ることができました！本当にありがとうございます！
               </p>
             </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// 9. VOICES: ユーザーの声
const VoiceSection = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <SectionHeader en="Voices" ja="みんなの感想" color="pink" />
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-50 p-8 rounded-3xl relative">
            <div className="absolute -top-4 left-8 text-4xl">❝</div>
            <p className="text-slate-600 text-sm leading-relaxed mb-6 pt-4">
              初めての主催で不安でしたが、集金管理が自動なのでデザインの相談に集中できました。お花屋さんも紹介してもらえて助かりました！
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-200 rounded-full" />
              <div>
                <p className="font-bold text-sm text-slate-800">A.Sさん</p>
                <p className="text-xs text-slate-500">VTuberファン / 主催歴1回</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 p-8 rounded-3xl relative">
            <div className="absolute -top-4 left-8 text-4xl">❝</div>
            <p className="text-slate-600 text-sm leading-relaxed mb-6 pt-4">
              たった1000円からの支援でも、名前をパネルに載せてもらえて嬉しかったです。現地に行けなくても「推し活」に参加できた実感がありました。
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-200 rounded-full" />
              <div>
                <p className="font-bold text-sm text-slate-800">T.Kさん</p>
                <p className="text-xs text-slate-500">アイドルファン / 参加者</p>
              </div>
            </div>
          </div>
           <div className="bg-slate-50 p-8 rounded-3xl relative">
            <div className="absolute -top-4 left-8 text-4xl">❝</div>
            <p className="text-slate-600 text-sm leading-relaxed mb-6 pt-4">
              イラストのデータを共有する機能が便利でした。解像度の問題とかも事前にチェックしてくれたので、印刷も綺麗にいきました。
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-200 rounded-full" />
              <div>
                <p className="font-bold text-sm text-slate-800">M.Mさん</p>
                <p className="text-xs text-slate-500">声優ファン / 絵師依頼</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// 10. FLOW: 詳細な利用の流れ
const FlowDetailSection = () => {
  const steps = [
    { title: "企画作成", sub: "3分で完了", desc: "目標金額、贈りたい相手、イベント日を入力してページを作成。" },
    { title: "拡散・募集", sub: "SNS連携", desc: "Twitter(X)でURLをシェア。TwiPlaなどの募集サイトとの併用もOK。" },
    { title: "達成・発注", sub: "自動送金", desc: "目標金額が集まったら、FLASTAL経由でお花屋さんに正式発注。" },
    { title: "制作・納品", sub: "進捗共有", desc: "お花屋さんから完成写真が届きます。サイト上で参加者に報告！" }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="container mx-auto px-6">
        <SectionHeader en="Process" ja="ご利用の流れ" color="blue" />
        
        <div className="relative max-w-4xl mx-auto">
          {/* Vertical Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 -translate-x-1/2 hidden md:block" />
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 md:hidden" />

          {steps.map((step, i) => (
            <div key={i} className={cn("relative flex items-center mb-16 last:mb-0", i % 2 === 0 ? "md:justify-start" : "md:justify-end")}>
              {/* Center Dot */}
              <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-4 border-sky-400 z-10 flex items-center justify-center text-xs font-bold text-sky-500">
                {i + 1}
              </div>
              
              <div className={cn("bg-white p-6 rounded-2xl shadow-md border border-slate-100 w-[calc(100%-60px)] md:w-[45%] ml-12 md:ml-0", i % 2 === 0 ? "md:mr-12" : "md:ml-12")}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg text-slate-800">{step.title}</h3>
                  <span className="text-xs font-bold bg-sky-100 text-sky-600 px-2 py-1 rounded">{step.sub}</span>
                </div>
                <p className="text-sm text-slate-600">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// 11. FUTURE: アプリ連携予告 (Advanced)
const AppSection = () => {
  return (
    <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      <div className="container mx-auto px-6 text-center relative z-10">
        <span className="bg-white/10 text-white border border-white/20 px-3 py-1 rounded-full text-xs font-bold mb-6 inline-block backdrop-blur">COMING SOON</span>
        <h2 className="text-4xl md:text-5xl font-black mb-6">Mobile App Integration</h2>
        <p className="text-slate-400 max-w-xl mx-auto mb-12">
          スマホアプリで、もっと身近に。<br/>
          プッシュ通知で進捗を受け取ったり、ARで会場にフラスタを配置してみたり。<br/>
          FLASTALの進化は止まりません。
        </p>
        <div className="flex justify-center gap-4 opacity-50">
          <div className="w-12 h-12 bg-white/10 rounded-xl" />
          <div className="w-12 h-12 bg-white/10 rounded-xl" />
        </div>
      </div>
    </section>
  );
};

// 12. FAQ: よくある質問 (Expanded)
const FaqSection = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6 max-w-3xl">
        <SectionHeader en="Q&A" ja="よくある質問" color="green" />
        
        <div className="space-y-4">
          {[
            { q: "目標金額に届かなかったらどうなりますか？", a: "企画作成時に「All-in方式（集まった分だけで実施）」か「All-or-Nothing方式（全額返金して中止）」かを選べます。小規模でも実施したい場合はAll-inがおすすめです。" },
            { q: "お花屋さんは自分で探せますか？", a: "はい、FLASTALに登録されていないお花屋さんに依頼することも可能です。その場合、金銭の授受のみFLASTALを通す形になります。" },
            { q: "手数料はかかりますか？", a: "企画の作成は無料です。支援金が集まった場合のみ、決済手数料・システム利用料として合計10%が差し引かれます。" },
            { q: "匿名で支援できますか？", a: "はい、ハンドルネームでの支援が可能です。主催者に本名や住所が伝わることはありません。" },
            { q: "パネルのイラストはどうすればいいですか？", a: "ご自身で描くか、イラストレーター様に依頼してください。FLASTAL上で依頼できるクリエイター紹介機能もございます。" },
            { q: "当日、現地に行けなくても参加できますか？", a: "もちろんです！完成したフラスタの写真はサイト上で高画質で共有されます。遠方からの「魂の参加」もお待ちしています。" }
          ].map((item, i) => (
            <details key={i} className="group bg-slate-50 rounded-2xl p-6 border border-slate-100 cursor-pointer [&_summary::-webkit-details-marker]:hidden open:bg-white open:shadow-md transition-all">
              <summary className="flex items-center justify-between font-bold text-slate-800 list-none">
                <span className="flex items-center gap-3"><HelpCircle className="text-emerald-500 shrink-0" /> {item.q}</span>
                <ChevronDown className="text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-4 text-sm text-slate-600 pl-9 leading-relaxed">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

// 13. NEWS: お知らせ
const NewsSection = () => {
  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-6 max-w-4xl">
         <div className="flex justify-between items-end mb-8">
           <h2 className="text-2xl font-bold text-slate-800">News</h2>
           <Link href="/news" className="text-sm text-pink-500 font-bold">一覧を見る</Link>
         </div>
         <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 divide-y divide-slate-100">
           {[
             { date: "2025.12.20", cat: "Feature", title: "新機能「イラスト公募機能」をリリースしました" },
             { date: "2025.12.15", cat: "Event", title: "コミックマーケット107開催に伴うお花の受付について" },
             { date: "2025.12.01", cat: "Info", title: "年末年始のサポート対応について" },
           ].map((n, i) => (
             <div key={i} className="py-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-6 hover:bg-slate-50 transition-colors cursor-pointer rounded-lg px-2">
               <span className="text-slate-400 text-sm font-mono">{n.date}</span>
               <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold w-fit">{n.cat}</span>
               <span className="text-slate-700 font-medium hover:text-pink-500 transition-colors">{n.title}</span>
             </div>
           ))}
         </div>
      </div>
    </section>
  );
};

// 14. CONTACT & FINAL CTA: お問い合わせ＆行動喚起
const ContactAndCtaSection = () => {
  return (
    <section className="relative pt-24 pb-32 bg-white overflow-hidden">
      {/* Contact Area */}
      <div className="container mx-auto px-6 mb-32">
        <SectionHeader en="Contact" ja="お問い合わせ" color="blue" />
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <a href="mailto:support@flastal.jp" className="group bg-sky-50 p-8 rounded-3xl border border-sky-100 text-center hover:shadow-lg transition-all">
            <Mail className="mx-auto text-sky-500 mb-4 group-hover:scale-110 transition-transform" size={40} />
            <h3 className="font-bold text-slate-800 text-xl mb-2">ユーザー・主催者の方</h3>
            <p className="text-sm text-slate-500">企画の立て方や利用トラブルについて</p>
          </a>
          <a href="mailto:business@flastal.jp" className="group bg-pink-50 p-8 rounded-3xl border border-pink-100 text-center hover:shadow-lg transition-all">
            <Gift className="mx-auto text-pink-500 mb-4 group-hover:scale-110 transition-transform" size={40} />
            <h3 className="font-bold text-slate-800 text-xl mb-2">お花屋さん・法人の方</h3>
            <p className="text-sm text-slate-500">加盟店登録や提携について</p>
          </a>
        </div>
      </div>

      {/* Final CTA */}
      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 rounded-[50px] p-12 md:p-20 text-white shadow-2xl shadow-pink-200 relative overflow-hidden">
          {/* Deco */}
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
          <FloatingShape color="bg-white" top="-20%" right="-10%" size={300} />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
              さあ、推しへの愛を<br/>
              形にしよう。
            </h2>
            <p className="text-pink-100 text-lg mb-12 max-w-xl mx-auto">
              企画の作成は無料です。<br/>
              あなたの「やりたい」という気持ちが、誰かの勇気になります。
            </p>
            <Link href="/create">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-pink-600 px-16 py-6 rounded-full text-2xl font-bold shadow-xl hover:shadow-2xl transition-all"
              >
                今すぐ始める
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Footer ---
const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white pt-24 pb-12 border-t border-slate-800">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-3xl font-bold mb-6 font-mono tracking-tighter text-pink-500">FLASTAL</h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              推し活特化型クラウドファンディング。<br/>
              ファンと推し、そしてお花屋さんを繋ぎ、<br/>
              世界にもっと「感動」を咲かせます。
            </p>
            <div className="flex gap-4 mt-6">
              {/* SNS Icons Mock */}
              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-pink-500 transition-colors cursor-pointer">X</div>
              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-pink-500 transition-colors cursor-pointer">Ig</div>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-white border-b border-slate-700 pb-2 inline-block">Platform</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><Link href="/projects" className="hover:text-pink-400 transition-colors">企画を探す</Link></li>
              <li><Link href="/create" className="hover:text-pink-400 transition-colors">企画を立てる</Link></li>
              <li><Link href="/florists" className="hover:text-pink-400 transition-colors">提携花屋一覧</Link></li>
              <li><Link href="/creators" className="hover:text-pink-400 transition-colors">提携絵師一覧</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-white border-b border-slate-700 pb-2 inline-block">Company</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><Link href="/about" className="hover:text-pink-400 transition-colors">運営会社</Link></li>
              <li><Link href="/terms" className="hover:text-pink-400 transition-colors">利用規約</Link></li>
              <li><Link href="/privacy" className="hover:text-pink-400 transition-colors">プライバシーポリシー</Link></li>
              <li><Link href="/tokusho" className="hover:text-pink-400 transition-colors">特商法に基づく表記</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© 2025 FLASTAL Inc. All rights reserved.</p>
          <div className="flex gap-4">
             <span>Made with ❤️ in Tokyo</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

// ------------------------------------
// Target Icon Component (Simple SVG)
// ------------------------------------
const TargetIcon = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);


// --- 👑 MAIN EXPORT ---
export default function HomePageContent() {
  return (
    <div className="bg-white min-h-screen text-slate-800 font-sans selection:bg-pink-100 selection:text-pink-600 overflow-x-hidden">
      <HeroSection />
      <TickerSection />
      <ProblemSection />
      <CultureSection />
      <FeaturesSection />
      <SafetySection />
      <PartnerSection />
      <ShowcaseSection />
      <VoiceSection />
      <FlowDetailSection />
      <AppSection />
      <FaqSection />
      <NewsSection />
      <ContactAndCtaSection />
      <Footer />
    </div>
  );
}