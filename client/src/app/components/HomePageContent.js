'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { 
  motion, useScroll, useSpring, useMotionValue, useTransform, AnimatePresence 
} from 'framer-motion';

import { 
  Sparkles, MessageCircle, Calendar, Users, ShieldCheck, 
  ChevronDown, Star, Search, Flower, CreditCard, Lock, 
  ArrowRight, CheckCircle2, HelpCircle, Store, MapPin, Ticket, Loader2,
  Bell, User, LogOut, Heart, Menu, X, LayoutDashboard
} from 'lucide-react';

import { FiActivity, FiGift, FiTruck, FiCheckCircle, FiTrendingUp, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// --- 🪄 MAGIC UI COMPONENTS ---

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return (
    <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-400 via-purple-400 to-sky-400 origin-left z-[100000] shadow-[0_0_20px_rgba(244,114,182,0.6)]" style={{ scaleX }} />
  );
};

const MagicCursor = () => {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      setHidden(false);
    };
    const hideCursor = () => setHidden(true);
    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseleave', hideCursor);
    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseleave', hideCursor);
    };
  }, [cursorX, cursorY]);

  return (
    <motion.div
      className={cn("fixed top-0 left-0 w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-sky-400 blur-xl pointer-events-none z-[90] mix-blend-multiply transition-opacity duration-500 hidden md:block", hidden ? "opacity-0" : "opacity-60")}
      style={{ x: cursorX, y: cursorY, translateX: '-50%', translateY: '-50%' }}
    />
  );
};

const Reveal = ({ children, delay = 0, width = "100%" }) => (
  <motion.div
    initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    viewport={{ once: true, margin: "-20px" }}
    transition={{ duration: 0.7, delay, type: "spring", bounce: 0.2 }}
    style={{ width }}
  >
    {children}
  </motion.div>
);

const TiltCard = ({ children, className, glowColor = "pink" }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    x.set(clientX - left - width / 2);
    y.set(clientY - top - height / 2);
  }

  const glows = {
    pink: "group-hover:shadow-pink-200/60",
    sky: "group-hover:shadow-sky-200/60",
    purple: "group-hover:shadow-purple-200/60",
    emerald: "group-hover:shadow-emerald-200/60",
  };

  return (
    <motion.div
      style={{ rotateX, rotateY, perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className={cn("relative transition-all duration-300 ease-out group hover:z-10 h-full", className)}
    >
      <div className={cn("transition-shadow duration-300 hover:shadow-2xl h-full rounded-[30px] bg-white", glows[glowColor])}>
        {children}
      </div>
    </motion.div>
  );
};

const FloatingShape = ({ color, top, left, right, bottom, size, delay = 0 }) => (
  <motion.div 
    style={{ top, left, right, bottom, width: size, height: size }}
    className={cn("absolute rounded-full blur-[80px] opacity-40 pointer-events-none mix-blend-multiply z-0", color)}
    animate={{ y: [0, -40, 0], scale: [1, 1.1, 0.9, 1], rotate: [0, 20, -20, 0] }}
    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay }}
  />
);

const SectionHeader = ({ en, ja, desc, color = "pink" }) => {
  const colors = {
    pink: "text-pink-500 from-pink-400 to-rose-400 border-pink-100",
    blue: "text-sky-500 from-sky-400 to-blue-400 border-sky-100",
    purple: "text-purple-500 from-purple-400 to-indigo-400 border-purple-100",
    green: "text-emerald-500 from-emerald-400 to-teal-400 border-emerald-100",
  };
  
  return (
    <div className="text-center mb-12 md:mb-24 relative z-10 px-4">
      <Reveal>
        <span className={cn("inline-block font-bold tracking-[0.2em] uppercase text-[10px] md:text-sm mb-4 font-mono px-4 py-1.5 rounded-full bg-white border shadow-sm", colors[color].split(" ")[0], colors[color].split(" ")[3])}>
          ✨ {en}
        </span>
        <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-4 md:mb-6 leading-tight">
          {ja}
        </h2>
        <div className={cn("h-1 w-16 md:w-24 mx-auto rounded-full bg-gradient-to-r mb-6 md:mb-8 opacity-80", colors[color].split(" ").slice(1, 3).join(" "))} />
        {desc && (
          <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed text-sm md:text-base font-medium">
            {desc}
          </p>
        )}
      </Reveal>
    </div>
  );
};

const KawaiiButton = ({ children, variant = "primary", icon: Icon, className, onClick }) => {
  const base = "relative px-6 md:px-8 py-3.5 md:py-4 rounded-full font-bold text-base md:text-lg shadow-lg transition-all overflow-hidden group flex items-center justify-center gap-2 active:scale-95";
  const styles = {
    primary: "bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 text-white shadow-pink-200 hover:shadow-pink-300",
    secondary: "bg-white text-slate-700 border-2 border-slate-100 hover:border-sky-300 hover:text-sky-500",
    outline: "bg-transparent border-2 border-white text-white hover:bg-white/20",
  };

  return (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={cn(base, styles[variant], className)} onClick={onClick}>
      {Icon && <Icon size={18} className="transition-transform group-hover:rotate-12" />}
      <span className="relative z-10">{children}</span>
      {variant === 'primary' && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shine" />}
    </motion.button>
  );
};

// --- 🚀 HERO & SECTIONS ---

const HeroSection = () => (
  /* 修正ポイント: ヒーローセクション上部の強制マージン・パディングを削除 */
  <section className="relative w-full min-h-[80vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden bg-white border-none m-0 p-0 z-10">
    <div className="absolute inset-0 bg-[radial-gradient(#e0f2fe_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
    <FloatingShape color="bg-pink-200" top="-5%" left="-5%" size={500} />
    <FloatingShape color="bg-sky-200" bottom="-5%" right="-5%" size={500} delay={2} />

    <div className="container relative z-10 px-6 py-10 md:py-20 grid lg:grid-cols-12 gap-10 items-center mx-auto">
      <div className="lg:col-span-7 text-center lg:text-left">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-md border border-pink-50 mb-6 mx-auto lg:mx-0">
            <span className="flex h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-[10px] md:text-xs font-bold text-slate-500 tracking-wide uppercase">Oshikatsu Update 2.0</span>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-slate-800 leading-tight mb-6 tracking-tight">
            想いを、<br/>
            <span className="relative inline-block px-1">
              <span className="absolute inset-0 bg-pink-200 -rotate-1 rounded-lg blur-sm opacity-40" />
              <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">結晶化</span>
            </span>
            しよう。
          </h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="text-sm md:text-xl text-slate-500 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
            FLASTAL（フラスタル）は、アイドル・声優・VTuber・歌い手への「お祝い花（フラスタ）」を、ファンのみんなで贈れる次世代クラウドファンディング・プラットフォームです。
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link href="/projects/create" className="w-full sm:w-auto"><KawaiiButton variant="primary" icon={Sparkles} className="w-full">無料で企画を立てる</KawaiiButton></Link>
            <Link href="/projects" className="w-full sm:w-auto"><KawaiiButton variant="secondary" icon={Search} className="w-full">企画を探す</KawaiiButton></Link>
          </div>
        </Reveal>
      </div>

      <div className="lg:col-span-5 relative hidden lg:block">
        <TiltCard>
          <motion.div initial={{ rotateY: 20, opacity: 0 }} animate={{ rotateY: -5, opacity: 1 }} transition={{ duration: 1.2 }} className="bg-white rounded-[40px] shadow-2xl border-4 border-white overflow-hidden">
             <div className="h-80 bg-slate-200 relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
               <div className="absolute bottom-6 left-6 text-white">
                 <span className="bg-pink-500 px-2 py-0.5 rounded text-[10px] font-bold mb-2 inline-block uppercase">Now Funding</span>
                 <h3 className="text-2xl font-bold">銀河一のフラスタを！</h3>
               </div>
             </div>
             <div className="p-6">
               <div className="flex justify-between items-end mb-4"><span className="text-2xl font-black text-slate-800">¥125,000</span><span className="text-pink-500 font-bold text-sm bg-pink-50 px-2 py-1 rounded">125% 達成!</span></div>
               <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4"><motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2, delay: 0.5 }} className="h-full bg-pink-500" /></div>
               <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest"><span><Users size={12} className="inline mr-1"/> 48 Supporters</span><span><Calendar size={12} className="inline mr-1"/> 5 Days Left</span></div>
             </div>
          </motion.div>
        </TiltCard>
      </div>
    </div>
  </section>
);

// --- 🏠 MAIN EXPORT COMPONENT ---
export default function HomePageContent() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 w-full">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-4" />
        <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase animate-pulse">Initializing System...</p>
      </div>
    );
  }

  return (
    <div className="bg-white text-slate-800 font-sans selection:bg-pink-100 selection:text-pink-600 m-0 p-0 w-full relative">
      <ScrollProgress />
      <MagicCursor />

      {isAuthenticated ? (
        <AuthenticatedHome user={user} logout={logout} />
      ) : (
        <main className="flex flex-col m-0 p-0 relative isolate">
          <HeroSection />

          {/* --- TICKER GENRES --- */}
          <div className="bg-slate-900 py-4 overflow-hidden relative border-y-2 border-pink-500 z-20 shadow-xl rotate-[-1deg] scale-[1.02] my-12">
            <motion.div className="flex gap-8 whitespace-nowrap" animate={{ x: [0, -1000] }} transition={{ repeat: Infinity, duration: 30, ease: "linear" }}>
                {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-12 items-center">
                    {["#地下アイドル", "#VTuber", "#歌い手", "#コンカフェ", "#生誕祭", "#周年ライブ", "#e-Sports", "#K-POP", "#2.5次元"].map((g, j) => (
                    <span key={j} className="text-sm md:text-lg font-bold text-slate-300 flex items-center gap-2">
                        <Star size={14} className="text-yellow-400 fill-current" /> {g}
                    </span>
                    ))}
                </div>
                ))}
            </motion.div>
          </div>

          {/* --- CULTURE SECTION --- */}
          <section className="py-20 md:py-32 bg-white relative overflow-hidden">
            <div className="container mx-auto px-6">
                <SectionHeader en="Otaku Culture" ja="どんなお花を贈る？" color="pink" />
                <div className="flex overflow-x-auto pb-8 md:grid md:grid-cols-4 gap-6 snap-x no-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
                {[
                    { title: "フラワースタンド", en: "Flower Stand", icon: "💐", desc: "ライブ会場のロビーを彩る定番。派手に装飾し、推しのメンカラ一色に。" },
                    { title: "卓上（楽屋花）", en: "Desktop", icon: "🧺", desc: "楽屋や受付に飾るコンパクトな贈り物。個人的な想いを込めて。" },
                    { title: "イラストパネル", en: "Panel", icon: "🎨", desc: "絵師に依頼した等身大パネルをお花に添えます。二次元界隈では必須！" },
                    { title: "祭壇・デコ", en: "Decor", icon: "🧸", desc: "ぬいぐるみやグッズを盛り込んだ、愛の重さが伝わる独自デザイン。" }
                ].map((item, i) => (
                    <div key={i} className="min-w-[280px] md:min-w-0 snap-center">
                    <TiltCard glowColor="pink">
                        <div className="bg-slate-50 rounded-[30px] p-8 text-center border border-slate-100 h-full flex flex-col items-center group">
                        <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                        <h3 className="font-bold text-slate-800 text-lg mb-1">{item.title}</h3>
                        <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-4">{item.en}</p>
                        <p className="text-sm text-slate-500 leading-relaxed text-left flex-grow">{item.desc}</p>
                        </div>
                    </TiltCard>
                    </div>
                ))}
                </div>
            </div>
          </section>

          {/* --- PROBLEM/SOLUTION --- */}
          <section className="py-20 md:py-32 bg-slate-50 relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <SectionHeader en="Pain & Solution" ja="企画の「大変」をゼロに" color="blue" />
                <div className="grid lg:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto items-stretch">
                <div className="bg-white p-8 md:p-10 rounded-[30px] border border-slate-200 opacity-80 h-full">
                    <h3 className="text-lg font-bold text-slate-400 mb-6 flex items-center gap-2">従来のやり方 😰</h3>
                    <ul className="space-y-4 md:space-y-6">
                    {["DMでの集金・口座管理の手間", "未入金の催促が気まずい", "本名や住所がバレるリスク"].map((t, i) => (
                        <li key={i} className="flex gap-3 text-slate-400 text-sm md:text-base items-center"><div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-xs font-bold">×</div>{t}</li>
                    ))}
                    </ul>
                </div>
                <TiltCard glowColor="sky">
                    <div className="bg-gradient-to-br from-white to-sky-50 p-8 md:p-10 rounded-[30px] border-2 border-sky-100 shadow-xl h-full relative overflow-hidden">
                    <h3 className="text-xl md:text-2xl font-bold text-sky-600 mb-6 flex items-center gap-2">FLASTALなら ✨</h3>
                    <ul className="space-y-4 md:space-y-6">
                        {["シェアするだけで集金完了", "完全匿名・クレカ決済対応", "収支報告もワンクリック"].map((t, i) => (
                        <li key={i} className="flex gap-3 text-slate-700 font-bold text-sm md:text-base items-center"><div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-md"><CheckCircle2 size={12} /></div>{t}</li>
                        ))}
                    </ul>
                    </div>
                </TiltCard>
                </div>
            </div>
          </section>

          {/* --- FEATURES --- */}
          <section className="py-20 md:py-32 bg-white">
            <div className="container mx-auto px-6">
                <SectionHeader en="Features" ja="推し活専用の最強機能" color="purple" />
                <div className="flex overflow-x-auto pb-8 md:grid md:grid-cols-3 gap-6 snap-x no-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
                {[
                    { title: "2つの開催方式", icon: <CreditCard />, desc: "All-in(必ず実施)とAll-or-Nothing(達成時のみ)から選択可能。" },
                    { title: "限定チャット", icon: <MessageCircle />, desc: "参加者だけの秘密の会議室。サプライズの相談もバレずに進行。" },
                    { title: "花屋マッチング", icon: <Flower />, desc: "推し活に理解のある提携フローリストを簡単に検索・発注。" }
                ].map((f, i) => (
                    <div key={i} className="min-w-[280px] md:min-w-0 snap-center">
                    <TiltCard glowColor="purple">
                        <div className="bg-slate-50 rounded-[30px] p-8 border border-slate-100 h-full flex flex-col">
                        <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center text-purple-500 mb-6 shadow-sm">{f.icon}</div>
                        <h3 className="text-xl font-bold text-slate-800 mb-3">{f.title}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed text-left flex-grow">{f.desc}</p>
                        </div>
                    </TiltCard>
                    </div>
                ))}
                </div>
            </div>
          </section>

          {/* --- SAFETY --- */}
          <section className="py-20 bg-emerald-50 relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <SectionHeader en="Trust & Safety" ja="安心への取り組み" color="green" />
                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        { title: "完全匿名配送", icon: Lock, desc: "主催者の個人情報が店舗や第三者に渡ることはありません。" },
                        { title: "安全なStripe決済", icon: CreditCard, desc: "世界基準の決済システムを採用。カード情報は保存されません。" },
                        { title: "運営の全件審査", icon: ShieldCheck, desc: "不適切な企画を未然に防ぐため、すべての企画を目視で審査。" }
                    ].map((item, i) => (
                        <Reveal key={i} delay={i * 0.1}>
                        <div className="bg-white p-8 rounded-[30px] shadow-sm text-center h-full border border-emerald-100">
                            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600"><item.icon size={24} /></div>
                            <h3 className="font-bold text-slate-800 mb-4">{item.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                        </div>
                        </Reveal>
                    ))}
                </div>
            </div>
          </section>

          {/* --- PARTNERS --- */}
          <section className="py-20 md:py-32 bg-white overflow-hidden">
            <div className="container mx-auto px-6">
                <SectionHeader en="For Professionals" ja="FLASTALのエコシステム" color="purple" />
                <div className="flex overflow-x-auto pb-8 md:grid md:grid-cols-3 gap-6 snap-x no-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
                {[
                    { title: "お花屋さん", icon: <Store />, color: "pink", hrefL: "/florists/login", hrefR: "/florists/register", desc: "未払いリスクゼロで売上UP。推し花需要を取り込みませんか？" },
                    { title: "会場・ホール", icon: <MapPin />, color: "sky", hrefL: "/venues/login", hrefR: "/venues/register", desc: "トラブル防止に。公式規定を周知し、許可された花のみ受取。" },
                    { title: "イベント主催", icon: <Ticket />, color: "purple", hrefL: "/organizers/login", hrefR: "/organizers/register", desc: "ファンの応援企画を公認。安全な応援文化を醸成します。" }
                ].map((p, i) => (
                    <div key={i} className="min-w-[280px] md:min-w-0 snap-center">
                    <TiltCard glowColor={p.color}>
                        <div className={cn("p-8 rounded-[30px] border shadow-lg text-center h-full flex flex-col bg-white border-slate-100")}>
                        <div className={cn("w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md text-slate-500")}>{p.icon}</div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">{p.title}</h3>
                        <p className="text-xs text-slate-400 mb-6 flex-grow leading-relaxed">{p.desc}</p>
                        <div className="flex flex-col gap-2">
                            <Link href={p.hrefR} className="py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-md hover:bg-slate-800 transition-all text-center">無料登録</Link>
                            <Link href={p.hrefL} className="py-2.5 rounded-xl border border-slate-100 text-slate-400 text-xs font-bold hover:bg-slate-50 text-center">ログイン</Link>
                        </div>
                        </div>
                    </TiltCard>
                    </div>
                ))}
                </div>
            </div>
          </section>

          {/* --- SHOWCASE --- */}
          <section className="py-20 bg-slate-900 text-white overflow-hidden relative">
            <div className="container mx-auto px-6 mb-10 text-center">
                <h2 className="text-2xl md:text-4xl font-bold mb-2 uppercase tracking-tighter italic">Success Stories</h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">想いが形になった瞬間</p>
            </div>
            <div className="flex gap-6 overflow-x-auto px-6 pb-10 snap-x no-scrollbar max-w-7xl mx-auto">
                {[1,2,3].map((i) => (
                <motion.div key={i} whileHover={{ y: -5 }} className="snap-center shrink-0 w-[280px] md:w-[350px] bg-slate-800 rounded-[30px] overflow-hidden border border-slate-700">
                    <div className="h-48 bg-slate-700 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-4 left-4"><h3 className="font-bold text-base">◯◯ちゃん生誕祭2025</h3></div>
                    </div>
                    <div className="p-6">
                        <div className="flex justify-between text-[10px] text-slate-500 mb-3 font-mono"><span>¥240,000</span><span>85 Supporters</span></div>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">みんなの協力でお祝いできました！ありがとうございます！</p>
                    </div>
                </motion.div>
                ))}
            </div>
          </section>

          {/* --- VOICES --- */}
          <section className="py-20 md:py-32 bg-white">
            <div className="container mx-auto px-6">
                <SectionHeader en="Voices" ja="みんなの感想" color="pink" />
                <div className="grid md:grid-cols-3 gap-6">
                {[
                    { text: "初めての主催で不安でしたが、集金管理が自動なので安心できました。", name: "A.Sさん", bg: "bg-pink-100" },
                    { text: "少額からでも支援できて、名前をパネルに載せてもらえて嬉しかったです。", name: "T.Kさん", bg: "bg-sky-100" },
                    { text: "イラストのデータを共有する機能が便利でした。印刷も綺麗！", name: "M.Mさん", bg: "bg-purple-100" }
                ].map((v, i) => (
                    <div key={i} className="bg-slate-50 p-8 rounded-[30px] relative border border-slate-100 hover:shadow-md transition-all flex flex-col h-full">
                    <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium italic">&quot;{v.text}&quot;</p>
                    <div className="flex items-center gap-3 mt-auto">
                        <div className={cn("w-10 h-10 rounded-full shadow-inner", v.bg)} />
                        <p className="font-bold text-xs text-slate-800">{v.name}</p>
                    </div>
                    </div>
                ))}
                </div>
            </div>
          </section>

          {/* --- NEWS --- */}
          <section className="py-20 bg-slate-50">
            <div className="container mx-auto px-6 max-w-4xl">
                <div className="flex justify-between items-end mb-8 px-2">
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase italic">News</h2>
                    <Link href="/news" className="text-xs text-pink-500 font-bold hover:underline tracking-widest uppercase">View All</Link>
                </div>
                <div className="bg-white rounded-[30px] p-4 md:p-6 shadow-sm border border-slate-100 divide-y divide-slate-100">
                    {[{ date: "2025.12.20", title: "「イラスト公募機能」をリリースしました" }, { date: "2025.12.15", title: "コミケ107開催に伴うお花の受付について" }].map((n, i) => (
                    <div key={i} className="py-4 flex items-center gap-4 md:gap-8 hover:bg-slate-50 transition-colors cursor-pointer rounded-xl px-4 group">
                        <span className="text-slate-300 text-[10px] md:text-xs font-mono font-bold shrink-0">{n.date}</span>
                        <span className="text-slate-600 font-bold text-xs md:text-sm line-clamp-1 group-hover:text-pink-500 transition-colors">{n.title}</span>
                    </div>
                    ))}
                </div>
            </div>
          </section>

          {/* --- FAQ --- */}
          <section className="py-20 md:py-32 bg-white">
            <div className="container mx-auto px-6 max-w-3xl">
                <SectionHeader en="Q&A" ja="よくある質問" color="green" />
                <div className="space-y-4">
                {[
                    { q: "目標未達の場合は？", a: "All-in(そのまま実施)かAll-or-Nothing(返金中止)かを選べます。" },
                    { q: "手数料は？", a: "企画作成は無料。達成時のみ、計10%を頂戴します。" },
                    { q: "匿名支援は可能？", a: "はい。主催者に本名や住所が伝わることはありません。" }
                ].map((item, i) => (
                    <details key={i} className="group bg-slate-50 rounded-2xl p-5 border border-slate-100 cursor-pointer open:bg-white open:shadow-lg transition-all">
                    <summary className="flex items-center justify-between font-bold text-slate-800 list-none text-sm md:text-base">
                        <span className="flex items-center gap-3"><HelpCircle className="text-emerald-500 shrink-0" size={18} /> {item.q}</span>
                        <ChevronDown size={16} className="text-slate-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="mt-4 text-xs md:text-sm text-slate-500 pl-8 leading-relaxed">{item.a}</div>
                    </details>
                ))}
                </div>
            </div>
          </section>

          {/* --- CTA --- */}
          <section className="relative pt-20 pb-20 md:pb-32 bg-white overflow-hidden px-6">
            <div className="container mx-auto text-center relative z-10">
                <Reveal>
                <div className="bg-slate-900 rounded-[40px] md:rounded-[60px] p-10 md:p-24 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,114,182,0.1),transparent)]" />
                    <div className="relative z-10">
                    <h2 className="text-3xl md:text-6xl font-black mb-6 md:mb-8 leading-tight tracking-tighter">さあ、推しへの愛を<br/>形にしよう。</h2>
                    <p className="text-slate-400 text-sm md:text-lg mb-8 md:mb-12 max-w-xl mx-auto font-medium">作成は無料。あなたの&quot;贈りたい&quot;が、誰かの勇気になります。</p>
                    <Link href="/projects/create" className="inline-block">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-pink-500 text-white px-10 md:px-16 py-4 md:py-6 rounded-full text-lg md:text-2xl font-black shadow-xl shadow-pink-500/20 hover:bg-pink-400 transition-all">
                        今すぐ企画を立てる
                        </motion.button>
                    </Link>
                    </div>
                </div>
                </Reveal>
            </div>
          </section>
        </main>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-shine { animation: shine 1.5s ease-in-out infinite; }
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

// --- 🏠 DASHBOARD WRAPPER ---
function AuthenticatedHome({ user, logout }) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 w-full relative z-[100]">
        <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-10 text-center border border-slate-100">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2 tracking-tight uppercase italic">Welcome Back</h1>
          <p className="text-slate-400 mb-8 font-bold text-xs uppercase tracking-widest">
            {user?.handleName || 'FLASTAL MEMBER'} Signed In
          </p>
          <div className="space-y-4">
            <Link href={user?.role === 'ADMIN' ? '/admin' : '/mypage'} className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-lg text-sm md:text-base text-center">
              DASHBOARD <ArrowRight size={18} />
            </Link>
            <button onClick={() => { logout(); toast.success('ログアウトしました'); }} className="text-[10px] font-black text-slate-300 hover:text-red-500 transition-colors uppercase tracking-[0.2em] block mx-auto mt-4">Sign Out</button>
          </div>
        </div>
      </div>
    );
}