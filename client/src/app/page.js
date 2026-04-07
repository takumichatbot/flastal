'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  motion, 
  useScroll, 
  useTransform, 
  AnimatePresence
} from 'framer-motion';

import { 
  Heart, Sparkles, ArrowRight, Search, Users,
  Gift, MessageCircle, Clock, Crown, PenTool, Video, Music, MapPin, Store,
  ChevronRight, ChevronDown, ArrowUpRight, Shield, Command, KeyRound, Building, Star
} from 'lucide-react';

// ==========================================
// 🛠️ UTILITIES & HELPER FUNCTIONS
// ==========================================
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function useWindowSize() {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    function handleResize() { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return windowSize;
}

function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);
  return isMounted;
}

// ==========================================
// 🎨 ULTRA-MODERN & OSHI-KATSU UI COMPONENTS
// ==========================================

const MagneticWrapper = ({ children, className }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isMounted = useIsMounted();
  const { width } = useWindowSize();

  const handleMouse = (e) => {
    if (!isMounted || !ref.current || width < 1024) return;
    const { clientX, clientY } = e;
    const { height, width: elemWidth, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + elemWidth / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
  };

  const reset = () => { setPosition({ x: 0, y: 0 }); };

  if (!isMounted) return <div className={className}>{children}</div>;

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

const SpotlightCard = ({ children, className, spotColor = "rgba(236, 72, 153, 0.15)" }) => {
  const divRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isMounted = useIsMounted();
  const { width } = useWindowSize();
  
  const opacity = isMounted && isFocused ? 1 : 0;

  const handleMouseMove = (e) => {
    if (!isMounted || !divRef.current || isFocused || width < 1024) return;
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
      className={cn("relative overflow-hidden rounded-[2.5rem] border border-slate-200/50 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)]", className)}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-[2.5rem] transition duration-300 hidden lg:block"
        style={{ opacity, background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotColor}, transparent 40%)` }}
      />
      {children}
    </div>
  );
};

const Reveal = ({ children, delay = 0, className = "" }) => {
  const isMounted = useIsMounted();
  if (!isMounted) return <div className={className}>{children}</div>;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 0.6, delay, ease: "easeOut" }} className={className}>
      {children}
    </motion.div>
  );
};

const SplitTextReveal = ({ text, className, delay = 0 }) => {
  const words = text.split(" ");
  const isMounted = useIsMounted();

  const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: delay } } };
  const child = { visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", damping: 12, stiffness: 100 } }, hidden: { opacity: 0, y: 20, filter: "blur(5px)" } };

  if (!isMounted) return <div className={className}>{text}</div>;

  return (
    <motion.div style={{ overflow: "hidden", display: "flex", flexWrap: "wrap", justifyContent: "center" }} variants={container} initial="hidden" whileInView="visible" viewport={{ once: true }} className={className}>
      {words.map((word, index) => (
        <motion.span variants={child} style={{ marginRight: "0.25em" }} key={index}>{word}</motion.span>
      ))}
    </motion.div>
  );
};

// ==========================================
// 🎀 EMOJI PARTICLE
// ==========================================
const EmojiParticle = ({ emoji, delay = 0, x = "0%", y = "0%", scale = 1 }) => {
  const isMounted = useIsMounted();
  if (!isMounted) return null;

  return (
    <motion.div
      className="absolute opacity-0 pointer-events-none drop-shadow-md select-none"
      style={{ top: y, left: x, scale, fontSize: '2.5rem' }}
      animate={{ 
        opacity: [0, 0.8, 0.5, 0.8, 0],
        y: ["0px", "-40px", "-20px", "-40px", "-60px"],
        rotate: [0, 15, -15, 15, 0]
      }}
      transition={{ 
        duration: 8, 
        delay: delay, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
    >
      {emoji}
    </motion.div>
  );
};

// ==========================================
// 📊 DUMMY DATA
// ==========================================
const CATEGORIES = [
  { id: 'idol', name: 'Idol / Artist', jp: 'アイドル・アーティスト', icon: Music, color: 'text-pink-500', bg: 'bg-pink-50' },
  { id: 'vtuber', name: 'Virtual Creator', jp: 'VTuber・配信者', icon: Video, color: 'text-cyan-500', bg: 'bg-cyan-50' },
  { id: 'stage', name: 'Stage / Musical', jp: '舞台・ミュージカル', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'voice', name: 'Voice Actor', jp: '声優・役者', icon: MessageCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
  { id: 'anime', name: 'Anime / Game', jp: 'アニメ・ゲームイベント', icon: Command, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'anniversary', name: 'Anniversary', jp: '生誕祭・周年記念', icon: Crown, color: 'text-rose-500', bg: 'bg-rose-50' },
];

const DUMMY_PROJECTS = [
  { id: "p1", title: "【祝・5周年】大好きなあのグループへ、アリーナ公演お祝いフラスタを贈ろう！", category: "Idol", target: 200000, current: 245000, percent: 122, days: 3, image: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=800&auto=format&fit=crop" },
  { id: "p2", title: "〇〇ちゃん お誕生日おめでとう！3Dライブ配信に向けたお祝い花企画", category: "VTuber", target: 150000, current: 85000, percent: 56, days: 12, image: "https://images.unsplash.com/photo-1519378018457-4c29a3a2ecdf?q=80&w=800&auto=format&fit=crop" },
  { id: "p3", title: "主演舞台『魔法の王国』ご出演祝い！千秋楽を彩るフラワースタンド計画", category: "Stage", target: 80000, current: 32000, percent: 40, days: 20, image: "https://images.unsplash.com/photo-1523690132227-ec1789725f44?q=80&w=800&auto=format&fit=crop" },
  { id: "p4", title: "念願のファンミーティング開催記念！ロビーをお花でいっぱいにしよう", category: "Voice Actor", target: 100000, current: 100000, percent: 100, days: 0, image: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=800&auto=format&fit=crop" },
];

// ==========================================
// 🚀 PAGE SECTIONS
// ==========================================

// --- 0. INTRO LOADER (★ 黒画面を撤廃し、サクサク開く) ---
const IntroLoader = ({ onComplete }) => {
  useEffect(() => { 
    // アニメーション全体を短縮し、1.6秒でサクッとアンマウントさせる
    const timer = setTimeout(onComplete, 1600); 
    return () => clearTimeout(timer); 
  }, [onComplete]);

  return (
    // ★ 背景を透明にし、後ろのメインコンテンツが見えるようにする
    <motion.div 
      className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-none"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
    >
      
      {/* --- 左側のレースカーテン --- */}
      <motion.div 
        className="absolute inset-y-0 left-0 w-1/2 bg-[#FDF2F8] shadow-[20px_0_50px_rgba(244,114,182,0.4)] z-10 origin-left"
        initial={{ x: 0, skewX: 0 }}
        animate={{ x: "-100%", skewX: -5 }} 
        transition={{ duration: 1.0, delay: 0.4, ease: [0.76, 0, 0.24, 1] }} // ★ タイミングを高速化
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(244,114,182,0.05) 50%, rgba(0,0,0,0) 100%),
            url('https://www.transparenttextures.com/patterns/french-stucco.png')
          `
        }}
      >
        <div className="absolute top-0 bottom-0 -right-10 w-12 h-full drop-shadow-xl overflow-hidden">
          <svg width="100%" height="100%" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="lace-left" x="0" y="0" width="48" height="60" patternUnits="userSpaceOnUse">
                <path d="M0,0 C24,0 48,15 48,30 C48,45 24,60 0,60 Z" fill="#FDF2F8" />
                <circle cx="15" cy="30" r="5" fill="transparent" stroke="#FBCFE8" strokeWidth="2" />
                <circle cx="30" cy="30" r="3" fill="#FBCFE8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#lace-left)" />
          </svg>
        </div>
      </motion.div>

      {/* --- 右側のレースカーテン --- */}
      <motion.div 
        className="absolute inset-y-0 right-0 w-1/2 bg-[#FDF2F8] shadow-[-20px_0_50px_rgba(244,114,182,0.4)] z-10 origin-right"
        initial={{ x: 0, skewX: 0 }}
        animate={{ x: "100%", skewX: 5 }} 
        transition={{ duration: 1.0, delay: 0.4, ease: [0.76, 0, 0.24, 1] }} // ★ タイミングを高速化
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(244,114,182,0.05) 50%, rgba(0,0,0,0) 100%),
            url('https://www.transparenttextures.com/patterns/french-stucco.png')
          `
        }}
      >
        <div className="absolute top-0 bottom-0 -left-10 w-12 h-full drop-shadow-xl overflow-hidden">
          <svg width="100%" height="100%" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="lace-right" x="0" y="0" width="48" height="60" patternUnits="userSpaceOnUse">
                <path d="M48,0 C24,0 0,15 0,30 C0,45 24,60 48,60 Z" fill="#FDF2F8" />
                <circle cx="33" cy="30" r="5" fill="transparent" stroke="#FBCFE8" strokeWidth="2" />
                <circle cx="18" cy="30" r="3" fill="#FBCFE8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#lace-right)" />
          </svg>
        </div>
      </motion.div>

      {/* --- 中央のロゴ (奥へ吸い込まれて消える) --- */}
      <motion.div 
        className="absolute z-20 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.8 }} 
        // ★ ズームインスピードを上げ、サクッと消える
        animate={{ opacity: [0, 1, 0], scale: [0.8, 1, 2.5] }} 
        transition={{ duration: 1.3, times: [0, 0.3, 1], ease: "easeIn" }}
      >
        <span className="font-calligraphy text-3xl md:text-4xl text-pink-400 mb-2 drop-shadow-sm">Welcome to</span>
        <h1 className="text-4xl md:text-7xl font-black text-pink-500 tracking-[0.3em] font-serif-jp drop-shadow-lg">
          FLASTAL
        </h1>
      </motion.div>
      
    </motion.div>
  );
};

// --- Main Content Wrapper ( IntroLoader 後ろに配置し、一緒に奥から浮かび上がる ) ---
const MainContent = () => {
  return (
    <motion.div
      // ★ カーテンが開くタイミング(delay: 0.4)に合わせて、全体が奥からフワッと浮かび上がる
      initial={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
    >
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

// --- 1. HERO SECTION ---
const Hero = () => {
  const { scrollY } = useScroll();
  const isMounted = useIsMounted();
  const { width } = useWindowSize();

  const y1 = useTransform(scrollY, [0, 1000], [0, 150]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  return (
    <section className="relative w-full min-h-[100svh] flex items-center justify-center overflow-hidden bg-[#FFF8FA] pt-20 pb-12 z-10">
      
      <EmojiParticle emoji="🎀" x="15%" y="25%" scale={1.2} delay={0} />
      <EmojiParticle emoji="🎂" x="80%" y="60%" scale={1.1} delay={1.5} />
      <EmojiParticle emoji="💖" x="25%" y="75%" scale={0.9} delay={3} />
      <EmojiParticle emoji="✨" x="85%" y="20%" scale={1.3} delay={0.5} />
      <EmojiParticle emoji="👑" x="50%" y="85%" scale={1.2} delay={2.2} />

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[150vw] md:w-[70vw] h-[150vw] md:h-[70vw] rounded-full bg-pink-300/15 blur-[80px] md:blur-[120px] mix-blend-multiply animate-pulse" />
        <div className="absolute top-[20%] -right-[10%] w-[120vw] md:w-[60vw] h-[120vw] md:h-[60vw] rounded-full bg-violet-300/15 blur-[80px] md:blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDelay: "2s" }} />
      </div>
      
      <motion.div style={isMounted && width >= 1024 ? { y: y1, opacity } : {}} className="container relative z-10 max-w-5xl mx-auto px-4 md:px-6 flex flex-col items-center text-center">
        <Reveal delay={0.1}>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white backdrop-blur-md border border-slate-100 shadow-sm mb-6 md:mb-8">
            <Sparkles size={16} className="text-pink-500" />
            <span className="text-[11px] md:text-xs font-extrabold text-slate-700 tracking-widest uppercase">愛を叫ぼう。お花に乗せて。</span>
          </div>
        </Reveal>

        {/* ★ 変更点: 霞んだチャコール (text-slate-700) をキープ */}
        <SplitTextReveal text="Celebrate with Flowers." className="text-4xl sm:text-5xl md:text-8xl font-black text-slate-700 tracking-tighter leading-[1.05] mb-4 md:mb-6" delay={0.2} />
        
        <Reveal delay={0.4}>
          <h2 className="text-lg sm:text-xl md:text-3xl font-extrabold text-slate-600 mb-6 md:mb-10 tracking-tight leading-snug">
            推しの特別な日に、ファンみんなで<br className="sm:hidden"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">とびきりのフラスタ</span>を贈ろう。
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium mb-10 md:mb-14 px-2">
            「おめでとう」の気持ちを、大きなお花に変えて届けよう。<br/>
            FLASTALは、ファン同士で想いを形にするクラウドファンディングです。
          </p>
        </Reveal>

        <Reveal delay={0.5} className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto px-4 sm:px-0">
          <MagneticWrapper className="w-full sm:w-auto">
            <Link href="/projects/create" className="block w-full">
              <button className="group relative w-full sm:w-auto px-9 md:px-11 py-4 md:py-5 bg-slate-950 text-white rounded-full font-extrabold text-sm md:text-base shadow-[0_10px_30px_rgba(0,0,0,0.15)] overflow-hidden transition-transform">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-violet-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Crown size={18} className="text-pink-300" /> 企画を立ち上げる <ArrowUpRight size={18} className="group-hover:rotate-45 transition-transform" />
                </span>
              </button>
            </Link>
          </MagneticWrapper>
          
          <MagneticWrapper className="w-full sm:w-auto">
            <Link href="/projects" className="block w-full">
              <button className="group w-full sm:w-auto px-9 md:px-11 py-4 md:py-5 bg-white text-slate-800 rounded-full font-extrabold text-sm md:text-base shadow-sm border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-center gap-2">
                <Search size={18} className="text-slate-400 group-hover:text-slate-800 transition-colors" /> 参加する企画を探す
              </button>
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
    <div className="py-5 md:py-9 bg-slate-950 overflow-hidden flex whitespace-nowrap border-y border-white/5 relative z-20">
      <div className="flex items-center gap-6 md:gap-16 animate-marquee">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-6 md:gap-16">
            {words.map((word, j) => (
              <React.Fragment key={j}>
                <span className="text-2xl md:text-5xl font-black text-transparent tracking-widest" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.1)" }}>
                  {word}
                </span>
                <Heart size={20} className="text-pink-600/30 mx-2" fill="currentColor" />
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
      <style jsx global>{`
        .animate-marquee { animation: marquee 30s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
      `}</style>
    </div>
  );
};

// --- 3. HOW IT WORKS ---
const HowItWorks = () => {
  const steps = [
    { num: "01", title: "企画ページをつくる", desc: "イベントの日程や会場、贈りたいお花のイメージを入力してページを公開します。", icon: PenTool, color: "text-pink-500", bg: "bg-pink-100" },
    { num: "02", title: "SNSでシェアして集金", desc: "みんなでお金を出し合います。クレジットカード対応で、面倒な口座管理は不要です。", icon: Heart, color: "text-violet-500", bg: "bg-violet-100" },
    { num: "03", title: "お花屋さんがお届け", desc: "目標達成後、FLASTAL提携のプロのお花屋さんが制作し、直接会場へお届けします。", icon: Gift, color: "text-sky-500", bg: "bg-sky-100" },
  ];

  return (
    <section className="py-24 md:py-36 bg-white relative z-10">
      
      {/* 花びら装飾 */}
      <div className="absolute top-1/4 left-0 w-24 h-24 bg-pink-100 rounded-full blur-3xl opacity-60" />
      <div className="absolute bottom-1/4 right-0 w-32 h-32 bg-sky-100 rounded-full blur-3xl opacity-60" />

      <div className="container mx-auto px-4 md:px-6 max-w-5xl relative z-10">
        <div className="text-center mb-16 md:mb-28">
          <span className="text-violet-500 font-mono text-xs font-bold tracking-widest uppercase block mb-3">Process</span>
          <h2 className="text-3xl md:text-6xl font-black text-slate-800 tracking-tighter">フラスタが届くまで</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14">
          {steps.map((step, i) => (
            <Reveal key={i} delay={i * 0.15} className="relative flex flex-col items-center text-center group">
              <div className="absolute top-12 left-1/2 w-full h-0.5 bg-slate-100 -z-10 hidden md:block" />
              <div className={cn("w-24 h-24 rounded-3xl flex items-center justify-center mb-7 shadow-sm border border-white relative z-10 transition-transform duration-500 group-hover:-translate-y-3", step.bg, step.color)}>
                <step.icon size={36} strokeWidth={1.5} />
              </div>
              <span className="font-mono text-4xl font-black text-slate-200 mb-2">{step.num}</span>
              <h3 className="text-xl md:text-2xl font-extrabold text-slate-800 mb-4">{step.title}</h3>
              <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed px-3">{step.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- 4. TRENDING PROJECTS ---
const TrendingProjects = () => {
  return (
    <section className="py-24 md:py-36 bg-slate-50 relative z-10 border-t border-slate-100">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-14 gap-6">
          <div>
            <span className="text-pink-500 font-mono text-xs font-bold tracking-widest uppercase block mb-3">Trending</span>
            <h2 className="text-3xl md:text-6xl font-black text-slate-800 tracking-tighter">注目の企画</h2>
          </div>
          <Link href="/projects" className="hidden md:block">
            <MagneticWrapper>
              <button className="px-7 py-4 rounded-full border border-slate-200 text-sm font-extrabold text-slate-600 hover:bg-white transition-colors flex items-center gap-2">
                すべての企画を見る <ArrowRight size={18}/>
              </button>
            </MagneticWrapper>
          </Link>
        </div>

        <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-8 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 gap-5 md:gap-6">
          {DUMMY_PROJECTS.map((project, i) => (
            <Reveal key={project.id} delay={i * 0.1} className="min-w-[85vw] sm:min-w-[320px] md:min-w-0 snap-center">
              <Link href={`/projects`}>
                <SpotlightCard className="h-full flex flex-col group cursor-pointer border-slate-200/60 p-2.5 bg-white">
                  <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden bg-slate-100">
                    <Image src={project.image} alt={project.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="absolute top-4 left-4">
                      <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] md:text-xs font-black tracking-widest uppercase text-slate-800 shadow-sm">
                        {project.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-grow mt-2">
                    <h3 className="text-sm md:text-base font-extrabold text-slate-800 leading-snug mb-5 group-hover:text-pink-500 transition-colors line-clamp-2">{project.title}</h3>
                    <div className="mt-auto">
                      <div className="flex justify-between items-end mb-2.5">
                        <div className="text-base font-black text-slate-800">¥{project.current.toLocaleString()}</div>
                        <div className="text-xs font-black font-mono text-slate-400">{project.percent}%</div>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} whileInView={{ width: `${Math.min(project.percent, 100)}%` }} transition={{ duration: 1.5, delay: 0.2 }} className="h-full bg-slate-900 rounded-full" />
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </Link>
            </Reveal>
          ))}
        </div>
        
        <Link href="/projects" className="md:hidden flex justify-center mt-5">
          <button className="px-7 py-4 w-full rounded-full border border-slate-200 text-sm font-extrabold text-slate-600 bg-white flex items-center justify-center gap-2 shadow-sm">
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
      title: "集金トラブルをゼロに。",
      desc: "クレジットカードやPayPay等での自動集金。主催者が個人の銀行口座を公開する必要はありません。",
      span: "col-span-1 md:col-span-2 row-span-1 md:row-span-2",
      icon: Shield,
      color: "bg-slate-950",
      text: "text-white",
      descColor: "text-white/80",
      iconColor: "text-emerald-400",
      visual: (
        <>
          <div className="absolute right-0 bottom-0 w-64 h-64 bg-gradient-to-tl from-emerald-400/20 to-transparent rounded-tl-full blur-2xl"></div>
        </>
      )
    },
    {
      title: "完全匿名で参加",
      desc: "本名や住所は不要。安心して推し活を楽しめます。",
      span: "col-span-1 md:col-span-1 row-span-1",
      icon: KeyRound,
      color: "bg-white",
      text: "text-slate-800",
      descColor: "text-slate-500",
      iconColor: "text-pink-500",
      visual: <div className="absolute -right-4 -bottom-4 opacity-5"><KeyRound size={120} /></div>
    },
    {
      title: "神絵師に依頼",
      desc: "イラストパネルの作成を、サイト内で絵師に直接依頼できます。",
      span: "col-span-1 md:col-span-1 row-span-1",
      icon: PenTool,
      color: "bg-white",
      text: "text-slate-800",
      descColor: "text-slate-500",
      iconColor: "text-violet-500",
      visual: <div className="absolute right-4 bottom-4 opacity-5"><Command size={80} /></div>
    }
  ];

  return (
    <section className="py-24 md:py-36 bg-white relative z-10 border-t border-slate-100">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="mb-14 md:mb-20">
          <span className="text-emerald-500 font-mono text-xs font-bold tracking-widest uppercase block mb-3">Safety & Features</span>
          <h2 className="text-3xl md:text-6xl font-black text-slate-800 tracking-tighter leading-tight max-w-2xl">
            裏方の面倒な作業は、<br/>すべてFLASTALにお任せ。
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-7 auto-rows-auto md:auto-rows-[280px]">
          {features.map((feat, i) => (
            <Reveal key={i} delay={i * 0.1} className={cn("rounded-[2.5rem] overflow-hidden relative group shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-200/50 hover:shadow-lg transition-all duration-500", feat.span, feat.color)}>
              <div className="absolute inset-0 p-8 md:p-10 flex flex-col z-20">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border", feat.text === 'text-white' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100', feat.iconColor)}>
                  <feat.icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className={cn("text-xl md:text-2xl font-black mb-2 tracking-tight", feat.text)}>{feat.title}</h3>
                <p className={cn("text-sm md:text-base font-medium leading-relaxed max-w-sm", feat.descColor)}>{feat.desc}</p>
              </div>
              <div className="absolute inset-0 z-10 opacity-70 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                {feat.visual}
              </div>
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
    <section className="py-24 md:py-32 bg-[#FAF9FF] relative z-10 border-t border-slate-100">
      
      <EmojiParticle emoji="🎂" x="5%" y="10%" scale={1.2} delay={0.5} />
      <EmojiParticle emoji="✨" x="90%" y="80%" scale={1.5} delay={2} />

      <div className="container mx-auto px-4 md:px-6 max-w-6xl relative z-10">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter mb-4">対応ジャンル</h2>
          <p className="text-sm md:text-base text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">アイドル、配信者、俳優、アニメイベントなど、様々なシーンのお祝いに対応しています。</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
          {CATEGORIES.map((cat, i) => (
            <Reveal key={cat.id} delay={i * 0.05}>
              <div className="group bg-white border border-slate-100 hover:border-violet-200 rounded-3xl p-5 md:p-7 text-center cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md">
                <div className={cn("w-12 h-12 md:w-14 md:h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", cat.bg, cat.color)}>
                  <cat.icon className="w-6 h-6 md:w-7 md:h-7" strokeWidth={1.5} />
                </div>
                <h3 className="text-slate-800 font-extrabold text-xs md:text-sm mb-1.5">{cat.name}</h3>
                <p className="text-slate-400 text-[10px] md:text-xs">{cat.jp}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- 7. ARTICLES (LARU SEO Embed) ---
const LaruSeoEmbed = () => {
  const containerRef = useRef(null);
  const isMounted = useIsMounted();
  
  useEffect(() => {
    if (!isMounted) return;
    const container = containerRef.current;
    if (!container || container.querySelector('script')) return;
    
    const script = document.createElement('script');
    script.src = "https://larubot.tokyo/embed/blog.js";
    script.setAttribute("data-id", "e19ed703-6238-49a5-ac83-c92c522a44cd");
    script.async = true;
    container.appendChild(script);
    
    return () => { if (container && container.contains(script)) container.removeChild(script); };
  }, [isMounted]);

  return <div ref={containerRef} className="w-full min-h-[300px] md:min-h-[400px]"></div>;
};

const ArticlesSection = () => (
  <section className="py-24 md:py-36 bg-white relative z-10 border-t border-slate-100">
    <div className="container mx-auto px-4 md:px-6 max-w-6xl">
      <div className="text-center mb-14">
        <span className="text-blue-500 font-mono text-xs font-bold tracking-widest uppercase block mb-3">Knowledge Base</span>
        <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter">お役立ち情報・コラム</h2>
      </div>
      <Reveal>
        <div className="bg-[#FAFBFD] rounded-3xl md:rounded-[3rem] p-5 md:p-10 border border-slate-100">
          <LaruSeoEmbed />
        </div>
      </Reveal>
    </div>
  </section>
);

// --- 8. PARTNER CTA ---
const PartnerCTA = () => (
  <section className="py-24 md:py-28 bg-slate-950 relative z-10 overflow-hidden border-t border-white/5">
    
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsPSIjRkZGRkZGIiBmaWxsLW9wYWNpdHk9IjAuNCI+PHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6bTIwIDIwaDIwdjIwSDIWMjB6TTAgMjBoMjB2MjBIMFYyMHoyMCAwaDIwdjIwSDIwVjB6Ii8+PC9nPjwvc3ZnPg==')" }} />

    <div className="container mx-auto px-4 md:px-6 max-w-5xl relative z-10">
      <Reveal>
        <div className="text-center mb-14 md:mb-18">
          <EmojiParticle emoji="🎀" x="45%" y="-40px" scale={1.5} delay={0.5} />
          
          <h2 className="text-3xl md:text-5xl font-black text-white mb-5 tracking-tighter mt-8">法人・クリエイターの皆様へ</h2>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-medium">
            FLASTALは、お花屋さん、ライブ会場、イベント主催者、イラストレーターとファンを繋ぐエコシステムです。初期費用・月額費用は一切かかりません。推しの活動をみんなで支えましょう。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7">
          <Link href="/venues/login" className="col-span-1 md:col-span-2 group">
            <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/20 rounded-3xl p-7 md:p-9 flex flex-col md:flex-row items-center justify-between hover:bg-blue-900/40 transition-colors duration-300">
              <div className="flex items-center gap-5 mb-5 md:mb-0">
                <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center shrink-0 border border-blue-500/20">
                  <Building size={28} strokeWidth={1.5}/>
                </div>
                <div className="text-left">
                  <h3 className="text-xl md:text-2xl font-black text-white mb-1.5">会場・ホールのご担当者様</h3>
                  <p className="text-blue-200/80 text-xs md:text-sm font-medium">搬入ルールの設定、お花屋さんとの連携はこちら</p>
                </div>
              </div>
              <button className="w-full md:w-auto px-7 py-4 bg-blue-600 text-white text-sm font-extrabold rounded-full flex items-center justify-center gap-2 group-hover:scale-105 transition-transform shadow-lg shadow-blue-900/30">
                ログイン / 新規登録 <ArrowRight size={18} />
              </button>
            </div>
          </Link>

          {[
            { href: "/florists/register", label: "お花屋さんとして登録", icon: Store, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { href: "/illustrators/register", label: "クリエイターとして登録", icon: PenTool, color: "text-pink-400", bg: "bg-pink-500/10" },
          ].map((btn, i) => (
            <Link key={i} href={btn.href} className="group">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-7 flex items-center gap-5 hover:bg-white/10 transition-colors h-full">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border", btn.bg, btn.color, 'border-white/10')}>
                  <btn.icon size={22} strokeWidth={1.5} />
                </div>
                <span className="text-slate-200 font-extrabold text-sm md:text-base group-hover:text-white transition-colors">{btn.label}</span>
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
  const [isMounted, setIsMounted] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) return null; 

  return (
    <main className="bg-[#FFFDFE] min-h-screen text-slate-800 font-sans selection:bg-pink-100 selection:text-pink-500">
      
      {/* ★ 変更点: mode="wait" は削除せず、IntroLoader と MainContent が独立して動くようにする */}
      <AnimatePresence>
        {!introFinished && <IntroLoader key="loader" onComplete={() => setIntroFinished(true)} />}
      </AnimatePresence>

      <AnimatePresence>
        {introFinished && <MainContent key="content" />}
      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&family=Parisienne&display=swap');
        
        :root {
          --font-sans: 'Zen Kaku Gothic New', 'Plus Jakarta Sans', sans-serif;
          --font-calligraphy: 'Parisienne', cursive; /* お洒落な筆記体 */
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