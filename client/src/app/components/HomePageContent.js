'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  motion, useScroll, useTransform, useSpring, useInView, 
  useMotionValue, useMotionTemplate, AnimatePresence 
} from 'framer-motion';
import { 
  ArrowRight, Check, Play, MessageCircle, Layers, 
  Calendar, Users, Gift, ShieldCheck, Globe, 
  Sparkles, Zap, Heart, Star, Music, Search
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility: Tailwind Class Merger ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- 💎 Core Component: 3D Glass SVG Icons (No Images, Pure Code) ---
// これが「絵文字以上のもの」です。SVGグラデーションでガラスの質感を生成します。

const GlassShape = ({ type, className, delay = 0 }) => {
  const isHeart = type === 'heart';
  const isStar = type === 'star';
  const isGem = type === 'gem';
  const isBubble = type === 'bubble';

  // 浮遊アニメーション
  const floatAnim = {
    y: [0, -15, 0],
    rotate: [0, 5, -5, 0],
    scale: [1, 1.05, 1],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
      delay: delay
    }
  };

  return (
    <motion.div animate={floatAnim} className={cn("relative drop-shadow-2xl", className)}>
      <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
        <defs>
          {/* 共通: 内部の光彩 */}
          <radialGradient id={`glow-${type}`} cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="white" stopOpacity="0.9" />
            <stop offset="40%" stopColor={isHeart ? "#f472b6" : isStar ? "#facc15" : isGem ? "#38bdf8" : "#c084fc"} stopOpacity="0.5" />
            <stop offset="100%" stopColor={isHeart ? "#be185d" : isStar ? "#ca8a04" : isGem ? "#0284c7" : "#7e22ce"} stopOpacity="0.8" />
          </radialGradient>
          {/* 共通: 表面の反射 (ハイライト) */}
          <linearGradient id={`reflect-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.8" />
            <stop offset="20%" stopColor="white" stopOpacity="0.1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          {/* 共通: フチの光 (リムライト) */}
          <filter id={`blur-${type}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
        </defs>

        {/* シェイプ定義 */}
        <g style={{ filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.15))' }}>
          {isHeart && (
            <path d="M100 180 C20 100 0 50 50 20 C80 0 100 30 100 30 C100 30 120 0 150 20 C200 50 180 100 100 180 Z" fill={`url(#glow-${type})`} />
          )}
          {isStar && (
            <path d="M100 10 L125 70 L190 75 L140 115 L155 180 L100 145 L45 180 L60 115 L10 75 L75 70 Z" fill={`url(#glow-${type})`} />
          )}
          {isGem && (
            <path d="M50 50 L150 50 L190 100 L100 180 L10 100 Z" fill={`url(#glow-${type})`} />
          )}
          {isBubble && (
            <circle cx="100" cy="100" r="80" fill={`url(#glow-${type})`} />
          )}
          
          {/* ガラスの反射レイヤー (ツヤ) */}
          {isHeart && (
             <path d="M100 180 C20 100 0 50 50 20 C80 0 100 30 100 30" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
          )}
          {/* ハイライトの楕円 */}
          <ellipse cx="70" cy="60" rx="20" ry="10" fill="white" fillOpacity="0.4" transform="rotate(-45, 70, 60)" />
          <circle cx="130" cy="50" r="5" fill="white" fillOpacity="0.8" />
        </g>
      </svg>
    </motion.div>
  );
};

// --- ✨ Particle Background System ---
const Particles = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // クライアントサイドでのみ生成
    const count = 30;
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 20 + 10,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white mix-blend-overlay"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: 0.3,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

// --- 🖱️ Magnetic Button Component ---
const MagneticButton = ({ children, className, onClick }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  const { x, y } = position;
  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={cn("relative overflow-hidden", className)}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
};

// --- 📱 Tilt Card (Holographic) ---
const HolographicCard = ({ children, className }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    x.set(clientX - left - width / 2);
    y.set(clientY - top - height / 2);
  }

  return (
    <motion.div
      style={{ rotateX, rotateY, perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className={cn("relative transition-all duration-200 ease-out", className)}
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};


// --- 🚀 SECTIONS 🚀 ---

// 1. Ultra Hero Section
const HeroSection = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);

  return (
    <section className="relative w-full min-h-[110vh] flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[#0a0a0a]">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-purple-600/30 rounded-full blur-[120px] mix-blend-screen animate-blob" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-pink-500/30 rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-2000" />
        <div className="absolute top-[40%] left-[40%] w-[40vw] h-[40vw] bg-sky-500/20 rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-4000" />
      </div>
      
      <Particles />

      <div className="container relative z-10 px-6 mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: Text Content */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center lg:text-left"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
            </span>
            <span className="text-sky-300 text-sm font-bold tracking-wider">FLASTAL 2.0</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-[0.9] mb-8">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50">MAKE IT</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-purple-400 to-pink-400 drop-shadow-[0_0_30px_rgba(192,132,252,0.5)]">
              KAWAII &
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-yellow-400">
              FOREVER.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            推しへの想いを、ただの「支援」で終わらせない。<br/>
            世界一透明で、世界一美しい、<br/>
            ガラス細工のようなクラウドファンディング体験。
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
            <Link href="/create">
              <MagneticButton className="group px-10 py-5 bg-white text-black rounded-full font-bold text-lg shadow-[0_0_50px_-10px_rgba(255,255,255,0.6)]">
                <span className="relative z-10 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 transition-colors">
                  企画を始める
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-sky-200 via-purple-200 to-pink-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </MagneticButton>
            </Link>
            <Link href="/projects">
              <MagneticButton className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-full font-bold text-lg backdrop-blur-sm hover:bg-white/10">
                企画を探す
              </MagneticButton>
            </Link>
          </div>
        </motion.div>

        {/* Right: 3D Visuals */}
        <div className="relative h-[600px] hidden lg:block perspective-1000">
          <motion.div style={{ y: y1, x: 50 }} className="absolute top-0 right-10 w-64 h-64 z-20">
            <GlassShape type="heart" />
          </motion.div>
          <motion.div style={{ y: y2 }} className="absolute bottom-20 left-10 w-48 h-48 z-10">
            <GlassShape type="gem" />
          </motion.div>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/10 rounded-full z-0 border-dashed opacity-30" />
          
          {/* Main Hero Card Mockup */}
          <motion.div 
            initial={{ rotateY: 45, opacity: 0 }}
            animate={{ rotateY: -10, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute top-1/4 left-1/4 w-[400px] h-[500px] bg-slate-900/80 backdrop-blur-xl border border-white/20 rounded-[40px] shadow-2xl p-6 flex flex-col z-10"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Mockup Content */}
            <div className="w-full h-48 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1490750967868-58cb75069ed6?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-80 group-hover:scale-110 transition-transform duration-700"></div>
              <div className="absolute bottom-4 right-4 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-white">
                あと3日
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-4 w-2/3 bg-white/10 rounded-full" />
              <div className="h-4 w-1/2 bg-white/10 rounded-full" />
            </div>
            <div className="mt-auto">
               <div className="flex justify-between items-end mb-2">
                 <span className="text-sky-400 font-bold text-2xl">125%</span>
                 <span className="text-slate-400 text-sm">Goal: ¥100,000</span>
               </div>
               <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: "100%" }}
                   transition={{ duration: 2, delay: 1 }}
                   className="h-full bg-gradient-to-r from-sky-400 to-pink-500" 
                 />
               </div>
            </div>
            {/* Floating Element */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute -right-12 top-20 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center gap-3 shadow-xl"
            >
              <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center">🎉</div>
              <div className="text-white text-sm font-bold">
                Masato.K<br/><span className="text-xs font-normal text-slate-300">Supported!</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// --- 2. Infinite Marquee (Social Proof) ---
const Marquee = () => {
  return (
    <div className="bg-[#0a0a0a] py-8 border-y border-white/5 overflow-hidden relative z-20">
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10" />
      
      <motion.div 
        className="flex gap-16 whitespace-nowrap"
        animate={{ x: [0, -1000] }}
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
      >
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex gap-16 items-center">
            {['TOTAL SUPPORT: ¥12,400,000+', 'ACTIVE PROJECTS: 450+', 'HAPPY IDOLS: 8,000+', 'NEW FLOWER SHOPS: 120+'].map((text, j) => (
              <div key={j} className="flex items-center gap-4">
                <Star className="text-yellow-400 fill-yellow-400 w-6 h-6" />
                <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-500 font-mono tracking-tighter">
                  {text}
                </span>
              </div>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// --- 3. Features: The "Bento Grid" Reimagined ---
const FeaturesSection = () => {
  return (
    <section className="py-32 bg-[#050505] relative">
      <div className="container mx-auto px-6">
        <div className="mb-24 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-block"
          >
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Future is <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">Crystal Clear.</span>
            </h2>
            <p className="text-slate-400 text-xl">
              「まさか」を「あたりまえ」にする、魔法のような機能たち。
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-3 gap-6 h-[1200px] md:h-[800px]">
          
          {/* Feature 1: AI Assistant (Large) */}
          <HolographicCard className="md:col-span-2 md:row-span-2 rounded-[40px] p-10 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 h-full flex flex-col">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center backdrop-blur-md border border-indigo-500/30 mb-6">
                <Sparkles className="w-8 h-8 text-indigo-300" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">AI Concierge</h3>
              <p className="text-slate-300 mb-8">
                文章が苦手でも大丈夫。最新のAIが、出演者の心を揺さぶる<br/>「エモい」メッセージや企画文を数秒で代筆します。
              </p>

              {/* AI Chat Simulation */}
              <div className="mt-auto bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 font-mono text-sm relative overflow-hidden">
                <div className="flex gap-3 mb-4">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
                <div className="space-y-3 text-slate-300">
                  <p><span className="text-green-400">User:</span> 感動的なお礼のメッセージを書いて</p>
                  <p><span className="text-purple-400">AI:</span> 承知しました。以下のような文面はいかがでしょう？</p>
                  <p className="text-white typing-effect border-l-2 border-sky-400 pl-3">
                    &quot;ステージ上の輝きは、私たちの明日への道標でした。この花束に、言葉にできない感謝を込めて...&quot;
                  </p>
                </div>
              </div>
            </div>
            
            <GlassShape type="star" className="absolute -bottom-10 -right-10 w-64 h-64 opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
          </HolographicCard>

          {/* Feature 2: AR (Tall) */}
          <HolographicCard className="md:row-span-2 rounded-[40px] p-8 overflow-hidden group relative">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550645614-8f35475db63e?auto=format&fit=crop&q=80')] bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-700 opacity-50" />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
             
             <div className="relative z-10 h-full flex flex-col justify-end">
                <div className="w-12 h-12 rounded-xl bg-sky-500 flex items-center justify-center mb-4 shadow-[0_0_20px_theme(colors.sky.500)]">
                  <Zap className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">AR Preview</h3>
                <p className="text-slate-400 text-sm mt-2">
                  スマホをかざせば、そこはもう会場。<br/>
                  フラスタのサイズ感や色味を<br/>
                  拡張現実でリアルに確認。
                </p>
             </div>
          </HolographicCard>

          {/* Feature 3: Global (Wide) */}
          <HolographicCard className="md:col-span-2 rounded-[40px] p-8 flex items-center justify-between overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800">
             <div className="relative z-10">
               <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                 <Globe className="text-emerald-400" /> Global Support
               </h3>
               <p className="text-slate-400 mt-2">海外ファンからの支援も、自動翻訳と多通貨決済でシームレスに。</p>
             </div>
             <div className="flex gap-2">
               {['USD', 'EUR', 'JPY', 'KRW', 'CNY'].map((cur, i) => (
                 <div key={i} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
                   {cur}
                 </div>
               ))}
             </div>
          </HolographicCard>

          {/* Feature 4: Security (Small) */}
          <HolographicCard className="rounded-[40px] p-8 bg-slate-900 flex flex-col justify-center items-center text-center">
             <ShieldCheck className="w-12 h-12 text-rose-400 mb-4" />
             <h3 className="text-xl font-bold text-white">Safe & Secure</h3>
             <p className="text-xs text-slate-400 mt-1">返金保証制度完備。</p>
          </HolographicCard>

        </div>
      </div>
    </section>
  );
};

// --- 4. The "Journey" (Interactive Roadmap) ---
const JourneySection = () => {
  return (
    <section className="py-32 bg-[#050505] overflow-hidden text-white relative">
      <div className="container mx-auto px-6">
         <h2 className="text-center text-4xl md:text-6xl font-bold mb-32">
           <span className="text-sky-400">Flow</span> of Emotion
         </h2>
         
         <div className="relative">
            {/* Connecting Line (Snake) */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-sky-500 via-purple-500 to-pink-500 -translate-x-1/2 hidden md:block opacity-30" />
            
            {[
              { title: "Launch", desc: "AIと共に、3分で企画ページ公開。", icon: "rocket", color: "sky" },
              { title: "Share", desc: "SNSで仲間を集める。招待はリンク一つで。", icon: "share", color: "indigo" },
              { title: "Connect", desc: "花屋さんとチャットでデザイン相談。", icon: "message", color: "purple" },
              { title: "Bloom", desc: "当日、あなたの想いが会場を彩る。", icon: "flower", color: "pink" }
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -100 : 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className={`flex items-center gap-12 mb-32 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} flex-col`}
              >
                 <div className="flex-1 text-center md:text-right">
                   {i % 2 === 0 && (
                     <>
                      <h3 className={`text-4xl font-bold text-${step.color}-400 mb-4`}>{step.title}</h3>
                      <p className="text-xl text-slate-300">{step.desc}</p>
                     </>
                   )}
                 </div>
                 
                 <div className="relative">
                   <div className={`w-24 h-24 rounded-full bg-${step.color}-500 blur-xl absolute inset-0 opacity-50 animate-pulse`} />
                   <div className="w-24 h-24 rounded-full bg-[#0a0a0a] border-4 border-white/10 relative z-10 flex items-center justify-center text-3xl">
                     {i + 1}
                   </div>
                 </div>

                 <div className="flex-1 text-center md:text-left">
                  {i % 2 !== 0 && (
                     <>
                      <h3 className={`text-4xl font-bold text-${step.color}-400 mb-4`}>{step.title}</h3>
                      <p className="text-xl text-slate-300">{step.desc}</p>
                     </>
                   )}
                 </div>
              </motion.div>
            ))}
         </div>
      </div>
    </section>
  );
};


// --- 5. Gallery (Parallax Effect) ---
const GallerySection = () => {
  const { scrollYProgress } = useScroll();
  const x = useTransform(scrollYProgress, [0, 1], [0, -500]);
  
  const images = [
    "https://images.unsplash.com/photo-1563241527-3002b76364f6?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1533616688419-b7a585564566?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1457089328109-e5d9bd499191?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507290439931-a861b5a38200?auto=format&fit=crop&q=80",
  ];

  return (
    <section className="py-24 bg-[#0a0a0a] overflow-hidden">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-white">Gallery of Dreams</h2>
      </div>
      <motion.div style={{ x }} className="flex gap-8 px-8 w-max">
        {images.map((src, i) => (
          <div key={i} className="w-[300px] md:w-[500px] h-[400px] rounded-3xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={src} 
              alt="Project" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
            />
            <div className="absolute bottom-6 left-6 z-20">
              <p className="text-white font-bold text-lg">Project #{100 + i}</p>
              <div className="flex text-yellow-400">★★★★★</div>
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  );
};


// --- 6. Final CTA (Glassmorphism Bomb) ---
const FinalCTA = () => {
  return (
    <section className="relative py-48 overflow-hidden bg-black flex flex-col items-center justify-center text-center">
      {/* Background Shapes */}
      <GlassShape type="heart" className="absolute top-10 left-10 w-48 h-48 opacity-50 blur-sm" delay={0} />
      <GlassShape type="bubble" className="absolute bottom-10 right-10 w-64 h-64 opacity-50 blur-sm" delay={2} />
      
      <div className="relative z-10 max-w-4xl px-6">
        <h2 className="text-6xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-pink-400 to-yellow-400 mb-12">
          READY?
        </h2>
        <p className="text-2xl text-slate-300 mb-12">
          あなたの「好き」という気持ちは、<br/>
          世界で一番強いエネルギーです。
        </p>
        
        <Link href="/create">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="px-16 py-8 rounded-full bg-white text-black text-2xl font-bold shadow-[0_0_100px_theme(colors.sky.500)] hover:shadow-[0_0_150px_theme(colors.pink.500)] transition-all duration-500"
          >
            今すぐ始める
          </motion.button>
        </Link>
      </div>
    </section>
  );
};

// --- Footer ---
const Footer = () => {
  return (
    <footer className="bg-black text-white pt-24 pb-12 border-t border-white/10">
      <div className="container mx-auto px-6 grid md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <h3 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-pink-400">FLASTAL</h3>
          <p className="text-slate-500 max-w-sm">
            推し活を、もっと自由に、もっと美しく。<br/>
            次世代のクラウドファンディング＆フラワースタンド支援プラットフォーム。
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-4">Platform</h4>
          <ul className="space-y-2 text-slate-400 text-sm">
            <li className="hover:text-white cursor-pointer">企画を探す</li>
            <li className="hover:text-white cursor-pointer">企画を立てる</li>
            <li className="hover:text-white cursor-pointer">成功事例</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4">Support</h4>
          <ul className="space-y-2 text-slate-400 text-sm">
            <li className="hover:text-white cursor-pointer">ヘルプセンター</li>
            <li className="hover:text-white cursor-pointer">利用規約</li>
            <li className="hover:text-white cursor-pointer">プライバシーポリシー</li>
          </ul>
        </div>
      </div>
      <div className="text-center mt-24 text-slate-600 text-xs">
        © 2025 FLASTAL Inc. All rights reserved. Made with ❤️ and Glass.
      </div>
    </footer>
  );
};


// --- 👑 MAIN EXPORT ---
export default function HomePageContent() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen text-slate-200 selection:bg-pink-500 selection:text-white font-sans">
      <HeroSection />
      <Marquee />
      <FeaturesSection />
      <JourneySection />
      <GallerySection />
      <FinalCTA />
      <Footer />
    </div>
  );
}