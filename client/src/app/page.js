// src/app/page.js
'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from 'framer-motion';

import {
  Heart, Sparkles, ArrowRight, Search, Users,
  Gift, MessageCircle, Clock, Crown, PenTool, Video, Music, MapPin, Store,
  ArrowUpRight, Shield, Command, KeyRound, Building, Ticket, Loader2, Calendar,
  ChevronRight, CheckCircle2, Wand2
} from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import RecommendedProjects from './components/RecommendedProjects';

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
// 🪄 ANIMATION COMPONENTS
// ==========================================

// ゆっくり・上品なReveal（app向け）
const Reveal = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-8%" }}
    transition={{
      duration: 0.7,
      delay,
      ease: [0.22, 1, 0.36, 1]  // Apple-style ease out
    }}
    className={className}
  >
    {children}
  </motion.div>
);

const SplitTextReveal = ({ text, className, delay = 0 }) => {
  const chars = Array.from(text);
  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.035, delayChildren: delay } }
  };
  const child = {
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
    hidden:  { opacity: 0, y: 16, filter: "blur(3px)" }
  };
  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={cn("whitespace-nowrap", className)}
    >
      {chars.map((char, index) => (
        <motion.span variants={child} key={index} className="inline-block">
          {char === ' ' ? ' ' : char}
        </motion.span>
      ))}
    </motion.div>
  );
};

// ==========================================
// 🎀 PARTICLES
// ==========================================
const ButterflyParticle = ({ delay = 0, x = "0%", y = "0%", scale = 1, color = "text-pink-400" }) => {
  const isMounted = useIsMounted();
  const vals = useMemo(() => ({
    yEnd: -100 - Math.random() * 50,
    xOffset1:  20 + Math.random() * 20,
    xOffset2: -20 - Math.random() * 20,
    duration: 5 + Math.random() * 3,
    wingDuration: 0.22 + Math.random() * 0.12,
  }), []);

  if (!isMounted) return null;
  const { yEnd, xOffset1, xOffset2, duration, wingDuration } = vals;

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-0 ${color}`}
      style={{ top: y, left: x, scale, filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.08))" }}
      animate={{
        opacity: [0, 0.7, 1, 0.7, 0],
        y: [0, yEnd * 0.25, yEnd * 0.5, yEnd * 0.75, yEnd],
        x: [0, xOffset1, xOffset2, xOffset1, 0],
        rotate: [-10, 10, -10, 10, -10]
      }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.div animate={{ scaleX: [1, 0.2, 1] }} transition={{ duration: wingDuration, repeat: Infinity, ease: "linear" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
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
// 📊 CONSTANTS
// ==========================================
const BACKGROUND_BUTTERFLIES = [
  { x: "8%",  y: "12%", delay: 0,   scale: 0.7,  color: "text-pink-200"  },
  { x: "22%", y: "58%", delay: 1.5, scale: 0.5,  color: "text-rose-200"   },
  { x: "55%", y: "22%", delay: 2.8, scale: 0.9,  color: "text-rose-200"  },
  { x: "71%", y: "68%", delay: 0.7, scale: 0.6,  color: "text-rose-200"  },
  { x: "86%", y: "38%", delay: 2.0, scale: 0.8,  color: "text-pink-200"  },
  { x: "40%", y: "82%", delay: 4.0, scale: 0.5,  color: "text-rose-200"   },
];

const CATEGORIES = [
  { id: 'idol',        name: 'Idol / Artist',    jp: 'アイドル・アーティスト', icon: Music,       color: 'text-pink-500',    bg: 'bg-pink-50',    border: 'border-pink-100' },
  { id: 'vtuber',     name: 'Virtual Creator',  jp: 'VTuber・配信者',         icon: Video,       color: 'text-fuchsia-500', bg: 'bg-fuchsia-50', border: 'border-fuchsia-100' },
  { id: 'stage',      name: 'Stage / Musical',  jp: '舞台・ミュージカル',     icon: Users,       color: 'text-purple-500',  bg: 'bg-purple-50',  border: 'border-purple-100' },
  { id: 'voice',      name: 'Voice Actor',      jp: '声優・役者',              icon: MessageCircle, color: 'text-rose-500',  bg: 'bg-rose-50',    border: 'border-rose-100' },
  { id: 'anime',      name: 'Anime / Game',     jp: 'アニメ・ゲームイベント', icon: Command,     color: 'text-violet-500',  bg: 'bg-violet-50',  border: 'border-violet-100' },
  { id: 'anniversary',name: 'Anniversary',      jp: '生誕祭・周年記念',        icon: Crown,       color: 'text-pink-600',     bg: 'bg-pink-100',    border: 'border-pink-200' },
];

// ==========================================
// 📈 COUNT UP COMPONENT
// ==========================================
function CountUp({ end, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !hasStarted) setHasStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    const duration = 2000;
    const steps = 60;
    const increment = end / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [end, hasStarted]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// ==========================================
// 🎬 INTRO LOADER（幕開け）
// ==========================================
const IntroLoader = ({ onComplete }) => {
  useEffect(() => {
    const t = setTimeout(onComplete, 600);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-none"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35, ease: "easeOut" } }}
    >
      {/* 左カーテン */}
      <motion.div
        className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-br from-[#FFF0F5] to-[#FFE4EF] z-10 origin-left"
        initial={{ x: 0 }}
        animate={{ x: "-100%" }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.76, 0, 0.24, 1] }}
      />
      {/* 右カーテン */}
      <motion.div
        className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-bl from-[#FFF0F5] to-[#FFE4EF] z-10 origin-right"
        initial={{ x: 0 }}
        animate={{ x: "100%" }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.76, 0, 0.24, 1] }}
      />
      {/* ロゴ */}
      <motion.div
        className="absolute z-20 flex flex-col items-center gap-4"
        initial={{ opacity: 0, scale: 0.85, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1], rotate: [0, 6, -6, 0] }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
        >
          <Image
            src="/icon-512x512.png"
            alt="FLASTAL"
            width={96}
            height={96}
            priority
            style={{ borderRadius: '28px', boxShadow: '0 8px 32px rgba(236,72,153,0.25)' }}
          />
        </motion.div>
        <div className="text-center">
          <span className="font-calligraphy text-xl text-pink-400 block mb-1">Welcome to</span>
          <h1 className="text-5xl md:text-6xl font-black text-pink-500 tracking-[0.15em]">
            FLASTAL
          </h1>
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="h-0.5 bg-gradient-to-r from-transparent via-pink-300 to-transparent mt-3 origin-center"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-[10px] font-black tracking-[0.3em] text-pink-300 uppercase mt-2"
          >
            推し活クラウドファンディング
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ==========================================
// 🌅 SOFT BACKGROUND
// ==========================================
const SoftBackground = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 2000], [0, -120]);
  const y2 = useTransform(scrollY, [0, 2000], [0, 80]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-pink-50/10">
      <motion.div style={{ y: y1 }} className="absolute -top-[10%] -left-[5%] w-[90vw] h-[90vw] md:w-[70vw] md:h-[70vw] rounded-full bg-pink-100/60 blur-[100px]" />
      <motion.div style={{ y: y2 }} className="absolute top-[40%] -right-[10%] w-[70vw] h-[70vw] md:w-[50vw] md:h-[50vw] rounded-full bg-rose-100/40 blur-[80px]" />
      {BACKGROUND_BUTTERFLIES.map((bf, i) => (
        <ButterflyParticle key={`bf-${i}`} {...bf} />
      ))}
    </div>
  );
};

// ==========================================
// 1. HERO SECTION
// ==========================================
const Hero = () => {
  const [featuredProjects, setFeaturedProjects] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/projects?limit=3&status=active`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const arr = Array.isArray(data) ? data : (data?.projects || []);
        const active = arr.filter(p => p?.status === 'FUNDRAISING' || p?.status === 'active' || p?.status === 'ACTIVE');
        setFeaturedProjects(active.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  return (
    <section className="relative w-full min-h-[92svh] flex flex-col justify-center overflow-hidden pt-6 pb-8 px-4 sm:px-5 md:px-6 z-10">

      <div className="container relative z-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">

          {/* ===== テキストエリア ===== */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">

            {/* バッジ */}
            <Reveal delay={0}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-pink-200 bg-pink-50/80 backdrop-blur-sm mb-5 text-pink-500 shadow-sm">
                <Sparkles size={12} className="shrink-0" />
                <span className="text-xs font-black tracking-wider">ファン同士で贈る、フラスタ企画</span>
              </div>
            </Reveal>

            {/* キャッチコピー */}
            <div className="mb-5 flex flex-col items-center lg:items-start">
              <Reveal delay={0.06}>
                <span className="font-calligraphy text-3xl sm:text-4xl lg:text-5xl text-rose-500 block -mb-2 ml-1 lg:ml-0 drop-shadow-sm">
                  To your favorite
                </span>
              </Reveal>
              <SplitTextReveal
                text="世界でひとつのお花を。"
                className="text-3xl sm:text-5xl md:text-6xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-tight [text-shadow:0_1px_3px_rgba(0,0,0,0.08)]"
                delay={0.12}
              />
            </div>

            {/* サブテキスト */}
            <Reveal delay={0.2}>
              <p className="text-sm md:text-base text-slate-500 max-w-lg leading-[1.85] font-medium mb-8">
                推しの特別な日を、みんなの愛で彩ろう。<br className="hidden sm:block"/>
                集金・匿名配送・お花屋さんへの発注まで<br className="hidden sm:block"/>
                FLASTALがすべてサポートします。
              </p>
            </Reveal>

            {/* モバイル専用ミニビジュアル */}
            <Reveal delay={0.25} className="lg:hidden w-full mb-8">
              <div className="flex items-center justify-center gap-3">
                <motion.div
                  initial={{ opacity: 0, rotate: -8, y: 10 }}
                  animate={{ opacity: 1, rotate: -6, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3, type: "spring", bounce: 0.4 }}
                  className="w-28 h-32 bg-white p-2 pb-6 rounded-xl shadow-xl border border-slate-100 shrink-0"
                >
                  <div className="w-full h-full bg-rose-50 rounded-lg flex items-center justify-center border border-rose-100">
                    <span className="text-4xl">💐</span>
                  </div>
                  <p className="font-calligraphy text-center mt-2 text-slate-400 text-[10px]">Anniversary</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, rotate: 10, y: -10 }}
                  animate={{ opacity: 1, rotate: 6, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4, type: "spring", bounce: 0.4 }}
                  className="w-32 h-36 bg-white p-2 pb-6 rounded-xl shadow-2xl border border-slate-100 shrink-0 z-10"
                >
                  <div className="w-full h-full bg-pink-50 rounded-lg flex items-center justify-center border border-pink-100">
                    <span className="text-5xl">💖</span>
                  </div>
                  <p className="font-calligraphy text-center mt-2 text-pink-400 text-xs">Thank you</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, rotate: -6, y: 8 }}
                  animate={{ opacity: 1, rotate: 4, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5, type: "spring", bounce: 0.4 }}
                  className="w-28 h-32 bg-white p-2 pb-6 rounded-xl shadow-xl border border-slate-100 shrink-0"
                >
                  <div className="w-full h-full bg-pink-50 rounded-lg flex items-center justify-center border border-pink-100">
                    <span className="text-4xl">🌟</span>
                  </div>
                  <p className="font-calligraphy text-center mt-2 text-pink-400 text-[10px]">Congratulations</p>
                </motion.div>
              </div>
            </Reveal>

            {/* CTA ボタン */}
            <Reveal delay={0.28} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <Link href="/projects/create" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-black text-base shadow-lg shadow-pink-200 hover:shadow-xl hover:shadow-pink-200 transition-shadow flex items-center justify-center gap-2.5"
                >
                  <Crown size={18} strokeWidth={2.5} /> 企画を立ち上げる
                </motion.button>
              </Link>

              <Link href="/projects" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="w-full sm:w-auto px-7 py-3.5 bg-white text-slate-700 rounded-2xl font-black text-base border-2 border-slate-100 hover:border-pink-200 shadow-sm flex items-center justify-center gap-2.5"
                >
                  <Search size={18} className="text-slate-400" strokeWidth={2.5} /> 企画を探す
                </motion.button>
              </Link>
            </Reveal>

            {/* 信頼バッジ */}
            <Reveal delay={0.36}>
              <div className="flex items-center gap-4 mt-6 text-slate-400">
                <span className="flex items-center gap-1.5 text-xs font-bold">
                  <CheckCircle2 size={13} className="text-pink-400" /> 完全無料で参加
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold">
                  <CheckCircle2 size={13} className="text-pink-400" /> 匿名で安心
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold">
                  <CheckCircle2 size={13} className="text-pink-400" /> 最短1日で開始
                </span>
              </div>
            </Reveal>
          </div>

          {/* ===== デスクトップ：コラージュビジュアル ===== */}
          <div className="lg:col-span-5 relative w-full hidden lg:flex flex-col justify-center mt-6 lg:mt-0 gap-3">
            {featuredProjects.length > 0 ? (
              featuredProjects.map((project, i) => {
                const percent = Math.min(Math.round(((project?.collectedAmount || project?.currentAmount || 0) / (project?.targetAmount || 1)) * 100), 100);
                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-sm border border-pink-100/50 flex items-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-xl bg-pink-50 flex-shrink-0 overflow-hidden relative">
                      {project.imageUrl ? (
                        <Image src={project.imageUrl} alt={project?.title || '企画画像'} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">💐</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{project.title}</p>
                      <div className="mt-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-400 to-rose-400 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{percent}% 達成</p>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, rotate: -15, x: -30, y: 30 }}
                  animate={{ opacity: 1, rotate: -8, x: 0, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.35 }}
                  className="w-48 h-56 bg-white p-3 pb-8 rounded-2xl shadow-xl border border-slate-100 cursor-pointer self-start"
                  whileHover={{ scale: 1.05, rotate: 0 }}
                >
                  <div className="w-full h-full bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100">
                    <span className="text-5xl drop-shadow-md">💐</span>
                  </div>
                  <p className="font-calligraphy text-center mt-2.5 text-slate-400 text-xs">Happy Anniversary!</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, rotate: 20, x: 30, y: -30 }}
                  animate={{ opacity: 1, rotate: 10, x: 0, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3, type: "spring", bounce: 0.35 }}
                  className="w-56 h-64 bg-white p-3 pb-10 rounded-2xl shadow-2xl border border-slate-100 cursor-pointer self-end"
                  whileHover={{ scale: 1.05, rotate: 0 }}
                >
                  <div className="w-full h-full bg-pink-50 rounded-xl flex items-center justify-center border border-pink-100">
                    <span className="text-6xl drop-shadow-md">💖</span>
                  </div>
                  <p className="font-calligraphy text-center mt-3 text-pink-400 text-base">Thank you</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4, type: "spring", bounce: 0.35 }}
                  className="w-64 h-24 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl shadow-lg border border-pink-100 flex items-center p-4 cursor-pointer self-start"
                  whileHover={{ scale: 1.04, y: -4 }}
                >
                  <div className="border-r-2 border-dashed border-pink-200 pr-4 mr-4">
                    <Ticket className="text-pink-400" size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black tracking-widest uppercase text-pink-400 mb-0.5">Live Event</p>
                    <p className="font-black text-slate-800 text-sm">フラスタ受付完了 🎉</p>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// ==========================================
// 2. INFINITE MARQUEE
// ==========================================
const InfiniteMarquee = () => {
  const words = ["IDOL", "VTUBER", "STAGE", "VOICE ACTOR", "ANIME", "ANNIVERSARY", "BIRTHDAY"];
  return (
    <div className="py-4 md:py-5 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 overflow-hidden flex whitespace-nowrap relative z-20">
      <div className="flex items-center gap-8 md:gap-14 animate-marquee">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-8 md:gap-14">
            {words.map((word, j) => (
              <React.Fragment key={j}>
                <span className="text-base md:text-2xl font-black text-white tracking-[0.2em] opacity-95">
                  {word}
                </span>
                <Heart size={14} className="text-pink-200 shrink-0" fill="currentColor" />
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 3. HOW IT WORKS
// ==========================================
const HowItWorks = () => {
  const steps = [
    { num: "01", title: "企画ページをつくる", desc: "イベントの日程や会場、贈りたいお花のイメージを入力してページを公開します。", icon: PenTool, color: "text-pink-600", bg: "bg-pink-50", iconBg: "bg-pink-100", iconColor: "text-pink-600" },
    { num: "02", title: "SNSでシェアして集金", desc: "みんなでお金を出し合います。クレジットカード対応で、面倒な口座管理は不要です。", icon: Heart, color: "text-pink-500", bg: "bg-pink-50", iconBg: "bg-pink-500", iconColor: "text-white" },
    { num: "03", title: "お花屋さんがお届け", desc: "目標達成後、提携のプロのお花屋さんが制作し、直接会場へお届けします。", icon: Gift, color: "text-rose-500", bg: "bg-rose-50", iconBg: "bg-rose-500", iconColor: "text-white" },
  ];

  return (
    <section className="py-16 md:py-24 bg-white relative z-10">
      <div className="container mx-auto px-4 sm:px-5 md:px-6 max-w-5xl">

        <div className="text-center mb-10 md:mb-16">
          <Reveal>
            <span className="text-xs font-black tracking-[0.25em] text-pink-400 uppercase bg-pink-50 px-4 py-1.5 rounded-full inline-block mb-4">
              How it works
            </span>
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-slate-800 tracking-tighter mt-2">フラスタが届くまで</h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-10 md:mb-16">
          {steps.map((step, i) => (
            <Reveal key={i} delay={i * 0.12}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="relative bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-shadow h-full"
              >
                <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase block mb-4">{step.num}</span>
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-sm", step.iconBg)}>
                  <step.icon size={26} strokeWidth={2} className={step.iconColor ?? "text-white"} />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2.5 leading-snug">{step.title}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                    <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
                      <ChevronRight size={14} className="text-pink-400" />
                    </div>
                  </div>
                )}
              </motion.div>
            </Reveal>
          ))}
        </div>

        {/* ===== はじめての方へ：4ステップフロー ===== */}
        <Reveal delay={0.2}>
          <div className="mb-10 md:mb-16 bg-gradient-to-br from-rose-50 via-pink-50 to-rose-50/50 rounded-3xl border border-pink-100 p-6 md:p-10">
            <div className="text-center mb-6">
              <span className="text-xs font-black tracking-[0.25em] text-rose-400 uppercase bg-white/80 px-4 py-1.5 rounded-full inline-block mb-3">はじめての方へ</span>
              <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter">支援から会場到着まで</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 relative">
              {[
                { num: "1", emoji: "🔍", title: "応援したいイベントを探す",   desc: "企画一覧から気になるフラスタ企画を見つけよう" },
                { num: "2", emoji: "💳", title: "企画ページで支援する",        desc: "クレジットカードで簡単・安全に支援完了" },
                { num: "3", emoji: "💐", title: "花屋とプランナーが制作",      desc: "プロの花屋さんが心を込めてフラスタを制作" },
                { num: "4", emoji: "🎉", title: "会場にフラスタが届く",        desc: "当日会場にフラスタが飾られ推しに届きます" },
              ].map((s, i, arr) => (
                <div key={i} className="relative">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-white rounded-2xl p-4 md:p-5 border border-pink-100/70 shadow-sm text-center h-full flex flex-col items-center"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 text-white text-sm font-black flex items-center justify-center mb-3 shadow-sm shrink-0">
                      {s.num}
                    </div>
                    <span className="text-3xl mb-2.5">{s.emoji}</span>
                    <h4 className="font-black text-slate-800 text-xs md:text-sm leading-snug mb-1.5">{s.title}</h4>
                    <p className="text-[10px] md:text-xs font-medium text-slate-400 leading-relaxed">{s.desc}</p>
                  </motion.div>
                  {i < arr.length - 1 && (
                    <div className="hidden md:flex absolute top-1/2 -right-2.5 -translate-y-1/2 z-10">
                      <div className="w-5 h-5 rounded-full bg-white border border-pink-200 flex items-center justify-center shadow-sm">
                        <ChevronRight size={12} className="text-pink-400" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* 使い方ガイドへの誘導 */}
        <Reveal delay={0.3}>
          <Link href="/guide" className="block relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100 hover:border-pink-200 transition-all duration-400 group shadow-sm hover:shadow-lg">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-pink-400/10 rounded-full blur-2xl group-hover:bg-pink-400/20 transition-all" />
            <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="text-center md:text-left">
                <p className="text-xs font-black tracking-widest text-pink-400 uppercase mb-2">Guide</p>
                <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-1.5">はじめての方へ</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                  企画の立て方からフラスタが届くまで、わかりやすく解説しています！
                </p>
              </div>
              <div className="shrink-0">
                <span className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-pink-500 font-black rounded-xl shadow-sm group-hover:bg-pink-500 group-hover:text-white transition-all text-sm">
                  使い方を見る <ArrowRight size={16} />
                </span>
              </div>
            </div>
          </Link>
        </Reveal>
      </div>
    </section>
  );
};

// ==========================================
// 4. TRENDING PROJECTS
// ==========================================
const TrendingProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API_URL}/api/projects?limit=8`);
        if (res.ok) {
          const data = await res.json();
          const arr = Array.isArray(data) ? data : (data?.projects || []);
          const active = arr.filter(p => p?.status === 'FUNDRAISING' || p?.status === 'SUCCESSFUL');
          setProjects(active.slice(0, 4));
        } else {
          setFetchError(true);
        }
      } catch {
        setFetchError(true);
      }
      finally { setLoading(false); }
    };
    fetchProjects();
  }, []);

  return (
    <section className="py-16 md:py-24 bg-rose-50/20 relative z-10 border-t border-slate-100/60">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 md:mb-12 gap-4">
          <Reveal>
            <span className="text-xs font-black tracking-[0.25em] text-pink-400 uppercase bg-pink-50 px-4 py-1.5 rounded-full inline-block mb-3">
              Trending
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tighter">注目の企画</h2>
            <p className="text-slate-500 font-medium mt-1.5 text-sm">みんなで応援中の素敵な企画をチェック！</p>
          </Reveal>
          <Link href="/projects" className="hidden sm:block shrink-0">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="px-5 py-2.5 rounded-full bg-white border border-slate-200 text-sm font-black text-slate-600 hover:border-pink-300 hover:text-pink-500 transition-colors flex items-center gap-2 shadow-sm"
            >
              すべて見る <ArrowRight size={14}/>
            </motion.button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
          </div>
        ) : fetchError ? (
          <div className="text-center py-16 text-slate-400 font-bold bg-white rounded-3xl border border-slate-100">
            データの取得に失敗しました。しばらくしてからページを再読み込みしてください。
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
            {projects.filter(p => p?.visibility !== 'UNLISTED' && p?.isVisible !== false).map((project, i) => {
              const percent = Math.min(Math.round(((project?.collectedAmount || 0) / (project?.targetAmount || 1)) * 100), 100);
              const isSuccess = percent >= 100 || project?.status === 'SUCCESSFUL' || project?.status === 'COMPLETED';
              const badgeLabel = project?.status === 'COMPLETED' ? '完了' : isSuccess ? '達成!' : '募集中';
              const badgeColor = project?.status === 'COMPLETED' ? 'bg-rose-600' : isSuccess ? 'bg-rose-500' : 'bg-pink-500';

              return (
                <Reveal key={project?.id || i} delay={i * 0.08}>
                  <motion.div
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="bg-white rounded-[1.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-shadow cursor-pointer h-full flex flex-col group"
                  >
                    <div className="relative w-full aspect-square bg-slate-100 shrink-0 overflow-hidden">
                      {project?.imageUrl ? (
                        <Image src={project.imageUrl} alt={project?.title || "企画画像"} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="absolute inset-0 bg-pink-50 flex items-center justify-center text-4xl">💐</div>
                      )}
                      <div className="absolute top-2.5 left-2.5">
                        <span className={cn("px-2.5 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-wider shadow-sm", badgeColor)}>
                          {badgeLabel}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="font-black text-slate-800 text-xs md:text-sm leading-snug group-hover:text-pink-500 transition-colors line-clamp-2 mb-3">
                        {project?.title}
                      </h3>
                      <div className="mt-auto">
                        <div className="flex justify-between items-center mb-1.5">
                          <p className="text-xs font-black text-slate-700">¥{(project?.collectedAmount || 0).toLocaleString()}</p>
                          <span className={cn("text-sm font-black", isSuccess ? "text-rose-500" : "text-pink-500")}>{percent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${percent}%` }}
                            transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                            className={cn("h-full rounded-full", isSuccess ? "bg-gradient-to-r from-rose-400 to-rose-500" : "bg-gradient-to-r from-pink-400 to-rose-400")}
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
          <div className="text-center py-16 text-slate-400 font-bold bg-white rounded-3xl border border-slate-100">
            現在表示できる注目の企画がありません。
          </div>
        )}

        <Link href="/projects" className="sm:hidden flex justify-center mt-5">
          <button className="w-full px-6 py-3.5 rounded-full border border-slate-200 text-sm font-black text-slate-600 bg-white shadow-sm active:opacity-70 transition-opacity">
            すべての企画を見る
          </button>
        </Link>
      </div>
    </section>
  );
};

// ==========================================
// 5. AI PERSONALIZED FEED（ログイン済みユーザー向け）
// ==========================================
const PersonalizedFeed = () => {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    const t = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
    fetch(`${API_URL}/api/projects/feed/personalized`, {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('fetch failed')))
      .then(data => setProjects(Array.isArray(data) ? data.slice(0, 4) : []))
      .catch(() => { setFetchError(true); })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated || (!loading && projects.length === 0 && !fetchError)) return null;

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-pink-50/60 via-rose-50/40 to-pink-50/20 relative z-10 border-t border-pink-100/40">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <Reveal>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-black tracking-[0.25em] text-pink-500 uppercase bg-pink-100 px-4 py-1.5 rounded-full">
              <Wand2 size={11} /> AI おすすめ
            </span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tighter">あなたへのおすすめ企画</h2>
          <p className="text-slate-500 font-medium mt-1.5 text-sm">支援履歴をもとにAIがピックアップ</p>
        </Reveal>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-pink-400 animate-spin" /></div>
        ) : fetchError ? (
          <div className="text-center py-12 text-slate-400 font-bold bg-white/60 rounded-3xl border border-pink-100 mt-8">
            データの取得に失敗しました。しばらくしてからページを再読み込みしてください。
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mt-8">
            {projects.map((project, i) => {
              const percent = Math.min(Math.round(((project?.collectedAmount || 0) / (project?.targetAmount || 1)) * 100), 100);
              return (
                <Reveal key={project.id} delay={i * 0.07}>
                  <div
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm border border-pink-100 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
                  >
                    <div className="aspect-square bg-gradient-to-br from-pink-50 to-rose-50 relative overflow-hidden">
                      {project.coverImageUrl
                        ? <Image src={project.coverImageUrl} alt={project.title} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center text-pink-200"><Heart size={40} /></div>
                      }
                      <div className="absolute top-2 right-2 bg-pink-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{percent}%</div>
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-black text-slate-800 line-clamp-2 leading-snug mb-2">{project.title}</p>
                      <div className="w-full h-1.5 bg-pink-50 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-pink-400 to-rose-400 rounded-full transition-all" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

// ==========================================
// 6. BENTO FEATURES
// ==========================================
const BentoFeatures = () => {
  const features = [
    {
      title: "集金・お金の管理をスマートに",
      desc: "クレジットカードで自動集金。個人の口座を晒したり、入金確認に追われるストレスをゼロに。",
      span: "col-span-1 md:col-span-2",
      icon: Shield,
      gradient: "from-pink-50 to-rose-50",
      border: "border-pink-100",
      iconColor: "text-pink-500",
      iconBg: "bg-pink-100",
      textColor: "text-pink-700",
    },
    {
      title: "完全匿名で安心参加",
      desc: "住所や本名を明かさず、ハンドルネームだけで参加可能。",
      span: "col-span-1",
      icon: KeyRound,
      gradient: "from-pink-50 to-rose-50",
      border: "border-pink-100",
      iconColor: "text-pink-500",
      iconBg: "bg-pink-100",
      textColor: "text-pink-700",
    },
    {
      title: "プロに直接依頼",
      desc: "フラスタ専門のお花屋さんや絵師さんをサイト内で指名・公募できます。",
      span: "col-span-1",
      icon: PenTool,
      gradient: "from-rose-50 to-pink-50",
      border: "border-rose-100",
      iconColor: "text-rose-500",
      iconBg: "bg-rose-100",
      textColor: "text-rose-700",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-white relative z-10 border-t border-slate-100/60">
      <div className="container mx-auto px-4 sm:px-5 md:px-6 max-w-5xl">
        <div className="mb-10 md:mb-16 text-center">
          <Reveal>
            <span className="text-xs font-black tracking-[0.25em] text-pink-400 uppercase bg-pink-50 px-4 py-1.5 rounded-full inline-block mb-4">Features</span>
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-slate-800 tracking-tighter mt-2">
              面倒な裏方は、<br className="sm:hidden"/>すべてFLASTALに。
            </h2>
            <p className="text-sm font-medium text-slate-400 mt-3">お金の管理から会場への確認まで、もっと手軽に推し活を楽しめます。</p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-3.5 md:gap-4">
          {features.map((feat, i) => (
            <Reveal key={i} delay={i * 0.1} className={feat.span}>
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={cn(
                  "rounded-3xl p-6 md:p-8 border bg-gradient-to-br h-full",
                  feat.gradient, feat.border
                )}
              >
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-5", feat.iconBg, feat.iconColor)}>
                  <feat.icon size={22} strokeWidth={2} />
                </div>
                <h3 className="text-base md:text-lg font-black text-slate-800 mb-2">{feat.title}</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">{feat.desc}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// ==========================================
// 6. CATEGORIES
// ==========================================
const CategoryGrid = () => {
  return (
    <section className="py-16 md:py-24 bg-rose-50/20 relative z-10 border-t border-slate-100/60">
      <div className="container mx-auto px-4 sm:px-5 md:px-6 max-w-5xl">
        <div className="text-center mb-8 md:mb-12">
          <Reveal>
            <span className="text-xs font-black tracking-[0.25em] text-pink-400 uppercase bg-pink-50 px-4 py-1.5 rounded-full inline-block mb-4">Categories</span>
            <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tighter mt-2">対応ジャンル</h2>
            <p className="text-sm text-slate-400 font-medium mt-2">様々なシーンのお祝いに対応しています。</p>
          </Reveal>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5 md:gap-3">
          {CATEGORIES.map((cat, i) => (
            <Reveal key={cat.id} delay={i * 0.06}>
              <motion.div
                whileHover={{ scale: 1.06, y: -4 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={cn(
                  "rounded-2xl p-3.5 md:p-4 text-center border cursor-pointer",
                  cat.bg, cat.border
                )}
              >
                <div className={cn("w-9 h-9 md:w-10 md:h-10 mx-auto bg-white rounded-full flex items-center justify-center mb-2.5 shadow-sm", cat.color)}>
                  <cat.icon size={17} strokeWidth={2} />
                </div>
                <h3 className="text-slate-700 font-black text-[10px] md:text-xs mb-0.5 leading-tight">{cat.name}</h3>
                <p className="text-slate-400 text-[8px] md:text-[9px] font-medium leading-tight">{cat.jp}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// ==========================================
// 7. ARTICLES
// ==========================================
const LaruSeoEmbed = () => {
  const containerRef = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => {
      const el = containerRef.current;
      if (!el || el.querySelector('script')) return;
      const script = document.createElement('script');
      script.src = `https://larubot.tokyo/embed/blog.js?t=${Date.now()}`;
      script.setAttribute("data-id", "e19ed703-6238-49a5-ac83-c92c522a44cd");
      script.setAttribute("data-limit", "3");
      script.async = true;
      el.appendChild(script);
    }, 100);
    return () => clearTimeout(t);
  }, []);
  return <div ref={containerRef} className="w-full min-h-[240px]" />;
};

const ArticlesSection = () => (
  <section className="py-16 md:py-24 bg-white relative z-10 border-t border-slate-100/60">
    <div className="container mx-auto px-4 md:px-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <Reveal>
          <span className="text-xs font-black tracking-[0.25em] text-pink-400 uppercase bg-pink-50 px-4 py-1.5 rounded-full inline-block mb-3">Tips</span>
          <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tighter">お役立ち情報</h2>
        </Reveal>
        <Link href="/blog">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="px-5 py-2.5 rounded-full border border-slate-200 text-sm font-black text-slate-600 bg-white shadow-sm flex items-center gap-2 shrink-0"
          >
            すべての記事 <ArrowRight size={13}/>
          </motion.button>
        </Link>
      </div>
      <Reveal>
        <div className="bg-violet-50/30 p-5 md:p-8 rounded-3xl border border-slate-100">
          <LaruSeoEmbed />
        </div>
      </Reveal>
    </div>
  </section>
);

// ==========================================
// 8. SOCIAL PROOF
// ==========================================
const SocialProof = () => {
  const stats = [
    { numeric: true,  end: 1200, suffix: '+', label: '企画数', sub: '累計' },
    { numeric: true,  end: 98,   suffix: '%', label: '満足度', sub: '完了企画' },
    { numeric: false, value: '全国',           label: '対応',   sub: 'お花屋さん' },
    { numeric: false, value: '0円',            label: '参加費', sub: '無料で使える' },
  ];

  const testimonials = [
    {
      avatar: '🌸',
      name: 'さくらP',
      role: '企画者',
      text: '口座管理やお釣りの計算が不要で、集金がすごく楽でした。お花屋さんとのやり取りもサイト内でできるので安心感が違います！',
    },
    {
      avatar: '💜',
      name: 'みほぴ',
      role: '支援者',
      text: '匿名で参加できるのが最高！カードで支援してそれだけ。当日会場で本物のフラスタを見たときに感動して泣きました🥲',
    },
    {
      avatar: '🌷',
      name: 'ゆなまる',
      role: 'お花屋さん',
      text: 'FLASTALを通してファンの方と直接やり取りできるようになり、制作のやりがいが増しました。発注管理もシンプルで助かっています。',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-white relative z-10 border-t border-slate-100/60">
      <div className="container mx-auto px-4 sm:px-5 md:px-6 max-w-5xl">

        {/* Stats */}
        <Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-3.5 md:gap-4 mb-14 md:mb-20">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl p-5 md:p-6 text-center border border-pink-100 shadow-sm"
              >
                <p className="text-3xl md:text-4xl font-black text-pink-500 tracking-tighter leading-none mb-1">
                  {s.numeric ? <CountUp end={s.end} suffix={s.suffix} /> : s.value}
                </p>
                <p className="text-sm font-black text-slate-700 mt-1.5">{s.label}</p>
                <p className="text-[10px] font-medium text-slate-400 tracking-wide mt-0.5">{s.sub}</p>
              </motion.div>
            ))}
          </div>
        </Reveal>

        {/* Testimonials */}
        <div className="text-center mb-8 md:mb-12">
          <Reveal>
            <span className="text-xs font-black tracking-[0.25em] text-pink-400 uppercase bg-pink-50 px-4 py-1.5 rounded-full inline-block mb-4">Voice</span>
            <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tighter mt-2">使ってみた感想</h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-pink-50 flex items-center justify-center text-2xl border border-pink-100 shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-sm">{t.name}</p>
                    <p className="text-[10px] font-bold text-pink-500 uppercase tracking-wider">{t.role}</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-600 leading-relaxed flex-1">"{t.text}"</p>
                <div className="flex text-pink-400 gap-0.5 mt-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// ==========================================
// 9. FAQ
// ==========================================
const FAQ = () => {
  const [open, setOpen] = useState(null);

  const items = [
    {
      q: '参加するのに費用はかかりますか？',
      a: '企画への参加・支援は無料でできます。支援金は1口から参加可能です（金額は各企画によって異なります）。決済手数料はサービス側が負担するため、支援者に別途費用はかかりません。',
    },
    {
      q: '目標金額に達しなかったらどうなりますか？',
      a: '締切日までに目標金額に達しなかった場合、企画は自動的に中止され、支援者の方々に全額ポイント返還されます。お花屋さんへの発注は行われません。',
    },
    {
      q: '匿名で参加できますか？',
      a: 'はい、ハンドルネームで参加できます。本名・住所・電話番号などの個人情報は他の参加者に公開されません。お届け先の住所は会場名のみでOKです。',
    },
    {
      q: 'お花屋さんはどうやって見つかりますか？',
      a: 'FLASTALに登録済みのプロのフラスタ専門お花屋さんを「お花屋さんを探す」ページから都道府県・スタイルで検索できます。気に入ったお花屋さんに直接オファーを送ることができます。',
    },
    {
      q: '企画者はどんな管理をするのですか？',
      a: '目標金額の設定・締切日の管理・お花屋さんへのオファー・見積もり承認など、フラスタ制作に必要な手続きがサイト内で完結します。支援者への連絡やシェアも簡単に行えます。',
    },
    {
      q: 'フラスタとは何ですか？',
      a: 'フラワースタンドの略で、アイドルやVTuberなどへの応援として、コンサートやライブ会場に送る花のスタンドです。ファンの気持ちを形にした特別なプレゼントとして、推し活の定番になっています。',
    },
    {
      q: '支援した後にキャンセルできますか？',
      a: '企画が達成（目標金額到達）する前であれば、マイページからキャンセルが可能です。達成後はお花屋さんへの発注が始まるため、原則としてキャンセルはお受けできません。',
    },
    {
      q: '支援者の個人情報は他の人に見えますか？',
      a: '支援者のハンドルネームのみが表示され、本名・住所・メールアドレスなどは他の参加者には一切公開されません。安心してご参加いただけます。',
    },
    {
      q: '最低支援金額はいくらですか？',
      a: '最低支援金額は各企画のプランナーが自由に設定します。500円から参加できる企画も多く、気軽に推し活を楽しめます。各企画ページで詳細な支援プランをご確認ください。',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-rose-50/20 relative z-10 border-t border-slate-100/60">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <div className="text-center mb-8 md:mb-12">
          <Reveal>
            <span className="text-xs font-black tracking-[0.25em] text-pink-400 uppercase bg-pink-50 px-4 py-1.5 rounded-full inline-block mb-4">FAQ</span>
            <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tighter mt-2">よくある質問</h2>
          </Reveal>
        </div>

        <div className="space-y-2">
          {items.map((item, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <motion.div
                layout
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="font-black text-slate-800 text-sm leading-snug">{item.q}</span>
                  <motion.div
                    animate={{ rotate: open === i ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 w-6 h-6 rounded-full bg-pink-50 flex items-center justify-center text-pink-500 border border-pink-100"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="px-5 pb-5 text-sm font-medium text-slate-600 leading-relaxed border-t border-slate-50 pt-4">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3}>
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400 font-medium mb-3">他にご不明な点はお気軽にご連絡ください</p>
            <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-sm shadow-sm hover:border-pink-300 hover:text-pink-500 transition-colors"
              >
                お問い合わせ
              </motion.button>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

// ==========================================
// 10. GALLERY HIGHLIGHT
// ==========================================
const GalleryHighlight = () => {
  const [photos, setPhotos] = useState([]);
  useEffect(() => {
    fetch(`${API_URL}/api/gallery/feed?limit=6`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data) && data.length) setPhotos(data); })
      .catch(() => {});
  }, []);

  if (!photos.length) return null;

  return (
    <section className="py-16 md:py-24 bg-white relative z-10 border-t border-slate-100/60">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <Reveal>
          <div className="text-center mb-10">
            <span className="text-xs font-black tracking-[0.25em] text-pink-400 uppercase bg-pink-50 px-4 py-1.5 rounded-full inline-block mb-4">Gallery</span>
            <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tighter mt-2">みんなの達成フラスタ</h2>
            <p className="text-sm font-medium text-slate-400 mt-2">完成したフラスタの写真をチェックしよう</p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 group">
                <Image src={photo.imageUrl} alt={photo.caption || ''} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized sizes="33vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <p className="text-white text-[10px] font-bold truncate">{photo.project?.title || ''}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/gallery" className="inline-flex items-center gap-2 text-sm font-black text-pink-500 hover:text-pink-700 active:opacity-70 transition-colors">
              もっと見る <ArrowRight size={14} />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

// ==========================================
// 11. TRUST BADGES
// ==========================================
const TrustBadges = () => {
  const badges = [
    {
      icon: '🔒',
      title: 'SSL暗号化通信',
      desc: '全ページでSSL/TLS通信を採用。個人情報・決済情報を安全に保護します。',
    },
    {
      icon: '💳',
      title: 'Stripe決済（PCI DSS準拠）',
      desc: '世界標準のStripeで決済を処理。カード情報はFLASTALに保存されません。',
    },
    {
      icon: '✅',
      title: '全花屋審査済み',
      desc: '登録花屋は事前審査を通過したプロのみ。安心してフラスタを依頼できます。',
    },
    {
      icon: '📧',
      title: '24時間サポート',
      desc: 'お問い合わせはいつでも受付中。トラブル時も迅速に対応いたします。',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-white relative z-10 border-t border-slate-100/60">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <div className="text-center mb-8 md:mb-12">
          <Reveal>
            <span className="text-xs font-black tracking-[0.25em] text-pink-500 uppercase bg-pink-50 px-4 py-1.5 rounded-full inline-block mb-4">Security</span>
            <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tighter mt-2">安心・安全の理由</h2>
            <p className="text-sm font-medium text-slate-400 mt-2">FLASTALはセキュリティと品質にこだわってサービスを提供しています。</p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {badges.map((badge, i) => (
            <Reveal key={i} delay={i * 0.09}>
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col items-center text-center"
              >
                <span className="text-3xl mb-3">{badge.icon}</span>
                <h3 className="font-black text-slate-800 text-sm mb-2 leading-snug">{badge.title}</h3>
                <p className="text-xs font-medium text-slate-400 leading-relaxed">{badge.desc}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// ==========================================
// 12. PARTNER CTA
// ==========================================
const PartnerCTA = () => (
  <section className="py-16 md:py-24 bg-gradient-to-b from-pink-50 to-rose-50 relative z-10 overflow-hidden border-t border-pink-100/60">
    <div className="container mx-auto px-4 md:px-6 max-w-5xl relative z-10">
      <Reveal>
        <div className="text-center mb-8 md:mb-12">
          <span className="text-xs font-black tracking-[0.25em] text-pink-400 uppercase bg-white/80 px-4 py-1.5 rounded-full inline-block mb-4">Partner</span>
          <h2 className="text-2xl md:text-4xl font-black text-slate-800 mb-3 tracking-tighter mt-2">法人・クリエイターの皆様へ</h2>
          <p className="text-slate-500 text-sm font-medium max-w-xl mx-auto leading-relaxed">
            お花屋さん・ライブ会場・イベント主催者・イラストレーターとファンを繋ぐサービスです。<br className="hidden md:block"/>初期費用・月額費用は一切かかりません。
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { href: "/venues/login",     title: "会場・ホールのご担当者様", desc: "搬入ルールの設定など",       icon: Building, color: "text-rose-500",    bg: "bg-rose-50" },
            { href: "/organizers/login", title: "イベント主催者様",         desc: "お祝い花のルール周知",       icon: Ticket,   color: "text-pink-600",    bg: "bg-pink-50" },
            { href: "/florists/login",   title: "お花屋さん",               desc: "フラスタの受注・納品報告",   icon: Store,    color: "text-rose-600",    bg: "bg-rose-50" },
            { href: "/illustrators/login", title: "クリエイター様",         desc: "イラストパネルの受注",       icon: PenTool,  color: "text-pink-500",    bg: "bg-pink-50" },
          ].map((role, i) => (
            <Link key={i} href={role.href} className="group">
              <motion.div
                whileHover={{ scale: 1.02, y: -3 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="bg-white border border-white/80 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow h-full"
              >
                <div className="flex items-center gap-3.5">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", role.bg, role.color)}>
                    <role.icon size={18} strokeWidth={2}/>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 leading-tight">{role.title}</h3>
                    <p className="text-slate-400 text-xs font-medium mt-0.5">{role.desc}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-pink-400 transition-colors shrink-0 ml-2" />
              </motion.div>
            </Link>
          ))}
        </div>
      </Reveal>
    </div>
  </section>
);

// ==========================================
// 📦 MAIN CONTENT
// ==========================================
const MainContent = () => {
  const { isAuthenticated, user } = useAuth();
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('authToken')?.replace(/^"|"$/g, '') || null
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <SoftBackground />
      <Hero />
      <InfiniteMarquee />
      <HowItWorks />
      <div className="h-px bg-gradient-to-r from-transparent via-pink-200/40 to-transparent mx-4 md:mx-8" />
      {!user && (
        <div className="container mx-auto px-4 md:px-6 max-w-6xl relative z-10 py-8">
          <section className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl p-8 mb-8 text-center border border-pink-100">
            <span className="inline-block text-xs font-black tracking-[0.2em] text-pink-400 uppercase bg-white px-4 py-1.5 rounded-full mb-4 shadow-sm">はじめての方へ</span>
            <p className="text-2xl font-black text-slate-800 mb-2 tracking-tight">推しへ、世界でひとつのフラスタを。</p>
            <p className="text-sm text-slate-500 mb-6 font-medium">会員登録無料・支援のたびポイント獲得</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <a href="/auth/register" className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black px-7 py-3.5 rounded-2xl hover:opacity-90 active:opacity-70 transition-opacity shadow-lg shadow-pink-200">
                無料で始める
              </a>
              <a href="/auth/login" className="bg-white text-slate-700 font-black px-7 py-3.5 rounded-2xl border-2 border-slate-100 hover:border-pink-200 active:opacity-70 transition-colors">
                ログインする
              </a>
            </div>
          </section>
        </div>
      )}
      <TrendingProjects />
      <div className="container mx-auto px-4 md:px-6 max-w-6xl relative z-10">
        <RecommendedProjects token={isAuthenticated ? token : null} />
      </div>
      <PersonalizedFeed />
      <BentoFeatures />
      <CategoryGrid />
      <div className="h-px bg-gradient-to-r from-transparent via-pink-200/40 to-transparent mx-4 md:mx-8" />
      <SocialProof />
      <GalleryHighlight />
      <FAQ />
      <TrustBadges />
      <ArticlesSection />
      <PartnerCTA />
    </motion.div>
  );
};

// ==========================================
// 👑 MAIN EXPORT
// ==========================================
export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) return null;

  return (
    <div id="main-content" className="bg-pink-50/10 min-h-screen text-slate-800 font-sans selection:bg-pink-100 selection:text-pink-500 relative">
      <AnimatePresence mode="wait">
        {!introFinished ? (
          <IntroLoader key="loader" onComplete={() => setIntroFinished(true)} />
        ) : (
          <MainContent key="content" />
        )}
      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&family=Parisienne&display=swap');

        :root {
          --font-sans: 'Zen Kaku Gothic New', 'Plus Jakarta Sans', sans-serif;
          --font-calligraphy: 'Parisienne', cursive;
        }
        body { font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }
        .font-calligraphy { font-family: var(--font-calligraphy); }

        .animate-marquee { animation: marquee 28s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
