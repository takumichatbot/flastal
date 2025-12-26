'use client';

// Next.js 15 のビルドエラーを確実に回避する設定
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import React, { useRef, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import { 
  motion, useScroll, useTransform, useSpring, useInView, useMotionValue, useMotionTemplate, AnimatePresence 
} from 'framer-motion';

// --- 1. Lucide React アイコン ---
import { 
  Heart, Sparkles, Zap, MessageCircle, Gift, 
  Calendar, Users, ShieldCheck, ChevronDown, 
  Star, Palette, Music, Camera, Mail, HelpCircle,
  ArrowRight, CheckCircle2, Search, Flower, Smile,
  CreditCard, Lock, Smartphone, Megaphone, Info, 
  Store, MapPin, Ticket, MousePointer2
} from 'lucide-react';

// --- 2. Feather Icons ---
import { FiLoader, FiShield } from 'react-icons/fi';

// --- Utility ---
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// --- 🪄 MAGIC UI COMPONENTS ---

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return (
    <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-400 via-purple-400 to-sky-400 origin-left z-[100] shadow-[0_0_20px_rgba(244,114,182,0.6)]" style={{ scaleX }} />
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
    initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    viewport={{ once: true, margin: "-10px" }}
    transition={{ duration: 0.6, delay, type: "spring", bounce: 0.2 }}
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
      className={cn("relative transition-all duration-300 ease-out group hover:z-10", className)}
    >
      <div className={cn("transition-shadow duration-300 hover:shadow-2xl h-full", glows[glowColor])}>
        {children}
      </div>
    </motion.div>
  );
};

const FloatingShape = ({ color, top, left, right, bottom, size, delay = 0 }) => (
  <motion.div 
    style={{ top, left, right, bottom, width: size, height: size }}
    className={cn("absolute rounded-full blur-[60px] opacity-30 pointer-events-none mix-blend-multiply z-0", color)}
    animate={{ y: [0, -30, 0], scale: [1, 1.1, 0.9, 1] }}
    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay }}
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
    <div className="text-center mb-10 md:mb-20 relative z-10 px-4">
      <Reveal>
        <span className={cn("inline-block font-bold tracking-[0.2em] uppercase text-[10px] md:text-sm mb-3 font-mono px-3 py-1 rounded-full bg-white border shadow-sm", colors[color].split(" ")[0], colors[color].split(" ")[3])}>
          ✨ {en}
        </span>
        <h2 className="text-2xl md:text-5xl font-black text-slate-800 mb-4 leading-tight">
          {ja}
        </h2>
        <div className={cn("h-1 w-12 md:w-20 mx-auto rounded-full bg-gradient-to-r mb-4 md:mb-6", colors[color].split(" ").slice(1, 3).join(" "))} />
        {desc && (
          <p className="text-slate-500 max-w-xl mx-auto leading-relaxed text-xs md:text-base font-medium">
            {desc}
          </p>
        )}
      </Reveal>
    </div>
  );
};

const KawaiiButton = ({ children, variant = "primary", icon: Icon, className, onClick }) => {
  const base = "relative px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-sm md:text-lg shadow-lg transition-all overflow-hidden group flex items-center justify-center gap-2 active:scale-95";
  const styles = {
    primary: "bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 text-white shadow-pink-100",
    secondary: "bg-white text-slate-700 border-2 border-slate-100 hover:border-sky-200 hover:text-sky-500",
    outline: "bg-transparent border-2 border-white text-white hover:bg-white/20",
  };

  return (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={cn(base, styles[variant], className)} onClick={onClick}>
      {Icon && <Icon size={18} className="transition-transform group-hover:rotate-12" />}
      <span className="relative z-10">{children}</span>
      {variant === 'primary' && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine" />}
    </motion.button>
  );
};

// --- 🚀 SECTIONS ---

// 1. HERO SECTION (ヘッダーとの空白を埋める修正)
const HeroSection = () => (
  <section className="relative w-full min-h-[70vh] md:min-h-[95vh] flex items-center justify-center overflow-hidden bg-slate-50 mt-[-64px] md:mt-[-80px]">
    <ScrollProgress />
    <MagicCursor />
    <div className="absolute inset-0 bg-[radial-gradient(#e0f2fe_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
    <FloatingShape color="bg-pink-100" top="10%" left="5%" size={300} />
    <FloatingShape color="bg-sky-100" bottom="10%" right="5%" size={400} delay={2} />

    <div className="container relative z-10 px-6 pt-24 md:pt-32 grid lg:grid-cols-12 gap-6 md:gap-12 items-center mx-auto">
      <div className="lg:col-span-7 text-center lg:text-left">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full shadow-sm border border-pink-50 mb-6 mx-auto lg:mx-0">
            <span className="flex h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Next Gen Gift Platform</span>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-slate-800 leading-[1.15] mb-6 tracking-tighter">
            想いを、<br/>
            <span className="relative inline-block">
              <span className="absolute inset-x-0 bottom-2 h-3 md:h-6 bg-pink-100/60 -rotate-1" />
              <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">結晶化</span>
            </span>
            しよう。
          </h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="text-sm md:text-xl text-slate-500 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
            FLASTALは、ファンのみんなでお祝い花（フラスタ）を贈れる<br className="hidden md:block" />
            次世代クラウドファンディング・プラットフォームです。
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Link href="/projects/create" className="w-full sm:w-auto"><KawaiiButton variant="primary" icon={Sparkles} className="w-full">企画を立てる</KawaiiButton></Link>
            <Link href="/projects" className="w-full sm:w-auto"><KawaiiButton variant="secondary" icon={Search} className="w-full">企画を探す</KawaiiButton></Link>
          </div>
        </Reveal>
      </div>

      <div className="lg:col-span-5 relative hidden lg:block">
        <TiltCard>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1 }} className="bg-white rounded-[40px] shadow-2xl border-4 border-white overflow-hidden">
             <div className="h-64 bg-slate-200 relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
               <div className="absolute bottom-4 left-5 text-white">
                 <h3 className="text-xl font-bold italic">銀河一のフラスタを！</h3>
               </div>
             </div>
             <div className="p-5">
               <div className="flex justify-between items-end mb-3"><span className="text-xl font-black text-slate-800">¥125,000</span><span className="text-pink-500 font-bold text-xs bg-pink-50 px-2 py-1 rounded">125% 達成!</span></div>
               <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3"><motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2 }} className="h-full bg-pink-500" /></div>
               <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest"><span>48 Supporters</span><span>5 Days Left</span></div>
             </div>
          </motion.div>
        </TiltCard>
      </div>
    </div>
  </section>
);

const TickerSection = () => {
  const genres = ["#地下アイドル", "#VTuber", "#歌い手", "#コンカフェ", "#生誕祭", "#e-Sports", "#K-POP", "#2.5次元"];
  return (
    <div className="bg-slate-900 py-3 overflow-hidden relative border-y-2 border-pink-500 z-20 shadow-lg rotate-[-1deg] scale-[1.01] my-4 md:my-8">
      <motion.div className="flex gap-8 whitespace-nowrap" animate={{ x: [0, -800] }} transition={{ repeat: Infinity, duration: 25, ease: "linear" }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-8 text-sm md:text-lg font-bold text-slate-300">
            {genres.map((g, j) => (
              <span key={j} className="flex items-center gap-2">
                <Star size={12} className="text-yellow-400 fill-current" /> {g}
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// 3. CULTURE SECTION (スマホ2列グリッド化)
const CultureSection = () => {
  const items = [
    { title: "フラワースタンド", en: "Stand", icon: "💐", desc: "ロビーを彩る定番。推し色一色に！" },
    { title: "卓上（楽屋花）", en: "Desktop", icon: "🧺", desc: "個人的な想いを込めた贈り物。" },
    { title: "イラストパネル", en: "Panel", icon: "🎨", desc: "絵師描き下ろしのパネルを添えて。" },
    { title: "祭壇・デコ", en: "Decor", icon: "🧸", desc: "愛を盛り込んだ独自のデザイン。" }
  ];

  return (
    <section className="py-12 md:py-32 bg-white relative">
      <div className="container mx-auto px-4 md:px-6">
        <SectionHeader en="Culture" ja="どんなお花を贈る？" color="pink" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {items.map((item, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <TiltCard className="h-full">
                <div className="bg-slate-50 rounded-2xl md:rounded-[30px] p-4 md:p-8 text-center border border-slate-100 h-full flex flex-col items-center">
                  <div className="text-4xl md:text-6xl mb-4 transform group-hover:scale-110 transition-transform">{item.icon}</div>
                  <h3 className="font-bold text-slate-800 text-xs md:text-lg mb-1">{item.title}</h3>
                  <p className="text-[8px] md:text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-3">{item.en}</p>
                  <p className="text-[10px] md:text-sm text-slate-400 leading-relaxed hidden md:block">{item.desc}</p>
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
  <section className="py-16 md:py-32 bg-slate-50 relative overflow-hidden">
    <div className="container mx-auto px-4 md:px-6 relative z-10">
      <SectionHeader en="Pain & Solution" ja="企画の「大変」をゼロに" color="blue" />
      <div className="grid lg:grid-cols-2 gap-4 md:gap-12 max-w-5xl mx-auto">
        <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[30px] border border-slate-200 opacity-70">
          <h3 className="text-sm md:text-lg font-bold text-slate-400 mb-4 flex items-center gap-2">従来のやり方 😰</h3>
          <ul className="space-y-3 md:space-y-6">
            {["DM集金の手間", "未入金の催促", "本名バレのリスク"].map((t, i) => (
              <li key={i} className="flex gap-2 text-slate-400 text-[10px] md:text-base items-center"><div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-[10px]">×</div>{t}</li>
            ))}
          </ul>
        </div>
        <TiltCard glowColor="sky">
          <div className="bg-gradient-to-br from-white to-sky-50 p-6 md:p-10 rounded-2xl md:rounded-[30px] border-2 border-sky-100 shadow-xl h-full">
            <h3 className="text-base md:text-2xl font-bold text-sky-600 mb-4 flex items-center gap-2 text-center sm:text-left justify-center sm:justify-start">FLASTALなら ✨</h3>
            <ul className="space-y-3 md:space-y-6">
              {["URL共有で集金完了", "完全匿名・クレカ対応", "収支報告も自動"].map((t, i) => (
                <li key={i} className="flex gap-2 text-slate-700 font-bold text-[10px] md:text-base items-center"><div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm"><CheckCircle2 size={10} /></div>{t}</li>
              ))}
            </ul>
          </div>
        </TiltCard>
      </div>
    </div>
  </section>
);

// 5. FEATURES (スマホ2列化)
const FeaturesSection = () => {
  const feats = [
    { title: "選べる方式", icon: <CreditCard size={20} />, desc: "All-in or Nothing方式を選択可。" },
    { title: "限定チャット", icon: <MessageCircle size={20} />, desc: "参加者だけの秘密の会議室。" },
    { title: "花屋検索", icon: <Flower size={20} />, desc: "提携フローリストに簡単発注。" }
  ];

  return (
    <section className="py-12 md:py-32 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <SectionHeader en="Features" ja="推し活専用の最強機能" color="purple" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          {feats.map((f, i) => (
            <div key={i} className={cn(i === 2 ? "col-span-2 md:col-span-1" : "")}>
              <TiltCard className="h-full" glowColor="purple">
                <div className="bg-slate-50 rounded-2xl md:rounded-[30px] p-4 md:p-8 border border-slate-100 h-full">
                  <div className="bg-white w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-purple-500 mb-4 shadow-sm">{f.icon}</div>
                  <h3 className="text-xs md:text-xl font-bold text-slate-800 mb-2">{f.title}</h3>
                  <p className="text-[10px] md:text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </TiltCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// 6. SAFETY SECTION
const SafetySection = () => (
  <section className="py-12 bg-emerald-50 relative overflow-hidden">
    <div className="container mx-auto px-4 md:px-6 relative z-10">
       <SectionHeader en="Safety" ja="安心への取り組み" color="green" />
       <div className="grid md:grid-cols-3 gap-4">
          {[
            { title: "完全匿名配送", icon: Lock, desc: "主催者の情報は渡りません。" },
            { title: "Stripe決済", icon: CreditCard, desc: "カード情報は保存されません。" },
            { title: "全件審査制", icon: ShieldCheck, desc: "不適切な企画を未然に防止。" }
          ].map((item, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-[30px] shadow-sm text-center h-full border border-emerald-100">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600"><item.icon size={20} /></div>
                <h3 className="font-bold text-slate-800 text-xs md:text-lg mb-2">{item.title}</h3>
                <p className="text-[10px] md:text-sm text-slate-400">{item.desc}</p>
              </div>
            </Reveal>
          ))}
       </div>
    </div>
  </section>
);

// 7. PARTNER JOIN SECTION
const PartnerJoinSection = () => {
  const partners = [
    { title: "お花屋さん", icon: <Store size={20}/>, color: "pink", hrefR: "/florists/register", desc: "未払いリスクゼロで売上UP。" },
    { title: "会場・ホール", icon: <MapPin size={20}/>, color: "sky", hrefR: "/venues/register", desc: "公式規定を徹底周知。" },
    { title: "イベント主催", icon: <Ticket size={20}/>, color: "purple", hrefR: "/organizers/register", desc: "安全な応援文化を醸成。" }
  ];
  return (
    <section className="py-12 md:py-32 bg-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <SectionHeader en="Professionals" ja="FLASTALのエコシステム" color="purple" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {partners.map((p, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <TiltCard className="h-full" glowColor={p.color}>
                <div className="p-6 md:p-8 rounded-2xl md:rounded-[30px] border shadow-lg text-center h-full flex flex-col bg-white border-slate-100">
                  <div className={cn("w-12 h-12 md:w-16 md:h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm", `text-${p.color}-500`)}>{p.icon}</div>
                  <h3 className="text-sm md:text-lg font-bold text-slate-800 mb-2">{p.title}</h3>
                  <p className="text-[10px] md:text-xs text-slate-400 mb-4 leading-relaxed">{p.desc}</p>
                  <Link href={p.hrefR} className={cn("py-2 md:py-2.5 rounded-xl text-white text-[10px] md:text-sm font-bold transition-all", p.color === 'pink' ? 'bg-pink-500' : p.color === 'sky' ? 'bg-sky-500' : 'bg-purple-500')}>無料登録</Link>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// 8. SHOWCASE
const ShowcaseSection = () => (
  <section className="py-16 bg-slate-900 text-white overflow-hidden relative">
    <div className="container mx-auto px-6 mb-6 text-center">
      <h2 className="text-xl md:text-4xl font-bold uppercase tracking-tighter italic">Success Stories</h2>
    </div>
    <div className="flex gap-4 overflow-x-auto px-6 pb-6 snap-x no-scrollbar">
      {[1,2,3].map((i) => (
        <div key={i} className="snap-center shrink-0 w-[240px] md:w-[350px] bg-slate-800 rounded-2xl md:rounded-[30px] overflow-hidden border border-slate-700">
           <div className="h-40 md:h-48 bg-slate-700 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
             <div className="absolute bottom-3 left-4"><h3 className="font-bold text-xs md:text-base">生誕祭企画 2025</h3></div>
           </div>
           <div className="p-4 md:p-6">
             <div className="flex justify-between text-[8px] md:text-[10px] text-slate-500 mb-2"><span>¥240,000</span><span>85 Supporters</span></div>
             <p className="text-[10px] md:text-xs text-slate-400 line-clamp-2">みんなの協力でお祝いできました！</p>
           </div>
        </div>
      ))}
    </div>
  </section>
);

// 9. VOICES
const VoiceSection = () => (
  <section className="py-12 md:py-32 bg-white">
    <div className="container mx-auto px-4 md:px-6">
      <SectionHeader en="Voices" ja="みんなの感想" color="pink" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { text: "集金管理が自動なので安心できました。", name: "A.Sさん", bg: "bg-pink-100" },
          { text: "少額からでも名前を載せてもらえて感激！", name: "T.Kさん", bg: "bg-sky-100" },
          { text: "イラストの共有機能が最高に便利でした。", name: "M.Mさん", bg: "bg-purple-100" }
        ].map((v, i) => (
          <div key={i} className="bg-slate-50 p-6 md:p-8 rounded-2xl md:rounded-[30px] relative border border-slate-100">
            <p className="text-slate-600 text-[11px] md:text-sm leading-relaxed mb-4 italic">"{v.text}"</p>
            <div className="flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-full shadow-inner", v.bg)} />
              <p className="font-bold text-[10px] md:text-xs text-slate-800">{v.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// 10. FAQ
const FaqSection = () => (
  <section className="py-12 md:py-32 bg-white">
    <div className="container mx-auto px-4 md:px-6 max-w-3xl">
      <SectionHeader en="Q&A" ja="よくある質問" color="green" />
      <div className="space-y-3">
        {[
          { q: "目標未達の場合は？", a: "All-in(そのまま実施)かAll-or-Nothingかを選べます。" },
          { q: "手数料は？", a: "企画作成は無料。達成時のみ計10%を頂戴します。" },
          { q: "匿名支援は可能？", a: "はい。主催者に本名や住所は伝わりません。" }
        ].map((item, i) => (
          <details key={i} className="group bg-slate-50 rounded-xl md:rounded-2xl p-4 md:p-5 border border-slate-100 cursor-pointer transition-all">
            <summary className="flex items-center justify-between font-bold text-slate-800 list-none text-xs md:text-base">
              <span className="flex items-center gap-3"><HelpCircle size={16} className="text-emerald-500" /> {item.q}</span>
              <ChevronDown size={14} className="text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-3 text-[10px] md:text-sm text-slate-500 pl-7 leading-relaxed">{item.a}</div>
          </details>
        ))}
      </div>
    </div>
  </section>
);

// 12. CONTACT & CTA
const ContactAndCtaSection = () => (
  <section className="relative py-12 md:py-32 bg-white overflow-hidden px-4 md:px-6">
    <div className="container mx-auto text-center relative z-10">
      <Reveal>
        <div className="bg-slate-900 rounded-3xl md:rounded-[60px] p-8 md:p-24 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,114,182,0.1),transparent)]" />
          <div className="relative z-10">
            <h2 className="text-2xl md:text-6xl font-black mb-4 md:mb-8 leading-tight tracking-tighter italic">さあ、推しへの愛を形に。</h2>
            <p className="text-slate-400 text-[10px] md:text-lg mb-6 md:mb-12 max-w-xl mx-auto">作成は無料。あなたの「贈りたい」が、誰かの勇気になります。</p>
            <Link href="/projects/create">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-pink-500 text-white px-8 md:px-16 py-3 md:py-6 rounded-full text-sm md:text-2xl font-black shadow-xl hover:bg-pink-400 transition-all">
                今すぐ企画を立てる
              </motion.button>
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);

// --- 🏠 DASHBOARD WRAPPER ---
function AuthenticatedHome({ user, logout }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 md:p-10 text-center border border-slate-100">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={40} />
        </div>
        <h1 className="text-xl md:text-2xl font-black text-slate-800 mb-2 tracking-tight uppercase italic">Welcome Back</h1>
        <p className="text-slate-400 mb-8 font-bold text-[10px] md:text-xs uppercase tracking-widest">
          {user?.handleName || 'FLASTAL MEMBER'} Signed In
        </p>
        <div className="space-y-4">
          <Link href={user?.role === 'ADMIN' ? '/admin' : '/mypage'} className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-lg text-sm md:text-base">
            DASHBOARD <ArrowRight size={18} />
          </Link>
          <button onClick={logout} className="text-[10px] font-black text-slate-300 hover:text-red-500 transition-colors uppercase tracking-[0.2em]">Sign Out</button>
        </div>
      </div>
    </div>
  );
}

// --- 👑 MAIN EXPORT ---
export default function HomePage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-4" />
        <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase animate-pulse">Initializing...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <AuthenticatedHome user={user} logout={logout} />;
  }

  return (
    <div className="bg-white min-h-screen text-slate-800 font-sans selection:bg-pink-100 selection:text-pink-600 overflow-x-hidden pt-0">
      <HeroSection />
      <TickerSection />
      <CultureSection />
      <ProblemSection />
      <FeaturesSection />
      <SafetySection />
      <PartnerJoinSection />
      <ShowcaseSection />
      <VoiceSection />
      <FaqSection />
      <ContactAndCtaSection />
      
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}