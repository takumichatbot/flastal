'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from './contexts/AuthContext';
import Image from 'next/image';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';

// Lucide Icons (推し活モチーフに合うものを厳選)
import { 
  Heart, Sparkles, Star, ArrowRight, Search, Users,
  Gift, MessageCircle, Clock, CheckCircle2, Ticket, 
  Crown, Cake, Gem, Camera, BookmarkHeart, Mail
} from 'lucide-react';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const JpText = ({ children, className }) => (
  <span className={cn("inline-block", className)}>{children}</span>
);

// ==========================================
// 🎨 DYNAMIC THEME (メンカラチェンジ機能 - 案11)
// ==========================================
const THEMES = {
  pink: { name: 'Pink', bg: 'bg-rose-400', light: 'bg-rose-50', text: 'text-rose-500', border: 'border-rose-200', grad: 'from-rose-400 to-pink-300' },
  blue: { name: 'Blue', bg: 'bg-sky-400', light: 'bg-sky-50', text: 'text-sky-500', border: 'border-sky-200', grad: 'from-sky-400 to-blue-300' },
  purple: { name: 'Purple', bg: 'bg-fuchsia-400', light: 'bg-fuchsia-50', text: 'text-fuchsia-500', border: 'border-fuchsia-200', grad: 'from-fuchsia-400 to-purple-300' },
  yellow: { name: 'Yellow', bg: 'bg-amber-400', light: 'bg-amber-50', text: 'text-amber-500', border: 'border-amber-200', grad: 'from-amber-400 to-yellow-300' },
  green: { name: 'Green', bg: 'bg-emerald-400', light: 'bg-emerald-50', text: 'text-emerald-500', border: 'border-emerald-200', grad: 'from-emerald-400 to-teal-300' },
};

// ==========================================
// 🪄 ANIMATION & MAGIC UI COMPONENTS
// ==========================================

// ペンライト風スクロール進行バー (案8)
const ScrollProgress = ({ theme }) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return (
    <motion.div 
      className={cn("fixed top-0 left-0 right-0 h-2 origin-left z-[100] bg-gradient-to-r shadow-[0_0_10px_rgba(255,255,255,0.8)]", theme.grad)} 
      style={{ scaleX }} 
    />
  );
};

const Reveal = ({ children, delay = 0, className = "" }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 0.7, delay, type: "spring", bounce: 0.3 }} className={className}>
    {children}
  </motion.div>
);

// 3Dリボンバナー風見出し (案3) & 明朝体フォント (案9)
const SectionTitle = ({ en, ja, theme }) => (
  <div className="text-center mb-12 md:mb-16 relative z-10">
    <Reveal>
      <div className="relative inline-block">
        {/* リボン背景のSVG装飾 */}
        <svg className={cn("absolute -top-4 -left-6 w-[120%] h-[140%] -z-10 opacity-20", theme.text)} viewBox="0 0 200 60" preserveAspectRatio="none">
          <path d="M10,30 Q50,0 100,30 T190,30 L180,50 Q100,20 20,50 Z" fill="currentColor" />
        </svg>
        <span className={cn("font-calligraphy text-2xl md:text-3xl opacity-60 block -mb-2", theme.text)}>{en}</span>
        <h2 className="text-2xl md:text-4xl font-serif-jp font-bold text-slate-800 tracking-widest">{ja}</h2>
      </div>
    </Reveal>
  </div>
);

// 推し活モチーフのパーティクル (案7)
const FloatingParticles = ({ theme }) => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  const symbols = ['🎀', '✨', '💖', '🕊️'];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className={cn("absolute text-lg md:text-2xl opacity-20 drop-shadow-md", theme.text)}
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -300], x: [null, (Math.random() - 0.5) * 100], opacity: [0.1, 0.4, 0.1], rotate: [0, Math.random() * 360] }}
          transition={{ duration: Math.random() * 10 + 15, repeat: Infinity, ease: "linear" }}
        >
          {symbols[i % symbols.length]}
        </motion.div>
      ))}
    </div>
  );
};

// 銀テープ（銀テ）降下アニメーション (案15)
const SilverTape = ({ show, colorClass }) => {
  if (!show) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[60]">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className={cn("absolute top-[-10%] w-1.5 h-12 bg-gradient-to-b rounded-full", colorClass)}
          initial={{ x: `${Math.random() * 100}%`, y: -50, rotate: Math.random() * 180 }}
          animate={{ y: '120vh', rotate: Math.random() * 720, x: `+=${(Math.random() - 0.5) * 200}px` }}
          transition={{ duration: Math.random() * 2 + 1.5, ease: "easeIn" }}
        />
      ))}
    </div>
  );
};

// ==========================================
// 🧩 SECTIONS
// ==========================================

// --- 🚀 1. HERO SECTION ---
const HeroSection = ({ theme }) => (
  // 大人可愛いダスティカラー背景 (案16) + カリグラフィー背景 (案17)
  <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#Fdfbfb] px-4 md:px-6 pt-24 pb-16 z-10 border-b-[12px] border-white">
    <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-40 z-0" />
    <FloatingParticles theme={theme} />
    
    {/* カリグラフィー背景文字 (案17) */}
    <div className="absolute top-20 -left-10 text-[10rem] md:text-[15rem] font-calligraphy text-slate-100 -rotate-6 whitespace-nowrap pointer-events-none select-none z-0">
      Happy Celebration
    </div>
    
    {/* レースアップ（編み上げ）装飾 SVG (案13) */}
    <div className="hidden lg:block absolute right-10 top-1/4 h-1/2 w-8 opacity-20">
       <svg viewBox="0 0 40 400" fill="none" xmlns="http://www.w3.org/2000/svg">
         {[...Array(10)].map((_, i)=>(
           <g key={i} transform={`translate(0, ${i*40})`}>
             <circle cx="5" cy="10" r="3" fill="#334155"/>
             <circle cx="35" cy="10" r="3" fill="#334155"/>
             <path d="M5 10 L35 30 M35 10 L5 30" stroke="#334155" strokeWidth="1.5" strokeLinecap="round"/>
             <circle cx="5" cy="30" r="3" fill="#334155"/>
             <circle cx="35" cy="30" r="3" fill="#334155"/>
           </g>
         ))}
       </svg>
    </div>

    <div className="container relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center">
      <Reveal>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.8 }}
          className={cn("inline-flex items-center gap-2 px-5 py-1.5 bg-white/90 backdrop-blur-md rounded-full shadow-sm border mb-6 font-serif-jp", theme.border)}
        >
          <Crown size={14} className={theme.text} />
          <span className={cn("text-[10px] md:text-xs font-bold tracking-widest", theme.text)}>世界でひとつだけの贈り物</span>
        </motion.div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-serif-jp text-slate-800 leading-tight mb-6 tracking-wide drop-shadow-sm">
          想いを集めて、<br/>
          <span className="relative inline-block mt-2">
             <span className={cn("absolute inset-0 -rotate-1 rounded-lg blur-[2px] opacity-20", theme.bg)}></span>
             <span className="relative italic font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600">とびきりのフラスタ</span>
          </span> を。
        </h1>
        
        <p className="text-xs md:text-sm text-slate-500 mb-10 leading-loose max-w-lg mx-auto font-medium tracking-wide">
          FLASTALは、推しへの「お祝い花」を<br className="hidden md:block"/>
          ファン同士で費用を出し合って贈れるサービスです。
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center px-4 w-full sm:w-auto">
          {/* ライブチケット風ボタン (案2) */}
          <Link href="/projects/create" className="w-full sm:w-auto">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className={cn(
                "relative w-full sm:w-auto px-10 py-5 text-white font-bold rounded-xl shadow-xl flex items-center justify-center gap-2 text-sm md:text-base overflow-hidden border border-white/40",
                theme.grad
              )}
            >
              {/* チケットの切り込み */}
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#Fdfbfb] rounded-full shadow-inner"></div>
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#Fdfbfb] rounded-full shadow-inner"></div>
              {/* もぎり線 (点線) */}
              <div className="absolute left-8 top-0 bottom-0 w-px border-l-2 border-dashed border-white/40"></div>
              
              <Sparkles size={18} className="ml-4" /> 企画を立てる
            </motion.button>
          </Link>
          
          <Link href="/projects" className="w-full sm:w-auto">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className={cn("w-full sm:w-auto px-10 py-5 bg-white border-2 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 text-sm md:text-base transition-colors", theme.border, theme.text)}
            >
              <Search size={18} /> 企画を探す
            </motion.button>
          </Link>
        </div>
      </Reveal>
    </div>
  </section>
);

// --- シャンパンタワー風の「企画ステップ」 (案19) ---
const AboutSection = ({ theme }) => (
  <section className="py-20 md:py-24 bg-white relative overflow-hidden border-b-8 border-slate-50">
    <div className="container mx-auto px-4 md:px-6 max-w-5xl relative z-10 text-center">
      <SectionTitle en="How it works" ja="フラスタが届くまで" theme={theme} />
      
      <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-12 mt-12 relative">
        {/* 背景の繋ぎ線 */}
        <div className={cn("hidden md:block absolute top-1/2 left-1/4 right-1/4 h-0.5 border-t-2 border-dashed -translate-y-1/2 -z-10", theme.border)}></div>

        {[
          { step: "Step 01", title: "企画を立ち上げる", icon: Ticket, text: "お祝いの趣旨や予算を決定し、専用のページを作ります。" },
          { step: "Step 02", title: "支援を集める", icon: Users, text: "SNSでシェアして参加者を募集！1口1,000円から匿名で集金可能。" },
          { step: "Step 03", title: "お花を届ける", icon: Cake, text: "目標を達成したらプロのお花屋さんへ発注。完成写真もサイトで共有！" },
        ].map((item, i) => (
          <Reveal key={i} delay={i * 0.2} className="relative bg-white w-full md:w-1/3">
            <div className="flex flex-col items-center text-center group">
              <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-4 border-4 shadow-sm relative transition-transform duration-500 group-hover:-translate-y-2", theme.bg, theme.border)}>
                 <div className="absolute inset-0 bg-white/20 rounded-full m-1 border border-white/50"></div>
                 <item.icon size={28} className="text-white relative z-10" />
              </div>
              <span className={cn("font-calligraphy text-lg mb-1", theme.text)}>{item.step}</span>
              <h3 className="text-base font-bold text-slate-800 mb-2">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium px-4">{item.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

// --- 痛バッグ風のジャンル一覧 (案18) ---
const CategoriesSection = ({ theme }) => (
  <section className="py-16 bg-slate-50 relative overflow-hidden">
    <div className="container mx-auto px-4 max-w-4xl text-center">
      <SectionTitle en="Categories" ja="対応ジャンル" theme={theme} />
      
      {/* ビニールバッグ（痛バ）風のコンテナ */}
      <Reveal className="relative mx-auto mt-8 bg-white/40 backdrop-blur-md border-4 border-white/80 rounded-[3rem] p-8 shadow-[inset_0_4px_20px_rgba(0,0,0,0.05)]">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-2 bg-white/60 rounded-full"></div> {/* バッグの持ち手風 */}
        <div className="flex flex-wrap justify-center gap-4">
          {CATEGORIES.map((cat, i) => (
            <motion.div key={cat.id} whileHover={{ scale: 1.1, rotate: [-2, 2, 0] }}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border-2 border-slate-100 shadow-[0_4px_10px_rgba(0,0,0,0.05)] cursor-pointer relative overflow-hidden"
            >
              {/* 缶バッジのテカリ表現 */}
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/60 to-transparent rounded-t-full pointer-events-none"></div>
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white shadow-inner bg-gradient-to-br", cat.color)}>
                {cat.icon}
              </div>
              <span className="font-bold text-slate-700 text-xs tracking-wide pr-2">{cat.name}</span>
            </motion.div>
          ))}
        </div>
      </Reveal>
    </div>
  </section>
);

// --- アクスタ/祭壇風プロジェクトカード (案12) & 銀テ降下 (案15) ---
const ProjectCardWrapper = ({ project, index, theme }) => {
  const [isHovered, setIsHovered] = useState(false);
  const percent = Math.min(Math.round((project.currentAmount / project.targetAmount) * 100), 100);
  const isSuccess = percent >= 100;
  
  return (
    <Reveal delay={index * 0.1} className="h-full min-w-[85vw] sm:min-w-[320px] md:min-w-0 snap-center p-2">
      <Link href={`/projects`} className="block group h-full relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        
        {/* 銀テープエフェクト */}
        <SilverTape show={isHovered && isSuccess} colorClass={theme.bg} />

        {/* アクスタ風フレーム (極太白フチ＋影) */}
        <div className="h-full flex flex-col bg-white border-[6px] border-white/90 rounded-[2.5rem] shadow-[0_15px_35px_rgba(0,0,0,0.08)] overflow-hidden relative z-10 transform group-hover:-translate-y-2 transition-all duration-300">
          
          <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden rounded-[1.5rem] m-2">
            <Image src={project.imgUrl} alt={project.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 768px) 85vw, 33vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
            
            <div className="absolute top-3 left-3">
              <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm flex items-center gap-1", 
                isSuccess ? "bg-white/90 text-emerald-500" : "bg-white/90 text-slate-700"
              )}>
                {isSuccess ? <><Crown size={12}/> SUCCESS</> : '募集中'}
              </span>
            </div>
            {project.status !== 'COMPLETED' && (
              <div className="absolute bottom-3 right-3 bg-slate-900/60 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                <Clock size={10} className="text-white" />
                <span className="text-[10px] font-bold text-white">残り {project.daysLeft} 日</span>
              </div>
            )}
          </div>
          
          <div className="p-5 flex flex-col flex-grow bg-white">
            <div className="text-[9px] font-bold text-slate-400 mb-2 flex items-center gap-1"><BookmarkHeart size={12} className={theme.text}/> {project.category}</div>
            <h3 className="font-bold text-sm text-slate-800 leading-snug mb-4 group-hover:text-slate-600 transition-colors line-clamp-2">{project.title}</h3>
            
            <div className="mt-auto">
              <div className="flex justify-between items-end mb-1.5">
                <p className="text-sm font-black text-slate-800">¥{project.currentAmount.toLocaleString()}</p>
                <span className={cn("text-sm font-black font-mono", isSuccess ? "text-emerald-500" : theme.text)}>{percent}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
                <motion.div initial={{ width: 0 }} whileInView={{ width: `${percent}%` }} transition={{ duration: 1.5 }} className={cn("h-full rounded-full", isSuccess ? "bg-emerald-400" : theme.bg)} />
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                <span className="text-[10px] font-bold text-slate-500 truncate max-w-[120px]">{project.organizer}</span>
                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Users size={12} className="text-slate-300"/> {project.supporters}人</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </Reveal>
  );
};

const HotProjectsSection = ({ theme }) => (
  <section className="py-20 md:py-32 bg-[#Fdfbfb] relative overflow-hidden">
    <div className="container mx-auto px-0 md:px-6 max-w-6xl relative z-10">
      <SectionTitle en="Projects" ja="注目の企画" theme={theme} />
      <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-8 px-4 md:px-0 md:grid md:grid-cols-4 gap-2 md:gap-4 mt-8">
        {DUMMY_PROJECTS.map((project, i) => (
          <ProjectCardWrapper key={project.id} project={project} index={i} theme={theme} />
        ))}
      </div>
      <div className="text-center mt-4">
        <Link href="/projects" className={cn("inline-flex items-center gap-2 text-sm font-bold transition-all hover:underline", theme.text)}>
          すべての企画を見る <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  </section>
);

// --- シーリングスタンプ風 招待状UI (案14) ---
const FeaturesSection = ({ theme }) => (
  <section className="py-20 md:py-32 bg-slate-50 relative overflow-hidden border-y border-slate-100">
    <div className="container mx-auto px-4 md:px-6 max-w-5xl relative z-10">
      <SectionTitle en="Why Choose Us" ja="安心・安全な推し活を。" theme={theme} />
      
      <div className="grid md:grid-cols-2 gap-8 md:gap-12 mt-12">
        <Reveal delay={0.1}>
          {/* 招待状風デザイン */}
          <div className="bg-white p-8 md:p-10 rounded-sm shadow-md border border-slate-200 relative">
            {/* シーリングスタンプ */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-rose-700 rounded-full shadow-[0_4px_10px_rgba(159,18,57,0.4)] border-2 border-rose-800 flex items-center justify-center">
               <span className="text-white font-calligraphy text-lg italic">F</span>
            </div>
            
            <h3 className="text-lg md:text-xl font-serif-jp font-bold text-slate-800 mb-6 text-center mt-4 border-b border-dashed border-slate-200 pb-4">企画する方へ</h3>
            <ul className="space-y-5">
              {[
                { title: "集金・未払い管理が不要", desc: "クレカ決済対応で、主催者の口座情報公開や面倒な催促は一切不要です。" },
                { title: "透明な収支報告", desc: "集まった金額と使用内訳をシステムが自動で可視化します。" }
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <CheckCircle2 className="text-rose-400 shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="font-bold text-slate-800 text-sm mb-1">{item.title}</p>
                    <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        
        <Reveal delay={0.2}>
          <div className="bg-white p-8 md:p-10 rounded-sm shadow-md border border-slate-200 relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-sky-700 rounded-full shadow-[0_4px_10px_rgba(3,105,161,0.4)] border-2 border-sky-800 flex items-center justify-center">
               <span className="text-white font-calligraphy text-lg italic">F</span>
            </div>
            <h3 className="text-lg md:text-xl font-serif-jp font-bold text-slate-800 mb-6 text-center mt-4 border-b border-dashed border-slate-200 pb-4">参加する方へ</h3>
            <ul className="space-y-5">
              {[
                { title: "完全匿名で安心", desc: "本名や住所の入力は不要。ハンドルネームだけで気軽に参加できます。" },
                { title: "1,000円から支援可能", desc: "少額からでも参加OK。推しへのメッセージも一緒に送れます。" }
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <CheckCircle2 className="text-sky-400 shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="font-bold text-slate-800 text-sm mb-1">{item.title}</p>
                    <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </div>
  </section>
);

// --- チェキ風（ポラロイド）ユーザーの声 (案4) ---
const VoiceSection = ({ theme }) => (
  <section className="py-20 md:py-32 bg-[#Fdfbfb] relative overflow-hidden">
    <div className="container mx-auto max-w-6xl px-0 md:px-6">
      <SectionTitle en="Testimonials" ja="ご利用いただいた皆様の声" theme={theme} />
      <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-12 px-6 md:px-0 md:grid md:grid-cols-3 gap-6 md:gap-10 mt-12 items-start">
        {VOICES.map((v, i) => {
          // 少しずつ傾きを変える
          const rotations = ["-rotate-3", "rotate-2", "-rotate-1"];
          return (
            <div key={i} className="min-w-[80vw] sm:min-w-[300px] md:min-w-0 snap-center flex-shrink-0 pt-6">
              <Reveal delay={i * 0.15}>
                <div className={cn("bg-white p-4 pb-12 shadow-[0_10px_20px_rgba(0,0,0,0.05)] relative border border-slate-100 hover:z-20 hover:scale-105 transition-transform duration-300", rotations[i % 3])}>
                  {/* マスキングテープ */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-yellow-100/60 -rotate-2 backdrop-blur-sm shadow-sm border border-yellow-200/50"></div>
                  
                  <div className="w-full aspect-square relative bg-slate-100 mb-4 overflow-hidden filter grayscale-[20%] sepia-[10%]">
                    <Image src={v.avatar} alt="User" fill className="object-cover" />
                  </div>
                  <div className="text-center px-2">
                    <p className="font-serif-jp text-xs text-slate-700 leading-relaxed tracking-wide min-h-[80px]">「{v.text.substring(0, 60)}...」</p>
                    <p className="font-calligraphy text-lg mt-4 text-slate-400">- {v.role} -</p>
                  </div>
                </div>
              </Reveal>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

// ★★★ 記事セクション (LARUseo 埋め込み) ★★★
const LaruSeoEmbed = () => {
  const containerRef = useRef(null);
  useEffect(() => {
    const container = containerRef.current;
    if (!container || container.querySelector('script')) return;
    const script = document.createElement('script');
    script.src = "https://larubot.tokyo/embed/blog.js";
    script.setAttribute("data-id", "e19ed703-6238-49a5-ac83-c92c522a44cd");
    script.async = true;
    container.appendChild(script);
    return () => { if (container && container.contains(script)) container.removeChild(script); };
  }, []);
  return <div ref={containerRef} className="w-full min-h-[400px]"></div>;
};

const ArticlesSection = ({ theme }) => (
  <section className="py-20 md:py-32 bg-white border-t border-slate-100 relative">
    <div className="container mx-auto px-4 md:px-6 max-w-6xl">
      <SectionTitle en="Articles" ja="フラスタお役立ち情報" theme={theme} />
      <Reveal delay={0.1}>
        <div className="bg-slate-50/50 rounded-3xl p-4 md:p-8 border border-slate-100 shadow-sm">
          <LaruSeoEmbed />
        </div>
      </Reveal>
    </div>
  </section>
);

const PartnerBanner = ({ theme }) => (
  <section className="py-12 md:py-20 bg-[#Fdfbfb]">
    <div className="mx-4 md:mx-auto max-w-5xl">
      <Reveal>
        <div className={cn("rounded-[2rem] p-8 md:p-12 text-center relative overflow-hidden shadow-lg border-2", theme.light, theme.border)}>
          <div className="relative z-10">
            <h2 className={cn("text-xl md:text-2xl font-serif-jp font-bold mb-4", theme.text)}>クリエイター・法人の皆様へ</h2>
            <p className="text-slate-600 text-xs md:text-sm mb-8 max-w-2xl mx-auto leading-relaxed">
              FLASTALは、お花屋さん、イベント主催者、イラストレーターの皆様とファンをつなぎます。
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { href: "/florists/register", label: "お花屋さん" },
                { href: "/venues/register", label: "会場・ホール" },
                { href: "/organizers/register", label: "イベント主催者" },
                { href: "/illustrators/register", label: "イラストレーター" },
              ].map((btn, i) => (
                <Link key={i} href={btn.href} className="px-5 py-2.5 bg-white text-slate-700 text-xs font-bold rounded-full border shadow-sm hover:shadow-md transition-all">
                  {btn.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);

const ContactAndCtaSection = ({ theme }) => (
  <section className="py-24 md:py-32 bg-white text-center px-4 md:px-6 relative overflow-hidden border-t-8 border-slate-50">
    <Reveal className="relative z-10 max-w-3xl mx-auto">
      <h2 className="text-3xl md:text-5xl font-serif-jp font-bold mb-6 text-slate-800 leading-tight">
        さあ、推しへの愛を<br className="md:hidden"/>形にしよう。
      </h2>
      <p className="text-xs md:text-sm text-slate-500 mb-10 font-medium leading-relaxed">
        企画の作成は無料です。<br/>
        あなたの「お祝いしたい」という気持ちが、推しの笑顔になります。
      </p>
      <Link href="/projects/create" className="inline-block w-full sm:w-auto">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className={cn("w-full sm:w-auto text-white px-10 py-5 rounded-full text-sm md:text-lg font-bold shadow-xl flex items-center justify-center gap-2 mx-auto", theme.grad)}
        >
          <Sparkles size={20} /> 無料で企画を立ち上げる
        </motion.button>
      </Link>
    </Reveal>
  </section>
);

// 開演のレースカーテン演出 (案1)
const CurtainReveal = () => {
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    // 1.5秒後にカーテンを消す
    const timer = setTimeout(() => setIsVisible(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="fixed inset-0 z-[999] flex pointer-events-none"
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
        >
          {/* 左カーテン */}
          <motion.div 
            initial={{ x: 0 }} animate={{ x: "-100%" }} transition={{ duration: 1.2, ease: "easeInOut", delay: 0.3 }}
            className="w-1/2 h-full bg-rose-50 border-r-8 border-rose-200/50 shadow-[10px_0_30px_rgba(0,0,0,0.1)] flex items-center justify-end pr-4"
          >
            <div className="w-1 h-full bg-rose-200 opacity-50"></div>
          </motion.div>
          {/* 右カーテン */}
          <motion.div 
            initial={{ x: 0 }} animate={{ x: "100%" }} transition={{ duration: 1.2, ease: "easeInOut", delay: 0.3 }}
            className="w-1/2 h-full bg-rose-50 border-l-8 border-rose-200/50 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex items-center justify-start pl-4"
          >
            <div className="w-1 h-full bg-rose-200 opacity-50"></div>
          </motion.div>
          
          {/* 中央のロゴ/文字 */}
          <motion.div 
            initial={{ opacity: 1, scale: 1 }} animate={{ opacity: 0, scale: 1.2 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
          >
            <h1 className="font-calligraphy text-4xl text-rose-400 mb-2">Welcome to</h1>
            <h2 className="font-serif-jp text-3xl font-bold text-slate-800 tracking-widest">FLASTAL</h2>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 鼓動するハートローディング (案20)
const HeartbeatLoader = () => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center">
    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
      <Heart className="w-12 h-12 text-rose-400 fill-rose-100" />
    </motion.div>
    <p className="mt-4 text-xs font-bold text-rose-300 font-serif-jp tracking-widest">Loading...</p>
  </div>
);

// ==========================================
// 👑 MAIN EXPORT
// ==========================================
export default function HomePage() {
  const { loading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  
  // メンカラチェンジ状態
  const [activeTheme, setActiveTheme] = useState('pink');
  const currentTheme = THEMES[activeTheme];

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted || loading) return <HeartbeatLoader />;

  return (
    <div className="bg-[#Fdfbfb] min-h-screen text-slate-800 font-sans selection:bg-rose-100 selection:text-rose-600 overflow-x-hidden relative">
      
      {/* グローバルフォント＆スクロールバー設定 (案8, 案9, 案17) */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Noto+Serif+JP:wght@400;700;900&display=swap');
        .font-serif-jp { font-family: 'Noto Serif JP', serif; }
        .font-calligraphy { font-family: 'Dancing Script', cursive; }
        
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #fdfbfb; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #fb7185, #38bdf8); border-radius: 10px; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        body { text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; }
      `}</style>

      <CurtainReveal />
      <ScrollProgress theme={currentTheme} />
      
      {/* 推し色カラーパレット (案11) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-lg border border-slate-100">
        {Object.entries(THEMES).map(([key, val]) => (
          <button 
            key={key} onClick={() => setActiveTheme(key)} title={val.name}
            className={cn("w-6 h-6 rounded-full border-2 transition-transform hover:scale-110", val.bg, activeTheme === key ? "border-white shadow-[0_0_10px_rgba(0,0,0,0.2)] scale-110" : "border-transparent opacity-50")}
          />
        ))}
      </div>

      <HeroSection theme={currentTheme} />
      <TickerSection />
      <AboutSection theme={currentTheme} />
      <CategoriesSection theme={currentTheme} />
      <HotProjectsSection theme={currentTheme} />
      <FeaturesSection theme={currentTheme} />
      <VoiceSection theme={currentTheme} />
      <ArticlesSection theme={currentTheme} />
      <PartnerBanner theme={currentTheme} />
      <ContactAndCtaSection theme={currentTheme} />
      
    </div>
  );
}