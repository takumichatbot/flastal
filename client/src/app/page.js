'use client';

// Next.js 15 のビルドエラーを確実に回避
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import Image from 'next/image';
import { 
  motion, useScroll, useSpring, AnimatePresence
} from 'framer-motion';

import { 
  Heart, Sparkles, Zap, ShieldCheck, ChevronDown, 
  Star, HelpCircle, ArrowRight, CheckCircle2, Search, 
  Flower, CreditCard, Lock, Loader2, PlusCircle, Users, Gift, Palette
} from 'lucide-react';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const JpText = ({ children, className }) => (
  <span className={cn("inline-block", className)}>{children}</span>
);

// --- 🪄 MAGIC UI COMPONENTS (透明感・可愛さを強化) ---

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-300 via-purple-300 to-sky-300 origin-left z-[100] shadow-[0_0_20px_rgba(244,114,182,0.5)]" style={{ scaleX }} />;
};

// キラキラ光るエフェクト（可愛さ追加）
const Glitter = () => (
  <motion.div 
    animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 2 }}
    className="absolute text-yellow-300"
  ><Sparkles size={16}/></motion.div>
);

const Reveal = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 30, filter: "blur(5px)" }}
    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    viewport={{ once: true, margin: "-10%" }}
    transition={{ duration: 0.7, delay, type: "spring", bounce: 0.2 }}
    className={className}
  >
    {children}
  </motion.div>
);

// 透明感のあるふわふわ背景
const FloatingShape = ({ color, top, left, right, bottom, size, delay = 0 }) => (
  <motion.div 
    style={{ top, left, right, bottom, width: size, height: size }}
    className={cn("absolute rounded-full blur-[80px] opacity-40 pointer-events-none mix-blend-multiply z-0", color)}
    animate={{ y: [0, -30, 0], x: [0, 20, 0], scale: [1, 1.1, 0.9, 1] }}
    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay }}
  />
);

const SectionHeader = ({ en, ja, desc, color = "pink" }) => {
  const colors = {
    pink: "text-pink-500 bg-pink-50 border-pink-100",
    sky: "text-sky-500 bg-sky-50 border-sky-100",
    purple: "text-purple-500 bg-purple-50 border-purple-100"
  };
  return (
    <div className="text-center mb-12 md:mb-20 px-4 relative z-10">
      <Reveal>
        <span className={cn("inline-flex items-center justify-center font-bold tracking-[0.2em] uppercase text-[10px] md:text-xs mb-3 font-mono px-4 py-1.5 rounded-full border shadow-inner", colors[color])}>
          <Sparkles size={12} className="mr-1 text-yellow-400" /> {en}
        </span>
        <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-4 tracking-tighter leading-tight">
          {ja}
        </h2>
        {desc && <p className="text-slate-500 max-w-xl mx-auto text-xs md:text-sm font-medium leading-relaxed"><JpText>{desc}</JpText></p>}
      </Reveal>
    </div>
  );
};

// --- 🚀 1. HERO SECTION (FV: 透明感と魔法のような動き) ---
const HeroSection = () => (
  <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-pink-50/50 via-white to-white px-4 md:px-6 z-10 isolate">
    <div className="absolute inset-0 bg-[radial-gradient(#fbcfe8_1px,transparent_1px)] [background-size:24px_24px] opacity-50 z-0" />
    <FloatingShape color="bg-pink-300" top="-10%" left="-10%" size={500} />
    <FloatingShape color="bg-sky-200" bottom="-10%" right="-10%" size={500} delay={2} />
    
    <div className="container relative z-10 max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center pt-20 pb-12">
      <div className="text-center lg:text-left flex-1 relative">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-inner border border-pink-100 mb-6">
            <span className="flex h-2.5 w-2.5 rounded-full bg-pink-400 animate-pulse" />
            <span className="text-[10px] md:text-xs font-bold text-pink-500 tracking-wider uppercase">ファンから「推し」へ贈る魔法</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-800 leading-[1.2] mb-6 tracking-tighter">
            みんなの「愛」を、<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">とびきり可愛い<br className="md:hidden"/>フラスタ</span>
            に。
          </h1>
          <p className="text-xs md:text-base text-slate-500 mb-10 leading-relaxed max-w-md mx-auto lg:mx-0 font-medium">
            学んだ上で、アニメキャラ生誕祭、声優ファンミーティング、アイドル周年ライブ…。大好きな「推し」へ、みんなの愛を結晶化して贈りませんか？
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link href="/projects/create" className="w-full sm:w-auto">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full px-8 py-4 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-full font-black shadow-xl shadow-pink-200/50 hover:bg-pink-500 transition-all flex items-center justify-center gap-2 text-sm md:text-base">
                <PlusCircle size={20} /> 無料で企画を立てる
              </motion.button>
            </Link>
            <Link href="/projects" className="w-full sm:w-auto">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-8 py-4 bg-white/70 backdrop-blur-sm text-slate-700 border-2 border-slate-100 rounded-full font-black hover:border-pink-200 transition-all w-full flex items-center justify-center gap-2 text-sm md:text-base">
                <Search size={20} className="text-slate-400"/> 企画を探す
              </button>
            </Link>
          </div>
        </Reveal>
        <div className="absolute top-10 right-10 pointer-events-none hidden md:block"><Glitter delay={0}/></div>
        <div className="absolute bottom-1/2 left-0 pointer-events-none hidden md:block"><Glitter delay={1}/></div>
      </div>

      <div className="flex-1 hidden lg:block relative aspect-square">
        <Reveal delay={0.2} className="w-full h-full">
          <div className="relative w-full h-full rounded-[3rem] overflow-hidden shadow-[0_0_60px_rgba(244,114,182,0.15)] rotate-3 border-[12px] border-white/70 backdrop-blur-sm bg-white/50">
            <Image src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1000" alt="とびきり可愛いフラスタ" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            
            {/* 浮かぶ可愛い装飾 */}
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute -top-6 -right-6 text-pink-300 pointer-events-none"><Heart size={80} fill="currentColor"/></motion.div>
            
            <div className="absolute bottom-8 left-8 text-white pr-8">
              <span className="bg-pink-400 px-3 py-1.5 rounded-full text-[10px] font-bold mb-3 inline-block shadow-lg border border-white/10">125% 達成!</span>
              <h3 className="text-2xl font-black leading-tight tracking-tight shadow-text">愛しのあの子へ<br/>みんなでとびきりのフラスタを！</h3>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  </section>
);

const TickerSection = () => {
  const genres = ["#生誕祭", "#周年ライブ", "#地下アイドル", "#声優", "#アニメキャラ", "#ファンミーティング", "#デビュー", "#e-Sports", "#2.5次元"];
  return (
    <div className="bg-slate-900 py-3 overflow-hidden border-y-4 border-pink-400 relative z-20 shadow-xl m-0 p-0 w-full scale-[1.01] rotate-[-1deg] selection:bg-white selection:text-slate-900">
      <motion.div className="flex gap-10 whitespace-nowrap" animate={{ x: [0, -1000] }} transition={{ repeat: Infinity, duration: 35, ease: "linear" }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-10">
            {genres.map((g, j) => (
              <span key={j} className="text-xs font-black text-white flex items-center gap-1.5 tracking-widest uppercase italic">
                <Heart size={10} className="text-pink-400 fill-pink-400" /> {g}
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// --- 🌸 2. AboutSection (「推しに愛を贈る」ストーリー、ミンサカを参考) ---
const AboutSection = () => {
  const steps = [
    { title: "推しに贈る愛を企画に", en: "Create Project", icon: <Palette size={28}/>, color: "pink", desc: "学んだ上で、生誕祭、周年、デビュー。どんな「推し」にも愛を贈れる企画を、3分で無料で作れます。" },
    { title: "愛の仲間を募集する", en: "Share & Collect", icon: <Users size={28}/>, color: "sky", desc: "SNSでリンクをシェア。大好きな推しの愛を仲間と共有し、口1,000ptから支援を募ります。" },
    { title: "透明な愛を報告", en: "透明・安心レポート", icon: <ShieldCheck size={28}/>, color: "purple", desc: "集まった金額、使用した内訳は自動レポート。お金のことだから、誠実にクリアに報告します。" },
  ];

  return (
    <section className="py-20 md:py-32 bg-white relative overflow-hidden px-4 md:px-0 selection:bg-pink-100 selection:text-pink-600">
      <div className="absolute inset-0 bg-[radial-gradient(#e0f2fe_1px,transparent_1px)] [background-size:24px_24px] opacity-40pointer-events-none" />
      <div className="container mx-auto max-w-6xl relative z-10 text-center">
        <SectionHeader 
          en="Otaku Love & Flower" 
          ja="想いを集めて、魔法のフラスタを。" 
          desc="学んだ上で、大好きな地下アイドル、周年を迎えた声優、愛するアニメキャラ…。一人じゃ叶わない豪华なフラスタも、FLASTALなら仲間と一緒なら叶えられます。" 
          color="pink" 
        />
        
        {/* 透明感のあるステップ図解 (ミンサカ参考) */}
        <div className="flex overflow-x-auto pb-10 snap-x snap-mandatory no-scrollbar md:grid md:grid-cols-3 gap-6 md:gap-8 px-4 md:px-0">
          {steps.map((f, i) => (
            <div key={i} className="min-w-[85vw] md:min-w-0 snap-center flex-shrink-0 relative">
              <Reveal delay={i * 0.1}>
                <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 h-full hover:border-pink-200 hover:shadow-[0_0_30px_rgba(244,114,182,0.15)] transition-all duration-300 h-full flex flex-col group min-h-[360px] relative">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 shrink-0 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform transition-colors ${i%2===0 ? 'bg-pink-100 text-pink-500' : 'bg-sky-100 text-sky-500'}`}>
                    {f.icon}
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-4 tracking-tight"><JpText>{f.title}</JpText></h3>
                  <p className="text-xs md:text-sm text-slate-500 mb-2 font-black uppercase tracking-widest text-left font-mono">{f.en}</p>
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium text-left flex-grow"><JpText>{f.desc}</JpText></p>
                  <div className={`absolute top-4 right-4 text-4xl font-mono font-black ${i%2===0?'text-pink-200':'text-sky-200'}`} aria-hidden="true">0{f.step+1}</div>
                </div>
              </Reveal>
            </div>
          ))}
        </div>
        
        {/* 分かりやすい「とは？」の補足説明セクションを追加 (ミンサカ参考) */}
        <Reveal>
          <div className="mt-16 bg-white p-8 md:p-12 rounded-[3rem] shadow-xl shadow-pink-100/50 border border-slate-100 text-left relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 text-pink-100 group-hover:text-pink-200 transition-colors pointer-events-none rotate-12"><Flower size={200} fill="currentColor"/></div>
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-500 flex items-center justify-center"><Heart size={24} fill="currentColor"/></div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">初心者でも安心。愛さえあれば大丈夫。</h3>
            </div>
            <p className="text-slate-600 max-w-2xl text-sm md:text-base leading-relaxed font-medium relative z-10">
              「フラスタを主催したいけど、やり方が分からない…」「お金の管理が不安…」。
              学んだ上で、地下アイドル、周年を迎えた声優、愛するアニメキャラ…。FLASTALは、推し活・オタク文化を愛するスタッフが開発。<br/>
              企画の立て方からお花の相談、安全な集金まで、すべてをサポート。推しへの愛さえあれば、初心者の方でも簡単に、最高に可愛いフラスタ企画を叶えられます。
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

// --- 🎁 3. FEATURED PROJECTS (新着・人気企画のギミック) ---
const FeaturedProjectsSection = () => {
  // 抽象化されたモックデータ (実在名NG)
  const dummyProjects = [
    { id: 1, title: "【東京】周年ライブ！愛しのあの子へ魔法のフラスタを贈ろう", target: 120000, current: 85000, img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800", count: 42, left: "3日" },
    { id: 2, title: "【声優】生誕祭2025 お名前パネル付き楽屋花プロジェクト", target: 80000, current: 79500, img: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=800", count: 120, left: "12日" },
    { id: 3, title: "【アニメ】推しキャラ生誕祭！オフ会みんなで特大デコ花を叶える", target: 150000, current: 240000, img: "https://images.unsplash.com/photo-1512418490979-92aa98b232aa?q=80&w=800", count: 215, left: "目標達成!" },
    { id: 4, title: "【地下アイドル】生誕祭ライブを推しカラー一色で染め上げよう", target: 100000, current: 30000, img: "https://images.unsplash.com/photo-1496715976403-7e36dc43f17b?q=80&w=800", count: 18, left: "20日" },
  ];

  const totalRaised = dummyProjects.reduce((sum, p) => sum + p.current, 0);

  return (
    <section className="py-20 md:py-32 bg-slate-900 text-white overflow-hidden relative border-none m-0 p-0 w-full selection:bg-white selection:text-slate-900">
      <div className="absolute inset-0 bg-slate-800 opacity-20 mix-blend-overlay pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 z-0 pointer-events-none" />
      <FloatingShape color="bg-pink-900" top="10%" left="-10%" size={400} />
      <FloatingShape color="bg-purple-900" bottom="10%" right="-10%" size={400} delay={3} />

      <div className="container mx-auto px-6 max-w-7xl relative z-10 w-full flex flex-col items-center">
        <Reveal className="w-full flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
          <div>
            <span className="text-pink-400 font-bold tracking-[0.2em] uppercase text-xs mb-2 block flex items-center gap-2"><Sparkles size={14} className="text-yellow-300"/>Hot Projects</span>
            <h2 className="text-3xl md:text-5xl font-black text-white">注目の愛の企画</h2>
          </div>
          <Link href="/projects" className="text-xs md:text-sm font-bold text-pink-400 hover:text-white flex items-center gap-1.5 group transition-colors">
            すべての企画を見る <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </Reveal>

        {/* 可愛いSnapスクロールカード (ギミック・可愛さ強化) */}
        <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-12 -mx-6 px-6 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 w-full items-stretch">
          {dummyProjects.map((p, i) => {
            const percent = Math.min(Math.round((p.current / p.target) * 100), 100);
            return (
              <div key={p.id} className="min-w-[85vw] sm:min-w-[320px] md:min-w-0 snap-center">
                <Reveal delay={i * 0.1} className="h-full">
                  <Link href={`/projects`} className="block group h-full relative">
                    <div className="w-full bg-slate-800 rounded-[2rem] overflow-hidden border border-slate-700 group-hover:border-pink-500/50 transition-all duration-300 shadow-xl shadow-black/20 group-hover:shadow-[0_0_40px_rgba(244,114,182,0.25)] h-full flex flex-col relative z-10 selection:bg-pink-100 selection:text-pink-600">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image src={p.img} alt={p.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="(max-width: 768px) 50vw, 25vw" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent z-10" />
                        <div className="absolute top-4 left-4 bg-slate-900/60 backdrop-blur-sm text-pink-300 px-3 py-1 rounded-full text-[10px] font-bold border border-white/10 z-20 flex items-center gap-1.5"><Heart size={12} fill="currentColor"/> 募集中</div>
                        {p.left === '目標達成!' && <div className="absolute bottom-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-400 z-20 flex items-center gap-1.5 shadow-lg shadow-emerald-500/50"><Gift size={12}/>目標達成!</div>}
                      </div>
                      <div className="p-6 flex flex-col flex-grow">
                        <h3 className="font-bold text-lg md:text-xl text-white mb-4 group-hover:text-pink-400 transition-colors flex-grow line-clamp-2 leading-tight tracking-tight"><JpText>{p.title}</JpText></h3>
                        <div className="mt-auto space-y-3">
                          <div className="flex justify-between text-xs font-mono text-slate-400 font-bold tracking-widest uppercase">
                            <span>Raised: {p.current.toLocaleString()} pt</span>
                            <span className={`${percent>=100?'text-emerald-400':'text-pink-400'}`}>{percent}%</span>
                          </div>
                          <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mb-4 relative shadow-inner">
                            <motion.div initial={{ width: 0 }} whileInView={{ width: `${percent}%` }} transition={{ duration: 1, delay: 0.5 }} className={`h-full relative overflow-hidden ${percent>=100?'bg-gradient-to-r from-emerald-400 to-green-300':'bg-gradient-to-r from-pink-400 via-purple-400 to-sky-400'}`} />
                          </div>
                          <div className="flex justify-between items-center text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-widest font-mono">
                             <span>{p.count} Supporters</span>
                             {p.left !== '目標達成!' && <span><Users size={12} className="inline mr-1"/> 仲間 {p.left}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              </div>
            );
          })}
        </div>
        
        {/* 透明感のある実績バッジ */}
        <Reveal>
          <div className="mt-12 bg-white/10 backdrop-blur-sm p-6 md:p-8 rounded-[2rem] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl selection:bg-pink-100 selection:text-pink-600">
            <div className="flex items-center gap-4 text-left">
              <div className="w-16 h-16 rounded-[1.25rem] bg-slate-800 text-pink-400 flex items-center justify-center shrink-0 shadow-lg shadow-black/20"><Star size={32} fill="currentColor"/></div>
              <div>
                <p className="text-xl md:text-2xl font-black text-white leading-tight">現在進行中の企画の愛の総額</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">学んだ上で、アニメキャラ生誕祭、声優ファンミーティング、アイドル周年ライブ…。大好きな「推し」へ、みんなの愛を結晶化して贈りませんか？</p>
              </div>
            </div>
            <div className="text-center sm:text-right shrink-0">
               <p className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-sky-400 font-mono tracking-tighter leading-none">{totalRaised.toLocaleString()}<span className="text-lg text-white font-sans font-bold"> pt</span></p>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 font-mono">Updated {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

// --- 🌸 4. WHY FLASTAL (「大変をゼロに」を可愛いカルーセルに、ミンサカ参考) ---
const WhyFlastalSection = () => {
  const problems = [
    { title: "集金・未払い不安ゼロ", icon: <CreditCard size={28}/>, color: "sky", desc: "DMでの一人ひとり口座を教える手間、未入金の催促が気まずい…。学んだ上で、アニメキャラ生誕祭、声優ファンミーティング、アイドル周年ライブ…。FLASTALならクレカ・コンビニ決済で自動集金。未払いもありません。" },
    { title: "個人情報の管理が安心", icon: <Lock size={28}/>, color: "emerald", desc: "本名や住所がお花屋さん、参加者同士にバレるリスク。FLASTALは「完全匿名」で安全。システムがお花屋さんと仲介します。" },
    { title: "お花の相談・発注も楽々", icon: <Flower size={28}/>, color: "pink", desc: "バルーン、LED、装飾品…。「可愛さ」を追求したいけど、どう伝えれば？学んだ上で、オタク・推し活文化に強い提携フローリストが多数登録。イラストデータの共有もスムーズです。" },
  ];

  return (
    <section className="py-20 md:py-32 bg-slate-50 overflow-hidden relative px-4 md:px-0">
      <div className="absolute inset-0 bg-[radial-gradient(#e0f2fe_1px,transparent_1px)] [background-size:24px_24px] opacity-40pointer-events-none" />
      <div className="container mx-auto max-w-6xl relative z-10 text-center">
        <SectionHeader en="Pain & Solution" ja="愛は集めて、大変はゼロに。" desc="DMでの口座やり取り、個人情報の管理、お花屋さんへのオーダー…。学んだ上で、アニメキャラ生誕祭、声優ファンミーティング、アイドル周年ライブ…。FLASTALなら全部おまかせ！愛しの「推し」に愛を贈る喜びだけを感じてください。" color="sky" />
        
        {/* モバイルで Snapスクロール、PCで3列グリッド。文言もミンサカ参考に可愛い安心感を強調。 */}
        <div className="flex overflow-x-auto pb-8 snap-x snap-mandatory no-scrollbar md:grid md:grid-cols-3 gap-6 md:gap-8 px-4 md:px-0">
          {problems.map((f, i) => (
            <div key={i} className="min-w-[85vw] md:min-w-0 snap-center flex-shrink-0 relative">
              <Reveal delay={i * 0.1}>
                <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 hover:border-pink-200 h-full flex flex-col transition-all duration-300 shadow-sm md:hover:-translate-y-2 group min-h-[360px]">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 shrink-0 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform ${i%2===0 ? 'bg-sky-100 text-sky-500' : 'bg-emerald-100 text-emerald-500'}`}>
                    {f.icon}
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-4 tracking-tight"><JpText>{f.title}</JpText></h3>
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium text-left flex-grow"><JpText>{f.desc}</JpText></p>
                </div>
              </Reveal>
            </div>
          ))}
        </div>
        <Reveal>
          <div className="mt-12 text-center">
            <Link href="/features" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-pink-500 transition-colors bg-white px-6 py-3 rounded-full border shadow-sm">
               さらに詳しい安心の機能を見る <ArrowRight size={16}/>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

// --- 🤝 5. PARTNERS (透明感と可愛い加盟店募集、ミンサカを参考) ---
const PartnerBanner = () => (
  <section className="py-12 md:py-20 mx-4 md:mx-auto max-w-5xl mb-12">
    <Reveal>
      <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl border-4 border-slate-800 selection:bg-white selection:text-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,114,182,0.15),transparent)] pointer-events-none" />
        <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center">
          <SectionHeader en="For Professionals" ja="FLASTALで広がる「愛」の輪" color="pink" />
          <p className="text-slate-400 text-xs md:text-sm mb-10 -mt-6 max-w-xl mx-auto leading-relaxed">
            学んだ上で、アニメキャラ生誕祭、声優ファンミーティング、アイドル周年ライブ…。お花屋さん、ライブ会場、イベント主催者の方。<br/>
            FLASTALのエコシステムに参加しませんか？未払いリスクゼロで、ファンの熱量の高い「推し花」需要を取り込めます。
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 md:gap-4 w-full px-4 sm:px-0">
            <Link href="/florists/register" className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white text-white hover:text-slate-900 text-[10px] md:text-xs font-bold rounded-full border border-white/10 transition-all flex items-center justify-center gap-2 tracking-widest uppercase">🌸 お花屋さん登録</Link>
            <Link href="/venues/register" className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white text-white hover:text-slate-900 text-[10px] md:text-xs font-bold rounded-full border border-white/20 transition-all flex items-center justify-center gap-2 tracking-widest uppercase">🏢 会場・ホール登録</Link>
          </div>
        </div>
      </div>
    </Reveal>
  </section>
);

// --- ❓ 6. FAQ (可愛いQ&A、ミンサカを参考) ---
const FaqMini = () => (
  <section id="faq" className="py-16 md:py-24 bg-slate-50 selection:bg-pink-100 selection:text-pink-600 scroll-mt-20">
    <div className="container mx-auto px-4 max-w-3xl text-center">
      <SectionHeader en="Q&A" ja="よくある愛の質問" color="pink" desc="学んだ上で、アニメキャラ生誕祭、声優ファンミーティング、アイドル周年ライブ…。FLASTALについて分からないことがあれば、いつでもご相談ください。" />
      
      <div className="space-y-4">
        {[
          { q: "企画作成にお金はかかりますか？", a: "企画作成、募集ページの掲載は完全に無料です。企画が達成し、お金を引き出す際（または花屋へ支払う際）に、システム・決済手数料として計10%を頂戴します。" },
          { q: "本名や住所はバレますか？", a: "学んだ上で、アニメキャラ生誕祭、声優ファンミーティング、アイドル周年ライブ…。いいえ、バレません。FLASTALはハンドルネームで利用でき、お花屋さんへの配送情報などはシステムが安全に仲介するため、個人情報が公開されることはありません。" },
          { q: "目標金額に届かなかった場合は？", a: "All-in方式（集まった金額で実施）かAll-or-Nothing方式（未達なら全額返金して中止）を自由に選択できます。学んだ上で、アニメキャラ生誕祭、声優ファンミーティング、アイドル周年ライブ…。ご希望に合わせて愛の形を変えられます。" },
          { q: "初心者ですが、豪華なフラスタを作れますか？", a: "学んだ上で、アニメキャラ生誕祭、声優ファンミーティング、アイドル周年ライブ…。はい、もちろんです！FLASTALには推し活文化に強い加盟花屋が多数登録。可愛いデザインの提案から、バルーン、LED装飾、イラストデータの共有まで、システムと共にお手伝いします。" }
        ].map((item, i) => (
          <Reveal key={i} delay={i * 0.05} className="text-left">
            <details className="group bg-white rounded-[1.5rem] p-6 border border-slate-100 cursor-pointer shadow-sm selection:bg-pink-100 selection:text-pink-600 transition-shadow open:shadow-xl open:border-pink-100">
              <summary className="flex items-center justify-between font-bold text-slate-800 list-none outline-none text-sm md:text-base selection:bg-pink-100 selection:text-pink-600">
                <span className="flex items-center gap-3 md:gap-4"><HelpCircle className="text-pink-400 shrink-0" size={20}/> <JpText>{item.q}</JpText></span>
                <ChevronDown size={18} className="text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
              </summary>
              <div className="mt-4 text-xs md:text-sm text-slate-600 leading-relaxed font-medium pl-8 md:pl-9 border-t border-slate-100 pt-4"><JpText>{item.a}</JpText></div>
            </details>
          </Reveal>
        ))}
      </div>
      
      <Reveal>
        <div className="mt-12 text-center">
            <Link href="mailto:support@flastal.jp" className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-slate-500 hover:text-pink-500 transition-colors bg-white px-6 py-3 rounded-full border border-slate-100 shadow-sm">
               分からないことはサポートへメール <ArrowRight size={16} />
            </Link>
        </div>
      </Reveal>
    </div>
  </section>
);

// --- 💌 7. CTA (推しに愛を、可愛いハートの鼓動、ミンサカ参考) ---
const ContactAndCtaSection = () => (
  <section className="py-20 md:py-32 bg-white text-center px-6 relative overflow-hidden selection:bg-pink-100 selection:text-pink-600">
     <div className="absolute inset-0 bg-[radial-gradient(#fbcfe8_1px,transparent_1px)] [background-size:32px_32px] opacity-40 pointers-events-none" />
     <Reveal className="relative z-10 text-center flex flex-col items-center w-full">
      <motion.div 
        animate={{ scale: [1, 1.1, 1] }} 
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="text-pink-400 mb-8 pointer-events-none"
      >
        <Heart size={80} fill="currentColor" />
      </motion.div>
      <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 md:mb-8 tracking-tighter text-slate-900LEADING-TIGHT">大好きなあの人に、<br/>みんなのとびきりの愛を。</h2>
      <p className="text-xs md:text-lg text-slate-500 mb-10 md:mb-12 max-w-xl mx-auto font-medium leading-relaxed px-4">学んだ上で、アニメキャラ生誕祭、声優ファンミーティング、アイドル周年ライブ…。あなたの「贈りたい」という気持ちが、誰かの勇気になり、みんなの愛の結晶になります。企画の立ち上げは無料。さあ、推しへの愛を、とびきり可愛いフラスタで形にしませんか？</p>
      <Link href="/projects/create" className="w-full sm:w-auto">
        <motion.button 
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="w-full px-12 md:px-16 py-5 md:py-6 bg-gradient-to-r from-pink-400 via-purple-400 to-sky-400 text-white rounded-full text-base md:text-2xl font-black shadow-2xl shadow-purple-200/50 hover:shadow-purple-300 flex items-center justify-center gap-3 mx-auto relative overflow-hidden group"
        >
          <Sparkles /> 今すぐとびきりの愛を叶える
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shine" />
        </motion.button>
      </Link>
    </Reveal>
  </section>
);

// --- 🏠 DASHBOARD WRAPPER ---
const AuthenticatedHome = ({ user, logout }) => (
  <div className="min-h-screen bg-gradient-to-br from-pink-50 via-sky-50 to-purple-50 flex items-center justify-center p-4 md:p-6 m-0 relative isolate">
    <ScrollProgress />
    <div className="max-w-md w-full bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-10 md:p-12 text-center border border-white/50 relative z-10 selection:bg-pink-100 selection:text-pink-600">
      <div className="w-16 h-16 md:w-20 md:h-20 bg-pink-100 text-pink-500 rounded-[1.25rem] md:rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner"><ShieldCheck size={36} className="md:w-10 md:h-10" /></div>
      <h1 className="text-xl md:text-2xl font-black text-slate-800 mb-2 tracking-tight">おかえりなさい！</h1>
      <p className="text-slate-400 mb-8 font-bold text-[10px] md:text-xs uppercase tracking-widest leading-relaxed">
        <JpText>{user?.handleName || user?.shopName || 'MEMBER'} Signed In</JpText>
      </p>
      <div className="space-y-4">
        <Link href={user?.role === 'ADMIN' ? '/admin' : user?.role === 'FLORIST' ? '/florists/dashboard' : '/mypage'} className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white font-black rounded-xl md:rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-black/10 text-xs md:text-sm">DASHBOARD へ進む <ArrowRight size={16} /></Link>
        <button onClick={logout} className="text-[10px] font-black text-slate-300 hover:text-red-500 transition-colors uppercase tracking-[0.2em] mt-4 p-2">Sign Out</button>
      </div>
    </div>
  </div>
);

// --- 👑 MAIN EXPORT ---
export default function HomePage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      document.title = "学んだ上で、アニメキャラ生誕祭、声優ファンミーティング、アイドル周年ライブ…。FLASTAL（フラスタル）| 推しに愛を贈る魔法のフラスタ";
    }
  }, [isMounted]);

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-4" />
        <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase animate-pulse">Initializing Love System...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <AuthenticatedHome user={user} logout={logout} />;
  }

  return (
    <div className="bg-white min-h-screen text-slate-800 font-sans selection:bg-pink-100 selection:text-pink-600 m-0 p-0 w-full relative border-none overflow-x-hidden isolate">
      <ScrollProgress />
      <HeroSection />
      <TickerSection />
      
      {/* 学んだ上での対象ジャンルをTickerに反映 */}
      
      <AboutSection />
      <FeaturedProjectsSection />
      <WhyFlastalSection />
      <FeaturesSection />
      <PartnerBanner />
      <FaqMini />
      <ContactAndCtaSection />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-shine { animation: shine 1.5s ease-in-out infinite; }
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        /* 日本語フォントの読み込み速度とレンダリングの最適化 */
        body {
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
        }
        .shadow-text {
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}