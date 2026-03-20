'use client';

// Next.js 15 のビルドエラーを確実に回避
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from './contexts/AuthContext';
import Image from 'next/image';
import { 
  motion, useScroll, useSpring, AnimatePresence
} from 'framer-motion';

import { 
  Heart, Sparkles, ShieldCheck, ChevronDown, 
  Star, HelpCircle, ArrowRight, Search, Users,
  Flower, CreditCard, Lock, Loader2, PlusCircle, Gift, 
  MessageCircle, Clock, Award, PenTool, Video, Music, MapPin, Store
} from 'lucide-react';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const JpText = ({ children, className }) => (
  <span className={cn("inline-block", className)}>{children}</span>
);

// ==========================================
// 🎨 ANIMATION & MAGIC UI COMPONENTS
// ==========================================

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-400 via-purple-400 to-sky-400 origin-left z-[100]" style={{ scaleX }} />;
};

const Reveal = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-10%" }}
    transition={{ duration: 0.7, delay, type: "spring", bounce: 0.2 }}
    className={className}
  >
    {children}
  </motion.div>
);

const SectionTitle = ({ en, ja, desc, color = "pink", align = "center", icon: Icon }) => {
  const colors = {
    pink: "text-pink-500 bg-pink-50 border-pink-100",
    sky: "text-sky-500 bg-sky-50 border-sky-100",
    purple: "text-purple-500 bg-purple-50 border-purple-100",
    emerald: "text-emerald-500 bg-emerald-50 border-emerald-100",
  };
  return (
    <div className={cn("mb-12 md:mb-16 px-4 relative z-10", align === "center" ? "text-center" : "text-left")}>
      <Reveal>
        <span className={cn("inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md border shadow-sm mb-4", 
          "font-mono text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase", colors[color])}>
          {Icon ? <Icon size={14} /> : <Sparkles size={14} />} {en}
        </span>
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-slate-800 mb-6 tracking-tighter leading-tight">
          {ja}
        </h2>
        {desc && <p className="text-slate-500 max-w-2xl text-xs md:text-sm font-medium leading-relaxed mt-4" style={align === "center" ? {margin: "0 auto"} : {}}><JpText>{desc}</JpText></p>}
      </Reveal>
    </div>
  );
};

const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2rem]", className)}>
    {children}
  </div>
);

// 背景のふわふわ浮かぶパーティクル（透明感・可愛さ）
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-3 h-3 bg-pink-300 rounded-full mix-blend-multiply filter blur-[1px] opacity-30"
        initial={{
          x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
          y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
        }}
        animate={{
          y: [null, Math.random() * -200],
          x: [null, (Math.random() - 0.5) * 100],
          opacity: [0.2, 0.5, 0.2],
          scale: [1, 1.5, 1],
        }}
        transition={{
          duration: Math.random() * 10 + 10,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    ))}
  </div>
);

// --- 🌸 CUSTOM SVG ILLUSTRATIONS ---
const SvgFlowerStand = ({ className }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M30 90L45 50H55L70 90H30Z" fill="url(#standGrad)" opacity="0.8"/>
    <path d="M50 50L50 20" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round"/>
    <circle cx="50" cy="30" r="25" fill="url(#flowerGrad)"/>
    <circle cx="40" cy="25" r="8" fill="#FFF" opacity="0.6"/>
    <circle cx="60" cy="35" r="6" fill="#FFF" opacity="0.5"/>
    <circle cx="50" cy="30" r="10" fill="#FBBF24"/>
    <defs>
      <linearGradient id="standGrad" x1="50" y1="50" x2="50" y2="90" gradientUnits="userSpaceOnUse">
        <stop stopColor="#CBD5E1" />
        <stop offset="1" stopColor="#94A3B8" />
      </linearGradient>
      <linearGradient id="flowerGrad" x1="25" y1="5" x2="75" y2="55" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F472B6" />
        <stop offset="1" stopColor="#FB7185" />
      </linearGradient>
    </defs>
  </svg>
);

const SvgBouquet = ({ className }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M20 20C40 0 60 0 80 20C100 40 100 60 80 80C60 100 40 100 20 80C0 60 0 40 20 20Z" fill="url(#bouquetGrad)" opacity="0.2"/>
    <path d="M35 75L50 95L65 75" fill="#E2E8F0"/>
    <circle cx="40" cy="40" r="15" fill="#F472B6"/>
    <circle cx="60" cy="40" r="15" fill="#60A5FA"/>
    <circle cx="50" cy="55" r="15" fill="#A78BFA"/>
    <circle cx="50" cy="45" r="8" fill="#FBBF24"/>
    <defs>
      <linearGradient id="bouquetGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FBCFE8" />
        <stop offset="1" stopColor="#BAE6FD" />
      </linearGradient>
    </defs>
  </svg>
);

const SvgPanel = ({ className }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="15" y="15" width="70" height="70" rx="8" fill="url(#panelGrad)" stroke="#F87171" strokeWidth="2"/>
    <circle cx="50" cy="45" r="15" fill="#FFF" opacity="0.8"/>
    <path d="M30 75C30 65 40 60 50 60C60 60 70 65 70 75" stroke="#FFF" strokeWidth="6" strokeLinecap="round"/>
    <path d="M25 25L35 35M75 25L65 35" stroke="#F87171" strokeWidth="2" strokeLinecap="round"/>
    <defs>
      <linearGradient id="panelGrad" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FECACA" />
        <stop offset="1" stopColor="#FCA5A5" />
      </linearGradient>
    </defs>
  </svg>
);

// ==========================================
// 📊 DUMMY DATA (実在の名称を使用しないモック)
// ==========================================

const CATEGORIES = [
  { id: 'idol', name: 'アイドル', icon: <Music size={16}/>, color: 'from-pink-400 to-rose-400', shadow: 'shadow-pink-200' },
  { id: 'vtuber', name: 'VTuber', icon: <Video size={16}/>, color: 'from-sky-400 to-blue-400', shadow: 'shadow-sky-200' },
  { id: 'voice', name: '声優・役者', icon: <MessageCircle size={16}/>, color: 'from-amber-400 to-orange-400', shadow: 'shadow-amber-200' },
  { id: 'stage', name: '舞台・演劇', icon: <Users size={16}/>, color: 'from-purple-400 to-indigo-400', shadow: 'shadow-purple-200' },
  { id: 'anime', name: 'アニメ・漫画', icon: <PenTool size={16}/>, color: 'from-emerald-400 to-teal-400', shadow: 'shadow-emerald-200' },
];

const DUMMY_PROJECTS = [
  {
    id: "proj_1",
    title: "【祝・5周年】大好きなあのグループへ、アリーナ公演お祝いフラスタを贈ろう！",
    category: "アイドル",
    organizer: "ファン有志一同",
    targetAmount: 200000,
    currentAmount: 245000,
    supporters: 128,
    daysLeft: 3,
    status: "SUCCESS",
    imgUrl: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=800&auto=format&fit=crop",
    tags: ["フラスタ", "連結", "バルーン"]
  },
  {
    id: "proj_2",
    title: "〇〇ちゃん お誕生日おめでとう！3Dライブ配信に向けたお祝い花＆メッセージ企画",
    category: "VTuber",
    organizer: "〇〇組",
    targetAmount: 150000,
    currentAmount: 85000,
    supporters: 42,
    daysLeft: 12,
    status: "FUNDING",
    imgUrl: "https://images.unsplash.com/photo-1519378018457-4c29a3a2ecdf?q=80&w=800&auto=format&fit=crop",
    tags: ["イラストパネル", "楽屋花"]
  },
  {
    id: "proj_3",
    title: "主演舞台『魔法の王国』ご出演祝い！千秋楽を彩るフラワースタンド計画",
    category: "舞台・演劇",
    organizer: "舞台応援委員会",
    targetAmount: 80000,
    currentAmount: 32000,
    supporters: 15,
    daysLeft: 20,
    status: "FUNDING",
    imgUrl: "https://images.unsplash.com/photo-1523690132227-ec1789725f44?q=80&w=800&auto=format&fit=crop",
    tags: ["フラスタ", "劇場装飾"]
  },
  {
    id: "proj_4",
    title: "念願のファンミーティング開催記念！会場ロビーをお花でいっぱいにしようプロジェクト",
    category: "声優・役者",
    organizer: "A.S",
    targetAmount: 100000,
    currentAmount: 110000,
    supporters: 55,
    daysLeft: 0,
    status: "COMPLETED",
    imgUrl: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=800&auto=format&fit=crop",
    tags: ["フラスタ", "達成御礼"]
  }
];

const VOICES = [
  {
    role: "主催者",
    name: "初めてのフラスタ主催・Mさん",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
    text: "ずっと推しにお花を出してみたかったのですが、お金の管理が不安で踏み出せませんでした。FLASTALなら集金もクレジットカードで自動ですし、参加者名簿も一目でわかるので本当に助かりました！無事にお花を届けることができて大号泣です😭",
    color: "pink"
  },
  {
    role: "参加者",
    name: "地方在住ファン・Kさん",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
    text: "ライブの現場には遠くて行けないけれど、お花という形で推しにおめでとうを伝えられて嬉しかったです！1口1,000円から支援できるし、匿名で参加できるのも安心ポイントでした。サイト上で完成したお花の写真が見れた時は感動しました✨",
    color: "sky"
  },
  {
    role: "お花屋さん",
    name: "提携フローリスト",
    avatar: "https://images.unsplash.com/photo-1506863530036-1efed7c9a369?q=80&w=200&auto=format&fit=crop",
    text: "ファンの皆様の熱い想いが詰まったデザイン案を見るのが毎回楽しみです。システムを通じて予算が確保されている状態で正式に発注が来るため、未払いリスクがなく、私達も安心してお花づくりに専念できています。",
    color: "emerald"
  }
];

// ==========================================
// 🧩 SECTIONS
// ==========================================

// --- 1. HERO SECTION (FV) ---
const HeroSection = () => (
  <section className="relative w-full min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-pink-50/80 to-white px-4 md:px-6 pt-20 pb-12">
    <div className="absolute inset-0 bg-[radial-gradient(#fbcfe8_1px,transparent_1px)] [background-size:24px_24px] opacity-50 z-0" />
    <FloatingParticles />
    
    <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-pink-300/30 blur-[80px] rounded-full mix-blend-multiply pointer-events-none z-0" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-sky-200/30 blur-[80px] rounded-full mix-blend-multiply pointer-events-none z-0" />

    <div className="container relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
      <div className="text-center lg:text-left flex-1">
        <Reveal>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-pink-100 mb-6"
          >
            <span className="flex h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-[10px] md:text-xs font-bold text-pink-500 tracking-wider uppercase">ファン発 クラウドファンディング</span>
          </motion.div>
          
          <h1 className="text-3xl md:text-6xl lg:text-7xl font-black text-slate-800 leading-[1.2] mb-4 md:mb-6 tracking-tighter">
            想いを集めて、<br/>
            <span className="relative inline-block mt-2">
               <span className="absolute inset-0 bg-pink-200 -rotate-2 rounded-lg blur-sm opacity-40"></span>
               <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">とびきりのフラスタ</span>
            </span><br className="md:hidden"/>を贈ろう。
          </h1>
          
          <p className="text-xs md:text-base text-slate-500 mb-8 md:mb-10 leading-relaxed max-w-lg mx-auto lg:mx-0 font-medium">
            FLASTAL（フラスタル）は、推しへの「お祝い花」を<br className="hidden md:block"/>
            ファン同士で費用を出し合って贈れるサービスです。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start px-2 sm:px-0">
            <Link href="/projects/create" className="w-full sm:w-auto">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="w-full px-6 md:px-8 py-3.5 md:py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-black shadow-xl shadow-pink-200 flex items-center justify-center gap-2 text-sm md:text-lg"
              >
                <PlusCircle size={20} /> 企画を立てる
              </motion.button>
            </Link>
            <Link href="/projects" className="w-full sm:w-auto">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="w-full px-6 md:px-8 py-3.5 md:py-4 bg-white text-pink-500 border border-pink-200 rounded-full font-black shadow-sm flex items-center justify-center gap-2 text-sm md:text-lg"
              >
                <Search size={20} /> 企画を探す
              </motion.button>
            </Link>
          </div>
        </Reveal>
      </div>

      <div className="flex-1 w-full max-w-sm md:max-w-lg mx-auto relative aspect-square lg:aspect-auto lg:h-[500px]">
        <Reveal delay={0.2} className="w-full h-full">
          <div className="relative w-full h-full rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl rotate-2 border-8 border-white bg-slate-100 group">
            <Image src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1000" alt="Flasta" fill className="object-cover transition-transform duration-1000 group-hover:scale-105" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-pink-900/80 via-transparent to-transparent" />
            
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-4 md:top-6 left-4 md:left-6 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg flex items-center gap-2">
              <div className="bg-green-100 text-green-500 p-1.5 rounded-full"><Users size={12}/></div>
              <span className="text-[10px] md:text-xs font-bold text-slate-700">85人が参加中!</span>
            </motion.div>

            <div className="absolute bottom-6 md:bottom-8 left-6 right-6 text-white">
              <span className="bg-pink-500 px-2.5 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold mb-2 inline-block shadow-md">目標達成!</span>
              <h3 className="text-lg md:text-2xl font-bold leading-tight drop-shadow-md">星街すいせいさんへ<br/>銀河一のフラスタを！</h3>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  </section>
);

// --- 2. TICKER ---
const TickerSection = () => {
  const genres = ["#地下アイドル", "#VTuber", "#歌い手", "#コンカフェ", "#生誕祭", "#周年ライブ", "#e-Sports", "#K-POP", "#2.5次元"];
  return (
    <div className="bg-pink-500 py-3 md:py-4 overflow-hidden relative z-20 shadow-md">
      <motion.div className="flex gap-6 md:gap-12 whitespace-nowrap" animate={{ x: [0, -1000] }} transition={{ repeat: Infinity, duration: 35, ease: "linear" }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-6 md:gap-12">
            {genres.map((g, j) => (
              <span key={j} className="text-[10px] md:text-xs font-bold text-white flex items-center gap-1 md:gap-2 tracking-widest">
                <Star size={10} className="fill-yellow-300 text-yellow-300" /> {g}
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// --- 🌸 3. ABOUT FLASTAL (初心者向け図解) ---
const AboutSection = () => {
  return (
    <section className="py-20 md:py-32 bg-[#FAFAFC] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-sky-100/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-pink-100/40 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 max-w-6xl relative z-10">
        <SectionTitle 
          en="About" 
          ja={<span>みんなの「おめでとう」を、<br className="hidden md:block"/>大きなお花に。</span>}
          desc="「推しにフラスタを贈りたいけど、一人じゃ予算が厳しい…」「企画を立てたいけど、お金の管理が不安…」FLASTALは、そんなファンのためのクラウドファンディングプラットフォームです。"
          color="pink"
        />

        <div className="relative mt-10 md:mt-16 bg-white md:bg-slate-50 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 md:border border-slate-100 md:shadow-inner">
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 relative z-10">
            {[
              { step: 1, title: "企画を立ち上げる", icon: SvgPanel, text: "贈りたい相手やイベント、予算を決めて専用ページを作成。イラストパネルの募集も可能です。" },
              { step: 2, title: "支援を集める", icon: SvgBouquet, text: "URLをSNSでシェアして参加者を募集。1口1,000円から、クレジットカード等で匿名支援が可能。" },
              { step: 3, title: "お花を届ける", icon: SvgFlowerStand, text: "目標を達成したら、FLASTALが提携するプロのお花屋さんへシステム経由で発注し、会場へお届け！" },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.15}>
                <GlassCard className="p-6 md:p-8 text-center h-full flex flex-col relative overflow-hidden group">
                  <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 relative z-10 transform group-hover:scale-110 transition-transform duration-500">
                    <item.icon className="w-full h-full drop-shadow-sm md:drop-shadow-md" />
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-slate-800 mb-2 md:mb-4 relative z-10"><JpText>{item.title}</JpText></h3>
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium relative z-10"><JpText>{item.text}</JpText></p>
                  <div className="absolute top-2 right-4 md:top-4 md:right-6 text-4xl md:text-6xl font-black text-slate-100/50 font-serif italic z-0 select-none">
                    {item.step}
                  </div>
                </GlassCard>
              </Reveal>
            ))}
          </div>
          {/* PC用の矢印 */}
          <div className="hidden md:block absolute top-1/2 left-[25%] right-[25%] -translate-y-1/2 -mt-8 pointer-events-none">
            <div className="w-full flex justify-between px-16">
              <ArrowRight size={32} className="text-slate-300" />
              <ArrowRight size={32} className="text-slate-300" />
            </div>
          </div>
        </div>

        {/* サブ：カテゴリー */}
        <div className="mt-16 md:mt-24">
          <p className="text-center text-xs md:text-sm font-bold text-slate-400 mb-6 uppercase tracking-widest">対応ジャンル</p>
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            {CATEGORIES.map((cat, i) => (
              <Reveal key={cat.id} delay={i * 0.05}>
                <div className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-3 rounded-full bg-white shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group">
                  <div className={cn("w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-white bg-gradient-to-br shadow-inner group-hover:scale-110 transition-transform", cat.color, cat.shadow)}>
                    {cat.icon}
                  </div>
                  <span className="font-bold text-slate-700 text-xs md:text-sm">{cat.name}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// --- 🌟 4. HOT PROJECTS (横スワイプ) ---
const HotProjectsSection = () => {
  const ProjectCardMini = ({ project, index }) => {
    const percent = Math.min(Math.round((project.currentAmount / project.targetAmount) * 100), 100);
    const isSuccess = percent >= 100;
    return (
      <Reveal delay={index * 0.1} className="h-full">
        <Link href={`/projects`} className="block group h-full">
          <GlassCard className="h-full flex flex-col overflow-hidden hover:-translate-y-2 transition-all duration-300 hover:border-pink-300 bg-white">
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
              <Image src={project.imgUrl} alt={project.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                <span className={cn("px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-md border shadow-sm", 
                  project.status === 'COMPLETED' ? "bg-slate-900/80 text-white border-slate-700" :
                  isSuccess ? "bg-emerald-500/90 text-white border-emerald-400" : "bg-pink-500/90 text-white border-pink-400"
                )}>
                  {project.status === 'COMPLETED' ? '終了' : isSuccess ? 'SUCCESS!' : '募集中'}
                </span>
              </div>
              <div className="absolute top-3 right-3">
                <span className="bg-white/90 backdrop-blur-md text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded border shadow-sm">{project.category}</span>
              </div>
              {project.status !== 'COMPLETED' && (
                <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white shadow-sm flex items-center gap-1">
                  <Clock size={10} className="text-pink-500" />
                  <span className="text-[9px] font-black text-slate-700">残り <span className="text-xs text-pink-500">{project.daysLeft}</span> 日</span>
                </div>
              )}
            </div>
            <div className="p-4 md:p-5 flex flex-col flex-grow bg-slate-50/50">
              <h3 className="font-bold text-sm md:text-base text-slate-800 leading-snug mb-3 group-hover:text-pink-500 transition-colors line-clamp-2"><JpText>{project.title}</JpText></h3>
              <div className="mt-auto">
                <div className="flex justify-between items-end mb-1.5">
                  <p className="text-sm font-black text-slate-800 leading-none">¥{project.currentAmount.toLocaleString()}</p>
                  <span className={cn("text-lg font-black font-mono leading-none", isSuccess ? "text-emerald-500" : "text-pink-500")}>{percent}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-3">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${percent}%` }} transition={{ duration: 1.5 }} className={cn("h-full rounded-full", isSuccess ? "bg-emerald-400" : "bg-gradient-to-r from-pink-400 to-rose-400")} />
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 truncate max-w-[100px]">{project.organizer}</span>
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-100 shadow-sm flex items-center gap-1"><Users size={10} className="text-sky-500"/> {project.supporters}人</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </Link>
      </Reveal>
    );
  };

  return (
    <section className="py-20 md:py-32 bg-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30" />
      <div className="container mx-auto px-0 md:px-6 max-w-7xl relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 md:mb-12 px-6 md:px-0 gap-4">
          <SectionTitle en="Projects" ja={<span className="text-white">注目の企画</span>} align="left" Icon={Heart} />
          <Link href="/projects" className="text-sm font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 group pb-6">
            すべての企画を見る <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-8 px-6 md:px-0 md:grid md:grid-cols-4 gap-4 md:gap-6">
          {DUMMY_PROJECTS.map((project, i) => (
            <div key={project.id} className="min-w-[80vw] sm:min-w-[300px] md:min-w-0 snap-center flex-shrink-0">
              <ProjectCardMini project={project} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- 🛡️ 5. FEATURES (悩みをゼロに) ---
const FeaturesSection = () => {
  return (
    <section className="py-20 md:py-32 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl relative z-10">
        <SectionTitle en="Why Choose Us" ja={<>お金のトラブルをゼロに。<br className="hidden md:block"/>推し活をもっと純粋に。</>} desc="個人情報の管理から集金催促まで、フラスタ企画の面倒な裏方はすべてFLASTALが引き受けます。" color="sky" align="center" Icon={ShieldCheck}/>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12 mt-12 md:mt-16">
          <Reveal delay={0.1}>
            <GlassCard className="bg-slate-50 border-slate-100 p-6 md:p-10 h-full">
              <div className="flex items-center gap-4 mb-6 md:mb-8">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-pink-100 rounded-[1rem] flex items-center justify-center text-pink-500 border border-pink-200 shadow-inner">
                  <Award size={24} />
                </div>
                <h3 className="text-lg md:text-2xl font-black text-slate-800">企画する人のメリット</h3>
              </div>
              <ul className="space-y-4 md:space-y-6">
                {[
                  { title: "集金・未払い管理が不要", desc: "銀行口座を教える必要なし。クレジットカード決済対応で未払いを防ぎます。" },
                  { title: "透明な収支報告", desc: "集まった金額と使用内訳をシステムが自動で可視化。信頼される企画運営が可能です。" },
                  { title: "神絵師への依頼も簡単", desc: "イラストパネルの作成をサイト内で絵師に直接依頼・決済できます。" }
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 md:gap-4">
                    <CheckCircle2 className="text-pink-400 shrink-0 mt-1" size={20} />
                    <div>
                      <p className="font-bold text-slate-800 mb-1 text-sm md:text-base">{item.title}</p>
                      <p className="text-slate-500 text-xs md:text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.2}>
            <GlassCard className="bg-slate-50 border-slate-100 p-6 md:p-10 h-full">
              <div className="flex items-center gap-4 mb-6 md:mb-8">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-sky-100 rounded-[1rem] flex items-center justify-center text-sky-500 border border-sky-200 shadow-inner">
                  <Heart size={24} />
                </div>
                <h3 className="text-lg md:text-2xl font-black text-slate-800">参加する人のメリット</h3>
              </div>
              <ul className="space-y-4 md:space-y-6">
                {[
                  { title: "完全匿名で安心", desc: "本名や住所の入力は不要。ハンドルネームだけで気軽にお祝いに参加できます。" },
                  { title: "1,000円から支援可能", desc: "少額からでも参加OK。みんなの力が合わさることで豪華なフラスタが実現します。" },
                  { title: "推しへのメッセージ", desc: "支援と同時にメッセージを送信。寄せ書きとして推しに届けることも可能です。" }
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 md:gap-4">
                    <CheckCircle2 className="text-sky-400 shrink-0 mt-1" size={20} />
                    <div>
                      <p className="font-bold text-slate-800 mb-1 text-sm md:text-base">{item.title}</p>
                      <p className="text-slate-500 text-xs md:text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

// --- 💬 6. VOICES (横スワイプ対応) ---
const VoiceSection = () => {
  return (
    <section className="py-20 md:py-32 bg-[#FAFAFC] relative overflow-hidden">
      <div className="container mx-auto max-w-6xl px-0 md:px-6">
        <SectionTitle en="Testimonials" ja="ご利用いただいた皆様の声" color="sky" Icon={MessageCircle} />

        <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-8 px-4 md:px-0 md:grid md:grid-cols-3 gap-4 md:gap-8 mt-8 md:mt-12">
          {VOICES.map((v, i) => (
            <div key={i} className="min-w-[85vw] sm:min-w-[300px] md:min-w-0 snap-center flex-shrink-0">
              <Reveal delay={i * 0.15} className="h-full">
                <GlassCard className="p-6 md:p-8 h-full relative group bg-white hover:-translate-y-2 transition-transform duration-300 shadow-sm border border-slate-100">
                  <div className="absolute top-4 right-6 opacity-10 text-slate-900 group-hover:text-pink-500 transition-colors">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21L16.411 14.502H10.457V3H21.543V14.502L18.423 21H14.017ZM3.56 21L5.954 14.502H0V3H11.086V14.502L7.966 21H3.56Z"/></svg>
                  </div>
                  <div className="flex items-center gap-4 mb-4 md:mb-6">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden relative shadow-md">
                      <Image src={v.avatar} alt="User" fill className="object-cover" />
                    </div>
                    <div>
                      <span className={cn("text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider", 
                        v.color === "pink" ? "bg-pink-100 text-pink-600" : 
                        v.color === "sky" ? "bg-sky-100 text-sky-600" : "bg-emerald-100 text-emerald-600"
                      )}>
                        {v.role}
                      </span>
                      <p className="font-bold text-slate-800 text-xs md:text-sm mt-1">{v.name}</p>
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium relative z-10">
                    <JpText>{v.text}</JpText>
                  </p>
                </GlassCard>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- 🤝 7. FOR PROFESSIONALS (プロ向けバナー) ---
const PartnerBanner = () => (
  <section className="py-12 md:py-20 mx-4 md:mx-auto max-w-6xl">
    <Reveal>
      <div className="bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 text-center relative overflow-hidden shadow-2xl border-4 border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,114,182,0.2),transparent)]" />
        
        <div className="relative z-10">
          <h2 className="text-xl md:text-3xl font-black text-white mb-3 md:mb-4">クリエイター・法人の皆様へ</h2>
          <p className="text-slate-400 text-xs md:text-sm mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed">
            FLASTALは、お花屋さん、ライブ会場、イベント主催者、イラストレーターの皆様と<br className="hidden md:block"/>
            ファンをつなぐ安全なエコシステムを提供します。初期費用・月額費用は無料です。
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 md:gap-4">
            {[
              { href: "/florists/register", label: "お花屋さん登録", icon: Flower },
              { href: "/venues/register", label: "会場・ホール登録", icon: MapPin },
              { href: "/illustrators/register", label: "イラストレーター登録", icon: PenTool },
            ].map((btn, i) => (
              <Link key={i} href={btn.href} className="px-5 py-3 md:px-6 md:py-3.5 bg-white/10 hover:bg-white text-white hover:text-slate-900 text-xs md:text-sm font-bold rounded-full border border-white/20 transition-all flex items-center justify-center gap-2 backdrop-blur-md">
                <btn.icon size={16} /> {btn.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Reveal>
  </section>
);

// --- ❓ 8. FAQ ---
const FaqMini = () => {
  const faqs = [
    { q: "目標金額に届かなかった場合はどうなりますか？", a: "企画作成時に「All-in（集まった金額だけで実施）」か「All-or-Nothing（未達なら全額返金して中止）」のどちらかを選ぶことができます。予算に合わせて柔軟に対応可能です。" },
    { q: "利用手数料はかかりますか？", a: "企画の立ち上げや支援は無料です。企画が達成し、集まった金額をお花屋さんへ支払う際（または引き出す際）に、システム・決済手数料として計10%を頂戴します。" },
    { q: "本名や住所を隠して参加（支援）できますか？", a: "はい、可能です。FLASTALでは参加者も主催者もハンドルネームで活動でき、お花屋さんへの配送情報などはシステムが安全に仲介するため、個人情報が漏れることはありません。" },
  ];

  return (
    <section id="faq" className="py-16 md:py-24 bg-white scroll-mt-20 relative">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl relative z-10">
        <SectionTitle en="FAQ" ja="よくある質問" color="emerald" align="center" Icon={HelpCircle} />
        <div className="space-y-3 md:space-y-4">
          {faqs.map((item, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <details className="group bg-slate-50 rounded-2xl md:rounded-[1.5rem] p-5 md:p-6 border border-slate-100 cursor-pointer hover:shadow-md transition-all outline-none">
                <summary className="flex items-center justify-between font-bold text-slate-800 list-none outline-none text-sm md:text-base">
                  <span className="flex items-center gap-2 md:gap-3"><HelpCircle className="text-emerald-500 shrink-0" size={18}/> <JpText>{item.q}</JpText></span>
                  <ChevronDown size={16} className="text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
                </summary>
                <div className="mt-3 md:mt-4 text-xs md:text-sm text-slate-500 pl-7 md:pl-8 leading-relaxed font-medium border-t border-slate-200 pt-3 md:pt-4"><JpText>{item.a}</JpText></div>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- 💌 9. CTA ---
const ContactAndCtaSection = () => (
  <section className="py-20 md:py-32 bg-gradient-to-b from-pink-50 to-white text-center px-4 md:px-6 relative overflow-hidden">
    <FloatingParticles />
    <Reveal className="relative z-10 max-w-4xl mx-auto">
      <motion.div 
        animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}
        className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-[0_8px_30px_rgba(244,114,182,0.3)] text-pink-500 border-4 border-pink-50"
      >
        <Heart size={32} fill="currentColor" className="md:w-10 md:h-10" />
      </motion.div>
      <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 md:mb-6 tracking-tighter text-slate-900 leading-tight">
        さあ、<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">推しへの愛</span>を<br className="md:hidden"/>形にしよう。
      </h2>
      <p className="text-xs md:text-base text-slate-500 mb-8 md:mb-12 font-medium max-w-xl mx-auto leading-relaxed">
        企画の作成は無料です。<br/>
        あなたの「お祝いしたい」という気持ちが、<br className="md:hidden"/>推しの笑顔と、ファン仲間の勇気になります。
      </p>
      <Link href="/projects/create" className="inline-block w-full sm:w-auto">
        <motion.button 
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 md:px-14 py-4 md:py-5 rounded-full text-base md:text-xl font-black shadow-xl flex items-center justify-center gap-2 md:gap-3 mx-auto"
        >
          <Sparkles size={20} /> 無料で企画を立ち上げる
        </motion.button>
      </Link>
    </Reveal>
  </section>
);

// --- 🏠 DASHBOARD WRAPPER ---
const AuthenticatedHome = ({ user, logout }) => (
  <div className="min-h-screen bg-gradient-to-br from-pink-50 to-sky-50 flex items-center justify-center p-4 md:p-6 m-0 relative overflow-hidden">
    <FloatingParticles />
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
      className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-[2rem] md:rounded-[3rem] shadow-2xl p-8 md:p-12 text-center border border-white relative z-10"
    >
      <div className="w-16 h-16 md:w-20 md:h-20 bg-pink-100 text-pink-500 rounded-[1rem] md:rounded-[1.5rem] rotate-3 flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-inner"><ShieldCheck size={32} /></div>
      <h1 className="text-xl md:text-2xl font-black text-slate-800 mb-2 tracking-tight">おかえりなさい！</h1>
      <p className="text-slate-400 mb-6 md:mb-8 font-bold text-[10px] md:text-xs uppercase tracking-widest">
        {user?.handleName || user?.shopName || 'MEMBER'} Signed In
      </p>
      <div className="space-y-3 md:space-y-4">
        <Link href={user?.role === 'ADMIN' ? '/admin' : user?.role === 'FLORIST' ? '/florists/dashboard' : '/mypage'} className="flex items-center justify-center gap-2 w-full py-3.5 md:py-4 bg-slate-900 text-white font-black rounded-xl md:rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200/50 text-sm">
          マイページへ進む <ArrowRight size={16} />
        </Link>
        <button onClick={logout} className="text-[10px] md:text-xs font-bold text-slate-400 hover:text-pink-500 transition-colors mt-2 md:mt-4 p-2 underline decoration-transparent hover:decoration-pink-500 underline-offset-4">ログアウト</button>
      </div>
    </motion.div>
  </div>
);

// ==========================================
// 👑 MAIN EXPORT
// ==========================================
export default function HomePage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted || loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-8 h-8 md:w-10 md:h-10 text-pink-500 animate-spin" /></div>;
  }

  if (isAuthenticated) {
    return <AuthenticatedHome user={user} logout={logout} />;
  }

  return (
    <div className="bg-white min-h-screen text-slate-800 font-sans selection:bg-pink-100 selection:text-pink-600 overflow-x-hidden">
      <ScrollProgress />
      <HeroSection />
      <TickerSection />
      <AboutSection />
      <HotProjectsSection />
      <FeaturesSection />
      <VoiceSection />
      <PartnerBanner />
      <FaqMini />
      <ContactAndCtaSection />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        body { text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; }
      `}</style>
    </div>
  );
}