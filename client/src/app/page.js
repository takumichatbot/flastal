// src/app/page.js
'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { useRouter } from 'next/navigation'; 
import { 
  motion, 
  useScroll, 
  useTransform, 
  AnimatePresence
} from 'framer-motion';

import { 
  Heart, Sparkles, ArrowRight, Search, Users,
  Gift, MessageCircle, Clock, Crown, PenTool, Video, Music, MapPin, Store,
  ArrowUpRight, Shield, Command, KeyRound, Building, Ticket, Loader2, Calendar
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);
  return isMounted;
}

// ==========================================
// 🪄 ANIMATION COMPONENTS (スピードUP & ポップ)
// ==========================================

const Reveal = ({ children, delay = 0, className = "" }) => {
  const isMounted = useIsMounted();
  if (!isMounted) return <div className={className}>{children}</div>;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true, margin: "-10%" }} 
      transition={{ duration: 0.5, delay, ease: "easeOut" }} // スピードUP
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Dribbble風の文字がボケながら1文字ずつフワッと出るアニメーション（日本語対応）
const SplitTextReveal = ({ text, className, delay = 0 }) => {
  const chars = Array.from(text); // 単語ではなく1文字ずつ分割する
  const isMounted = useIsMounted();

  const container = { 
    hidden: { opacity: 0 }, 
    visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: delay } } 
  };
  const child = { 
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: "easeOut" } }, 
    hidden: { opacity: 0, y: 15, filter: "blur(4px)" } 
  };

  if (!isMounted) return <div className={className}>{text}</div>;

  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      whileInView="visible" 
      viewport={{ once: true }} 
      // ★ whitespace-nowrap で強制的に1行にする
      className={cn("whitespace-nowrap", className)}
    >
      {chars.map((char, index) => (
        <motion.span variants={child} key={index} className="inline-block">
          {char}
        </motion.span>
      ))}
    </motion.div>
  );
};

// ==========================================
// 🎀 PARTICLES
// ==========================================
const EmojiParticle = ({ emoji, delay = 0, x = "0%", y = "0%", scale = 1 }) => {
  const isMounted = useIsMounted();
  if (!isMounted) return null;

  return (
    <motion.div
      className="absolute opacity-0 pointer-events-none drop-shadow-sm select-none"
      style={{ top: y, left: x, scale, fontSize: '2.5rem' }}
      animate={{ 
        opacity: [0, 0.9, 0.6, 0.9, 0],
        y: ["0px", "-30px", "-15px", "-30px", "-50px"],
        rotate: [0, 10, -10, 10, 0]
      }}
      transition={{ duration: 6, delay: delay, repeat: Infinity, ease: "easeInOut" }}
    >
      {emoji}
    </motion.div>
  );
};

const ButterflyParticle = ({ delay = 0, x = "0%", y = "0%", scale = 1, color = "text-pink-400" }) => {
  const isMounted = useIsMounted();
  if (!isMounted) return null;

  const yEnd = -100 - Math.random() * 50;
  const xOffset1 = 20 + Math.random() * 20;
  const xOffset2 = -20 - Math.random() * 20;

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-0 ${color}`}
      style={{ top: y, left: x, scale, filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))" }}
      animate={{ 
        opacity: [0, 0.8, 1, 0.8, 0],
        y: [0, yEnd * 0.25, yEnd * 0.5, yEnd * 0.75, yEnd],
        x: [0, xOffset1, xOffset2, xOffset1, 0],
        rotate: [-10, 10, -10, 10, -10]
      }}
      transition={{ duration: 7 + Math.random() * 3, delay: delay, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.div animate={{ scaleX: [1, 0.2, 1] }} transition={{ duration: 0.2 + Math.random() * 0.1, repeat: Infinity, ease: "linear" }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.5 12C11.5 12 10 4 3 5C3 5 4 11 11.5 12Z" />
          <path d="M11.5 12C11.5 12 9 18 4 19C4 19 7 14 11.5 12Z" />
          <path d="M12.5 12C12.5 12 14 4 21 5C21 5 20 11 12.5 12Z" />
          <path d="M12.5 12C12.5 12 15 18 20 19C20 19 17 14 12.5 12Z" />
        </svg>
      </motion.div>
    </motion.div>
  );
};

// ==========================================
// 📊 CATEGORIES
// ==========================================
const CATEGORIES = [
  { id: 'idol', name: 'Idol / Artist', jp: 'アイドル・アーティスト', icon: Music, color: 'text-pink-500', bg: 'bg-pink-100' },
  { id: 'vtuber', name: 'Virtual Creator', jp: 'VTuber・配信者', icon: Video, color: 'text-cyan-500', bg: 'bg-cyan-100' },
  { id: 'stage', name: 'Stage / Musical', jp: '舞台・ミュージカル', icon: Users, color: 'text-purple-500', bg: 'bg-purple-100' },
  { id: 'voice', name: 'Voice Actor', jp: '声優・役者', icon: MessageCircle, color: 'text-amber-500', bg: 'bg-amber-100' },
  { id: 'anime', name: 'Anime / Game', jp: 'アニメ・ゲームイベント', icon: Command, color: 'text-emerald-500', bg: 'bg-emerald-100' },
  { id: 'anniversary', name: 'Anniversary', jp: '生誕祭・周年記念', icon: Crown, color: 'text-rose-500', bg: 'bg-rose-100' },
];

// ==========================================
// 🚀 PAGE SECTIONS
// ==========================================

// --- 0. INTRO LOADER (レースのカーテン) ---
const IntroLoader = ({ onComplete }) => {
  useEffect(() => { 
    // サクッと開くように時間を短縮
    const timer = setTimeout(onComplete, 1000); 
    return () => clearTimeout(timer); 
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-none"
      initial={{ opacity: 1 }}
      exit={{ scale: 1.05, opacity: 0, filter: "blur(5px)", transition: { duration: 0.4, ease: "easeOut" } }}
    >
      <motion.div 
        className="absolute inset-y-0 left-0 w-1/2 bg-[#FFF5F8] shadow-[20px_0_50px_rgba(244,114,182,0.3)] z-10 origin-left"
        initial={{ x: 0, skewX: 0 }}
        animate={{ x: "-100%", skewX: -2 }} 
        transition={{ duration: 0.7, delay: 0.2, ease: [0.76, 0, 0.24, 1] }}
      >
        <div className="absolute top-0 bottom-0 -right-10 w-12 h-full drop-shadow-xl overflow-hidden text-[#FFF5F8]">
          <svg width="100%" height="100%" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="lace-left" x="0" y="0" width="48" height="60" patternUnits="userSpaceOnUse">
                <path d="M0,0 C24,0 48,15 48,30 C48,45 24,60 0,60 Z" fill="currentColor" />
                <circle cx="15" cy="30" r="5" fill="transparent" stroke="#FBCFE8" strokeWidth="2" />
                <circle cx="30" cy="30" r="3" fill="#FBCFE8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#lace-left)" />
          </svg>
        </div>
      </motion.div>

      <motion.div 
        className="absolute inset-y-0 right-0 w-1/2 bg-[#FFF5F8] shadow-[-20px_0_50px_rgba(244,114,182,0.3)] z-10 origin-right"
        initial={{ x: 0, skewX: 0 }}
        animate={{ x: "100%", skewX: 2 }} 
        transition={{ duration: 0.7, delay: 0.2, ease: [0.76, 0, 0.24, 1] }}
      >
        <div className="absolute top-0 bottom-0 -left-10 w-12 h-full drop-shadow-xl overflow-hidden text-[#FFF5F8]">
          <svg width="100%" height="100%" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="lace-right" x="0" y="0" width="48" height="60" patternUnits="userSpaceOnUse">
                <path d="M48,0 C24,0 0,15 0,30 C0,45 24,60 48,60 Z" fill="currentColor" />
                <circle cx="33" cy="30" r="5" fill="transparent" stroke="#FBCFE8" strokeWidth="2" />
                <circle cx="18" cy="30" r="3" fill="#FBCFE8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#lace-right)" />
          </svg>
        </div>
      </motion.div>

      <motion.div 
        className="absolute z-20 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.9, y: 10 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <span className="font-calligraphy text-4xl text-pink-400 mb-2 drop-shadow-sm">Welcome to</span>
        <h1 className="text-5xl md:text-7xl font-black text-pink-500 tracking-[0.2em] font-serif-jp drop-shadow-md">
          FLASTAL
        </h1>
        <motion.div 
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.4, delay: 0.1 }} 
          className="w-full h-px bg-pink-300 mt-4 origin-center" 
        />
      </motion.div>
    </motion.div>
  );
};

// --- パララックス付き背景 ---
const SoftBackground = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 2000], [0, -150]);
  const y2 = useTransform(scrollY, [0, 2000], [0, 100]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#FFFDFE]">
      <motion.div style={{ y: y1 }} className="absolute -top-[10%] -left-[5%] w-[80vw] h-[80vw] rounded-full bg-pink-100/50 blur-[80px]" />
      <motion.div style={{ y: y2 }} className="absolute top-[30%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-amber-50/50 blur-[80px]" />
      
      {[...Array(5)].map((_, i) => {
        const colors = ["text-pink-300", "text-sky-300", "text-amber-300", "text-rose-300"];
        return (
          <ButterflyParticle 
            key={`bf-${i}`}
            x={`${Math.random() * 90}%`}
            y={`${Math.random() * 100}%`}
            delay={Math.random() * 5}
            scale={0.5 + Math.random() * 0.6}
            color={colors[i % colors.length]}
          />
        );
      })}
    </div>
  );
};

// --- メインコンテンツ ---
const MainContent = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }} // フェードインを速く
    >
      <SoftBackground />
      <Hero />
      <InfiniteMarquee />
      <HowItWorks />
      <TrendingProjects />
      <BentoFeatures />
      <CategoryGrid />
      <ArticlesSection />
      <PartnerCTA />
    </motion.div>
  );
}

// --- 1. HERO SECTION (脱AI・雑誌レイアウト) ---
const Hero = () => {
  return (
    <section className="relative w-full min-h-[90svh] flex items-center justify-center overflow-hidden pt-28 pb-12 z-10 bg-[#FFFDFE]/50">
      
      {/* 優しい装飾 */}
      <ButterflyParticle x="10%" y="20%" scale={1.2} delay={0} color="text-pink-400" />
      <ButterflyParticle x="90%" y="75%" scale={1} delay={2} color="text-amber-400" />

      <div className="container relative z-10 max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* 左：テキストエリア */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
            <Reveal delay={0}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-pink-200 bg-pink-50 mb-6 text-pink-500 shadow-sm">
                <Sparkles size={14} />
                <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase">ファン同士で贈る、フラスタ・クラウドファンディング</span>
              </div>
            </Reveal>

            {/* タイトル：雑誌やポスターのような組み方 */}
            <div className="mb-6 flex flex-col items-center lg:items-start">
              <Reveal delay={0.1}>
                <span className="font-calligraphy text-4xl sm:text-5xl lg:text-6xl text-rose-300 -mb-4 block drop-shadow-sm ml-4 lg:ml-0">
                  To your favorite
                </span>
              </Reveal>
              <SplitTextReveal 
                text="世界でひとつのお花を。" 
                className="text-[1.75rem] sm:text-5xl md:text-6xl lg:text-[4.2rem] font-black text-slate-800 tracking-tighter leading-tight" 
                delay={0.15} 
              />
            </div>
            
            <Reveal delay={0.3}>
              <p className="text-sm md:text-base text-slate-500 max-w-xl leading-relaxed font-bold mb-10">
                推しの特別な日を、みんなの愛で彩ろう。<br className="hidden sm:block"/>
                FLASTALはお金の管理や会場の確認など、面倒な裏方をすべてサポート。仲間を集めて、最高のお祝いを届けませんか？
              </p>
            </Reveal>

            {/* ネオ・ブルータリズム風のポップなボタン */}
            <Reveal delay={0.4} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 w-full sm:w-auto">
              <Link href="/projects/create" className="w-full sm:w-auto block">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto px-8 py-4 bg-pink-500 text-white rounded-2xl font-black text-sm md:text-base shadow-[4px_4px_0px_rgba(244,114,182,0.3)] hover:shadow-[2px_2px_0px_rgba(244,114,182,0.3)] hover:translate-y-[2px] hover:translate-x-[2px] transition-all flex items-center justify-center gap-2"
                >
                  <Crown size={18} /> 企画を立ち上げる
                </motion.button>
              </Link>
              
              <Link href="/projects" className="w-full sm:w-auto block">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 rounded-2xl font-black text-sm md:text-base border-2 border-slate-200 hover:border-pink-300 shadow-[4px_4px_0px_rgba(226,232,240,1)] hover:shadow-[2px_2px_0px_rgba(244,114,182,0.3)] hover:translate-y-[2px] hover:translate-x-[2px] transition-all flex items-center justify-center gap-2"
                >
                  <Search size={18} className="text-slate-400" /> 参加する企画を探す
                </motion.button>
              </Link>
            </Reveal>
          </div>

          {/* 右：コラージュ風ビジュアル（SaaS感をなくす） */}
          <div className="lg:col-span-5 relative w-full h-[400px] lg:h-[500px] hidden md:block mt-10 lg:mt-0 perspective-1000">
             
             {/* ポラロイド風カード 1 */}
             <motion.div 
               initial={{ opacity: 0, rotate: -15, x: -30, y: 30 }}
               animate={{ opacity: 1, rotate: -8, x: 0, y: 0 }}
               transition={{ duration: 0.8, delay: 0.3, type: "spring", bounce: 0.4 }}
               className="absolute top-[10%] left-[5%] w-48 h-56 bg-white p-3 pb-8 rounded-xl shadow-xl border border-slate-100 z-10 cursor-pointer"
               whileHover={{ scale: 1.05, rotate: 0, zIndex: 30 }}
             >
                <div className="w-full h-full bg-sky-100 rounded-lg flex items-center justify-center border border-sky-200">
                   <span className="text-5xl drop-shadow-md">💐</span>
                </div>
                <p className="font-calligraphy text-center mt-3 text-slate-500 text-sm">Happy Anniversary!</p>
             </motion.div>

             {/* ポラロイド風カード 2 */}
             <motion.div 
               initial={{ opacity: 0, rotate: 20, x: 30, y: -30 }}
               animate={{ opacity: 1, rotate: 10, x: 0, y: 0 }}
               transition={{ duration: 0.8, delay: 0.4, type: "spring", bounce: 0.4 }}
               className="absolute top-[20%] right-[5%] w-56 h-64 bg-white p-3 pb-10 rounded-xl shadow-2xl border border-slate-100 z-20 cursor-pointer"
               whileHover={{ scale: 1.05, rotate: 0, zIndex: 30 }}
             >
                <div className="w-full h-full bg-pink-100 rounded-lg flex items-center justify-center border border-pink-200">
                   <span className="text-6xl drop-shadow-md">💖</span>
                </div>
                <p className="font-calligraphy text-center mt-4 text-pink-500 text-lg">Thank you</p>
             </motion.div>

             {/* チケット風カード */}
             <motion.div 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.6, type: "spring", bounce: 0.4 }}
               className="absolute bottom-[5%] left-[20%] w-64 h-24 bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl shadow-[0_10px_30px_rgba(245,158,11,0.2)] border-2 border-white z-30 flex items-center p-4 cursor-pointer"
               whileHover={{ scale: 1.05, y: -5 }}
             >
                <div className="border-r-2 border-dashed border-amber-300 pr-4 mr-4">
                  <Ticket className="text-amber-500" size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-widest uppercase text-amber-500 mb-0.5">Live Event</p>
                  <p className="font-black text-slate-800 text-sm">フラスタ受付完了 🎉</p>
                </div>
             </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
};

// --- 2. INFINITE MARQUEE ---
const InfiniteMarquee = () => {
  const words = ["IDOL", "VTUBER", "STAGE", "VOICE ACTOR", "ANIME", "ANNIVERSARY"];
  return (
    <div className="py-5 md:py-6 bg-pink-400 overflow-hidden flex whitespace-nowrap relative z-20 shadow-inner">
      <div className="flex items-center gap-6 md:gap-12 animate-marquee">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-6 md:gap-12">
            {words.map((word, j) => (
              <React.Fragment key={j}>
                <span className="text-xl md:text-3xl font-black text-white tracking-widest">
                  {word}
                </span>
                <Heart size={20} className="text-pink-200 mx-2" fill="currentColor" />
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
      <style jsx global>{`
        .animate-marquee { animation: marquee 25s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
      `}</style>
    </div>
  );
};

// --- 3. HOW IT WORKS ---
const HowItWorks = () => {
  const steps = [
    { num: "1", title: "企画ページをつくる", desc: "イベントの日程や会場、贈りたいお花のイメージを入力してページを公開します。", icon: PenTool, color: "text-amber-500", bg: "bg-amber-100" },
    { num: "2", title: "SNSでシェアして集金", desc: "みんなでお金を出し合います。クレジットカード対応で、面倒な口座管理は不要です。", icon: Heart, color: "text-pink-500", bg: "bg-pink-100" },
    { num: "3", title: "お花屋さんがお届け", desc: "目標達成後、提携のプロのお花屋さんが制作し、直接会場へお届けします。", icon: Gift, color: "text-sky-500", bg: "bg-sky-100" },
  ];

  return (
    <section className="py-20 md:py-28 bg-white relative z-10">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl relative z-10">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter">フラスタが届くまで</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
          <div className="absolute top-10 left-1/6 right-1/6 h-1 bg-slate-100 hidden md:block -z-10" />

          {steps.map((step, i) => (
            <Reveal key={i} delay={i * 0.1} className="relative flex flex-col items-center text-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-5 shadow-sm relative z-10", step.bg, step.color)}>
                <step.icon size={32} strokeWidth={2} />
              </motion.div>
              <div className="bg-slate-100 text-slate-500 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm mb-4">
                {step.num}
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-3">{step.title}</h3>
              <p className="text-sm text-slate-600 font-bold leading-relaxed">{step.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- 4. TRENDING PROJECTS ---
const TrendingProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API_URL}/api/projects?limit=8`);
        if (res.ok) {
          const data = await res.json();
          const projectsArray = Array.isArray(data) ? data : (data?.projects || []);
          const activeProjects = projectsArray.filter(p => p?.status === 'FUNDRAISING' || p?.status === 'SUCCESSFUL');
          setProjects(activeProjects.slice(0, 4));
        }
      } catch (error) {
        console.error("Failed to fetch trending projects", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <section className="py-20 md:py-28 bg-[#FAF9FF] relative z-10 border-t border-slate-100">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter">注目の企画</h2>
            <p className="text-slate-500 font-bold mt-2 text-sm">みんなで応援中の素敵な企画をチェック！</p>
          </div>
          <Link href="/projects" className="hidden md:block">
            <motion.button whileHover={{ scale: 1.05 }} className="px-6 py-3 rounded-full bg-white border border-slate-200 text-sm font-black text-slate-600 hover:border-pink-300 hover:text-pink-500 transition-colors flex items-center gap-2 shadow-sm">
              すべての企画を見る <ArrowRight size={16}/>
            </motion.button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 text-pink-400 animate-spin" />
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {projects.filter(p => p?.visibility !== 'UNLISTED' && p?.isVisible !== false).map((project, i) => {
              const percent = Math.min(Math.round(((project?.collectedAmount || 0) / (project?.targetAmount || 1)) * 100), 100);
              const isSuccess = percent >= 100 || project?.status === 'SUCCESSFUL' || project?.status === 'COMPLETED';
              const badgeLabel = project?.status === 'COMPLETED' ? '完了' : isSuccess ? '達成!' : '募集中';
              const badgeColor = project?.status === 'COMPLETED' ? 'bg-purple-500' : isSuccess ? 'bg-emerald-500' : 'bg-pink-500';

              return (
                <Reveal key={project?.id || i} delay={i * 0.1}>
                  <motion.div 
                    whileHover={{ y: -8, scale: 1.02 }} 
                    transition={{ duration: 0.3 }}
                    onClick={() => router.push(`/projects/${project.id}`)} 
                    className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl cursor-pointer h-full flex flex-col group"
                  >
                    <div className="relative w-full aspect-square bg-slate-100 shrink-0 overflow-hidden">
                      {project?.imageUrl ? (
                        <Image src={project.imageUrl} alt={project?.title || "企画画像"} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="absolute inset-0 bg-pink-50 flex items-center justify-center text-4xl">💐</div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className={cn("px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-sm", badgeColor)}>
                          {badgeLabel}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="font-black text-slate-800 text-sm leading-snug group-hover:text-pink-500 transition-colors line-clamp-2 mb-3">
                        {project?.title}
                      </h3>
                      
                      <div className="mt-auto pt-3 border-t border-slate-50">
                        <div className="flex justify-between items-end mb-2">
                          <p className="text-sm font-black text-slate-800">
                            ¥{(project?.collectedAmount || 0).toLocaleString()}
                          </p>
                          <span className={cn("text-lg font-black leading-none", isSuccess ? "text-emerald-500" : "text-pink-500")}>
                            {percent}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} whileInView={{ width: `${percent}%` }} transition={{ duration: 1.5, delay: 0.2 }}
                            className={cn("h-full rounded-full", isSuccess ? "bg-emerald-400" : "bg-pink-400")} 
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Reveal>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400 font-bold bg-white rounded-3xl border border-slate-100">
            現在表示できる注目の企画がありません。
          </div>
        )}
        
        <Link href="/projects" className="md:hidden flex justify-center mt-6">
          <button className="px-6 py-3 w-full rounded-xl border border-slate-200 text-sm font-black text-slate-600 bg-white shadow-sm hover:bg-slate-50">
            すべての企画を見る
          </button>
        </Link>
      </div>
    </section>
  );
};

// --- 5. BENTO FEATURES ---
const BentoFeatures = () => {
  const features = [
    {
      title: "集金・お金の管理をスマートに",
      desc: "クレジットカードやPayPayで自動集金。個人の口座を晒したり、入金確認に追われるストレスをゼロにします。",
      span: "col-span-1 md:col-span-2",
      icon: Shield,
      color: "bg-emerald-50/50 hover:bg-emerald-50",
      text: "text-emerald-900",
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-100",
    },
    {
      title: "完全匿名で安心",
      desc: "住所や本名を明かさず、ハンドルネームだけで参加可能。プライバシーを守ります。",
      span: "col-span-1",
      icon: KeyRound,
      color: "bg-pink-50/50 hover:bg-pink-50",
      text: "text-pink-900",
      iconColor: "text-pink-500",
      iconBg: "bg-pink-100",
    },
    {
      title: "プロに直接依頼",
      desc: "フラスタ専門のお花屋さんや絵師さんをサイト内で指名・公募できます。",
      span: "col-span-1",
      icon: PenTool,
      color: "bg-amber-50/50 hover:bg-amber-50",
      text: "text-amber-900",
      iconColor: "text-amber-500",
      iconBg: "bg-amber-100",
    },
    {
      title: "レギュレーション確認済み",
      desc: "お花送付のルールを会場と連携。当日「サイズオーバーで置けなかった」という悲劇を防ぎます。",
      span: "col-span-1 md:col-span-2",
      icon: Building,
      color: "bg-sky-50/50 hover:bg-sky-50",
      text: "text-sky-900",
      iconColor: "text-sky-500",
      iconBg: "bg-sky-100",
    }
  ];

  return (
    <section className="py-20 md:py-28 bg-white relative z-10 border-t border-slate-100">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter mb-4">
            面倒な裏方は、すべてFLASTALに。
          </h2>
          <p className="text-sm font-bold text-slate-500">お金の管理から会場への確認まで、もっと手軽に推し活を楽しめます。</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {features.map((feat, i) => (
            <Reveal key={i} delay={i * 0.1} className={cn("rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-2 cursor-default group", feat.span, feat.color)}>
              <motion.div whileHover={{ scale: 1.1, rotate: -5 }} className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform", feat.iconBg, feat.iconColor)}>
                <feat.icon size={24} strokeWidth={2} />
              </motion.div>
              <h3 className={cn("text-lg font-black mb-2", feat.text)}>{feat.title}</h3>
              <p className="text-sm font-bold text-slate-600 leading-relaxed">{feat.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- 6. CATEGORIES ---
const CategoryGrid = () => {
  return (
    <section className="py-20 md:py-28 bg-white relative z-10 border-t border-slate-100">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter mb-3">対応ジャンル</h2>
          <p className="text-sm text-slate-500 font-bold">様々なシーンのお祝いに対応しています。</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {CATEGORIES.map((cat, i) => (
            <Reveal key={cat.id} delay={i * 0.05}>
              <motion.div whileHover={{ scale: 1.05, y: -5 }} className={cn("rounded-2xl p-4 text-center border border-slate-100 transition-shadow hover:shadow-md cursor-pointer", cat.bg)}>
                <div className={cn("w-10 h-10 mx-auto bg-white rounded-full flex items-center justify-center mb-3 shadow-sm", cat.color)}>
                  <cat.icon size={20} strokeWidth={2} />
                </div>
                <h3 className="text-slate-800 font-black text-xs mb-1">{cat.name}</h3>
                <p className="text-slate-500 text-[9px] font-bold">{cat.jp}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- 7. ARTICLES ---
const LaruSeoEmbed = () => {
  const containerRef = useRef(null);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;
      if (container.querySelector('script')) return;

      const script = document.createElement('script');
      script.src = "https://larubot.tokyo/embed/blog.js";
      script.setAttribute("data-id", "e19ed703-6238-49a5-ac83-c92c522a44cd");
      script.setAttribute("data-limit", "3"); 
      script.async = true;
      container.appendChild(script);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return <div ref={containerRef} className="w-full min-h-[300px]" />;
};

const ArticlesSection = () => (
  <section className="py-20 md:py-28 bg-[#FAF9FF] relative z-10 border-t border-slate-100">
    <div className="container mx-auto px-4 md:px-6 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter">お役立ち情報</h2>
        <Link href="/blog">
          <motion.button whileHover={{ scale: 1.05 }} className="px-5 py-2.5 rounded-full border border-slate-200 text-xs font-black text-slate-600 bg-white shadow-sm flex items-center gap-2">
            すべての記事を見る <ArrowRight size={14}/>
          </motion.button>
        </Link>
      </div>
      <Reveal>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <LaruSeoEmbed />
        </div>
      </Reveal>
    </div>
  </section>
);


// --- 8. PARTNER CTA ---
const PartnerCTA = () => (
  <section className="py-20 md:py-28 bg-pink-50 relative z-10 overflow-hidden border-t border-pink-100">
    <div className="container mx-auto px-4 md:px-6 max-w-5xl relative z-10">
      <Reveal>
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-black text-slate-800 mb-4 tracking-tighter">法人・クリエイターの皆様へ</h2>
          <p className="text-slate-600 text-sm font-bold max-w-2xl mx-auto leading-relaxed">
            FLASTALは、お花屋さん、ライブ会場、イベント主催者、イラストレーターとファンを繋ぐサービスです。初期費用・月額費用は一切かかりません。
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { href: "/venues/login", title: "会場・ホールのご担当者様", desc: "搬入ルールの設定など", icon: Building, color: "text-blue-500" },
            { href: "/organizers/login", title: "イベント主催者様", desc: "お祝い花のルール周知", icon: Ticket, color: "text-amber-500" },
            { href: "/florists/login", title: "お花屋さん", desc: "フラスタの受注・納品報告", icon: Store, color: "text-emerald-500" },
            { href: "/illustrators/login", title: "クリエイター様", desc: "イラストパネルの受注", icon: PenTool, color: "text-pink-500" },
          ].map((role, i) => (
            <Link key={i} href={role.href} className="group">
              <motion.div whileHover={{ scale: 1.02, y: -5 }} className="bg-white border border-pink-100 rounded-2xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all h-full">
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0", role.color)}>
                    <role.icon size={20} strokeWidth={2}/>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">{role.title}</h3>
                    <p className="text-slate-500 text-[10px] font-bold mt-0.5">{role.desc}</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-pink-500 transition-colors group-hover:translate-x-1" />
              </motion.div>
            </Link>
          ))}
        </div>
      </Reveal>
    </div>
  </section>
);

// ==========================================
// 👑 MAIN EXPORT
// ==========================================
export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) return null; 

  return (
    <main className="bg-[#FFFDFE] min-h-screen text-slate-800 font-sans selection:bg-pink-100 selection:text-pink-500 relative">
      
      <AnimatePresence mode="wait">
        {!introFinished ? (
          <IntroLoader key="loader" onComplete={() => setIntroFinished(true)} />
        ) : (
          <MainContent key="content" />
        )}
      </AnimatePresence>

      <Script 
        src="https://larubot.tokyo/static/embed.js" 
        data-public-id="e19ed703-6238-49a5-ac83-c92c522a44cd" 
        strategy="afterInteractive" 
      />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&family=Parisienne&display=swap');
        
        :root {
          --font-sans: 'Zen Kaku Gothic New', 'Plus Jakarta Sans', sans-serif;
          --font-calligraphy: 'Parisienne', cursive;
        }

        body {
          font-family: var(--font-sans);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .font-calligraphy {
          font-family: var(--font-calligraphy);
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}