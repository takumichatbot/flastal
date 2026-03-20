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
  Star, HelpCircle, ArrowRight, Search, Users,
  Flower, CreditCard, Lock, Loader2, PlusCircle, Gift, MessageCircle
} from 'lucide-react';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const JpText = ({ children, className }) => (
  <span className={cn("inline-block", className)}>{children}</span>
);

// --- 🪄 MAGIC UI COMPONENTS ---

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-400 via-purple-400 to-sky-400 origin-left z-[100]" style={{ scaleX }} />;
};

const Reveal = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-10%" }}
    transition={{ duration: 0.7, delay, type: "spring", bounce: 0.2 }}
    className={className}
  >
    {children}
  </motion.div>
);

const SectionHeader = ({ en, ja, desc, color = "pink" }) => {
  const colors = {
    pink: "text-pink-500 bg-pink-50 border-pink-100",
    blue: "text-sky-500 bg-sky-50 border-sky-100",
    purple: "text-purple-500 bg-purple-50 border-purple-100",
    emerald: "text-emerald-500 bg-emerald-50 border-emerald-100",
  };
  return (
    <div className="text-center mb-12 md:mb-20 px-4">
      <Reveal>
        <span className={cn("inline-flex items-center justify-center font-bold tracking-[0.2em] uppercase text-[10px] md:text-xs mb-4 font-mono px-4 py-1.5 rounded-full border", colors[color])}>
          <Sparkles size={12} className="mr-1" /> {en}
        </span>
        <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-4 tracking-tighter leading-tight">
          {ja}
        </h2>
        {desc && <p className="text-slate-500 max-w-2xl mx-auto text-sm md:text-base font-medium leading-relaxed mt-4"><JpText>{desc}</JpText></p>}
      </Reveal>
    </div>
  );
};

// 背景のフワフワしたパーティクル
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    {[...Array(10)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-3 h-3 bg-pink-300 rounded-full mix-blend-multiply filter blur-[1px] opacity-30"
        initial={{
          x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
          y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
        }}
        animate={{
          y: [null, Math.random() * -200],
          x: [null, (Math.random() - 0.5) * 100],
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.5, 1],
        }}
        transition={{
          duration: Math.random() * 10 + 10,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    ))}
  </div>
);

// --- 🚀 1. HERO SECTION (FV) ---
const HeroSection = () => (
  <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-pink-50/80 to-white px-4 md:px-6 pt-20 pb-12">
    <div className="absolute inset-0 bg-[radial-gradient(#fbcfe8_1px,transparent_1px)] [background-size:24px_24px] opacity-50 z-0" />
    <FloatingParticles />
    
    <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-pink-300/30 blur-[80px] rounded-full mix-blend-multiply pointer-events-none z-0" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-sky-200/30 blur-[80px] rounded-full mix-blend-multiply pointer-events-none z-0" />

    <div className="container relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
      <div className="text-center lg:text-left flex-1">
        <Reveal>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-pink-100 mb-6"
          >
            <span className="flex h-2.5 w-2.5 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-[10px] md:text-xs font-bold text-pink-500 tracking-wider uppercase">ファン発 クラウドファンディング</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-800 leading-[1.2] mb-6 tracking-tighter">
            想いを集めて、<br/>
            <span className="relative inline-block mt-2">
               <span className="absolute inset-0 bg-pink-200 -rotate-2 rounded-lg blur-sm opacity-40"></span>
               <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">とびきりのフラスタ</span>
            </span><br className="md:hidden"/>を贈ろう。
          </h1>
          
          <p className="text-sm md:text-lg text-slate-500 mb-10 leading-relaxed max-w-lg mx-auto lg:mx-0 font-medium">
            FLASTAL（フラスタル）は、推しへの「お祝い花」を<br className="hidden md:block"/>
            ファン同士で費用を出し合って贈れるサービスです。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start px-2 sm:px-0">
            <Link href="/projects/create" className="w-full sm:w-auto">
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="w-full px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-black shadow-xl shadow-pink-200 flex items-center justify-center gap-2 text-base md:text-lg"
              >
                <PlusCircle size={22} /> 企画を立てる
              </motion.button>
            </Link>
            <Link href="/projects" className="w-full sm:w-auto">
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="w-full px-8 py-4 bg-white text-pink-500 border-2 border-pink-100 rounded-full font-black shadow-sm flex items-center justify-center gap-2 text-base md:text-lg"
              >
                <Search size={22} /> 企画を探す
              </motion.button>
            </Link>
          </div>
        </Reveal>
      </div>

      <div className="flex-1 w-full max-w-lg mx-auto relative lg:h-[600px] aspect-square lg:aspect-auto">
        <Reveal delay={0.2} className="w-full h-full">
          <div className="relative w-full h-full rounded-[3rem] overflow-hidden shadow-2xl rotate-2 border-8 border-white bg-slate-100 group">
            <Image src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1000" alt="Flasta" fill className="object-cover transition-transform duration-1000 group-hover:scale-105" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-pink-900/80 via-transparent to-transparent" />
            
            {/* 浮かぶ装飾バッジ */}
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg flex items-center gap-2">
              <div className="bg-green-100 text-green-500 p-1.5 rounded-full"><Users size={14}/></div>
              <span className="text-xs font-bold text-slate-700">85人が参加中!</span>
            </motion.div>

            <div className="absolute bottom-8 left-8 right-8 text-white">
              <span className="bg-pink-500 px-3 py-1 rounded-full text-[10px] font-bold mb-3 inline-block shadow-md">目標達成!</span>
              <h3 className="text-xl md:text-2xl font-bold leading-tight drop-shadow-md">星街すいせいさんへ<br/>銀河一のフラスタを！</h3>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  </section>
);

const TickerSection = () => {
  const genres = ["#地下アイドル", "#VTuber", "#歌い手", "#コンカフェ", "#生誕祭", "#周年ライブ", "#e-Sports", "#K-POP", "#2.5次元"];
  return (
    <div className="bg-pink-500 py-4 overflow-hidden relative z-20 shadow-md">
      <motion.div className="flex gap-8 md:gap-12 whitespace-nowrap" animate={{ x: [0, -1000] }} transition={{ repeat: Infinity, duration: 35, ease: "linear" }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-8 md:gap-12">
            {genres.map((g, j) => (
              <span key={j} className="text-xs md:text-sm font-bold text-white flex items-center gap-2 tracking-widest">
                <Star size={14} className="fill-yellow-300 text-yellow-300" /> {g}
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// --- 🌸 2. WHAT'S FLASTAL? (初心者向け図解) ---
const AboutSection = () => {
  return (
    <section className="py-20 md:py-32 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-5xl text-center">
        <SectionHeader en="About" ja="FLASTALとは？" color="sky" desc="「推しに大きなお花を贈りたいけど、一人じゃお金が…」そんな悩みを解決する、推し活のためのクラウドファンディングです。" />
        
        <div className="relative mt-16 bg-slate-50 rounded-[3rem] p-8 md:p-12 border border-slate-100 shadow-inner">
          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            {[
              { step: 1, title: "企画を立ち上げる", icon: <PlusCircle size={32}/>, desc: "誰でも無料で簡単に企画ページを作れます。" },
              { step: 2, title: "仲間から支援を集める", icon: <Users size={32}/>, desc: "URLをSNSでシェア。1口1,000円から支援を募ります。" },
              { step: 3, title: "豪華なお花が届く", icon: <Gift size={32}/>, desc: "集まったお金でプロのお花屋さんが制作し、会場へお届け！" },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 0.2}>
                <div className="flex flex-col items-center text-center relative">
                  <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center text-sky-500 mb-6 relative border-4 border-sky-50">
                    <span className="absolute -top-2 -right-2 w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-black text-sm border-2 border-white">{s.step}</span>
                    {s.icon}
                  </div>
                  <h3 className="text-lg font-black text-slate-800 mb-3">{s.title}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
          {/* PC用の矢印 */}
          <div className="hidden md:block absolute top-1/2 left-[25%] right-[25%] -translate-y-1/2 -mt-8 pointer-events-none">
            <div className="w-full flex justify-between px-16">
              <ArrowRight size={32} className="text-slate-300" />
              <ArrowRight size={32} className="text-slate-300" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- 🌟 3. FEATURED PROJECTS (注目の企画 / 新着) ---
const FeaturedProjectsSection = () => {
  // 実際のAPIがあれば置き換えますが、今回はUIの雰囲気を伝えるためのモックデータを使用
  const dummyProjects = [
    { id: 1, title: "【東京ドーム】〇〇ちゃんソロライブ出演祝いフラスタ", target: 100000, current: 85000, users: 42, img: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=800" },
    { id: 2, title: "Vtuber〇〇 3周年記念3Dライブ 応援広告＆フラスタ企画", target: 200000, current: 240000, users: 120, img: "https://images.unsplash.com/photo-1505236858219-8359eb29e325?q=80&w=800" },
    { id: 3, title: "舞台『〇〇』千秋楽祝い 楽屋花プロジェクト", target: 50000, current: 20000, users: 15, img: "https://images.unsplash.com/photo-1457089328109-e5d9bd499191?q=80&w=800" },
  ];

  return (
    <section className="py-20 md:py-32 bg-slate-900 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30" />
      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <span className="text-pink-400 font-bold tracking-[0.2em] uppercase text-xs mb-2 block flex items-center gap-2"><Sparkles size={14}/> Hot Projects</span>
            <h2 className="text-3xl md:text-5xl font-black text-white">注目の企画</h2>
          </div>
          <Link href="/projects" className="text-sm font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 group">
            すべての企画を見る <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 横スワイプ対応のカードリスト */}
        <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-8 -mx-6 px-6 md:mx-0 md:px-0 md:grid md:grid-cols-3 gap-6">
          {dummyProjects.map((p, i) => {
            const percent = Math.min(Math.round((p.current / p.target) * 100), 100);
            return (
              <div key={p.id} className="min-w-[85vw] sm:min-w-[320px] md:min-w-0 snap-center">
                <Reveal delay={i * 0.1} className="h-full">
                  <Link href={`/projects`} className="block group h-full">
                    <div className="bg-slate-800 rounded-[2.5rem] overflow-hidden border border-slate-700 hover:border-pink-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(236,72,153,0.2)] h-full flex flex-col">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image src={p.img} alt={p.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold border border-white/10">募集中</div>
                      </div>
                      <div className="p-6 flex flex-col flex-grow">
                        <h3 className="font-bold text-lg leading-tight mb-4 group-hover:text-pink-400 transition-colors line-clamp-2"><JpText>{p.title}</JpText></h3>
                        <div className="mt-auto">
                          <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                            <span>{p.current.toLocaleString()} pt</span>
                            <span className="text-pink-400">{percent}%</span>
                          </div>
                          <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mb-4">
                            <motion.div initial={{ width: 0 }} whileInView={{ width: `${percent}%` }} transition={{ duration: 1, delay: 0.5 }} className="h-full bg-gradient-to-r from-pink-500 to-rose-400" />
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                            <Users size={14} className="text-slate-500"/> {p.users}人が参加
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
      </div>
    </section>
  );
};

// --- 💡 4. WHY CHOOSE FLASTAL? (メリット詳細) ---
const FeaturesSection = () => {
  const features = [
    { title: "集金・未払いトラブルゼロ", icon: CreditCard, color: "sky", desc: "DMでの口座のやり取りは不要。参加者はクレジットカードやコンビニ払いで簡単に支援でき、集金管理は自動化されます。" },
    { title: "完全匿名でバレない安心感", icon: Lock, color: "emerald", desc: "参加者も主催者もハンドルネームでOK。本名や住所がお花屋さんや参加者同士に伝わることは一切ありません。" },
    { title: "全国のプロ花屋と直接連携", icon: Flower, color: "pink", desc: "フラスタ制作に特化した提携フローリストが多数登録。特殊なデザインやイラストパネルの持ち込みもスムーズに相談できます。" },
    { title: "透明な自動収支レポート", icon: ShieldCheck, color: "purple", desc: "集まった金額と支払った金額はシステムが自動計算し、参加者全員にクリアな収支報告として公開されます。" },
  ];

  return (
    <section className="py-20 md:py-32 bg-slate-50 overflow-hidden">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeader en="Features" ja="主催者も参加者も、最高に楽。" desc="個人情報の管理から集金催促まで、フラスタ企画の面倒な裏方はすべてFLASTALが引き受けます。" color="purple" />
        
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {features.map((f, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl md:hover:-translate-y-2 transition-all duration-300 h-full flex flex-col">
                <div className="flex items-center gap-5 mb-5">
                  <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center bg-${f.color}-50 text-${f.color}-500 shrink-0 shadow-inner`}>
                    <f.icon size={26} />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 leading-tight"><JpText>{f.title}</JpText></h3>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed font-medium"><JpText>{f.desc}</JpText></p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- 🤝 5. FOR PROFESSIONALS ---
const PartnerBanner = () => (
  <section className="py-12 md:py-20 mx-4 md:mx-auto max-w-5xl mb-12">
    <Reveal>
      <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl border-4 border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,114,182,0.15),transparent)]" />
        <div className="relative z-10">
          <h2 className="text-2xl md:text-4xl font-black text-white mb-4">プロフェッショナルの皆様へ</h2>
          <p className="text-slate-400 text-xs md:text-sm mb-10 max-w-2xl mx-auto leading-relaxed">
            お花屋さん、ライブ会場、イベント主催者、イラストレーターの方。<br className="hidden md:block"/>
            FLASTALのエコシステムに参加し、未払いリスクなくファンの想いをサポートしませんか？
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 md:gap-4">
            <Link href="/florists/register" className="px-6 py-3.5 bg-white/10 hover:bg-white text-white hover:text-slate-900 text-xs md:text-sm font-bold rounded-full border border-white/20 transition-all flex items-center justify-center gap-2">🌸 お花屋さん登録</Link>
            <Link href="/venues/register" className="px-6 py-3.5 bg-white/10 hover:bg-white text-white hover:text-slate-900 text-xs md:text-sm font-bold rounded-full border border-white/20 transition-all flex items-center justify-center gap-2">🏢 会場・ホール登録</Link>
          </div>
        </div>
      </div>
    </Reveal>
  </section>
);

// --- ❓ 6. FAQ ---
const FaqMini = () => (
  <section id="faq" className="py-16 md:py-24 bg-white scroll-mt-20">
    <div className="container mx-auto px-6 max-w-3xl">
      <SectionHeader en="Q&A" ja="よくある質問" color="emerald" />
      <div className="space-y-4">
        {[
          { q: "目標金額に届かなかった場合はどうなりますか？", a: "企画作成時に「All-in（集まった金額だけで実施）」か「All-or-Nothing（未達なら全額返金して中止）」のどちらかを選ぶことができます。" },
          { q: "利用手数料はかかりますか？", a: "企画の立ち上げや支援は無料です。企画が達成し、集まった金額をお花屋さんへ支払う際（または引き出す際）に、システム・決済手数料として計10%を頂戴します。" },
          { q: "本名や住所を隠して参加（支援）できますか？", a: "はい、可能です。FLASTALでは参加者も主催者もハンドルネームで活動でき、お花屋さんへの配送情報などはシステムが安全に仲介するため、個人情報が漏れることはありません。" }
        ].map((item, i) => (
          <Reveal key={i} delay={i * 0.1}>
            <details className="group bg-slate-50 rounded-[1.5rem] p-6 border border-slate-100 cursor-pointer hover:shadow-md transition-all outline-none">
              <summary className="flex items-center justify-between font-bold text-slate-800 list-none outline-none text-sm md:text-base">
                <span className="flex items-center gap-3"><HelpCircle className="text-emerald-500 shrink-0" size={20}/> <JpText>{item.q}</JpText></span>
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

// --- 💌 7. CTA ---
const ContactAndCtaSection = () => (
  <section className="py-20 md:py-32 bg-pink-50 text-center px-6 border-t border-pink-100 relative overflow-hidden">
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-50 mix-blend-overlay" />
    <Reveal className="relative z-10">
      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-pink-200 text-pink-500">
        <Heart size={40} fill="currentColor" className="animate-pulse" />
      </div>
      <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tighter text-slate-900">さあ、推しへの愛を形に。</h2>
      <p className="text-sm md:text-lg text-slate-600 mb-10 font-medium max-w-lg mx-auto leading-relaxed">
        企画の作成は無料。あなたの「贈りたい」という気持ちが、推しの笑顔と、ファン仲間の勇気になります。
      </p>
      <Link href="/projects/create">
        <motion.button 
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-rose-500 text-white px-10 md:px-14 py-5 md:py-6 rounded-full text-lg md:text-2xl font-black shadow-2xl shadow-pink-300 flex items-center justify-center gap-3 mx-auto"
        >
          <Sparkles /> 今すぐ企画を立てる
        </motion.button>
      </Link>
    </Reveal>
  </section>
);

// --- 🏠 DASHBOARD WRAPPER ---
const AuthenticatedHome = ({ user, logout }) => (
  <div className="min-h-screen bg-gradient-to-br from-pink-50 to-sky-50 flex items-center justify-center p-4 md:p-6 m-0">
    <div className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-[3rem] shadow-2xl p-8 md:p-12 text-center border border-white">
      <div className="w-20 h-20 bg-pink-100 text-pink-500 rounded-[1.5rem] rotate-3 flex items-center justify-center mx-auto mb-6 shadow-inner"><ShieldCheck size={36} /></div>
      <h1 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">おかえりなさい！</h1>
      <p className="text-slate-400 mb-8 font-bold text-xs uppercase tracking-widest">
        {user?.handleName || user?.shopName || 'MEMBER'} Signed In
      </p>
      <div className="space-y-4">
        <Link href={user?.role === 'ADMIN' ? '/admin' : user?.role === 'FLORIST' ? '/florists/dashboard' : '/mypage'} className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 text-sm">
          マイページへ進む <ArrowRight size={18} />
        </Link>
        <button onClick={logout} className="text-xs font-bold text-slate-400 hover:text-pink-500 transition-colors mt-4 p-2 underline decoration-transparent hover:decoration-pink-500 underline-offset-4">ログアウト</button>
      </div>
    </div>
  </div>
);

// --- 👑 MAIN EXPORT ---
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
      <FeaturedProjectsSection />
      <WhyFlastalSection />
      <FeaturesSection />
      <PartnerBanner />
      <FaqMini />
      <ContactAndCtaSection />
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}