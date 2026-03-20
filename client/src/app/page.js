'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from './contexts/AuthContext';
import { 
  motion, useScroll, useSpring, useTransform, AnimatePresence, useInView 
} from 'framer-motion';
import { 
  Heart, Sparkles, Search, ChevronDown, Star, HelpCircle, ArrowRight, 
  Users, Flower, CreditCard, Lock, Loader2, PlusCircle, Gift, 
  MessageCircle, Clock, Calendar, CheckCircle2, ChevronRight, Award, 
  Smile, ShieldCheck, ThumbsUp, Camera, Music, Video, PenTool
} from 'lucide-react';

// ==========================================
// 🎨 UTILS & ANIMATION VARIANTS
// ==========================================

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const JpText = ({ children, className }) => (
  <span className={cn("inline-block", className)}>{children}</span>
);

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const floatAnimation = {
  y: [-10, 10],
  transition: { duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
};

// ==========================================
// 🌸 CUSTOM SVG ILLUSTRATIONS (可愛さ・透明感の演出)
// ==========================================

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
// 📊 DUMMY DATA (実在の名称を使用せずリアリティを出す)
// ==========================================

const CATEGORIES = [
  { id: 'idol', name: 'アイドル', icon: <Music size={18}/>, color: 'from-pink-400 to-rose-400', shadow: 'shadow-pink-200' },
  { id: 'vtuber', name: 'VTuber', icon: <Video size={18}/>, color: 'from-sky-400 to-blue-400', shadow: 'shadow-sky-200' },
  { id: 'voice', name: '声優・役者', icon: <MessageCircle size={18}/>, color: 'from-amber-400 to-orange-400', shadow: 'shadow-amber-200' },
  { id: 'stage', name: '舞台・演劇', icon: <Users size={18}/>, color: 'from-purple-400 to-indigo-400', shadow: 'shadow-purple-200' },
  { id: 'anime', name: 'アニメ・漫画', icon: <PenTool size={18}/>, color: 'from-emerald-400 to-teal-400', shadow: 'shadow-emerald-200' },
  { id: 'birthday', name: '生誕祭・周年', icon: <Gift size={18}/>, color: 'from-rose-400 to-red-400', shadow: 'shadow-rose-200' },
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
    status: "SUCCESS", // 達成済み
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
    status: "FUNDING", // 募集中
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
    status: "COMPLETED", // 終了
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
// 🧩 MICRO COMPONENTS (UIの部品)
// ==========================================

const ScrollProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-400 via-rose-400 to-sky-400 origin-left z-[100]" style={{ scaleX }} />;
};

const SectionTitle = ({ en, ja, desc, align = "center", icon: Icon }) => (
  <div className={cn("mb-12 md:mb-16 px-4 relative z-10", align === "center" ? "text-center" : "text-left")}>
    <Reveal>
      <div className={cn("inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border shadow-sm mb-4", 
        "text-pink-500 border-pink-100 font-mono text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase")}>
        {Icon ? <Icon size={14} /> : <Sparkles size={14} />} {en}
      </div>
      <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-800 mb-6 tracking-tighter leading-tight">
        {ja}
      </h2>
      {desc && <p className="text-slate-500 max-w-2xl text-sm md:text-base font-medium leading-relaxed" style={align === "center" ? {margin: "0 auto"} : {}}><JpText>{desc}</JpText></p>}
    </Reveal>
  </div>
);

const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2rem]", className)}>
    {children}
  </div>
);

const ProjectCard = ({ project, index }) => {
  const percent = Math.min(Math.round((project.currentAmount / project.targetAmount) * 100), 100);
  const isSuccess = percent >= 100;
  
  return (
    <Reveal delay={index * 0.1} className="h-full">
      <Link href={`/projects/${project.id}`} className="block group h-full">
        <GlassCard className="h-full flex flex-col overflow-hidden hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_16px_40px_rgba(244,114,182,0.15)] group-hover:border-pink-200">
          
          <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
            <Image src={project.imgUrl} alt={project.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
            
            {/* ステータスバッジ */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md border", 
                project.status === 'COMPLETED' ? "bg-slate-900/80 text-white border-slate-700" :
                isSuccess ? "bg-emerald-500/90 text-white border-emerald-400" : "bg-pink-500/90 text-white border-pink-400"
              )}>
                {project.status === 'COMPLETED' ? '終了' : isSuccess ? 'SUCCESS!' : '募集中'}
              </span>
            </div>

            {/* カテゴリ */}
            <div className="absolute top-4 right-4">
              <span className="bg-white/90 backdrop-blur-md text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/50 shadow-sm flex items-center gap-1">
                {project.category}
              </span>
            </div>

            {/* カウントダウン */}
            {project.status !== 'COMPLETED' && (
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white shadow-sm flex items-center gap-1.5">
                <Clock size={12} className="text-pink-500" />
                <span className="text-[10px] font-black text-slate-700">残り <span className="text-sm text-pink-500">{project.daysLeft}</span> 日</span>
              </div>
            )}
          </div>

          <div className="p-6 flex flex-col flex-grow bg-gradient-to-b from-white/50 to-white">
            <div className="flex flex-wrap gap-1 mb-3">
              {project.tags.map(tag => (
                <span key={tag} className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">#{tag}</span>
              ))}
            </div>
            
            <h3 className="font-bold text-base md:text-lg text-slate-800 leading-snug mb-4 group-hover:text-pink-500 transition-colors line-clamp-2">
              <JpText>{project.title}</JpText>
            </h3>
            
            <div className="mt-auto">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Current</p>
                  <p className="text-lg font-black text-slate-800 leading-none">
                    ¥{project.currentAmount.toLocaleString()}
                    <span className="text-[10px] text-slate-400 font-medium ml-1 font-mono">/ ¥{project.targetAmount.toLocaleString()}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className={cn("text-2xl font-black font-mono leading-none", isSuccess ? "text-emerald-500" : "text-pink-500")}>
                    {percent}%
                  </span>
                </div>
              </div>

              {/* プログレスバー */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-4 shadow-inner relative">
                <motion.div 
                  initial={{ width: 0 }} 
                  whileInView={{ width: `${percent}%` }} 
                  transition={{ duration: 1.5, ease: "easeOut" }} 
                  className={cn("h-full rounded-full absolute left-0 top-0", isSuccess ? "bg-emerald-400" : "bg-gradient-to-r from-pink-400 to-rose-400")} 
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100/50">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 border border-indigo-100">
                    <User size={12} />
                  </div>
                  <span className="text-xs font-bold text-slate-600 truncate max-w-[100px]">{project.organizer}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                  <Users size={12} className="text-sky-500"/> {project.supporters}人
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </Link>
    </Reveal>
  );
};

// ==========================================
// 🌌 MAJOR SECTIONS
// ==========================================

// --- 🌸 2. TICKER ---
const TickerSection = () => {
  const words = ["#推し活", "#フラスタ", "#生誕祭", "#地下アイドル", "#VTuber", "#舞台祝い", "#ファンミーティング", "#周年記念", "#楽屋花", "#応援広告"];
  return (
    <div className="bg-gradient-to-r from-pink-500 to-rose-400 py-3 overflow-hidden relative z-20 shadow-[0_4px_20px_rgba(244,114,182,0.3)]">
      <motion.div className="flex gap-8 md:gap-12 whitespace-nowrap" animate={{ x: [0, -1000] }} transition={{ repeat: Infinity, duration: 40, ease: "linear" }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-8 md:gap-12">
            {words.map((w, j) => (
              <span key={j} className="text-xs md:text-sm font-black text-white/90 flex items-center gap-2 tracking-widest uppercase">
                <Star size={12} className="fill-yellow-300 text-yellow-300" /> {w}
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// --- 💡 3. CONCEPT & WHAT IS FLASTAL (初心者向け) ---
const ConceptSection = () => {
  return (
    <section className="py-24 md:py-32 bg-[#FAFAFC] relative overflow-hidden">
      {/* 透過背景の装飾 */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-sky-100/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-pink-100/40 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <SectionTitle 
          en="Concept" 
          ja={<span>みんなの「おめでとう」を、<br/>大きなお花に。</span>}
          desc="「推しにフラスタを贈りたいけど、一人じゃ予算が厳しい…」「企画を立てたいけど、お金の管理が不安…」FLASTALは、そんなファンのためのクラウドファンディングプラットフォームです。"
          color="pink"
        />

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {[
            { title: "企画を立ち上げる", icon: SvgPanel, text: "贈りたい相手やイベント、予算を決めて専用ページを作成。イラストパネルの募集も可能です。" },
            { title: "支援を集める", icon: SvgBouquet, text: "URLをSNSでシェアして参加者を募集。1口1,000円から、クレジットカードやコンビニで匿名支援が可能。" },
            { title: "お花を届ける", icon: SvgFlowerStand, text: "目標を達成したら、FLASTALが提携するプロのお花屋さんへシステム経由で発注し、会場へお届けします。" },
          ].map((item, i) => (
            <Reveal key={i} delay={i * 0.15}>
              <GlassCard className="p-8 text-center h-full flex flex-col relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-24 h-24 mx-auto mb-6 relative z-10 transform group-hover:scale-110 transition-transform duration-500">
                  <item.icon className="w-full h-full drop-shadow-md" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-4 relative z-10"><JpText>{item.title}</JpText></h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium relative z-10"><JpText>{item.text}</JpText></p>
                <div className="absolute top-4 right-6 text-6xl font-black text-slate-100/50 font-serif italic z-0 select-none">
                  {i + 1}
                </div>
              </GlassCard>
            </Reveal>
          ))}
        </div>

        {/* サブ：カテゴリー */}
        <div className="mt-24">
          <p className="text-center text-sm font-bold text-slate-400 mb-8 uppercase tracking-widest">対応ジャンル</p>
          <div className="flex flex-wrap justify-center gap-4">
            {CATEGORIES.map((cat, i) => (
              <Reveal key={cat.id} delay={i * 0.05}>
                <div className={cn("flex items-center gap-2 px-5 py-3 rounded-full bg-white shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group")}>
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white bg-gradient-to-br shadow-inner group-hover:scale-110 transition-transform", cat.color, cat.shadow)}>
                    {cat.icon}
                  </div>
                  <span className="font-bold text-slate-700 text-sm">{cat.name}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// --- 🌟 4. HOT PROJECTS (新着・注目企画) ---
const HotProjectsSection = () => {
  return (
    <section className="py-24 md:py-32 bg-white relative">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <SectionTitle 
            en="Projects" 
            ja="進行中のプロジェクト" 
            desc="今まさに動いている、ファンのみんなの熱い企画たちです。"
            align="left"
            Icon={Heart}
          />
          <Link href="/projects">
            <motion.button 
              whileHover={{ x: 5 }}
              className="mb-8 md:mb-16 px-6 py-3 bg-pink-50 text-pink-600 font-bold rounded-full flex items-center gap-2 hover:bg-pink-100 transition-colors border border-pink-100"
            >
              すべての企画を見る <ArrowRight size={16} />
            </motion.button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DUMMY_PROJECTS.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

// --- 🛡️ 5. FEATURES (主催者・参加者のメリット) ---
const FeaturesSection = () => {
  return (
    <section className="py-24 md:py-32 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-pink-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-sky-500/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-pink-300 font-mono text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase mb-6">
            <ShieldCheck size={14} /> Why Choose Us
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tighter">
            お金のトラブルをゼロに。<br className="hidden md:block"/>推し活をもっと純粋に。
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mt-16">
          {/* 主催者のメリット */}
          <Reveal delay={0.1}>
            <GlassCard className="bg-white/5 border-white/10 p-8 md:p-10 h-full hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-pink-500/20 rounded-2xl flex items-center justify-center text-pink-400 border border-pink-500/30">
                  <Award size={28} />
                </div>
                <h3 className="text-2xl font-black text-white">企画する人のメリット</h3>
              </div>
              <ul className="space-y-6">
                {[
                  { title: "集金・未払い管理が不要", desc: "銀行口座を教える必要なし。クレジットカード決済対応で未払いを防ぎます。" },
                  { title: "透明な収支報告", desc: "集まった金額と使用内訳をシステムが自動で可視化。信頼される企画運営が可能です。" },
                  { title: "神絵師への依頼も簡単", desc: "イラストパネルの作成をサイト内で絵師に直接依頼・決済できます。" }
                ].map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <CheckCircle2 className="text-pink-400 shrink-0 mt-1" size={20} />
                    <div>
                      <p className="font-bold text-white mb-1 text-base">{item.title}</p>
                      <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </Reveal>

          {/* 参加者のメリット */}
          <Reveal delay={0.2}>
            <GlassCard className="bg-white/5 border-white/10 p-8 md:p-10 h-full hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-sky-500/20 rounded-2xl flex items-center justify-center text-sky-400 border border-sky-500/30">
                  <Heart size={28} />
                </div>
                <h3 className="text-2xl font-black text-white">参加する人のメリット</h3>
              </div>
              <ul className="space-y-6">
                {[
                  { title: "完全匿名で安心", desc: "本名や住所の入力は不要。ハンドルネームだけで気軽にお祝いに参加できます。" },
                  { title: "1,000円から支援可能", desc: "少額からでも参加OK。みんなの力が合わさることで豪華なフラスタが実現します。" },
                  { title: "推しへのメッセージ", desc: "支援と同時にメッセージを送信。寄せ書きとして推しに届けることも可能です。" }
                ].map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <CheckCircle2 className="text-sky-400 shrink-0 mt-1" size={20} />
                    <div>
                      <p className="font-bold text-white mb-1 text-base">{item.title}</p>
                      <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
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

// --- 💬 6. VOICES (感想) ---
const VoiceSection = () => {
  return (
    <section className="py-24 md:py-32 bg-[#FAFAFC] relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl">
        <SectionTitle 
          en="Testimonials" 
          ja="ご利用いただいた皆様の声" 
          color="sky"
          Icon={MessageCircle}
        />

        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {VOICES.map((v, i) => (
            <Reveal key={i} delay={i * 0.15}>
              <GlassCard className="p-8 h-full relative group hover:-translate-y-2 transition-transform duration-300">
                <div className="absolute top-6 right-6 opacity-10 text-slate-900 group-hover:text-pink-500 transition-colors">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21L16.411 14.502H10.457V3H21.543V14.502L18.423 21H14.017ZM3.56 21L5.954 14.502H0V3H11.086V14.502L7.966 21H3.56Z"/></svg>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full overflow-hidden relative shadow-md">
                    <Image src={v.avatar} alt="User" fill className="object-cover" />
                  </div>
                  <div>
                    <span className={cn("text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider", 
                      v.color === "pink" ? "bg-pink-100 text-pink-600" : 
                      v.color === "sky" ? "bg-sky-100 text-sky-600" : "bg-emerald-100 text-emerald-600"
                    )}>
                      {v.role}
                    </span>
                    <p className="font-bold text-slate-800 text-sm mt-1">{v.name}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium relative z-10">
                  <JpText>{v.text}</JpText>
                </p>
              </GlassCard>
            </Reveal>
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
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl border border-slate-700">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,114,182,0.2),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.2),transparent)]" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-md mb-6 border border-white/20">
            <Store className="text-white" size={32} />
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-white mb-4">クリエイター・法人の皆様へ</h2>
          <p className="text-slate-300 text-sm md:text-base mb-10 max-w-2xl mx-auto leading-relaxed">
            FLASTALは、お花屋さん、ライブ会場、イベント主催者、イラストレーターの皆様と<br className="hidden md:block"/>
            ファンをつなぐ安全なエコシステムを提供します。初期費用・月額費用は無料です。
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4">
            {[
              { href: "/florists/register", label: "お花屋さん無料登録", icon: Flower },
              { href: "/venues/register", label: "会場・ホール登録", icon: MapPin },
              { href: "/illustrators/register", label: "イラストレーター登録", icon: PenTool },
            ].map((btn, i) => (
              <Link key={i} href={btn.href} className="px-6 py-3.5 bg-white/10 hover:bg-white text-white hover:text-slate-900 text-sm font-bold rounded-full border border-white/20 transition-all flex items-center justify-center gap-2 backdrop-blur-md">
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
    { q: "お花屋さんの指定はできますか？", a: "FLASTALに登録されている全国の提携フローリストから選んで発注することが可能です。過去の実績写真などを参考に、イメージに合うお店を探せます。" }
  ];

  return (
    <section id="faq" className="py-20 md:py-32 bg-white scroll-mt-20 relative">
      <div className="absolute left-0 top-1/2 w-64 h-64 bg-pink-100/50 rounded-full blur-[80px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      
      <div className="container mx-auto px-6 max-w-3xl relative z-10">
        <SectionTitle en="FAQ" ja="よくある質問" color="sky" align="center" Icon={HelpCircle} />
        
        <div className="space-y-4">
          {faqs.map((item, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <details className="group bg-slate-50 rounded-[1.5rem] p-6 border border-slate-100 cursor-pointer hover:shadow-md transition-all outline-none">
                <summary className="flex items-center justify-between font-bold text-slate-800 list-none outline-none text-sm md:text-base">
                  <span className="flex items-center gap-3"><HelpCircle className="text-sky-500 shrink-0" size={20}/> <JpText>{item.q}</JpText></span>
                  <ChevronDown size={18} className="text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
                </summary>
                <div className="mt-4 text-sm text-slate-500 pl-8 leading-relaxed font-medium border-t border-slate-200 pt-4"><JpText>{item.a}</JpText></div>
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
  <section className="py-24 md:py-32 bg-gradient-to-b from-pink-50 to-white text-center px-6 relative overflow-hidden">
    <FloatingParticles />
    <Reveal className="relative z-10 max-w-4xl mx-auto">
      <motion.div 
        animate={{ scale: [1, 1.05, 1] }} 
        transition={{ duration: 2, repeat: Infinity }}
        className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_8px_30px_rgba(244,114,182,0.3)] text-pink-500 border-4 border-pink-50"
      >
        <Heart size={48} fill="currentColor" />
      </motion.div>
      <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter text-slate-900 leading-tight">
        さあ、<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">推しへの愛</span>を<br className="md:hidden"/>形にしよう。
      </h2>
      <p className="text-sm md:text-lg text-slate-500 mb-12 font-medium max-w-xl mx-auto leading-relaxed">
        企画の作成は無料です。<br/>
        あなたの「お祝いしたい」という気持ちが、<br className="md:hidden"/>推しの笑顔と、ファン仲間の勇気になります。
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/projects/create" className="w-full sm:w-auto">
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(244,114,182,0.4)" }} 
            whileTap={{ scale: 0.95 }}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white px-10 md:px-14 py-5 md:py-6 rounded-full text-lg md:text-2xl font-black shadow-xl flex items-center justify-center gap-3"
          >
            <Sparkles /> 無料で企画を立ち上げる
          </motion.button>
        </Link>
      </div>
    </Reveal>
  </section>
);

// --- 🏠 DASHBOARD WRAPPER (ログイン済みの場合はトップをダッシュボード化) ---
const AuthenticatedHome = ({ user, logout }) => (
  <div className="min-h-screen bg-gradient-to-br from-pink-50 to-sky-50 flex items-center justify-center p-4 md:p-6 m-0 relative overflow-hidden">
    <FloatingParticles />
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
      className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-[3rem] shadow-2xl p-8 md:p-12 text-center border border-white relative z-10"
    >
      <div className="w-20 h-20 bg-pink-100 text-pink-500 rounded-[1.5rem] rotate-3 flex items-center justify-center mx-auto mb-6 shadow-inner"><ShieldCheck size={36} /></div>
      <h1 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">おかえりなさい！</h1>
      <p className="text-slate-400 mb-8 font-bold text-xs uppercase tracking-widest">
        {user?.handleName || user?.shopName || 'MEMBER'} Signed In
      </p>
      <div className="space-y-4">
        <Link href={user?.role === 'ADMIN' ? '/admin' : user?.role === 'FLORIST' ? '/florists/dashboard' : '/mypage'} className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200/50 text-sm">
          マイページへ進む <ArrowRight size={18} />
        </Link>
        <button onClick={logout} className="text-xs font-bold text-slate-400 hover:text-pink-500 transition-colors mt-4 p-2 underline decoration-transparent hover:decoration-pink-500 underline-offset-4">ログアウト</button>
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
    return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-10 h-10 text-pink-500 animate-spin" /></div>;
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