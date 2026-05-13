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
  Gift, MessageCircle, Crown, PenTool, Video, Music, MapPin, Store,
  ArrowUpRight, Shield, Command, KeyRound, Building, Ticket, Loader2, Calendar
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// ==========================================
// 🌌 1. 呼吸するメッシュグラデーション背景
// ==========================================
const BreathingMeshGradient = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#fdfcff] pointer-events-none">
      <motion.div 
        animate={{ y: [0, -20, 0], x: [0, 10, 0], scale: [1, 1.05, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] md:w-[60vw] md:h-[60vw] rounded-full bg-pink-300/30 blur-3xl" 
      />
      <motion.div 
        animate={{ y: [0, 15, 0], x: [0, -20, 0], scale: [1, 0.95, 1] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-[-10%] right-[-10%] w-[80vw] h-[80vw] md:w-[60vw] md:h-[60vw] rounded-full bg-sky-300/30 blur-3xl" 
      />
      <motion.div 
        animate={{ y: [0, -10, 0], x: [0, -10, 0], scale: [1, 1.05, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="absolute bottom-[-20%] left-[20%] w-[90vw] h-[90vw] md:w-[70vw] md:h-[70vw] rounded-full bg-violet-300/30 blur-3xl" 
      />
      <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')" }}></div>
    </div>
  );
};

// ==========================================
// 🎨 ULTRA-MODERN UI COMPONENTS
// ==========================================
const MagneticWrapper = ({ children, className }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    if (!ref.current || window.innerWidth < 1024) return;
    const { clientX, clientY } = e;
    const { height, width: elemWidth, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + elemWidth / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.15, y: middleY * 0.15 });
  };

  const reset = () => { setPosition({ x: 0, y: 0 }); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const GlassCard = ({ children, className, spotColor = "rgba(236, 72, 153, 0.15)" }) => {
  const divRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const opacity = isFocused ? 1 : 0;

  const handleMouseMove = (e) => {
    if (!divRef.current || isFocused || window.innerWidth < 1024) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsFocused(true)}
      onMouseLeave={() => setIsFocused(false)}
      className={cn(
        "relative overflow-hidden rounded-[2.5rem] bg-white/60 backdrop-blur-2xl",
        "border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)]",
        "before:absolute before:inset-0 before:rounded-[2.5rem] before:border before:border-white/50 before:pointer-events-none",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-[2.5rem] transition duration-500 hidden lg:block z-0"
        style={{ opacity, background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotColor}, transparent 40%)` }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};

const Reveal = ({ children, delay = 0, className = "" }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 0.8, delay, type: "spring", bounce: 0.3 }} className={className}>
      {children}
    </motion.div>
  );
};

const SplitTextReveal = ({ text, className, delay = 0 }) => {
  const words = text.split(" ");
  // クラッシュ原因になる filter: blur を削除し、シンプルで安定したフェードインに変更
  const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: delay } } };
  const child = { visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 14, stiffness: 100 } }, hidden: { opacity: 0, y: 30 } };

  return (
    <motion.div style={{ overflow: "hidden", display: "flex", flexWrap: "wrap", justifyContent: "center" }} variants={container} initial="hidden" whileInView="visible" viewport={{ once: true }} className={className}>
      {words.map((word, index) => (
        <motion.span variants={child} style={{ marginRight: "0.25em", display: "inline-block" }} key={index}>{word}</motion.span>
      ))}
    </motion.div>
  );
};

// ★修正: クラッシュを防ぐため scale を initial に移動
const EmojiParticle = ({ emoji, delay = 0, x = "0%", y = "0%", scale = 1 }) => {
  return (
    <motion.div
      className="absolute opacity-0 pointer-events-none drop-shadow-md select-none z-0"
      style={{ top: y, left: x, fontSize: '2.5rem' }}
      initial={{ scale }}
      animate={{ 
        opacity: [0, 0.9, 0.5, 0.9, 0],
        y: ["0px", "-40px", "-20px", "-40px", "-60px"],
        rotate: [0, 15, -15, 15, 0]
      }}
      transition={{ duration: 8, delay: delay, repeat: Infinity, ease: "easeInOut" }}
    >
      {emoji}
    </motion.div>
  );
};

// ==========================================
// 📊 CATEGORIES
// ==========================================
const CATEGORIES = [
  { id: 'idol', name: 'Idol / Artist', jp: 'アイドル・アーティスト', icon: Music, color: 'text-pink-500', bg: 'bg-pink-50/80', border: 'border-pink-100' },
  { id: 'vtuber', name: 'Virtual Creator', jp: 'VTuber・配信者', icon: Video, color: 'text-cyan-500', bg: 'bg-cyan-50/80', border: 'border-cyan-100' },
  { id: 'stage', name: 'Stage / Musical', jp: '舞台・ミュージカル', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50/80', border: 'border-purple-100' },
  { id: 'voice', name: 'Voice Actor', jp: '声優・役者', icon: MessageCircle, color: 'text-amber-500', bg: 'bg-amber-50/80', border: 'border-amber-100' },
  { id: 'anime', name: 'Anime / Game', jp: 'アニメ・ゲームイベント', icon: Command, color: 'text-emerald-500', bg: 'bg-emerald-50/80', border: 'border-emerald-100' },
  { id: 'anniversary', name: 'Anniversary', jp: '生誕祭・周年記念', icon: Crown, color: 'text-rose-500', bg: 'bg-rose-50/80', border: 'border-rose-100' },
];

// ==========================================
// 🚀 PAGE SECTIONS
// ==========================================

// --- 0. INTRO LOADER ---
const IntroLoader = ({ onComplete }) => {
  useEffect(() => { 
    const timer = setTimeout(onComplete, 1200); 
    return () => clearTimeout(timer); 
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-none"
      initial={{ opacity: 1 }}
      exit={{ scale: 1.1, opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
    >
      <motion.div 
        className="absolute inset-y-0 left-0 w-1/2 bg-[#FDF2F8] shadow-[20px_0_50px_rgba(244,114,182,0.4)] z-10 origin-left border-r border-white/50"
        initial={{ x: 0, skewX: 0 }} animate={{ x: "-100%", skewX: -2 }} transition={{ duration: 0.8, delay: 0.4, ease: [0.76, 0, 0.24, 1] }}
        style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(244,114,182,0.05) 50%, rgba(0,0,0,0) 100%), url('https://www.transparenttextures.com/patterns/french-stucco.png')` }}
      />
      <motion.div 
        className="absolute inset-y-0 right-0 w-1/2 bg-[#FDF2F8] shadow-[-20px_0_50px_rgba(244,114,182,0.4)] z-10 origin-right border-l border-white/50"
        initial={{ x: 0, skewX: 0 }} animate={{ x: "100%", skewX: 2 }} transition={{ duration: 0.8, delay: 0.4, ease: [0.76, 0, 0.24, 1] }}
        style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(244,114,182,0.05) 50%, rgba(0,0,0,0) 100%), url('https://www.transparenttextures.com/patterns/french-stucco.png')` }}
      />
      <motion.div className="absolute z-20 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <span className="font-serif italic text-4xl text-pink-400 mb-2 drop-shadow-sm">Welcome to</span>
        <h1 className="text-5xl md:text-7xl font-black text-pink-500 tracking-[0.3em] font-serif-jp drop-shadow-lg">FLASTAL</h1>
      </motion.div>
    </motion.div>
  );
};

// --- メインコンテンツ ---
const MainContent = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <BreathingMeshGradient />
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

// --- 1. HERO SECTION (Spline 3D Hologram + Emoji) ---
const Hero = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacity = useTransform(scrollY, [0, 600], [1, 0]);

  return (
    <section className="relative w-full min-h-[100svh] flex flex-col items-center justify-center overflow-hidden pt-20 pb-12 z-10">
      
      {/* 🎀 復活: リボンやケーキの動く装飾 */}
      <EmojiParticle emoji="🎀" x="15%" y="25%" scale={1.2} delay={0} />
      <EmojiParticle emoji="🎂" x="80%" y="60%" scale={1.1} delay={1.5} />
      <EmojiParticle emoji="💖" x="25%" y="75%" scale={0.9} delay={3} />
      <EmojiParticle emoji="✨" x="85%" y="20%" scale={1.3} delay={0.5} />
      <EmojiParticle emoji="👑" x="50%" y="85%" scale={1.2} delay={2.2} />
      <EmojiParticle emoji="🎉" x="10%" y="55%" scale={1.0} delay={1.8} />

      {/* 🌸 3Dダイヤモンドの安定したiframe埋め込み */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-auto opacity-70 md:opacity-100">
         <div className="w-[150%] h-[150%] md:w-[100%] md:h-[100%] md:translate-x-[25%]">
             <iframe 
                src="https://my.spline.design/diamond3dcopycopy-wG2QFxtCNBSfnRGpsp6nNDqp-aq6/" 
                style={{ border: 'none', width: '100%', height: '100%' }}
                title="3D Hologram Diamond"
                loading="lazy"
             ></iframe>
         </div>
      </div>
      
      <motion.div style={{ y: y1, opacity }} className="container relative z-10 max-w-6xl mx-auto px-4 md:px-6 flex flex-col items-center md:items-start text-center md:text-left mt-24 md:mt-0">
        
        <Reveal delay={0.2}>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/70 backdrop-blur-xl border border-white/80 shadow-lg shadow-pink-500/10 mb-6 md:mb-8">
            <Sparkles size={16} className="text-pink-500 animate-pulse" />
            <span className="text-[11px] md:text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500 tracking-widest uppercase">
              愛を叫ぼう。お花に乗せて。
            </span>
          </div>
        </Reveal>

        <SplitTextReveal text="Blooming Canvas." className="text-5xl sm:text-6xl md:text-[6rem] lg:text-[7rem] font-black text-slate-800 tracking-tighter leading-[1.0] mb-4 md:mb-6 drop-shadow-sm" delay={0.3} />
        
        <Reveal delay={0.5}>
          <h2 className="text-lg sm:text-xl md:text-3xl font-extrabold text-slate-700/90 mb-6 md:mb-10 tracking-tight leading-snug">
            推しの特別な日に、ファンみんなで<br className="sm:hidden"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">とびきりのフラスタ</span>を贈ろう。
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600/80 max-w-xl leading-relaxed font-bold mb-10 md:mb-14">
            「おめでとう」の気持ちを、大きなお花に変えて届けよう。<br/>
            FLASTALは、ファン同士で想いを形にする新しいクラウドファンディングです。
          </p>
        </Reveal>

        <Reveal delay={0.6} className="flex flex-col sm:flex-row items-center gap-4 md:gap-5 w-full sm:w-auto px-4 sm:px-0">
          <MagneticWrapper className="w-full sm:w-auto">
            <Link href="/projects/create" className="block w-full">
              <motion.button whileTap={{ scale: 0.95 }} className="group relative w-full sm:w-auto px-9 md:px-12 py-4 md:py-5 bg-slate-900 text-white rounded-full font-black text-sm md:text-base shadow-[0_15px_40px_rgba(0,0,0,0.2)] overflow-hidden transition-all hover:shadow-[0_20px_50px_rgba(236,72,153,0.3)]">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Crown size={18} className="text-pink-300 group-hover:text-white transition-colors" /> 企画を立ち上げる <ArrowUpRight size={18} className="group-hover:rotate-45 transition-transform" />
                </span>
              </motion.button>
            </Link>
          </MagneticWrapper>
          
          <MagneticWrapper className="w-full sm:w-auto">
            <Link href="/projects" className="block w-full">
              <motion.button whileTap={{ scale: 0.95 }} className="group w-full sm:w-auto px-9 md:px-12 py-4 md:py-5 bg-white/80 backdrop-blur-xl text-slate-800 rounded-full font-black text-sm md:text-base shadow-lg border border-white/80 hover:bg-white transition-all flex items-center justify-center gap-2">
                <Search size={18} className="text-pink-400 group-hover:scale-110 transition-transform" /> 参加する企画を探す
              </motion.button>
            </Link>
          </MagneticWrapper>
        </Reveal>

      </motion.div>
    </section>
  );
};

// --- 2. INFINITE MARQUEE ---
const InfiniteMarquee = () => {
  const words = ["IDOL", "VTUBER", "STAGE", "VOICE ACTOR", "ANIME", "ANNIVERSARY"];
  return (
    <div className="py-6 md:py-10 bg-white/30 backdrop-blur-3xl border-y border-white/50 overflow-hidden flex whitespace-nowrap relative z-20 shadow-sm">
      <motion.div 
        className="flex items-center gap-6 md:gap-16"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-6 md:gap-16 shrink-0">
            {words.map((word, j) => (
              <React.Fragment key={j}>
                <span className="text-2xl md:text-5xl font-black text-slate-800/80 tracking-widest drop-shadow-sm">
                  {word}
                </span>
                <Heart size={24} className="text-pink-400/80 mx-2 md:mx-4" fill="currentColor" />
              </React.Fragment>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// --- 3. HOW IT WORKS ---
const HowItWorks = () => {
  const { scrollYProgress } = useScroll();
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.4], ["0%", "100%"]);

  const steps = [
    { num: "01", title: "企画ページをつくる", desc: "イベントの日程や会場、贈りたいお花のイメージを入力してページを公開します。", icon: PenTool, color: "text-pink-500", bg: "bg-pink-100" },
    { num: "02", title: "SNSでシェアして集金", desc: "みんなでお金を出し合います。クレジットカード対応で、面倒な口座管理は不要です。", icon: Heart, color: "text-violet-500", bg: "bg-violet-100" },
    { num: "03", title: "お花屋さんがお届け", desc: "目標達成後、FLASTAL提携のプロのお花屋さんが制作し、直接会場へお届けします。", icon: Gift, color: "text-sky-500", bg: "bg-sky-100" },
  ];

  return (
    <section className="py-24 md:py-36 relative z-10">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl relative z-10">
        <div className="text-center mb-16 md:mb-28">
          <span className="text-violet-500 font-mono text-xs font-black tracking-[0.2em] uppercase block mb-3">Process</span>
          <h2 className="text-3xl md:text-6xl font-black text-slate-800 tracking-tighter">フラスタが届くまで</h2>
        </div>

        <div className="relative">
          <div className="absolute top-12 left-0 w-full h-1 bg-slate-200/50 -z-10 hidden md:block rounded-full overflow-hidden">
              <motion.div style={{ width: lineHeight }} className="h-full bg-gradient-to-r from-pink-400 via-violet-400 to-sky-400 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-14">
            {steps.map((step, i) => (
              <Reveal key={i} delay={i * 0.15} className="relative flex flex-col items-center text-center group">
                <div className={cn("w-24 h-24 rounded-[2rem] flex items-center justify-center mb-7 shadow-xl border-4 border-white relative z-10 transition-transform duration-500 group-hover:-translate-y-4 group-hover:scale-110", step.bg, step.color)}>
                  <step.icon size={36} strokeWidth={2.5} />
                </div>
                <span className="font-mono text-5xl font-black text-slate-200/80 mb-2 drop-shadow-sm">{step.num}</span>
                <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-4">{step.title}</h3>
                <p className="text-sm md:text-base text-slate-600 font-bold leading-relaxed px-3">{step.desc}</p>
              </Reveal>
            ))}
          </div>
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
          // ★修正: データがnullや空の場合のクラッシュを完全に防止
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
    <section className="py-24 md:py-36 relative z-10">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-14 gap-6">
          <Reveal>
            <span className="text-pink-500 font-mono text-xs font-black tracking-[0.2em] uppercase block mb-3">Trending</span>
            <h2 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tighter">注目の企画</h2>
          </Reveal>
          <Link href="/projects" className="hidden md:block">
            <MagneticWrapper>
              <motion.button whileTap={{ scale: 0.95 }} className="px-8 py-4 rounded-full bg-white/80 backdrop-blur-md border border-white shadow-md text-sm font-black text-slate-700 hover:text-pink-500 transition-all flex items-center gap-2 group">
                すべての企画を見る <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
              </motion.button>
            </MagneticWrapper>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
          </div>
        ) : projects.length > 0 ? (
          <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-12 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 gap-5 md:gap-6">
            
            {projects.filter(p => p?.visibility !== 'UNLISTED' && p?.isVisible !== false).map((project, i) => {
              // ★修正: オブジェクトのプロパティ欠落によるクラッシュを防止
              const percent = Math.min(Math.round(((project?.collectedAmount || 0) / (project?.targetAmount || 1)) * 100), 100);
              const isSuccess = percent >= 100 || project?.status === 'SUCCESSFUL' || project?.status === 'COMPLETED';
              const badgeLabel = project?.status === 'COMPLETED' ? '完了' : isSuccess ? '達成!' : '募集中';
              const badgeColor = project?.status === 'COMPLETED' ? 'bg-purple-500' : isSuccess ? 'bg-emerald-500' : 'bg-pink-500';

              return (
                <Reveal key={project?.id || i} delay={i * 0.1} className="min-w-[85vw] sm:min-w-[320px] md:min-w-0 snap-center h-full">
                  <div onClick={() => router.push(`/projects/${project.id}`)} className="block group h-full cursor-pointer">
                    <GlassCard className="!p-4 lg:!p-5 h-full flex flex-col transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(236,72,153,0.15)] group-hover:border-pink-300">
                      
                      <div className="relative w-full aspect-[4/5] rounded-[1.5rem] overflow-hidden bg-slate-100 shrink-0 shadow-inner">
                        {project?.imageUrl ? (
                          <Image src={project.imageUrl} alt={project?.title || "企画画像"} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-sky-100 flex items-center justify-center text-4xl">💐</div>
                        )}
                        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-slate-900/60 to-transparent" />
                        <div className="absolute top-4 left-4">
                          <span className={cn("px-3 py-1.5 rounded-full text-[10px] font-black shadow-md border border-white/20 backdrop-blur-md text-white uppercase tracking-widest", badgeColor)}>
                            {badgeLabel}
                          </span>
                        </div>
                      </div>

                      <div className="pt-5 flex flex-col flex-grow">
                        <h3 className="font-black text-slate-800 text-sm leading-snug group-hover:text-pink-500 transition-colors line-clamp-2 mb-3">
                          {project?.title}
                        </h3>
                        
                        <div className="space-y-1.5 mb-4">
                            {project?.deliveryDateTime && (
                                <p className="text-[11px] font-bold text-slate-500 flex items-center">
                                    <Calendar className="mr-1.5 shrink-0 text-pink-400" size={14}/> 
                                    {new Date(project.deliveryDateTime).toLocaleDateString()}
                                </p>
                            )}
                            <p className="text-[11px] font-bold text-slate-500 flex items-center truncate">
                                <MapPin className="mr-1.5 shrink-0 text-sky-400" size={14}/> 
                                <span className="truncate">{project?.venue?.venueName || project?.deliveryAddress || '場所未定'}</span>
                            </p>
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-200/60">
                          <div className="flex justify-between items-end mb-2">
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Current</p>
                              <p className="text-base font-black leading-none text-slate-800">
                                ¥{(project?.collectedAmount || 0).toLocaleString()}
                                <span className="text-[9px] text-slate-400 font-bold ml-1">/ ¥{(project?.targetAmount || 0).toLocaleString()}</span>
                              </p>
                            </div>
                            <span className={cn("text-xl font-black font-mono leading-none", isSuccess ? "text-emerald-500" : "text-pink-500")}>
                              {percent}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner mb-4">
                            <motion.div 
                              initial={{ width: 0 }} whileInView={{ width: `${percent}%` }} transition={{ duration: 1.5, ease: "easeOut" }}
                              className={cn("h-full rounded-full absolute left-0 top-0", isSuccess ? "bg-emerald-400" : "bg-gradient-to-r from-pink-400 to-rose-400")} 
                            />
                          </div>

                          {project?.status === 'FUNDRAISING' && (
                              <motion.button
                                  whileTap={{ scale: 0.9, y: 2 }}
                                  onClick={(e) => {
                                      e.stopPropagation(); 
                                      router.push(`/projects/${project.id}#pledge-section`);
                                  }}
                                  className="w-full py-3 bg-pink-50 hover:bg-pink-500 text-pink-600 hover:text-white rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
                              >
                                  <Heart size={14} className="fill-current" />
                                  支援する (1口 ¥{(project?.minContributionAmount || 1000).toLocaleString()}〜)
                              </motion.button>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  </div>
                </Reveal>
              );
            })}

          </div>
        ) : (
          <div className="text-center py-20 text-slate-400 font-bold">
            現在表示できる注目の企画がありません。
          </div>
        )}
        
        <Link href="/projects" className="md:hidden flex justify-center mt-5">
          <button className="px-8 py-4 w-full rounded-full bg-white/80 backdrop-blur-md border border-white shadow-lg text-sm font-black text-slate-700 flex items-center justify-center gap-2 active:scale-95 transition-transform">
            すべての企画を見る <ArrowRight size={18}/>
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
      desc: "クレジットカードやPayPayで自動集金。主催者が個人の銀行口座を晒したり、入金確認に追われるストレスをゼロにします。",
      span: "col-span-1 md:col-span-2",
      icon: Shield,
      color: "bg-white/60",
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-100/80",
      border: "border-emerald-100",
      visual: <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-emerald-300/20 rounded-full blur-[40px] pointer-events-none" />
    },
    {
      title: "完全匿名・安全に参加",
      desc: "住所や本名を明かさず、ハンドルネームだけでOK。プライバシーを守りながら、安心して推しへの愛を形にできます。",
      span: "col-span-1",
      icon: KeyRound,
      color: "bg-white/60",
      iconColor: "text-pink-500",
      iconBg: "bg-pink-100/80",
      border: "border-pink-100",
      visual: <div className="absolute -right-4 -bottom-4 opacity-[0.05] rotate-12 pointer-events-none text-pink-500"><KeyRound size={120} /></div>
    },
    {
      title: "お花屋さん・絵師へ直接依頼",
      desc: "企画にぴったりのフラスタ専門のお花屋さんやイラストレーターを公募・指名可能。デザインのすり合わせもサイト内で完結します。",
      span: "col-span-1",
      icon: PenTool,
      color: "bg-white/60",
      iconColor: "text-violet-500",
      iconBg: "bg-violet-100/80",
      border: "border-violet-100",
      visual: <div className="absolute -right-4 -bottom-4 opacity-[0.05] -rotate-12 pointer-events-none text-violet-500"><Command size={100} /></div>
    },
    {
      title: "会場レギュレーション確認済み",
      desc: "FLASTALがお花送付のルールを会場・主催者と連携。当日「サイズオーバーでフラスタが置けなかった」という悲劇を防ぎます。",
      span: "col-span-1 md:col-span-2",
      icon: Building,
      color: "bg-white/60",
      iconColor: "text-sky-500",
      iconBg: "bg-sky-100/80",
      border: "border-sky-100",
      visual: <div className="absolute right-10 top-10 opacity-[0.05] pointer-events-none text-sky-500"><MapPin size={120} /></div>
    }
  ];

  return (
    <section className="py-20 md:py-36 relative z-10">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="mb-12 md:mb-20 text-center md:text-left">
          <Reveal>
            <span className="text-emerald-500 font-black text-[10px] md:text-xs tracking-[0.2em] uppercase block mb-4">Safety & Professional</span>
            <h2 className="text-[24px] sm:text-3xl md:text-5xl lg:text-6xl font-black text-slate-800 tracking-tighter leading-[1.3] md:leading-[1.2]">
              フラスタ企画の面倒な裏方は、<br />
              すべてFLASTALにお任せ。
            </h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {features.map((feat, i) => (
            <Reveal key={i} delay={i * 0.1} className={cn("col-span-1", feat.span)}>
              <GlassCard className={cn("h-full p-8 md:p-10 group hover:-translate-y-2 transition-transform duration-500", feat.border)}>
                <div className="relative z-20 flex flex-col h-full">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-white", feat.iconBg, feat.iconColor)}>
                    <feat.icon size={28} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-3 tracking-tight drop-shadow-sm">{feat.title}</h3>
                  <p className="text-sm md:text-base font-bold text-slate-600 leading-relaxed">{feat.desc}</p>
                </div>
                {feat.visual}
              </GlassCard>
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
    <section className="py-24 md:py-36 relative z-10">
      <EmojiParticle emoji="🎂" x="5%" y="10%" scale={1.2} delay={0.5} />
      <EmojiParticle emoji="✨" x="90%" y="80%" scale={1.5} delay={2} />

      <div className="container mx-auto px-4 md:px-6 max-w-6xl relative z-10">
        <div className="text-center mb-14 md:mb-20">
          <Reveal>
             <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter mb-4 drop-shadow-sm">対応ジャンル</h2>
             <p className="text-sm md:text-base text-slate-600 font-bold max-w-lg mx-auto leading-relaxed">アイドル、配信者、俳優、アニメイベントなど、様々なシーンのお祝いに対応しています。</p>
          </Reveal>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {CATEGORIES.map((cat, i) => (
            <Reveal key={cat.id} delay={i * 0.05} className="h-full">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={cn("h-full bg-white/80 backdrop-blur-xl border-2 rounded-[2rem] p-6 text-center cursor-pointer transition-colors duration-300 shadow-sm hover:shadow-xl", cat.border)}>
                <div className={cn("w-14 h-14 mx-auto rounded-[1.25rem] flex items-center justify-center mb-4 shadow-inner border border-white/50", cat.bg, cat.color)}>
                  <cat.icon size={24} strokeWidth={2} />
                </div>
                <h3 className="text-slate-800 font-black text-xs md:text-sm mb-1.5 leading-tight">{cat.name}</h3>
                <p className="text-slate-500 text-[9px] md:text-[10px] font-bold">{cat.jp}</p>
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
      script.setAttribute("data-limit", "6"); 
      script.async = true;
      container.appendChild(script);

      // React 18のStrict Modeでスタイルタグが二重に挿入されるのを防ぐ安全な処理
      if (container.querySelector('style')) return;
      const style = document.createElement('style');
      style.innerHTML = `
        #laru-blog-container > div { display: flex !important; flex-wrap: nowrap !important; overflow-x: auto !important; scroll-snap-type: x mandatory !important; -webkit-overflow-scrolling: touch !important; padding-bottom: 24px !important; margin: 0 -16px !important; padding-left: 16px !important; padding-right: 16px !important; gap: 20px !important; }
        #laru-blog-container > div::-webkit-scrollbar { display: none; }
        #laru-blog-container > div > div { flex: 0 0 auto !important; width: 85vw !important; max-width: 320px !important; scroll-snap-align: center !important; display: flex !important; flex-direction: column !important; height: 100% !important; border-radius: 24px !important; overflow: hidden !important; box-shadow: 0 4px 20px rgba(0,0,0,0.05) !important; background: white !important; }
        @media (min-width: 768px) {
          #laru-blog-container > div { margin: 0 !important; padding-left: 0 !important; padding-right: 0 !important; }
          #laru-blog-container > div > div { width: 340px !important; max-width: none !important; }
        }
        #laru-blog-container img { aspect-ratio: 16 / 9 !important; height: auto !important; object-fit: cover !important; }
      `;
      container.appendChild(style);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div ref={containerRef} className="w-full min-h-[400px] relative z-20">
       <div id="laru-blog-container"></div>
    </div>
  );
};

const ArticlesSection = () => (
  <section className="py-24 md:py-36 relative z-10">
    <div className="container mx-auto px-4 md:px-6 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 md:mb-14">
        <Reveal className="text-center md:text-left mb-6 md:mb-0">
          <span className="text-blue-500 font-mono text-xs font-black tracking-widest uppercase block mb-3">Knowledge Base</span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter">お役立ち情報・コラム</h2>
        </Reveal>
        
        <Link href="/blog" className="hidden md:block">
          <MagneticWrapper>
             <button className="px-8 py-4 rounded-full border border-slate-200 bg-white/80 backdrop-blur-md shadow-sm text-sm font-black text-slate-700 hover:text-blue-500 transition-all flex items-center gap-2">
               すべての記事を見る <ArrowRight size={16}/>
             </button>
          </MagneticWrapper>
        </Link>
      </div>

      <Reveal>
        <LaruSeoEmbed />
      </Reveal>

      <Link href="/blog" className="md:hidden flex justify-center mt-4">
        <motion.button whileTap={{ scale: 0.95 }} className="px-8 py-4 w-full rounded-full border border-slate-200 bg-white/80 backdrop-blur-md shadow-sm text-sm font-black text-slate-700 flex items-center justify-center gap-2 active:scale-95 transition-all">
          すべての記事を見る <ArrowRight size={16}/>
        </motion.button>
      </Link>
    </div>
  </section>
);

// --- 8. PARTNER CTA ---
const PartnerCTA = () => (
  <section className="py-24 md:py-36 bg-slate-950 relative z-10 overflow-hidden">
    <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-pink-500/10 mix-blend-screen filter blur-[100px] pointer-events-none" />
    <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-cyan-500/10 mix-blend-screen filter blur-[100px] pointer-events-none" />
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsPSIjRkZGRkZGIiBmaWxsLW9wYWNpdHk9IjAuNCI+PHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6bTIwIDIwaDIwdjIwSDIWMjB6TTAgMjBoMjB2MjBIMFYyMHoyMCAwaDIwdjIwSDIwVjB6Ii8+PC9nPjwvc3ZnPg==')" }} />

    <div className="container mx-auto px-4 md:px-6 max-w-5xl relative z-10">
      <Reveal>
        <div className="text-center mb-16 md:mb-24">
          <EmojiParticle emoji="🤝" x="45%" y="-40px" scale={1.5} delay={0.5} />
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tighter mt-8 drop-shadow-md">法人・クリエイターの皆様へ</h2>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-bold">
            FLASTALは、お花屋さん、ライブ会場、イベント主催者、イラストレーターとファンを繋ぐエコシステムです。初期費用・月額費用は一切かかりません。推しの活動をみんなで支えましょう。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
          {[
            { href: "/venues/login", title: "会場・ホールのご担当者様", desc: "搬入ルールの設定、お花屋さんとの連携", icon: Building, color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30", hoverBorder: "hover:border-blue-400" },
            { href: "/organizers/login", title: "イベント主催者様", desc: "お祝い花のレギュレーション周知・管理", icon: Ticket, color: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/30", hoverBorder: "hover:border-amber-400" },
            { href: "/florists/login", title: "お花屋さん", desc: "フラスタの受注管理・納品報告", icon: Store, color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30", hoverBorder: "hover:border-emerald-400" },
            { href: "/illustrators/login", title: "クリエイター様", desc: "イラストパネルの受注・納品", icon: PenTool, color: "text-pink-400", bg: "bg-pink-500/20", border: "border-pink-500/30", hoverBorder: "hover:border-pink-400" },
          ].map((role, i) => (
            <Link key={i} href={role.href} className="block group h-full">
              <div className={cn("bg-white/5 backdrop-blur-xl border rounded-[2rem] p-8 md:p-10 flex flex-col h-full transition-all duration-500 hover:-translate-y-2 hover:bg-white/10 hover:shadow-2xl", role.border, role.hoverBorder)}>
                <div className="flex items-start gap-5 mb-8">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 shadow-inner", role.bg, role.color)}>
                    <role.icon size={28} strokeWidth={2}/>
                  </div>
                  <div className="text-left mt-1">
                    <h3 className="text-lg md:text-xl font-black text-white mb-2 tracking-tight">{role.title}</h3>
                    <p className="text-slate-400 text-xs md:text-sm font-bold leading-relaxed">{role.desc}</p>
                  </div>
                </div>
                <div className="mt-auto pt-6 border-t border-white/10 flex justify-between items-center">
                  <span className="text-slate-300 font-black text-sm group-hover:text-white transition-colors">ログイン / 新規登録</span>
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white transition-colors">
                     <ArrowRight size={18} className="text-white group-hover:text-slate-900 transition-colors" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Reveal>
    </div>
  </section>
);

// ==========================================
// 👑 MAIN EXPORT (Page Assembler)
// ==========================================
export default function HomePage() {
  const [introFinished, setIntroFinished] = useState(false);

  return (
    <main className="bg-transparent min-h-screen text-slate-800 font-sans selection:bg-pink-200 selection:text-pink-600 relative overflow-hidden">

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

      {/* ★ 修正: React 18の標準的なスタイル定義に変更 */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&family=Parisienne&display=swap');
        
        :root {
          --font-sans: 'Zen Kaku Gothic New', 'Plus Jakarta Sans', sans-serif;
          --font-calligraphy: 'Parisienne', cursive;
        }

        body {
          font-family: var(--font-sans);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background-color: #fdfcff;
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

        /* Animation Keyframes */
        .animate-marquee { animation: marquee 25s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
        
        @keyframes blob { 
          0% { transform: translate(0px, 0px) scale(1); } 
          33% { transform: translate(30px, -50px) scale(1.1); } 
          66% { transform: translate(-20px, 20px) scale(0.9); } 
          100% { transform: translate(0px, 0px) scale(1); } 
        }
        .animate-blob { animation: blob 15s infinite alternate ease-in-out; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </main>
  );
}