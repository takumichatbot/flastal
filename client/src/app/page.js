'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from './contexts/AuthContext';
import { 
  motion, 
  useScroll, 
  useTransform, 
  useSpring, 
  useInView, 
  useAnimation, 
  AnimatePresence,
  useMotionValue,
  useMotionTemplate
} from 'framer-motion';

// 修正後
import { 
  Heart, Sparkles, Star, ArrowRight, Search, Users,
  Gift, MessageCircle, Clock, CheckCircle2, Ticket, 
  Crown, PenTool, Video, Music, MapPin, Store,
  ChevronRight, ArrowUpRight, Zap, Play, Image as ImageIcon,
  Shield, CreditCard, Flame, Sparkle, Command, Plus,
  ChevronDown, Loader2 // <-- この2つを追加
} from 'lucide-react';

// ==========================================
// 🛠️ UTILITIES & HELPER FUNCTIONS
// ==========================================
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// 画面サイズ取得フック
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({ width: undefined, height: undefined });
  useEffect(() => {
    function handleResize() { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return windowSize;
}

// マウス位置取得フック
function useMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const updateMousePosition = (e) => { setMousePosition({ x: e.clientX, y: e.clientY }); };
    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);
  return mousePosition;
}

// ==========================================
// 🎨 ULTRA-MODERN UI COMPONENTS
// ==========================================

// 1. カスタムカーソル (Blend Modeを使用した先進的なカーソル)
const CustomCursor = () => {
  const { x, y } = useMousePosition();
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseOver = (e) => {
      const target = e.target;
      if (target.tagName.toLowerCase() === 'a' || target.tagName.toLowerCase() === 'button' || target.closest('a') || target.closest('button')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };
    window.addEventListener('mouseover', handleMouseOver);
    return () => window.removeEventListener('mouseover', handleMouseOver);
  }, []);

  if (typeof window === 'undefined' || x === 0) return null;

  return (
    <>
      <motion.div 
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-slate-400/50 pointer-events-none z-[9999] mix-blend-difference hidden md:block flex items-center justify-center"
        animate={{ x: x - 16, y: y - 16, scale: isHovering ? 1.5 : 1, backgroundColor: isHovering ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0)' }}
        transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.5 }}
      />
      <motion.div 
        className="fixed top-0 left-0 w-2 h-2 bg-pink-500 rounded-full pointer-events-none z-[10000] hidden md:block"
        animate={{ x: x - 4, y: y - 4, scale: isHovering ? 0 : 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 28, mass: 0.1 }}
      />
    </>
  );
};

// 2. Magnetic Button (磁力のようにカーソルに吸い付くボタン)
const MagneticWrapper = ({ children, className }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
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

// 3. Spotlight Card (Appleライクなマウス追従グラデーションカード)
const SpotlightCard = ({ children, className, spotColor = "rgba(236, 72, 153, 0.15)" }) => {
  const divRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const opacity = isFocused ? 1 : 0;

  const handleMouseMove = (e) => {
    if (!divRef.current || isFocused) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => { setIsFocused(true); setIsHovered(true); };
  const handleBlur = () => { setIsFocused(false); setIsHovered(false); };
  const handleMouseEnter = () => { setIsFocused(true); };
  const handleMouseLeave = () => { setIsFocused(false); };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn("relative overflow-hidden rounded-[2rem] border border-slate-200/50 bg-white/50 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]", className)}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[2rem] opacity-0 transition duration-300"
        style={{ opacity, background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotColor}, transparent 40%)` }}
      />
      {children}
    </div>
  );
};

// 4. Split Text Reveal (次世代タイポグラフィアニメーション)
const SplitTextReveal = ({ text, className, delay = 0 }) => {
  const words = text.split(" ");
  
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: delay * 0.3 }
    })
  };

  const child = {
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", damping: 12, stiffness: 100 } },
    hidden: { opacity: 0, y: 40, filter: "blur(10px)" }
  };

  return (
    <motion.div style={{ overflow: "hidden", display: "flex", flexWrap: "wrap", justifyContent: "center" }} variants={container} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-10%" }} className={className}>
      {words.map((word, index) => (
        <motion.span variants={child} style={{ marginRight: "0.25em" }} key={index}>
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
};

// 5. Noise Overlay (ハイエンドな質感を出す微細なノイズ)
const NoiseOverlay = () => (
  <div className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
);

// 6. Fluid Mesh Gradient Background
const MeshGradient = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-pink-400/20 blur-[120px] mix-blend-multiply" />
    <motion.div animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute top-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-cyan-400/20 blur-[120px] mix-blend-multiply" />
    <motion.div animate={{ scale: [1.2, 1, 1.2], rotate: [90, 0, 90] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="absolute -bottom-[20%] left-[20%] w-[80vw] h-[80vw] rounded-full bg-purple-400/20 blur-[150px] mix-blend-multiply" />
  </div>
);

// 7. Reveal Animation (スクロールに合わせてふわっと出す)
const Reveal = ({ children, delay = 0, className }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const mainControls = useAnimation();

  useEffect(() => {
    if (isInView) {
      mainControls.start("visible");
    }
  }, [isInView, mainControls]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden w-full", className)}>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 30 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate={mainControls}
        transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
};

// ==========================================
// 📊 COMPLEX DUMMY DATA
// ==========================================

const CATEGORIES = [
  { id: 'idol', name: 'Idol / Artist', jp: 'アイドル・アーティスト', icon: Music, color: 'text-pink-500', bg: 'bg-pink-50', count: 124 },
  { id: 'vtuber', name: 'Virtual Creator', jp: 'VTuber・配信者', icon: Video, color: 'text-cyan-500', bg: 'bg-cyan-50', count: 89 },
  { id: 'stage', name: 'Stage / Musical', jp: '舞台・ミュージカル', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50', count: 56 },
  { id: 'voice', name: 'Voice Actor', jp: '声優・役者', icon: MessageCircle, color: 'text-amber-500', bg: 'bg-amber-50', count: 72 },
  { id: 'anime', name: 'Anime / Game', jp: 'アニメ・ゲームイベント', icon: Command, color: 'text-emerald-500', bg: 'bg-emerald-50', count: 45 },
  { id: 'anniversary', name: 'Anniversary', jp: '生誕祭・周年記念', icon: Crown, color: 'text-rose-500', bg: 'bg-rose-50', count: 210 },
];

const BENTO_FEATURES = [
  {
    title: "Zero Financial Risk",
    desc: "集金から花屋への支払いまで、システムが自動で安全に仲介。未払いや持ち逃げのリスクを完全にゼロにします。",
    span: "col-span-1 md:col-span-2 row-span-2",
    icon: Shield,
    color: "from-slate-800 to-slate-900",
    text: "text-white",
    visual: (
      <div className="absolute right-0 bottom-0 w-64 h-64 bg-gradient-to-tl from-emerald-400/30 to-transparent rounded-tl-full blur-2xl"></div>
    )
  },
  {
    title: "Anonymous Support",
    desc: "本名や住所は一切不要。ハンドルネームだけで気軽にお祝いに参加できます。",
    span: "col-span-1 md:col-span-1 row-span-1",
    icon: Users,
    color: "bg-white",
    text: "text-slate-800",
    visual: <div className="absolute -right-4 -bottom-4 opacity-10"><Users size={120} /></div>
  },
  {
    title: "Direct Order",
    desc: "審査済みのプロのフローリストへ直接発注。",
    span: "col-span-1 md:col-span-1 row-span-1",
    icon: Sparkles,
    color: "bg-gradient-to-br from-pink-500 to-rose-500",
    text: "text-white",
    visual: <div className="absolute right-4 bottom-4"><ArrowUpRight size={48} className="text-white/30" /></div>
  },
  {
    title: "Creator Matching",
    desc: "フラスタを彩るイラストパネル。サイト内で神絵師を探して、そのまま依頼・決済まで完結します。",
    span: "col-span-1 md:col-span-2 row-span-1",
    icon: PenTool,
    color: "bg-white",
    text: "text-slate-800",
    visual: (
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex -space-x-4">
        {[1,2,3].map(i => (
          <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-slate-100 shadow-md">
             <Image src={`https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop&sig=${i}`} alt="creator" width={48} height={48} className="rounded-full object-cover" />
          </div>
        ))}
        <div className="w-12 h-12 rounded-full border-4 border-white bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-md z-10">+99</div>
      </div>
    )
  }
];

const DUMMY_PROJECTS = [
  { id: "p1", title: "【祝・5周年】大好きなあのグループへ、アリーナ公演お祝いフラスタを贈ろう！", category: "Idol", target: 200000, current: 245000, percent: 122, days: 3, image: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=800&auto=format&fit=crop" },
  { id: "p2", title: "〇〇ちゃん お誕生日おめでとう！3Dライブ配信に向けたお祝い花企画", category: "VTuber", target: 150000, current: 85000, percent: 56, days: 12, image: "https://images.unsplash.com/photo-1519378018457-4c29a3a2ecdf?q=80&w=800&auto=format&fit=crop" },
  { id: "p3", title: "主演舞台『魔法の王国』ご出演祝い！千秋楽を彩るフラワースタンド計画", category: "Stage", target: 80000, current: 32000, percent: 40, days: 20, image: "https://images.unsplash.com/photo-1523690132227-ec1789725f44?q=80&w=800&auto=format&fit=crop" },
  { id: "p4", title: "念願のファンミーティング開催記念！ロビーをお花でいっぱいにしよう", category: "Voice Actor", target: 100000, current: 100000, percent: 100, days: 0, image: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=800&auto=format&fit=crop" },
  { id: "p5", title: "K-POPワールドツアー日本公演 応援バルーンスタンド企画", category: "Artist", target: 300000, current: 150000, percent: 50, days: 15, image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=800&auto=format&fit=crop" },
  { id: "p6", title: "新作アニメ放送開始記念！キャスト・スタッフへの感謝を込めて", category: "Anime", target: 50000, current: 65000, percent: 130, days: 2, image: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=800&auto=format&fit=crop" }
];

const REVIEWS = [
  { name: "Mika.T", role: "Planner", text: "お金の管理が不安でずっと踏み出せませんでしたが、FLASTALのおかげで夢だったフラスタを出すことができました。最高のエクスペリエンスです。", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150" },
  { name: "Kouta", role: "Supporter", text: "現場に行けなくても、推しにおめでとうを伝えられるのが嬉しい。UIが綺麗で、支援状況がリアルタイムで分かるのも安心感があります。", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150" },
  { name: "Lily Floral", role: "Florist", text: "予算が確保された状態でシステムから発注が来るため、未払いリスクがなく、私達も安心してお花づくりに専念できています。素晴らしいプラットフォームです。", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150" },
  { name: "Nana_Illust", role: "Creator", text: "パネルイラストの依頼をサイト内で直接受けられるのが最高です。報酬もポイントとして確実に支払われるので、安心して制作に打ち込めます。", img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=150" },
];


// ==========================================
// 🚀 PAGE SECTIONS
// ==========================================

// --- 1. INTRO LOADER (洗練されたローディング) ---
const IntroLoader = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => { onComplete(); }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-[99999] bg-slate-900 flex items-center justify-center flex-col"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: "-100vh" }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="overflow-hidden">
        <motion.h1 
          initial={{ y: 100 }} animate={{ y: 0 }} transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="text-4xl md:text-6xl font-black text-white tracking-[0.2em] uppercase font-sans"
        >
          FLASTAL
        </motion.h1>
      </div>
      <div className="w-48 h-px bg-slate-800 mt-6 relative overflow-hidden">
        <motion.div 
          initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
        />
      </div>
    </motion.div>
  );
};

// --- 2. HERO SECTION (Ultra Modern Spatial Design) ---
const Hero = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -100]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  return (
    <section className="relative w-full min-h-[100svh] flex items-center justify-center overflow-hidden bg-[#FAFAFC] pt-20 pb-12 z-10">
      <MeshGradient />
      
      <motion.div style={{ y: y1, opacity }} className="container relative z-10 max-w-7xl mx-auto px-4 md:px-6 flex flex-col items-center text-center">
        
        <Reveal delay={0.2}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 backdrop-blur-md border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.05)] mb-8">
            <Sparkle size={14} className="text-pink-500" />
            <span className="text-[10px] md:text-xs font-bold text-slate-600 tracking-[0.15em] uppercase">Crowdfunding for Oshikatsu</span>
          </div>
        </Reveal>

        <SplitTextReveal text="Empower Your Passion." className="text-5xl md:text-7xl lg:text-[6rem] font-black text-slate-900 tracking-tighter leading-[1.1] mb-6" delay={0.3} />
        
        <Reveal delay={0.5}>
          <h2 className="text-xl md:text-3xl font-bold text-slate-500 mb-10 tracking-tight">
            想いを集めて、<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">とびきりのフラスタ</span>を。
          </h2>
          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium mb-12">
            FLASTALは、推しへの「お祝い花」をファン同士で費用を出し合って贈れる、<br className="hidden md:block"/>
            次世代の推し活クラウドファンディングプラットフォームです。
          </p>
        </Reveal>

        <Reveal delay={0.6} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <MagneticWrapper>
            <Link href="/projects/create">
              <button className="group relative w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 bg-slate-900 text-white rounded-full font-bold text-sm md:text-base shadow-[0_10px_40px_rgba(0,0,0,0.2)] overflow-hidden transition-transform">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-violet-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  企画を立ち上げる <ArrowUpRight size={18} className="group-hover:rotate-45 transition-transform" />
                </span>
              </button>
            </Link>
          </MagneticWrapper>
          
          <MagneticWrapper>
            <Link href="/projects">
              <button className="group w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 bg-white text-slate-800 rounded-full font-bold text-sm md:text-base shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-100 hover:border-slate-300 transition-all flex items-center justify-center gap-2">
                <Search size={18} className="text-slate-400 group-hover:text-slate-800 transition-colors" /> 企画を探す
              </button>
            </Link>
          </MagneticWrapper>
        </Reveal>

      </motion.div>

      {/* Floating UI Elements (Parallax) */}
      <motion.div style={{ y: y2 }} className="absolute hidden lg:block right-[10%] top-[30%]">
        <SpotlightCard className="p-4 flex items-center gap-4 w-64 rotate-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 p-0.5 shadow-md">
             <div className="w-full h-full bg-white rounded-full flex items-center justify-center"><Heart className="text-pink-500 fill-pink-100" size={20}/></div>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Goal Reached</p>
            <p className="text-sm font-black text-slate-800">¥150,000 / 100%</p>
          </div>
        </SpotlightCard>
      </motion.div>

      <motion.div style={{ y: y1 }} className="absolute hidden lg:block left-[10%] bottom-[20%]">
        <SpotlightCard className="p-4 flex items-center gap-4 w-56 -rotate-3">
          <div className="flex -space-x-3">
             {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 shadow-sm" />)}
          </div>
          <p className="text-xs font-black text-slate-700">85人が参加中</p>
        </SpotlightCard>
      </motion.div>

    </section>
  );
};

// --- 3. INFINITE MARQUEE ---
const InfiniteMarquee = () => {
  const words = ["IDOL", "VTUBER", "STAGE", "VOICE ACTOR", "ANIME", "ANNIVERSARY", "LIVE TOUR"];
  return (
    <div className="py-6 md:py-10 bg-slate-900 overflow-hidden flex whitespace-nowrap border-y border-white/10 relative z-20">
      <motion.div className="flex items-center gap-8 md:gap-16" animate={{ x: [0, -1035] }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-8 md:gap-16">
            {words.map((word, j) => (
              <span key={j} className="text-4xl md:text-6xl font-black text-transparent tracking-widest" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)" }}>
                {word}
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// --- 4. BENTO FEATURES SECTION (次世代のBento UI) ---
const BentoFeatures = () => {
  return (
    <section className="py-24 md:py-32 bg-slate-50 relative z-10">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="mb-16">
          <span className="text-pink-500 font-mono text-sm font-bold tracking-widest uppercase block mb-4">Features</span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter leading-tight max-w-2xl">
            推し活をもっとスマートに。<br/>お金のトラブルをゼロに。
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[250px]">
          {BENTO_FEATURES.map((feat, i) => (
            <Reveal key={i} delay={i * 0.1} className={cn("rounded-[2.5rem] overflow-hidden relative group shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-200/50 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500", feat.span, feat.color)}>
              <div className="absolute inset-0 p-8 md:p-10 flex flex-col z-20">
                <feat.icon size={32} className={cn("mb-6", feat.text)} />
                <h3 className={cn("text-2xl font-black mb-3 tracking-tight", feat.text)}>{feat.title}</h3>
                <p className={cn("text-sm font-medium leading-relaxed max-w-sm", feat.text === 'text-white' ? 'text-white/80' : 'text-slate-500')}>{feat.desc}</p>
              </div>
              <div className="absolute inset-0 z-10 opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                {feat.visual}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- 5. TRENDING PROJECTS (Masonry/Grid + Spotlight) ---
const TrendingProjects = () => {
  return (
    <section className="py-24 md:py-32 bg-white relative z-10 border-t border-slate-100">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <span className="text-cyan-500 font-mono text-sm font-bold tracking-widest uppercase block mb-4">Trending</span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter">注目の企画</h2>
          </div>
          <Link href="/projects">
            <MagneticWrapper>
              <button className="px-6 py-3 rounded-full border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
                View All Projects <ArrowRight size={16}/>
              </button>
            </MagneticWrapper>
          </Link>
        </div>

        <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-12 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 gap-6">
          {DUMMY_PROJECTS.slice(0, 3).map((project, i) => (
            <Reveal key={project.id} delay={i * 0.15} className="min-w-[85vw] sm:min-w-[350px] md:min-w-0 snap-center">
              <Link href={`/projects`}>
                <SpotlightCard className="h-full flex flex-col group cursor-pointer border-slate-200/60 p-2 bg-slate-50/50">
                  <div className="relative aspect-[4/3] rounded-[1.5rem] overflow-hidden bg-slate-200">
                    <Image src={project.image} alt={project.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black tracking-widest uppercase text-slate-800 shadow-sm">
                        {project.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow bg-white rounded-[1.5rem] mt-2 shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 leading-snug mb-6 group-hover:text-pink-500 transition-colors line-clamp-2">{project.title}</h3>
                    <div className="mt-auto">
                      <div className="flex justify-between items-end mb-2">
                        <div className="text-sm font-black text-slate-800">¥{project.current.toLocaleString()}</div>
                        <div className="text-sm font-black font-mono text-slate-400">{project.percent}%</div>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} whileInView={{ width: `${Math.min(project.percent, 100)}%` }} transition={{ duration: 1.5, delay: 0.5 }} className="h-full bg-slate-800 rounded-full" />
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- 6. CATEGORIES (Interactive Grid) ---
const CategoryGrid = () => {
  return (
    <section className="py-24 bg-slate-900 relative z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
      <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-4">ジャンルから探す</h2>
          <p className="text-slate-400 font-medium">様々なシーンのお祝いに対応しています。</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat, i) => (
            <Reveal key={cat.id} delay={i * 0.05}>
              <div className="group relative bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-md rounded-3xl p-6 text-center cursor-pointer transition-all duration-300 hover:-translate-y-2">
                <div className={cn("w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", cat.bg, cat.color)}>
                  <cat.icon size={24} />
                </div>
                <h3 className="text-white font-bold text-sm mb-1">{cat.name}</h3>
                <p className="text-slate-400 text-[10px]">{cat.jp}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- 7. HOW IT WORKS (Vertical Timeline) ---
const HowItWorks = () => {
  const steps = [
    { num: "01", title: "企画を作成する", desc: "専用ページを作成し、目標金額やデザインの希望、お花屋さんを決定します。", icon: PenTool },
    { num: "02", title: "支援を集める", desc: "URLをSNSでシェア。参加者は1口1,000円から、クレジットカード等で匿名支援が可能です。", icon: Users },
    { num: "03", title: "お花を届ける", desc: "目標達成後、FLASTALが提携フローリストへ発注。当日は最高のお花が会場に届きます。", icon: Gift },
  ];

  return (
    <section className="py-24 md:py-32 bg-[#FAFAFC] relative z-10">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <div className="text-center mb-20">
          <span className="text-purple-500 font-mono text-sm font-bold tracking-widest uppercase block mb-4">Process</span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter">フラスタが届くまで</h2>
        </div>

        <div className="relative">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 -translate-x-1/2" />
          
          <div className="space-y-12 md:space-y-24">
            {steps.map((step, i) => (
              <Reveal key={i} delay={0.2} className="relative flex flex-col md:flex-row items-center justify-between group">
                {/* Connector Node */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white border-4 border-slate-100 rounded-full items-center justify-center z-10 group-hover:border-purple-300 transition-colors">
                  <div className="w-3 h-3 bg-purple-500 rounded-full" />
                </div>

                <div className={cn("w-full md:w-5/12", i % 2 === 0 ? "md:text-right md:pr-12" : "md:order-last md:text-left md:pl-12")}>
                  <div className={cn("inline-block mb-4", i % 2 === 0 ? "md:float-right" : "")}>
                    <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center -rotate-3 group-hover:rotate-0 transition-transform">
                      <step.icon size={28} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-3">{step.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                </div>

                <div className={cn("hidden md:block w-5/12", i % 2 === 0 ? "md:order-last md:text-left md:pl-12" : "md:text-right md:pr-12")}>
                  <span className="text-[6rem] font-black text-slate-100/50 font-serif leading-none select-none">{step.num}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// --- 8. TESTIMONIALS (Drag Carousel) ---
const Testimonials = () => {
  return (
    <section className="py-24 bg-white relative z-10 border-t border-slate-100 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter mb-16 text-center">ご利用いただいた皆様の声</h2>
        
        <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-12 -mx-4 px-4 md:mx-0 md:px-0 gap-6">
          {REVIEWS.map((review, i) => (
            <Reveal key={i} delay={i * 0.1} className="min-w-[85vw] sm:min-w-[350px] snap-center">
              <SpotlightCard className="p-8 h-full flex flex-col justify-between border-slate-100">
                <p className="text-slate-600 font-medium leading-relaxed mb-8 text-sm md:text-base">&quot;{review.text}&quot;</p>
                <div className="flex items-center gap-4 mt-auto">
                  <Image src={review.img} alt={review.name} width={48} height={48} className="rounded-full object-cover border-2 border-white shadow-sm" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{review.name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{review.role}</p>
                  </div>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- 9. ARTICLES (LARU SEO Embed) ---
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

const ArticlesSection = () => (
  <section className="py-24 bg-slate-50 border-y border-slate-200/50 relative z-10">
    <div className="container mx-auto px-4 md:px-6 max-w-6xl">
      <div className="text-center mb-12">
        <span className="text-sky-500 font-mono text-sm font-bold tracking-widest uppercase block mb-4">Knowledge Base</span>
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter">お役立ち情報・コラム</h2>
      </div>
      <Reveal>
        <div className="bg-white rounded-[2rem] p-4 md:p-8 shadow-sm border border-slate-100">
          <LaruSeoEmbed />
        </div>
      </Reveal>
    </div>
  </section>
);

// --- 10. PARTNER CTA (Dark Mode Contrast) ---
const PartnerCTA = () => (
  <section className="py-24 bg-white relative z-10">
    <div className="container mx-auto px-4 md:px-6 max-w-5xl">
      <Reveal>
        <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
              <Store className="text-white" size={32} />
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-white mb-6 tracking-tighter">クリエイター・法人の皆様へ</h2>
            <p className="text-slate-300 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
              FLASTALは、お花屋さん、イベント主催者、イラストレーターの皆様とファンを繋ぐ、全く新しいエコシステムを提供します。初期費用・月額費用は一切かかりません。
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { href: "/florists/register", label: "お花屋さんとして登録" },
                { href: "/organizers/register", label: "イベント主催者として登録" },
                { href: "/illustrators/register", label: "クリエイターとして登録" },
              ].map((btn, i) => (
                <Link key={i} href={btn.href}>
                  <button className="px-6 py-3 bg-white/10 hover:bg-white text-white hover:text-slate-900 text-sm font-bold rounded-full border border-white/20 transition-all backdrop-blur-md">
                    {btn.label}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);

// --- 11. FAQ ACCORDION ---
const FAQSection = () => {
  const faqs = [
    { q: "目標金額に届かなかった場合はどうなりますか？", a: "企画作成時に「All-in（集まった金額だけで実施）」か「All-or-Nothing（未達なら全額返金して中止）」のどちらかを選ぶことができます。" },
    { q: "利用手数料はかかりますか？", a: "企画の立ち上げや支援は無料です。企画が達成し、集まった金額をお花屋さんへ支払う際（または引き出す際）に、システム・決済手数料として計10%を頂戴します。" },
    { q: "本名や住所を隠して参加（支援）できますか？", a: "はい、可能です。FLASTALでは参加者も主催者もハンドルネームで活動でき、お花屋さんへの配送情報などはシステムが安全に仲介するため、個人情報が漏れることはありません。" }
  ];
  return (
    <section className="py-24 bg-[#FAFAFC] border-t border-slate-200/50 relative z-10">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <h2 className="text-3xl font-black text-slate-800 text-center mb-12 tracking-tighter">よくあるご質問</h2>
        <div className="space-y-4">
          {faqs.map((item, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <details className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 cursor-pointer outline-none marker:hidden">
                <summary className="flex items-center justify-between font-bold text-slate-800 list-none outline-none">
                  <span>{item.q}</span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 group-open:rotate-180 transition-transform">
                    <ChevronRight size={16} className="text-slate-400 group-open:hidden" />
                    <ChevronDown size={16} className="text-slate-400 hidden group-open:block" />
                  </div>
                </summary>
                <div className="mt-4 text-sm text-slate-500 leading-relaxed font-medium pt-4 border-t border-slate-50">{item.a}</div>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- 12. MASSIVE FOOTER ---
const Footer = () => (
  <footer className="bg-slate-950 pt-32 pb-12 relative z-10 overflow-hidden">
    <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-24">
        <div className="lg:col-span-1">
          <h2 className="text-3xl font-black text-white tracking-[0.2em] mb-6">FLASTAL</h2>
          <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xs">
            推しへの愛を、もっと自由に、もっと美しく。次世代の推し活クラウドファンディング。
          </p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6 tracking-widest uppercase text-xs">For Fans</h4>
          <ul className="space-y-4">
            <li><Link href="/projects" className="text-slate-400 hover:text-white text-sm transition-colors">企画を探す</Link></li>
            <li><Link href="/projects/create" className="text-slate-400 hover:text-white text-sm transition-colors">企画を立ち上げる</Link></li>
            <li><Link href="/login" className="text-slate-400 hover:text-white text-sm transition-colors">ログイン / 登録</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6 tracking-widest uppercase text-xs">For Creators & Business</h4>
          <ul className="space-y-4">
            <li><Link href="/florists/register" className="text-slate-400 hover:text-white text-sm transition-colors">お花屋さん向け</Link></li>
            <li><Link href="/illustrators/register" className="text-slate-400 hover:text-white text-sm transition-colors">イラストレーター向け</Link></li>
            <li><Link href="/organizers/register" className="text-slate-400 hover:text-white text-sm transition-colors">イベント主催者向け</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6 tracking-widest uppercase text-xs">Legal</h4>
          <ul className="space-y-4">
            <li><Link href="/terms" className="text-slate-400 hover:text-white text-sm transition-colors">利用規約</Link></li>
            <li><Link href="/privacy" className="text-slate-400 hover:text-white text-sm transition-colors">プライバシーポリシー</Link></li>
            <li><Link href="/tokushoho" className="text-slate-400 hover:text-white text-sm transition-colors">特定商取引法に基づく表記</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-slate-500 text-xs">© 2026 FLASTAL. All rights reserved.</p>
        <div className="flex gap-4">
          {/* Social Icons Placeholder */}
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-900 transition-all cursor-pointer">X</div>
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-900 transition-all cursor-pointer">IG</div>
        </div>
      </div>
    </div>
    
    {/* Giant Background Text */}
    <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none select-none opacity-5">
      <h1 className="text-[15vw] font-black text-white text-center leading-none tracking-tighter whitespace-nowrap translate-y-1/4">
        EMPOWER PASSION
      </h1>
    </div>
  </footer>
);

// ==========================================
// 👑 MAIN EXPORT (Page Assembler)
// ==========================================
export default function HomePage() {
  const { loading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="relative">
           <Loader2 className="w-12 h-12 text-white animate-spin opacity-20" />
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-2 h-2 bg-white rounded-full animate-ping" />
           </div>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-[#FAFAFC] min-h-screen text-slate-800 font-sans selection:bg-slate-900 selection:text-white">
      <AnimatePresence>
        {!introFinished && <IntroLoader onComplete={() => setIntroFinished(true)} />}
      </AnimatePresence>

      <NoiseOverlay />
      <CustomCursor />
      
      {/* ページ全体の構造 */}
      <Hero />
      <InfiniteMarquee />
      <BentoFeatures />
      <TrendingProjects />
      <CategoryGrid />
      <HowItWorks />
      <Testimonials />
      <ArticlesSection />
      <PartnerCTA />
      <FAQSection />
      <Footer />

      {/* グローバルスタイル（Modern Typography & Utilities） */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap');
        
        :root {
          --font-sans: 'Zen Kaku Gothic New', 'Plus Jakarta Sans', sans-serif;
        }

        body {
          font-family: var(--font-sans);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          cursor: none; /* Hide default cursor for custom cursor on desktop */
        }
        
        @media (max-width: 768px) {
          body { cursor: auto; } /* Re-enable default cursor on mobile */
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