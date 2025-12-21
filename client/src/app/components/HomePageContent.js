'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  motion, useScroll, useTransform, useSpring, useInView, useMotionValue, useMotionTemplate 
} from 'framer-motion';
import { 
  Heart, Sparkles, Zap, MessageCircle, Gift, 
  Calendar, Users, ShieldCheck, ChevronDown, 
  Star, Palette, Music, Camera, Mail, HelpCircle,
  ArrowRight, CheckCircle2, Search, Flower, Smile,
  CreditCard, Lock, Smartphone, Megaphone, Info, 
  Store, MapPin, Ticket
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// --- 🪄 MAGIC UI COMPONENTS 🪄 ---

// 1. スクロールプログレス (虹色ライン)
const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return (
    <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-400 via-purple-400 to-sky-400 origin-left z-[100] shadow-sm" style={{ scaleX }} />
  );
};

// 2. マウスストーカー (魔法の粉) - PCのみ
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
    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, [cursorX, cursorY]);

  return (
    <motion.div
      className={cn("fixed top-0 left-0 w-6 h-6 rounded-full bg-gradient-to-r from-pink-400 to-sky-400 blur-md pointer-events-none z-[90] mix-blend-multiply transition-opacity duration-300", hidden ? "opacity-0" : "opacity-60")}
      style={{ x: cursorX, y: cursorY, translateX: '-50%', translateY: '-50%' }}
    />
  );
};

// 3. ふわっと現れる (Stagger Reveal)
const Reveal = ({ children, delay = 0, width = "100%" }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, delay, type: "spring", bounce: 0.3 }}
    style={{ width }}
  >
    {children}
  </motion.div>
);

// 4. 3D Tilt Card (物理演算風の傾き)
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
    pink: "group-hover:shadow-pink-200/50",
    sky: "group-hover:shadow-sky-200/50",
    purple: "group-hover:shadow-purple-200/50",
  };

  return (
    <motion.div
      style={{ rotateX, rotateY, perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className={cn("relative transition-all duration-300 ease-out group hover:z-10", className)}
    >
      <div className={cn("transition-shadow duration-300 hover:shadow-2xl", glows[glowColor])}>
        {children}
      </div>
    </motion.div>
  );
};

// 5. 背景の浮遊シェイプ
const FloatingShape = ({ color, top, left, right, bottom, size, delay = 0 }) => (
  <motion.div 
    style={{ top, left, right, bottom, width: size, height: size }}
    className={cn("absolute rounded-full blur-[80px] opacity-40 pointer-events-none mix-blend-multiply z-0", color)}
    animate={{ 
      y: [0, -40, 0],
      scale: [1, 1.1, 0.9, 1],
      rotate: [0, 20, -20, 0]
    }}
    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay }}
  />
);

// 6. 見出しコンポーネント
const SectionHeader = ({ en, ja, desc, color = "pink" }) => {
  const colors = {
    pink: "text-pink-500 from-pink-400 to-rose-400",
    blue: "text-sky-500 from-sky-400 to-blue-400",
    purple: "text-purple-500 from-purple-400 to-indigo-400",
    green: "text-emerald-500 from-emerald-400 to-teal-400",
  };
  
  return (
    <div className="text-center mb-20 relative z-10">
      <Reveal>
        <span className={cn("inline-block font-bold tracking-[0.2em] uppercase text-sm mb-3 font-mono px-4 py-1 rounded-full bg-white border shadow-sm", colors[color].split(" ")[0], "border-slate-100")}>
          ✨ {en}
        </span>
        <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-6 leading-tight">
          {ja}
        </h2>
        <div className={cn("h-1.5 w-24 mx-auto rounded-full bg-gradient-to-r mb-6 opacity-70", colors[color].split(" ").slice(1).join(" "))} />
        {desc && (
          <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed text-sm md:text-base font-medium">
            {desc}
          </p>
        )}
      </Reveal>
    </div>
  );
};

// 7. Kawaii Button
const KawaiiButton = ({ children, variant = "primary", icon: Icon, className, onClick }) => {
  const base = "relative px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-all overflow-hidden group flex items-center justify-center gap-2 active:scale-95";
  const styles = {
    primary: "bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 text-white shadow-pink-200 hover:shadow-pink-300 hover:scale-105",
    secondary: "bg-white text-slate-700 border-2 border-slate-100 hover:border-sky-300 hover:text-sky-500 hover:shadow-sky-100 hover:scale-105",
    outline: "bg-transparent border-2 border-white text-white hover:bg-white/20",
  };

  return (
    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={cn(base, styles[variant], className)} onClick={onClick}>
      {Icon && <Icon size={20} className="transition-transform group-hover:rotate-12" />}
      <span className="relative z-10">{children}</span>
      {variant === 'primary' && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shine" />}
    </motion.button>
  );
};


// --- 🚀 SECTIONS 🚀 ---

// 1. HERO SECTION
const HeroSection = () => (
  <section className="relative w-full min-h-[95vh] flex items-center justify-center overflow-hidden bg-slate-50">
    <ScrollProgress />
    <MagicCursor />
    <div className="absolute inset-0 bg-[radial-gradient(#e0f2fe_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
    <FloatingShape color="bg-pink-300" top="-10%" left="-10%" size={600} />
    <FloatingShape color="bg-sky-300" bottom="-10%" right="-10%" size={600} delay={2} />
    <FloatingShape color="bg-yellow-200" top="40%" right="10%" size={300} delay={4} />

    <div className="container relative z-10 px-6 pt-20 grid lg:grid-cols-12 gap-12 items-center">
      {/* Left Text */}
      <div className="lg:col-span-7 text-center lg:text-left">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg border border-pink-100 mb-8 mx-auto lg:mx-0 animate-bounce-slow">
            <span className="flex h-2 w-2 rounded-full bg-pink-500 animate-ping" />
            <span className="text-xs font-bold text-slate-600 tracking-wide">推し活アップデート 2.0</span>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-800 leading-[1.1] mb-8 tracking-tight">
            想いを、<br/>
            <span className="relative inline-block px-2">
              <span className="absolute inset-0 bg-pink-200 -rotate-2 rounded-lg blur-sm opacity-50" />
              <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">結晶化</span>
            </span>
            しよう。
          </h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
            FLASTAL（フラスタル）は、<br className="md:hidden"/>
            アイドル・声優・VTuber・歌い手への<br/>
            「お祝い花（フラスタ）」を、ファンのみんなで贈れる<br/>
            次世代クラウドファンディング・プラットフォームです。
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start mb-12">
            <Link href="/create">
              <KawaiiButton variant="primary" icon={Sparkles}>無料で企画を立てる</KawaiiButton>
            </Link>
            <Link href="/projects">
              <KawaiiButton variant="secondary" icon={Search}>企画を探す</KawaiiButton>
            </Link>
          </div>
        </Reveal>
      </div>

      {/* Right Visual (3D Tilt) */}
      <div className="lg:col-span-5 relative h-[500px] lg:h-[600px] hidden md:block perspective-1000">
        <TiltCard className="w-full h-full">
          <motion.div 
            initial={{ rotateY: 30, opacity: 0 }}
            animate={{ rotateY: -10, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="relative w-full h-full bg-white rounded-[40px] shadow-2xl border-[6px] border-white overflow-hidden"
          >
             <div className="h-2/3 bg-gradient-to-br from-indigo-500 to-purple-600 relative group overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-80 mix-blend-overlay group-hover:scale-110 transition-transform duration-700" />
               <div className="absolute bottom-6 left-6 text-white z-10">
                 <div className="flex gap-2 mb-2">
                   <span className="bg-pink-500 px-2 py-0.5 rounded text-[10px] font-bold shadow-lg animate-pulse">募集中</span>
                   <span className="bg-sky-500 px-2 py-0.5 rounded text-[10px] font-bold shadow-lg">#VTuber</span>
                 </div>
                 <h3 className="text-2xl font-bold leading-tight drop-shadow-md">星街すいせいさんへ<br/>銀河一のフラスタを！</h3>
               </div>
             </div>
             <div className="p-6 bg-white h-1/3 relative z-20">
               <div className="flex justify-between items-end mb-2">
                 <span className="text-3xl font-bold text-slate-800">¥125,000</span>
                 <span className="text-pink-500 font-bold bg-pink-50 px-2 py-1 rounded">125% 達成!</span>
               </div>
               <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-4 border border-slate-100">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: "100%" }}
                   transition={{ duration: 1.5, delay: 1 }}
                   className="h-full bg-gradient-to-r from-pink-400 to-rose-500"
                 />
               </div>
               <div className="flex justify-between text-xs text-slate-400 font-bold">
                 <span className="flex items-center gap-1"><Users size={14}/> 48人</span>
                 <span className="flex items-center gap-1"><Calendar size={14}/> 残り5日</span>
               </div>
             </div>
          </motion.div>
          
          {/* Floating UI Elements */}
          <motion.div animate={{ y: [-10, 10, -10] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 z-30 border border-slate-50">
            <div className="bg-sky-100 p-2 rounded-full text-sky-500"><Palette size={20} /></div>
            <div>
              <p className="text-xs text-slate-400 font-bold">Illustrator</p>
              <p className="font-bold text-slate-700">神絵師決定！</p>
            </div>
          </motion.div>
        </TiltCard>
      </div>
    </div>
    
    <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-400 flex flex-col items-center gap-2">
      <span className="text-[10px] font-bold tracking-widest uppercase">Scroll</span>
      <ChevronDown size={20} />
    </motion.div>
  </section>
);

// 2. TICKER SECTION
const TickerSection = () => {
  const genres = ["#地下アイドル", "#VTuber", "#歌い手", "#コンカフェ", "#声優イベント", "#2.5次元舞台", "#K-POP", "#e-Sports大会", "#生誕祭", "#周年ライブ", "#卒業公演"];
  return (
    <div className="bg-slate-900 py-4 overflow-hidden relative border-y-4 border-pink-500 z-20 shadow-xl rotate-1 scale-105 my-10">
      <motion.div className="flex gap-12 whitespace-nowrap" animate={{ x: [0, -1000] }} transition={{ repeat: Infinity, duration: 40, ease: "linear" }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-12">
            {genres.map((g, j) => (
              <span key={j} className="text-lg font-bold text-slate-300 flex items-center gap-2">
                <Star size={14} className="text-yellow-400 fill-current" />
                {g}
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// 3. CULTURE SECTION (フラスタとは？)
const CultureSection = () => {
  const items = [
    { title: "フラワースタンド", en: "Flower Stand", icon: "💐", desc: "ライブ会場のロビーを彩る定番。バルーンやLEDで派手に装飾し、推しの「メンカラ」一色に染め上げます。" },
    { title: "卓上フラスタ（楽屋花）", en: "Desktop Flasta", icon: "🧺", desc: "楽屋や受付に飾るコンパクトなアレンジメント。会場規制でスタンド不可の場合や、個人的な贈り物に。" },
    { title: "イラストパネル", en: "Illustration Panel", icon: "🎨", desc: "神絵師に依頼した推しの等身大パネルやイラストボードをお花に添えます。二次元・VTuber界隈では必須！" },
    { title: "祭壇・デコ", en: "Altar & Decor", icon: "🧸", desc: "お花だけでなく、ぬいぐるみ、グッズ、名札パネルなどを大量に盛り込んだ、愛の重さが伝わる独自のデザイン。" }
  ];

  return (
    <section className="py-32 bg-white relative">
      <div className="container mx-auto px-6">
        <SectionHeader en="Otaku Culture" ja="どんなお花を贈る？" desc="「フラスタ」と一口に言っても形は様々。会場のレギュレーション（規則）や予算に合わせて、最適な形を選ぼう。" color="pink" />
        <div className="grid md:grid-cols-4 gap-6">
          {items.map((item, i) => (
            <Reveal key={i} delay={i * 0.1} className="h-full">
              <TiltCard className="h-full">
                <div className="bg-slate-50 rounded-[30px] p-6 text-center border border-slate-100 h-full flex flex-col items-center group">
                  <div className="text-6xl mb-6 transform group-hover:scale-125 transition-transform duration-300 drop-shadow-md">{item.icon}</div>
                  <h3 className="font-bold text-slate-800 text-lg mb-1">{item.title}</h3>
                  <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-4">{item.en}</p>
                  <p className="text-sm text-slate-600 leading-relaxed text-left bg-white p-4 rounded-xl shadow-inner flex-grow">
                    {item.desc}
                  </p>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// 4. PROBLEM SECTION
const ProblemSection = () => (
  <section className="py-32 bg-slate-50 relative overflow-hidden">
    <FloatingShape color="bg-slate-200" top="10%" left="-10%" size={400} />
    <div className="container mx-auto px-6 relative z-10">
      <SectionHeader en="Pain & Solution" ja="フラスタ企画の「大変」をゼロに" desc="DMでの集金、個人情報の管理、お花屋さんへのオーダー...。主催者の負担をFLASTALがすべて引き受けます。" color="blue" />
      <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
        <Reveal>
          <div className="bg-white p-10 rounded-[40px] border border-slate-200 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <h3 className="text-xl font-bold text-slate-600 mb-8 flex items-center gap-3">
              <span className="bg-slate-200 px-3 py-1 rounded-full text-xs">従来のやり方</span> 😰 大変すぎる...
            </h3>
            <ul className="space-y-6">
              {["DMで一人ひとり口座を教える手間", "未入金の催促が気まずい", "本名や住所がバレるリスク", "収支報告のエクセル管理が地獄"].map((t, i) => (
                <li key={i} className="flex gap-4 text-slate-500 items-center"><div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-400 font-bold">×</div>{t}</li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={0.2}>
          <TiltCard glowColor="sky">
            <div className="bg-gradient-to-br from-white to-sky-50 p-10 rounded-[40px] border-4 border-sky-100 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-sky-500 text-white text-xs font-bold px-4 py-2 rounded-bl-2xl shadow-md">SOLUTION</div>
              <h3 className="text-2xl font-bold text-sky-600 mb-8 flex items-center gap-3">
                <span className="bg-sky-100 px-3 py-1 rounded-full text-xs">FLASTALなら</span> ✨ 全部おまかせ！
              </h3>
              <ul className="space-y-6 relative z-10">
                {["リンクをシェアするだけで集金完了", "クレカ・コンビニ払いで自動管理", "完全匿名で安心安全", "収支報告もワンクリックで公開"].map((t, i) => (
                  <li key={i} className="flex gap-4 text-slate-700 font-bold items-center">
                    <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-sky-200"><CheckCircle2 size={16} /></div>{t}
                  </li>
                ))}
              </ul>
            </div>
          </TiltCard>
        </Reveal>
      </div>
    </div>
  </section>
);

// 5. FEATURES (BENTO GRID)
const FeaturesSection = () => (
  <section className="py-32 bg-white relative">
    <div className="container mx-auto px-6">
      <SectionHeader en="Features" ja="推し活専用の最強機能" color="purple" />
      <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 h-auto md:h-[800px]">
        <div className="md:col-span-2 md:row-span-2">
          <Reveal className="h-full">
            <TiltCard className="h-full" glowColor="purple">
              <div className="h-full bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-[40px] p-10 flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity transform rotate-12"><CreditCard size={250} /></div>
                <div className="relative z-10">
                  <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-xs font-bold mb-4 inline-block shadow-sm">CORE SYSTEM</span>
                  <h3 className="text-3xl font-bold text-slate-800 mb-4">選べる2つの開催方式</h3>
                  <p className="text-slate-600 mb-8 max-w-md leading-relaxed">企画の規模や確実性に合わせて、クラウドファンディングの方式を選択できます。</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 hover:scale-105 transition-transform">
                      <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Zap size={18} className="text-yellow-500"/> All-in 方式</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">目標金額に届かなくても、集まった分だけで実施。少額でも必ず贈りたい時に。</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 hover:scale-105 transition-transform">
                      <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Lock size={18} className="text-red-500"/> All-or-Nothing</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">目標達成時のみ実施。未達なら全額返金。豪華なフラスタを目指す時に。</p>
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard>
          </Reveal>
        </div>
        <Reveal delay={0.2} className="h-full">
          <TiltCard className="h-full" glowColor="sky">
            <div className="h-full bg-sky-50 rounded-[40px] p-8 relative overflow-hidden group border border-sky-100">
              <MessageCircle className="text-sky-200 absolute -bottom-4 -right-4 w-40 h-40 group-hover:scale-110 transition-transform rotate-12" />
              <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center text-sky-500 mb-4 shadow-sm"><MessageCircle size={24} /></div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">参加者限定チャット</h3>
              <p className="text-sm text-slate-600 leading-relaxed">企画参加者だけの秘密の会議室。サプライズの相談もSNSでバレずに進行可能。</p>
            </div>
          </TiltCard>
        </Reveal>
        <Reveal delay={0.3} className="h-full">
          <TiltCard className="h-full" glowColor="pink">
            <div className="h-full bg-pink-50 rounded-[40px] p-8 relative overflow-hidden group border border-pink-100">
              <Flower className="text-pink-200 absolute -bottom-4 -right-4 w-40 h-40 group-hover:scale-110 transition-transform rotate-12" />
              <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center text-pink-500 mb-4 shadow-sm"><Flower size={24} /></div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">花屋マッチング</h3>
              <p className="text-sm text-slate-600 leading-relaxed">オタク文化に理解のある提携フローリストを検索。「痛い」オーダーもプロが形にします。</p>
            </div>
          </TiltCard>
        </Reveal>
      </div>
    </div>
  </section>
);

// 6. SAFETY SECTION
const SafetySection = () => (
  <section className="py-24 bg-emerald-50 border-y border-emerald-100 relative overflow-hidden">
    <FloatingShape color="bg-emerald-200" bottom="-10%" left="10%" size={300} />
    <div className="container mx-auto px-6 relative z-10">
       <SectionHeader en="Trust & Safety" ja="お金のことだから、誠実に" color="green" desc="FLASTALは、すべてのファンが安心して利用できる環境づくりを最優先しています。" />
       <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "完全匿名配送", icon: Lock, desc: "お花屋さんへの発注はFLASTALが代行。主催者の個人情報が店舗や第三者に渡ることはありません。" },
            { title: "安全な決済", icon: CreditCard, desc: "世界基準のStripe決済を採用。クレジットカード情報はサーバーに保存されず、安全に処理されます。" },
            { title: "運営の審査制", icon: ShieldCheck, desc: "すべての企画は公開前に運営スタッフが目視で審査。詐欺や不適切な企画を未然に防ぎます。" }
          ].map((item, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="bg-white p-8 rounded-[30px] shadow-sm border border-emerald-100 hover:shadow-lg transition-shadow text-center h-full">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500"><item.icon size={32} /></div>
                <h3 className="font-bold text-lg mb-4 text-slate-800">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </Reveal>
          ))}
       </div>
    </div>
  </section>
);

// 7. PARTNERS (JOIN US) - NEW SECTION for Professionals
const PartnerJoinSection = () => {
  return (
    <section className="py-24 bg-white relative">
      <div className="container mx-auto px-6">
        <SectionHeader en="For Professionals" ja="FLASTALで広がる可能性" desc="お花屋さん、ライブ会場、イベンターの方へ。FLASTALのエコシステムに参加しませんか？" color="purple" />
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* For Florists */}
          <Reveal>
            <div className="bg-gradient-to-b from-pink-50 to-white p-8 rounded-[40px] border border-pink-100 shadow-lg text-center hover:shadow-xl transition-all h-full flex flex-col">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-pink-500 shadow-md">
                <Store size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">お花屋さん</h3>
              <p className="text-sm text-slate-500 mb-6 flex-grow">
                未払いリスクゼロで、確実に売上を。ファンの熱量が高い「推し花」需要を取り込みませんか？
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/florists/login" className="w-full py-3 rounded-xl border border-pink-200 text-pink-500 font-bold hover:bg-pink-50">ログイン</Link>
                <Link href="/florists/register" className="w-full py-3 rounded-xl bg-pink-500 text-white font-bold hover:bg-pink-600 shadow-md shadow-pink-200">新規登録</Link>
              </div>
            </div>
          </Reveal>

          {/* For Venues */}
          <Reveal delay={0.1}>
            <div className="bg-gradient-to-b from-sky-50 to-white p-8 rounded-[40px] border border-sky-100 shadow-lg text-center hover:shadow-xl transition-all h-full flex flex-col">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-sky-500 shadow-md">
                <MapPin size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">会場・ホール</h3>
              <p className="text-sm text-slate-500 mb-6 flex-grow">
                搬入出のトラブル防止に。公式のレギュレーションを周知し、許可されたフラスタのみを受け入れ可能。
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/venues/login" className="w-full py-3 rounded-xl border border-sky-200 text-sky-500 font-bold hover:bg-sky-50">ログイン</Link>
                <Link href="/venues/register" className="w-full py-3 rounded-xl bg-sky-500 text-white font-bold hover:bg-sky-600 shadow-md shadow-sky-200">新規登録</Link>
              </div>
            </div>
          </Reveal>

          {/* For Organizers */}
          <Reveal delay={0.2}>
            <div className="bg-gradient-to-b from-purple-50 to-white p-8 rounded-[40px] border border-purple-100 shadow-lg text-center hover:shadow-xl transition-all h-full flex flex-col">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-purple-500 shadow-md">
                <Ticket size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">イベント主催者</h3>
              <p className="text-sm text-slate-500 mb-6 flex-grow">
                ファンの応援企画を公認・把握。安全な応援文化を醸成し、イベントの盛り上がりを可視化します。
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/organizers/login" className="w-full py-3 rounded-xl border border-purple-200 text-purple-500 font-bold hover:bg-purple-50">ログイン</Link>
                <Link href="/organizers/register" className="w-full py-3 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-600 shadow-md shadow-purple-200">新規登録</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

// 8. SHOWCASE (成功事例)
const ShowcaseSection = () => (
  <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
    <div className="container mx-auto px-6 mb-12 relative z-10 text-center">
      <span className="text-pink-500 font-bold tracking-widest text-xs uppercase mb-2 block">Gallery</span>
      <h2 className="text-3xl md:text-5xl font-bold mb-4">Success Stories</h2>
      <p className="text-slate-400">想いが形になった瞬間</p>
    </div>
    <div className="flex gap-8 overflow-x-auto px-6 pb-12 snap-x items-center">
      {[1,2,3,4,5].map((i) => (
        <motion.div key={i} whileHover={{ scale: 1.05, rotate: 1 }} className="snap-center shrink-0 w-[300px] md:w-[400px] bg-slate-800 rounded-[30px] overflow-hidden shadow-2xl border border-slate-700 group cursor-pointer">
           <div className="h-56 bg-slate-700 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
             <div className="absolute bottom-4 left-4 z-20">
               <div className="bg-pink-500 px-2 py-1 rounded text-[10px] font-bold inline-block mb-2 shadow-lg">#VTuber</div>
               <h3 className="font-bold text-lg leading-tight">◯◯ちゃん生誕祭2025</h3>
             </div>
           </div>
           <div className="p-6">
             <div className="flex justify-between text-sm text-slate-400 mb-4 font-mono"><span>Total: ¥240,000</span><span>Fans: 85</span></div>
             <p className="text-xs text-slate-500 line-clamp-2">みんなの協力のおかげで、バルーンアーチ付きの特大フラスタを贈ることができました！本当にありがとうございます！</p>
           </div>
        </motion.div>
      ))}
    </div>
  </section>
);

// 9. VOICES
const VoiceSection = () => (
  <section className="py-32 bg-white">
    <div className="container mx-auto px-6">
      <SectionHeader en="Voices" ja="みんなの感想" color="pink" />
      <div className="grid md:grid-cols-3 gap-8">
        {[
          { text: "初めての主催で不安でしたが、集金管理が自動なのでデザインの相談に集中できました。", name: "A.Sさん", role: "VTuberファン", bg: "bg-pink-100" },
          { text: "たった1000円からの支援でも、名前をパネルに載せてもらえて嬉しかったです。", name: "T.Kさん", role: "アイドルファン", bg: "bg-sky-100" },
          { text: "イラストのデータを共有する機能が便利でした。印刷も綺麗にいきました。", name: "M.Mさん", role: "絵師依頼", bg: "bg-purple-100" }
        ].map((v, i) => (
          <Reveal key={i} delay={i * 0.1}>
            <div className="bg-slate-50 p-8 rounded-[30px] relative border border-slate-100 h-full flex flex-col hover:shadow-lg transition-shadow">
              <div className="text-6xl text-slate-200 absolute top-4 left-6 font-serif">“</div>
              <p className="text-slate-600 text-sm leading-relaxed mb-6 pt-6 relative z-10 font-medium">{v.text}</p>
              <div className="flex items-center gap-4 mt-auto">
                <div className={cn("w-12 h-12 rounded-full", v.bg)} />
                <div><p className="font-bold text-sm text-slate-800">{v.name}</p><p className="text-xs text-slate-500">{v.role}</p></div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

// 10. FLOW
const FlowDetailSection = () => {
  const steps = [
    { title: "企画作成", sub: "3分で完了", desc: "目標金額、贈りたい相手、イベント日を入力してページを作成。" },
    { title: "拡散・募集", sub: "SNS連携", desc: "Twitter(X)でURLをシェア。TwiPlaなどの募集サイトとの併用もOK。" },
    { title: "達成・発注", sub: "自動送金", desc: "目標金額が集まったら、FLASTAL経由でお花屋さんに正式発注。" },
    { title: "制作・納品", sub: "進捗共有", desc: "お花屋さんから完成写真が届きます。サイト上で参加者に報告！" }
  ];
  return (
    <section className="py-32 bg-gradient-to-b from-white to-slate-50">
      <div className="container mx-auto px-6">
        <SectionHeader en="Process" ja="ご利用の流れ" color="blue" />
        <div className="relative max-w-4xl mx-auto">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 -translate-x-1/2 hidden md:block" />
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 md:hidden" />
          {steps.map((step, i) => (
            <Reveal key={i} width="100%">
              <div className={cn("relative flex items-center mb-16 last:mb-0", i % 2 === 0 ? "md:justify-start" : "md:justify-end")}>
                <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white border-4 border-sky-400 z-10 flex items-center justify-center text-sm font-bold text-sky-500 shadow-md">{i + 1}</div>
                <div className={cn("bg-white p-8 rounded-[30px] shadow-lg border border-slate-100 w-[calc(100%-60px)] md:w-[45%] ml-14 md:ml-0 hover:-translate-y-1 transition-transform duration-300", i % 2 === 0 ? "md:mr-12" : "md:ml-12")}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-xl text-slate-800">{step.title}</h3>
                    <span className="text-[10px] font-bold bg-sky-100 text-sky-600 px-2 py-1 rounded-full">{step.sub}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// 11. APP (TEASER)
const AppSection = () => (
  <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
    <div className="container mx-auto px-6 text-center relative z-10">
      <Reveal>
        <span className="bg-white/10 text-white border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold mb-8 inline-block backdrop-blur animate-pulse">COMING SOON</span>
        <h2 className="text-4xl md:text-6xl font-black mb-8">Mobile App Integration</h2>
        <p className="text-slate-400 max-w-xl mx-auto mb-12 leading-relaxed">スマホアプリで、もっと身近に。プッシュ通知で進捗を受け取ったり、ARで会場にフラスタを配置してみたり。FLASTALの進化は止まりません。</p>
        <div className="flex justify-center gap-6 opacity-30"><div className="w-16 h-16 bg-white/10 rounded-2xl animate-pulse" /><div className="w-16 h-16 bg-white/10 rounded-2xl animate-pulse delay-75" /></div>
      </Reveal>
    </div>
  </section>
);

// 12. FAQ
const FaqSection = () => (
  <section className="py-32 bg-white">
    <div className="container mx-auto px-6 max-w-3xl">
      <SectionHeader en="Q&A" ja="よくある質問" color="green" />
      <div className="space-y-4">
        {[
          { q: "目標金額に届かなかったらどうなりますか？", a: "企画作成時に「All-in方式（集まった分だけで実施）」か「All-or-Nothing方式（全額返金して中止）」かを選べます。" },
          { q: "お花屋さんは自分で探せますか？", a: "はい、FLASTALに登録されていないお花屋さんに依頼することも可能です。その場合、金銭の授受のみFLASTALを通す形になります。" },
          { q: "手数料はかかりますか？", a: "企画の作成は無料です。支援金が集まった場合のみ、決済手数料・システム利用料として合計10%が差し引かれます。" },
          { q: "匿名で支援できますか？", a: "はい、ハンドルネームでの支援が可能です。主催者に本名や住所が伝わることはありません。" }
        ].map((item, i) => (
          <Reveal key={i} delay={i * 0.05}>
            <details className="group bg-slate-50 rounded-2xl p-6 border border-slate-100 cursor-pointer [&_summary::-webkit-details-marker]:hidden open:bg-white open:shadow-lg open:border-emerald-100 transition-all duration-300">
              <summary className="flex items-center justify-between font-bold text-slate-800 list-none">
                <span className="flex items-center gap-3"><HelpCircle className="text-emerald-500 shrink-0" /> {item.q}</span>
                <ChevronDown className="text-slate-400 group-open:rotate-180 transition-transform duration-300" />
              </summary>
              <div className="mt-4 text-sm text-slate-600 pl-9 leading-relaxed">{item.a}</div>
            </details>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

// 13. NEWS
const NewsSection = () => (
  <section className="py-24 bg-slate-50">
    <div className="container mx-auto px-6 max-w-4xl">
       <div className="flex justify-between items-end mb-8"><h2 className="text-2xl font-bold text-slate-800">News</h2><Link href="/news" className="text-sm text-pink-500 font-bold hover:underline">一覧を見る</Link></div>
       <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 divide-y divide-slate-100">
         {[{ date: "2025.12.20", cat: "Feature", title: "新機能「イラスト公募機能」をリリースしました" }, { date: "2025.12.15", cat: "Event", title: "コミックマーケット107開催に伴うお花の受付について" }, { date: "2025.12.01", cat: "Info", title: "年末年始のサポート対応について" }].map((n, i) => (
           <div key={i} className="py-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-6 hover:bg-slate-50 transition-colors cursor-pointer rounded-lg px-2 group">
             <span className="text-slate-400 text-sm font-mono">{n.date}</span>
             <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold w-fit group-hover:bg-pink-100 group-hover:text-pink-600 transition-colors">{n.cat}</span>
             <span className="text-slate-700 font-medium group-hover:text-pink-500 transition-colors">{n.title}</span>
           </div>
         ))}
       </div>
    </div>
  </section>
);

// 14. CONTACT & CTA
const ContactAndCtaSection = () => (
  <section className="relative pt-24 pb-32 bg-white overflow-hidden">
    <div className="container mx-auto px-6 mb-32">
      <SectionHeader en="Contact" ja="お問い合わせ" color="blue" />
      <Reveal>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <a href="mailto:support@flastal.jp" className="group bg-sky-50 p-8 rounded-[30px] border border-sky-100 text-center hover:shadow-xl hover:-translate-y-1 transition-all">
            <Mail className="mx-auto text-sky-500 mb-4 group-hover:scale-110 transition-transform" size={40} />
            <h3 className="font-bold text-slate-800 text-xl mb-2">ユーザー・主催者の方</h3>
            <p className="text-sm text-slate-500">企画の立て方や利用トラブルについて</p>
          </a>
          <a href="mailto:business@flastal.jp" className="group bg-pink-50 p-8 rounded-[30px] border border-pink-100 text-center hover:shadow-xl hover:-translate-y-1 transition-all">
            <Gift className="mx-auto text-pink-500 mb-4 group-hover:scale-110 transition-transform" size={40} />
            <h3 className="font-bold text-slate-800 text-xl mb-2">お花屋さん・法人の方</h3>
            <p className="text-sm text-slate-500">加盟店登録や提携について</p>
          </a>
        </div>
      </Reveal>
    </div>
    <div className="container mx-auto px-6 text-center relative z-10">
      <Reveal>
        <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 rounded-[60px] p-12 md:p-24 text-white shadow-2xl shadow-pink-200 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
          <FloatingShape color="bg-white" top="-20%" right="-10%" size={400} />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight drop-shadow-md">さあ、推しへの愛を<br/>形にしよう。</h2>
            <p className="text-pink-100 text-lg mb-12 max-w-xl mx-auto font-medium">企画の作成は無料です。<br/>あなたの「やりたい」という気持ちが、誰かの勇気になります。</p>
            <Link href="/create">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-white text-pink-600 px-16 py-6 rounded-full text-2xl font-bold shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group">
                <span className="relative z-10">今すぐ始める</span>
                <div className="absolute inset-0 bg-pink-50 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);

// --- Footer ---
const Footer = () => (
  <footer className="bg-slate-900 text-white pt-24 pb-12 border-t border-slate-800">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 md:col-span-2">
          <h3 className="text-3xl font-bold mb-6 font-mono tracking-tighter text-pink-500">FLASTAL</h3>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">推し活特化型クラウドファンディング。<br/>ファンと推し、そしてお花屋さんを繋ぎ、世界にもっと「感動」を咲かせます。</p>
          <div className="flex gap-4 mt-6">
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-pink-500 transition-colors cursor-pointer text-xs font-bold">X</div>
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-pink-500 transition-colors cursor-pointer text-xs font-bold">Ig</div>
          </div>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-white border-b border-slate-700 pb-2 inline-block">Platform</h4>
          <ul className="space-y-3 text-sm text-slate-400">
            <li><Link href="/projects" className="hover:text-pink-400 transition-colors">企画を探す</Link></li>
            <li><Link href="/create" className="hover:text-pink-400 transition-colors">企画を立てる</Link></li>
            <li><Link href="/florists" className="hover:text-pink-400 transition-colors">提携花屋一覧</Link></li>
            <li><Link href="/creators" className="hover:text-pink-400 transition-colors">提携絵師一覧</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-white border-b border-slate-700 pb-2 inline-block">Company</h4>
          <ul className="space-y-3 text-sm text-slate-400">
            <li><Link href="/about" className="hover:text-pink-400 transition-colors">運営会社</Link></li>
            <li><Link href="/terms" className="hover:text-pink-400 transition-colors">利用規約</Link></li>
            <li><Link href="/privacy" className="hover:text-pink-400 transition-colors">プライバシーポリシー</Link></li>
            <li><Link href="/tokusho" className="hover:text-pink-400 transition-colors">特商法に基づく表記</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
        <p>© 2025 FLASTAL Inc. All rights reserved.</p>
        <div className="flex gap-4"><span>Made with ❤️ in Tokyo</span></div>
      </div>
    </div>
  </footer>
);

// --- 👑 MAIN EXPORT ---
export default function HomePageContent() {
  return (
    <div className="bg-white min-h-screen text-slate-800 font-sans selection:bg-pink-100 selection:text-pink-600 overflow-x-hidden">
      <HeroSection />
      <TickerSection />
      <CultureSection />
      <ProblemSection />
      <FeaturesSection />
      <SafetySection />
      <PartnerJoinSection /> {/* 新規追加: お花屋さん・会場・主催者向け */}
      <ShowcaseSection />
      <VoiceSection />
      <FlowDetailSection />
      <AppSection />
      <FaqSection />
      <NewsSection />
      <ContactAndCtaSection />
      <Footer />
    </div>
  );
}