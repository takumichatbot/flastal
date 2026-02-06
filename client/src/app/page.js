'use client';

// Next.js 15 のビルドエラーを確実に回避する設定
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import React, { useRef, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import Image from 'next/image';
import { 
  motion, useScroll, useTransform, useSpring, useInView, useMotionValue, useMotionTemplate, AnimatePresence 
} from 'framer-motion';

// --- すべて lucide-react に統一 ---
import { 
  Heart, Sparkles, Zap, MessageCircle, Gift, 
  Calendar, Users, ShieldCheck, ChevronDown, 
  Star, Palette, HelpCircle, Mail,
  ArrowRight, CheckCircle2, Search, Flower,
  CreditCard, Lock, Store, MapPin, Ticket, Loader2,
  Image as ImageIcon, Share2, Award, PiggyBank
} from 'lucide-react';

// --- Utility ---
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * 日本語の変な改行を防ぐためのコンポーネント
 */
const JpText = ({ children, className }) => (
  <span className={cn("inline-block", className)}>{children}</span>
);

// --- 🪄 MAGIC UI COMPONENTS 🪄 ---

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
      className={cn("fixed top-0 left-0 w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-sky-400 blur-xl pointer-events-none z-[90] mix-blend-multiply transition-opacity duration-500 hidden lg:block", hidden ? "opacity-0" : "opacity-60")}
      style={{ x: cursorX, y: cursorY, translateX: '-50%', translateY: '-50%' }}
    />
  );
};

const Reveal = ({ children, delay = 0, width = "100%" }) => (
  <motion.div
    initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.8, delay, type: "spring", bounce: 0.3 }}
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
    amber: "group-hover:shadow-amber-200/60",
  };

  return (
    <motion.div
      style={{ rotateX, rotateY, perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className={cn("relative transition-all duration-300 ease-out group hover:z-10 h-full", className)}
    >
      <div className={cn("transition-shadow duration-300 hover:shadow-2xl h-full rounded-[30px] bg-white border border-slate-100", glows[glowColor])}>
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
    <div className="text-center mb-24 relative z-10 px-4">
      <Reveal>
        <span className={cn("inline-block font-bold tracking-[0.2em] uppercase text-sm mb-4 font-mono px-4 py-1.5 rounded-full bg-white border shadow-sm", colors[color].split(" ")[0], colors[color].split(" ")[3])}>
          ✨ {en}
        </span>
        <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-6 leading-tight">
          {ja}
        </h2>
        <div className={cn("h-1.5 w-24 mx-auto rounded-full bg-gradient-to-r mb-8 opacity-80", colors[color].split(" ").slice(1, 3).join(" "))} />
        {desc && (
          <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed text-sm md:text-base font-medium">
            {desc}
          </p>
        )}
      </Reveal>
    </div>
  );
};

const KawaiiButton = ({ children, variant = "primary", icon: Icon, className, onClick, ariaLabel }) => {
  const base = "relative px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-all overflow-hidden group flex items-center justify-center gap-2 active:scale-95";
  const styles = {
    primary: "bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 text-white shadow-pink-200 hover:shadow-pink-300 hover:scale-105",
    secondary: "bg-white text-slate-700 border-2 border-slate-100 hover:border-sky-300 hover:text-sky-500 hover:shadow-sky-100 hover:scale-105",
    outline: "bg-transparent border-2 border-white text-white hover:bg-white/20",
  };

  return (
    <motion.button 
      whileHover={{ scale: 1.05 }} 
      whileTap={{ scale: 0.95 }} 
      className={cn(base, styles[variant], className)} 
      onClick={onClick}
      aria-label={ariaLabel || (typeof children === 'string' ? children : 'button')}
    >
      {Icon && <Icon size={20} className="transition-transform group-hover:rotate-12" aria-hidden="true" />}
      <span className="relative z-10">{children}</span>
      {variant === 'primary' && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shine" />}
    </motion.button>
  );
};

// --- ★追加: お花屋さんの投稿ギャラリーセクション ---
const FloristWorksSection = () => {
  const [posts, setPosts] = React.useState([]);

  React.useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com'}/api/florists/posts/public`)
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setPosts(data);
      })
      .catch(e => console.error(e));
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="py-20 bg-slate-50 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <SectionHeader en="New Arrivals" ja="お花屋さんの最新作品" desc="パートナー花屋さんが制作した、こだわりのフラスタたち。" color="pink" />
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {posts.map((post, i) => (
            <Reveal key={post.id} delay={i * 0.1}>
              <Link href={`/florists/${post.floristId}`} className="group block h-full">
                <div className="relative aspect-square overflow-hidden rounded-2xl shadow-md border border-white">
                  {/* ★修正: next/image を使用 */}
                  <Image 
                    src={post.imageUrl} 
                    alt={post.content || "制作実績"} 
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <p className="text-white text-xs font-bold line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                       <div className="w-5 h-5 rounded-full bg-white/20 overflow-hidden relative">
                         {/* ★修正: アイコンも next/image に変更 (ある場合) */}
                         {post.florist?.iconUrl && (
                           <Image 
                             src={post.florist.iconUrl} 
                             alt="Florist Icon" 
                             fill 
                             className="object-cover"
                           />
                         )}
                       </div>
                       <span className="text-[10px] text-white/90 truncate">{post.florist?.platformName}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
        
        <div className="mt-12 text-center">
             <Link href="/florists" className="inline-flex items-center gap-2 text-pink-600 font-bold hover:underline">
                お花屋さん一覧を見る <ArrowRight size={16}/>
             </Link>
        </div>
      </div>
    </section>
  );
};

// --- 🚀 HERO & SECTIONS ---

const HeroSection = () => (
  <section className="relative w-full min-h-[85vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden bg-white border-none m-0 mt-[-2px] p-0 z-10 isolate">
    <div className="absolute inset-0 bg-[radial-gradient(#e0f2fe_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
    <FloatingShape color="bg-pink-200" top="-5%" left="-5%" size={500} />
    <FloatingShape color="bg-sky-200" bottom="-5%" right="-5%" size={500} delay={2} />

    <div className="container relative z-10 px-6 py-12 md:py-24 grid lg:grid-cols-12 gap-10 items-center mx-auto">
      <div className="lg:col-span-7 text-center lg:text-left">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-md border border-pink-50 mb-6 mx-auto lg:mx-0">
            <span className="flex h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-[10px] md:text-xs font-bold text-slate-500 tracking-wide uppercase">Oshikatsu Update 2.0</span>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-slate-800 leading-tight mb-6 tracking-tight">
            <JpText>想いを、</JpText><br/>
            <span className="relative inline-block px-1">
              <span className="absolute inset-0 bg-pink-200 -rotate-1 rounded-lg blur-sm opacity-40" />
              <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">結晶化</span>
            </span>
            <JpText>しよう。</JpText>
          </h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="text-sm md:text-xl text-slate-500 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
            <JpText>FLASTAL（フラスタル）は、</JpText><JpText>アイドル・声優・VTuber・歌い手への</JpText><JpText>「お祝い花（フラスタ）」を、</JpText><JpText>ファンのみんなで贈れる</JpText><JpText>次世代クラウドファンディング・プラットフォームです。</JpText>
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link href="/projects/create" className="w-full sm:w-auto" aria-label="無料でフラスタ企画を立てる">
              <KawaiiButton variant="primary" icon={Sparkles} className="w-full">無料で企画を立てる</KawaiiButton>
            </Link>
            <Link href="/projects" className="w-full sm:w-auto" aria-label="実施中のフラスタ企画を探す">
              <KawaiiButton variant="secondary" icon={Search} className="w-full">企画を探す</KawaiiButton>
            </Link>
          </div>
        </Reveal>
      </div>

      <div className="lg:col-span-5 relative hidden lg:block">
        <TiltCard>
          <motion.div initial={{ rotateY: 20, opacity: 0 }} animate={{ rotateY: -5, opacity: 1 }} transition={{ duration: 1.2 }} className="bg-white rounded-[40px] shadow-2xl border-4 border-white overflow-hidden">
             <div className="h-80 bg-slate-200 relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center" role="img" aria-label="フラスタのイメージ画像" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
               <div className="absolute bottom-6 left-6 text-white">
                 <span className="bg-pink-500 px-2 py-0.5 rounded text-[10px] font-bold mb-2 inline-block uppercase">Now Funding</span>
                 <h3 className="text-2xl font-bold">星街すいせいさんへ銀河一のフラスタを！</h3>
               </div>
             </div>
             <div className="p-6">
               <div className="flex justify-between items-end mb-4"><span className="text-2xl font-black text-slate-800">¥125,000</span><span className="text-pink-500 font-bold text-sm bg-pink-50 px-2 py-1 rounded">125% 達成!</span></div>
               <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4"><motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2, delay: 0.5 }} className="h-full bg-gradient-to-r from-pink-400 to-rose-500" /></div>
               <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest"><span><Users size={12} className="inline mr-1" aria-hidden="true"/> 48 Supporters</span><span><Calendar size={12} className="inline mr-1" aria-hidden="true"/> 5 Days Left</span></div>
             </div>
          </motion.div>
        </TiltCard>
      </div>
    </div>
  </section>
);

const TickerSection = () => {
  const genres = ["#地下アイドル", "#VTuber", "#歌い手", "#コンカフェ", "#生誕祭", "#周年ライブ", "#e-Sports", "#K-POP", "#2.5次元"];
  return (
    <div className="bg-slate-900 py-4 overflow-hidden relative border-y-4 border-pink-500 z-20 shadow-xl rotate-[-1deg] scale-[1.02] my-12">
      <motion.div className="flex gap-12 whitespace-nowrap" animate={{ x: [0, -1000] }} transition={{ repeat: Infinity, duration: 40, ease: "linear" }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-12">
            {genres.map((g, j) => (
              <span key={j} className="text-lg font-bold text-slate-300 flex items-center gap-2">
                <Star size={14} className="text-yellow-400 fill-current" aria-hidden="true" />
                {g}
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

const CultureSection = () => {
  const items = [
    { title: "フラワースタンド", en: "Flower Stand", icon: "💐", desc: "ライブ会場のロビーを彩る定番。バルーンやLEDで派手に装飾し、推しの「メンカラ」一色に染め上げます。" },
    { title: "卓上フラスタ（楽屋花）", en: "Desktop Flasta", icon: "🧺", desc: "楽屋や受付に飾るコンパクトなアレンジメント。会場規制でスタンド不可の場合や、個人的な贈り物に。" },
    { title: "イラストパネル", en: "Illustration Panel", icon: "🎨", desc: "神絵師に依頼した推しの等身大パネルやイラストボードをお花に添えます。二次元・VTuber界隈では必須！" },
    { title: "祭壇・デコ", en: "Altar & Decor", icon: "🧸", desc: "お花だけでなく、ぬいぐるみ、グッズ、名札パネルなどを大量に盛り込んだ、愛の重さが伝わる独自デザイン。" }
  ];

  return (
    <section className="py-20 md:py-32 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6">
        <SectionHeader en="Otaku Culture" ja="どんなお花を贈る？" desc="「フラスタ」と一口に言っても形は様々。会場のレギュレーションや予算に合わせて、最適な形を選ぼう。" color="pink" />
        <div className="flex overflow-x-auto pb-8 md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 snap-x no-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
          {items.map((item, i) => (
            <div key={i} className="min-w-[280px] md:min-w-0 snap-center h-full">
              <Reveal key={i} delay={i * 0.1}>
                <TiltCard glowColor="pink">
                  <div className="bg-slate-50 rounded-[30px] p-8 text-center border border-slate-100 h-full flex flex-col items-center group min-h-[400px]">
                    <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300" aria-hidden="true">{item.icon}</div>
                    <h3 className="font-bold text-slate-800 text-lg mb-1">{item.title}</h3>
                    <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-4">{item.en}</p>
                    <p className="text-sm text-slate-500 leading-relaxed text-left flex-grow">
                      <JpText>{item.desc}</JpText>
                    </p>
                  </div>
                </TiltCard>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ProblemSection = () => (
  <section className="py-20 md:py-32 bg-slate-50 relative overflow-hidden">
    <FloatingShape color="bg-slate-200" top="10%" left="-10%" size={400} />
    <div className="container mx-auto px-6 relative z-10">
      <SectionHeader en="Pain & Solution" ja="企画の「大変」をゼロに" desc="DMでの集金、個人情報の管理、お花屋さんへのオーダー...。主催者の負担をFLASTALがすべて引き受けます。" color="blue" />
      <div className="grid lg:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto items-stretch">
        <Reveal>
          <div className="bg-white p-10 rounded-[40px] border border-slate-200 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500 h-full">
            <h3 className="text-xl font-bold text-slate-600 mb-8 flex items-center gap-3">
              <span className="bg-slate-200 px-3 py-1 rounded-full text-xs">従来のやり方</span> 😰 <JpText>大変すぎる...</JpText>
            </h3>
            <ul className="space-y-6">
              {["DMで一人ひとり口座を教える手間", "未入金の催促が気まずい", "本名や住所がバレるリスク", "収支報告のエクセル管理が地獄"].map((t, i) => (
                <li key={i} className="flex gap-4 text-slate-500 items-center"><div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-xs font-bold" aria-hidden="true">×</div><JpText>{t}</JpText></li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={0.2}>
          <TiltCard glowColor="sky" className="h-full">
            <div className="bg-gradient-to-br from-white to-sky-50 p-10 rounded-[40px] border-2 border-sky-100 shadow-xl h-full relative overflow-hidden group">
              <h3 className="text-2xl font-bold text-sky-600 mb-8 flex items-center gap-3">
                <span className="bg-sky-100 px-3 py-1 rounded-full text-xs">FLASTALなら</span> ✨ <JpText>全部おまかせ！</JpText>
              </h3>
              <ul className="space-y-6 relative z-10">
                {["リンクをシェアするだけで集金完了", "クレカ・コンビニ払いで自動管理", "完全匿名で安心安全", "収支報告もワンクリックで公開"].map((t, i) => (
                  <li key={i} className="flex gap-4 text-slate-700 font-bold items-center">
                    <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-sky-200"><CheckCircle2 size={16} aria-hidden="true" /></div><JpText>{t}</JpText>
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

const FeaturesSection = () => {
  const features = [
    {
      id: "payment",
      title: "ハイブリッド集金システム",
      icon: <CreditCard size={28} aria-hidden="true" />,
      color: "purple",
      desc: "All-in方式とAll-or-Nothing方式を自由に選択。クレカ、コンビニ、銀行振込など多様な決済に対応し、集金の「未払い」をゼロにします。"
    },
    {
      id: "privacy",
      title: "匿名・プライバシー保護",
      icon: <Lock size={28} aria-hidden="true" />,
      color: "emerald",
      desc: "参加者はハンドルネームで支援可能。主催者に本名や住所が伝わることもなく、安全な「匿名配送」を実現しました。"
    },
    {
      id: "illust",
      title: "神絵師イラスト公募",
      icon: <Palette size={28} aria-hidden="true" />,
      color: "pink",
      desc: "フラスタに添えるパネルのイラストをサイト内で公募・依頼可能。絵師とのマッチングから謝礼の支払いまで一括管理できます。"
    },
    {
      id: "chat",
      title: "参加者限定・密談チャット",
      icon: <MessageCircle size={28} aria-hidden="true" />,
      color: "sky",
      desc: "支援者だけが入室できるチャットルーム。サプライズの演出相談や、お花屋さんとの進捗共有をクローズドな空間で行えます。"
    },
    {
      id: "matching",
      title: "全国対応・花屋マッチング",
      icon: <Flower size={28} aria-hidden="true" />,
      color: "amber",
      desc: "「推し活」に特化した提携フローリストを検索。バルーン、LED、装飾品の持ち込みなど、わがままなオーダーにも柔軟に応えます。"
    },
    {
      id: "report",
      title: "自動収支・透明性レポート",
      icon: <PiggyBank size={28} aria-hidden="true" />,
      color: "green",
      desc: "集まった金額と使用した内訳を自動計算。領収書画像をアップロードするだけで、参加者全員にクリアな収支報告書を公開できます。"
    }
  ];

  return (
    <section className="py-20 md:py-32 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6">
        <SectionHeader 
          en="Powerful Features" 
          ja="推し活専用の最強機能" 
          desc="フラスタ文化を愛するスタッフが開発。痒い所に手が届く、企画を成功させるための全ての武器がここに。"
          color="purple" 
        />
        <div className="flex overflow-x-auto pb-8 md:grid md:grid-cols-2 lg:grid-cols-3 gap-8 snap-x no-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
          {features.map((f, i) => (
            <div key={i} className="min-w-[300px] md:min-w-0 snap-center h-full">
              <Reveal delay={i * 0.1}>
                <Link href={`/features#${f.id}`} aria-label={`${f.title}の詳細を見る`}>
                  <TiltCard className="h-full" glowColor={f.color === 'emerald' || f.color === 'green' ? 'emerald' : f.color}>
                    <div className="p-10 flex flex-col h-full relative overflow-hidden group min-h-[380px]">
                      <div className={cn("absolute -top-6 -right-6 opacity-5 transform rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-6", `text-${f.color}-500`)} aria-hidden="true">
                        {f.icon}
                      </div>
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-sm transition-all group-hover:scale-110 group-hover:rotate-3", `bg-${f.color}-50 text-${f.color}-500`)}>
                        {f.icon}
                      </div>
                      <h3 className="text-xl font-black text-slate-800 mb-4 group-hover:text-purple-600 transition-colors">
                        {f.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        <JpText>{f.desc}</JpText>
                      </p>
                      <div className="mt-8 pt-6 border-t border-slate-50 flex items-center gap-2 text-xs font-bold text-slate-400 group-hover:text-purple-400 transition-colors">
                        LEARN MORE <ArrowRight size={14} aria-hidden="true" />
                      </div>
                    </div>
                  </TiltCard>
                </Link>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const SafetySection = () => {
  const safetyItems = [
    { title: "完全匿名配送", icon: Lock, desc: "お花屋さんへの発注はFLASTALが代行。主催者の個人情報が店舗や第三者に渡ることはありません。" },
    { title: "安全な決済", icon: CreditCard, desc: "世界基準のStripe決済を採用。クレジットカード情報はサーバーに保存されず、安全に処理されます。" },
    { title: "運営の審査制", icon: ShieldCheck, desc: "すべての企画は公開前に運営スタッフが目視で審査。詐欺や不適切な企画を未然に防ぎます。" }
  ];

  return (
    <section className="py-20 bg-emerald-50 border-y border-emerald-100 relative overflow-hidden">
      <FloatingShape color="bg-emerald-200" bottom="-10%" left="10%" size={300} />
      <div className="container mx-auto px-6 relative z-10">
         <SectionHeader en="Trust & Safety" ja="お金のことだから、誠実に" color="green" desc="FLASTALは、すべてのファンが安心して利用できる環境づくりを最優先しています。" />
         <div className="flex overflow-x-auto pb-8 md:grid md:grid-cols-3 gap-8 snap-x no-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
            {safetyItems.map((item, i) => (
              <div key={i} className="min-w-[280px] md:min-w-0 snap-center h-full">
                <Reveal delay={i * 0.1}>
                  <div className="bg-white p-8 rounded-[30px] shadow-sm border border-emerald-100 hover:shadow-lg transition-shadow text-center h-full min-h-[320px] flex flex-col justify-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500 shrink-0"><item.icon size={32} aria-hidden="true" /></div>
                    <h3 className="font-bold text-lg mb-4 text-slate-800"><JpText>{item.title}</JpText></h3>
                    <p className="text-sm text-slate-500 leading-relaxed"><JpText>{item.desc}</JpText></p>
                  </div>
                </Reveal>
              </div>
            ))}
         </div>
      </div>
    </section>
  );
};

const PartnerJoinSection = () => {
  const partners = [
    { title: "お花屋さん", icon: Store, color: "pink", hrefL: "/florists/login", hrefR: "/florists/register", desc: "未払いリスクゼロで、確実に売上を。ファンの熱量が高い「推し花」需要を取り込みませんか？" },
    { title: "会場・ホール", icon: MapPin, color: "sky", hrefL: "/venues/login", hrefR: "/venues/register", desc: "搬入出のトラブル防止に. 公式のレギュレーションを周知し、許可されたフラスタのみを受け入れ可能。" },
    { title: "イベント主催者", icon: Ticket, color: "purple", hrefL: "/organizers/login", hrefR: "/organizers/register", desc: "ファンの応援企画を公認・把握。安全な応援文化を醸成し、イベントの盛り上がりを可視化します。" }
  ];

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6">
        <SectionHeader en="For Professionals" ja="FLASTALで広がる可能性" desc="お花屋さん、ライブ会場、イベンターの方へ。FLASTALのエコシステムに参加しませんか？" color="purple" />
        <div className="flex overflow-x-auto pb-8 md:grid md:grid-cols-3 gap-8 snap-x no-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
          {partners.map((p, i) => (
            <div key={i} className="min-w-[300px] md:min-w-0 snap-center h-full">
              <Reveal delay={i * 0.1}>
                <TiltCard className="h-full" glowColor={p.color}>
                  <div className={cn("p-8 rounded-[40px] border shadow-lg text-center h-full flex flex-col bg-white min-h-[480px]", 
                    p.color === "pink" ? "border-pink-100" : 
                    p.color === "sky" ? "border-sky-100" : 
                    "border-purple-100")}>
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md text-slate-500 shrink-0">
                      <p.icon size={40} aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2"><JpText>{p.title}</JpText></h3>
                    <p className="text-sm text-slate-500 mb-6 flex-grow leading-relaxed"><JpText>{p.desc}</JpText></p>
                    <div className="flex flex-col gap-3 shrink-0">
                      <Link href={p.hrefL} className={cn("w-full py-3 rounded-xl border-2 font-bold transition-colors text-center", 
                        p.color === "pink" ? "border-pink-200 text-pink-500 hover:bg-pink-50" : 
                        p.color === "sky" ? "border-sky-200 text-sky-500 hover:bg-sky-50" : 
                        "border-purple-200 text-purple-500 hover:bg-purple-50")}>ログイン</Link>
                      <Link href={p.hrefR} className={cn("w-full py-3 rounded-xl text-white font-bold shadow-md transition-colors text-center", 
                        p.color === "pink" ? "bg-pink-500 hover:bg-pink-600 shadow-pink-200" : 
                        p.color === "sky" ? "bg-sky-500 hover:bg-sky-600 shadow-sky-200" : 
                        "bg-purple-500 hover:bg-purple-600 shadow-purple-200")}>新規登録</Link>
                    </div>
                  </div>
                </TiltCard>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ShowcaseSection = () => (
  <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
    <div className="absolute inset-0 bg-slate-800 opacity-20 mix-blend-overlay" />
    <div className="container mx-auto px-6 mb-12 relative z-10 text-center">
      <span className="text-pink-500 font-bold tracking-widest text-xs uppercase mb-2 block">Gallery</span>
      <h2 className="text-3xl md:text-5xl font-bold mb-4">Success Stories</h2>
      <p className="text-slate-400"><JpText>想いが形になった瞬間</JpText></p>
    </div>
    <div className="flex gap-8 overflow-x-auto px-6 pb-12 snap-x items-center no-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
      {[1,2,3,4,5].map((i) => (
        <div key={i} className="min-w-[300px] md:min-w-[400px] snap-center">
          <motion.div whileHover={{ scale: 1.05, rotate: 1 }} className="w-full bg-slate-800 rounded-[30px] overflow-hidden shadow-2xl border border-slate-700 group cursor-pointer h-full">
             <div className="h-56 bg-slate-700 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
               <div className="absolute bottom-4 left-4 z-20">
                 <div className="bg-pink-500 px-2 py-1 rounded text-[10px] font-bold inline-block mb-2 shadow-lg">#VTuber</div>
                 <h3 className="font-bold text-lg leading-tight"><JpText>◯◯ちゃん生誕祭2025</JpText></h3>
               </div>
             </div>
             <div className="p-6">
               <div className="flex justify-between text-sm text-slate-400 mb-4 font-mono"><span>Total: ¥240,000</span><span>Fans: 85</span></div>
               <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                 <JpText>みんなの協力のおかげで、バルーンアーチ付きの特大フラスタを贈ることができました！本当にありがとうございます！</JpText>
               </p>
             </div>
          </motion.div>
        </div>
      ))}
    </div>
  </section>
);

const VoiceSection = () => (
  <section className="py-20 md:py-32 bg-white relative overflow-hidden">
    <div className="container mx-auto px-6">
      <SectionHeader en="Voices" ja="みんなの感想" color="pink" />
      <div className="flex overflow-x-auto pb-8 md:grid md:grid-cols-3 gap-8 snap-x no-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
        {[
          { text: "初めての主催で不安でしたが、集金管理が自動なのでデザインの相談に集中できました。", name: "A.Sさん", role: "VTuberファン", bg: "bg-pink-100" },
          { text: "たった1000円からの支援でも、名前をパネルに載せてもらえて嬉しかったです。", name: "T.Kさん", role: "アイドルファン", bg: "bg-sky-100" },
          { text: "イラストのデータを共有する機能が便利でした。印刷も綺麗にいきました。", name: "M.Mさん", role: "絵師依頼", bg: "bg-purple-100" }
        ].map((v, i) => (
          <div key={i} className="min-w-[300px] md:min-w-0 snap-center h-full">
            <Reveal delay={i * 0.1}>
              <div className="bg-slate-50 p-8 rounded-[30px] relative border border-slate-100 h-full flex flex-col hover:shadow-lg transition-shadow min-h-[260px]">
                <div className="text-6xl text-slate-200 absolute top-4 left-6 font-serif opacity-30" aria-hidden="true">“</div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 pt-6 relative z-10 font-medium italic">
                  <JpText>「{v.text}」</JpText>
                </p>
                <div className="flex items-center gap-4 mt-auto relative z-10">
                  <div className={cn("w-12 h-12 rounded-full shadow-inner", v.bg)} />
                  <div><p className="font-bold text-sm text-slate-800">{v.name}</p><p className="text-xs text-slate-500">{v.role}</p></div>
                </div>
              </div>
            </Reveal>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FlowDetailSection = () => {
  const steps = [
    { title: "企画作成", sub: "3分で完了", desc: "目標金額、贈りたい相手、イベント日を入力してページを作成。" },
    { title: "拡散・募集", sub: "SNS連携", desc: "Twitter(X)でURLをシェア。TwiPlaなどの募集サイトとの併用もOK。" },
    { title: "達成・発注", sub: "自動送金", desc: "目標金額が集まったら、FLASTAL経由でお花屋さんに正式発注。" },
    { title: "制作・納品", sub: "進捗共有", desc: "お花屋さんから完成写真が届きます。サイト上で参加者に報告！" }
  ];
  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-white to-slate-50">
      <div className="container mx-auto px-6">
        <SectionHeader en="Process" ja="ご利用の流れ" color="blue" />
        <div className="relative max-w-4xl mx-auto">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 -translate-x-1/2 hidden md:block" aria-hidden="true" />
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 md:hidden" aria-hidden="true" />
          {steps.map((step, i) => (
            <Reveal key={i} width="100%">
              <div className={cn("relative flex items-center mb-16 last:mb-0", i % 2 === 0 ? "md:justify-start" : "md:justify-end")}>
                <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white border-4 border-sky-400 z-10 flex items-center justify-center text-sm font-bold text-sky-500 shadow-md">{i + 1}</div>
                <div className={cn("bg-white p-8 rounded-[30px] shadow-lg border border-slate-100 w-[calc(100%-60px)] md:w-[45%] ml-14 md:ml-0 hover:-translate-y-1 transition-transform duration-300", i % 2 === 0 ? "md:mr-12" : "md:ml-12")}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-xl text-slate-800"><JpText>{step.title}</JpText></h3>
                    <span className="text-[10px] font-bold bg-sky-100 text-sky-600 px-2 py-1 rounded-full">{step.sub}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed"><JpText>{step.desc}</JpText></p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

const FaqSection = () => (
  <section className="py-20 md:py-32 bg-white">
    <div className="container mx-auto px-6 max-w-3xl">
      <SectionHeader en="Q&A" ja="よくある質問" color="green" />
      <div className="space-y-4">
        {[
          { q: "目標未達の場合は？", a: "All-in(そのまま実施)かAll-or-Nothing(返金中止)かを選べます。" },
          { q: "手数料は？", a: "企画作成は無料。達成時のみ、計10%を頂戴します。" },
          { q: "匿名支援は可能？", a: "はい。主催者に本名や住所が伝わることはありません。" }
        ].map((item, i) => (
          <Reveal key={i} delay={i * 0.05}>
            <details className="group bg-slate-50 rounded-2xl p-6 border border-slate-100 cursor-pointer open:bg-white open:shadow-lg open:border-emerald-100 transition-all duration-300">
              <summary className="flex items-center justify-between font-bold text-slate-800 list-none">
                <span className="flex items-center gap-3"><HelpCircle className="text-emerald-500 shrink-0" aria-hidden="true" /> <JpText>{item.q}</JpText></span>
                <ChevronDown size={16} className="text-slate-400 group-open:rotate-180 transition-transform duration-300" aria-hidden="true" />
              </summary>
              <div className="mt-4 text-xs md:text-sm text-slate-500 pl-9 leading-relaxed"><JpText>{item.a}</JpText></div>
            </details>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

const NewsSection = () => (
  <section className="py-20 bg-slate-50">
    <div className="container mx-auto px-6 max-w-4xl">
       <div className="flex justify-between items-end mb-8 px-2">
         <h2 className="text-2xl font-black text-slate-800 tracking-tighter italic uppercase">News</h2>
         <Link href="/news" className="text-xs text-pink-500 font-bold hover:underline tracking-widest uppercase">View All</Link>
       </div>
       <div className="bg-white rounded-[30px] p-6 shadow-sm border border-slate-100 divide-y divide-slate-100">
         {[{ date: "2025.12.20", cat: "Feature", title: "新機能「イラスト公募機能」をリリースしました" }, { date: "2025.12.15", cat: "Event", title: "コミックマーケット107開催に伴うお花の受付について" }, { date: "2025.12.01", cat: "Info", title: "年末年始のサポート対応について" }].map((n, i) => (
           <div key={i} className="py-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-6 hover:bg-slate-50 transition-colors cursor-pointer rounded-xl px-4 group">
             <span className="text-slate-400 text-xs font-mono">{n.date}</span>
             <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold w-fit group-hover:bg-pink-100 group-hover:text-pink-600 transition-colors">{n.cat}</span>
             <span className="text-slate-700 font-bold text-sm group-hover:text-pink-500 transition-colors"><JpText>{n.title}</JpText></span>
           </div>
         ))}
       </div>
    </div>
  </section>
);

const ContactAndCtaSection = () => (
  <section className="relative pt-24 pb-32 bg-white overflow-hidden">
    <div className="container mx-auto px-6 mb-32">
      <SectionHeader en="Contact" ja="お問い合わせ" color="blue" />
      <Reveal>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <a href="mailto:support@flastal.jp" className="group bg-sky-50 p-8 rounded-[30px] border border-sky-100 text-center hover:shadow-xl hover:-translate-y-1 transition-all h-full flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-sky-500 mb-4 shadow-sm group-hover:scale-110 transition-transform"><Mail size={32} aria-hidden="true" /></div>
            <h3 className="font-bold text-slate-800 text-xl mb-2"><JpText>ユーザー・主催者の方</JpText></h3>
            <p className="text-sm text-slate-500 font-medium"><JpText>企画の立て方や利用トラブルについて</JpText></p>
          </a>
          <a href="mailto:business@flastal.jp" className="group bg-pink-50 p-8 rounded-[30px] border border-pink-100 text-center hover:shadow-xl hover:-translate-y-1 transition-all h-full flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-pink-500 mb-4 shadow-sm group-hover:scale-110 transition-transform"><Gift size={32} aria-hidden="true" /></div>
            <h3 className="font-bold text-slate-800 text-xl mb-2"><JpText>お花屋さん・法人の方</JpText></h3>
            <p className="text-sm text-slate-500 font-medium"><JpText>加盟店登録や提携について</JpText></p>
          </a>
        </div>
      </Reveal>
    </div>
    <div className="container mx-auto px-6 text-center relative z-10">
      <Reveal>
        <div className="bg-slate-900 rounded-[60px] p-12 md:p-24 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,114,182,0.15),transparent)]" aria-hidden="true" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-7xl font-black mb-8 leading-tight tracking-tighter">
              <JpText>さあ、推しへの愛を</JpText><br/><JpText>形にしよう。</JpText>
            </h2>
            <p className="text-slate-400 text-lg mb-12 max-w-xl mx-auto font-medium leading-relaxed">
              <JpText>企画の作成は無料。</JpText><JpText>あなたの「贈りたい」が、</JpText><JpText>誰かの勇気になります。</JpText>
            </p>
            <Link href="/projects/create" className="inline-block" aria-label="今すぐ無料でフラスタ企画を作成する">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-pink-500 text-white px-12 md:px-20 py-5 md:py-7 rounded-full text-xl md:text-3xl font-black shadow-xl shadow-pink-500/20 hover:bg-pink-400 transition-all">今すぐ企画を立てる</motion.button>
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);

// --- 🏠 DASHBOARD WRAPPER ---
const AuthenticatedHome = ({ user, logout }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 m-0">
    <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-10 text-center border border-slate-100">
      <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><ShieldCheck size={40} aria-hidden="true" /></div>
      <h1 className="text-2xl font-black text-slate-800 mb-2 tracking-tight italic uppercase">Welcome Back</h1>
      <p className="text-slate-400 mb-8 font-bold text-xs uppercase tracking-widest leading-relaxed">
        <JpText>{user?.handleName || 'FLASTAL MEMBER'} Signed In</JpText>
      </p>
      <div className="space-y-4">
        <Link href={user?.role === 'ADMIN' ? '/admin' : user?.role === 'FLORIST' ? '/florists/dashboard' : '/mypage'} className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-lg text-sm md:text-base text-center">DASHBOARD <ArrowRight size={18} aria-hidden="true" /></Link>
        <button onClick={logout} className="text-[10px] font-black text-slate-300 hover:text-red-500 transition-colors uppercase tracking-[0.2em] mt-4">Sign Out</button>
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
      document.title = "FLASTAL（フラスタル）| 推し活特化型クラウドファンディング";
    }
  }, [isMounted]);

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-4" aria-hidden="true" />
        <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase animate-pulse">Initializing System...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <AuthenticatedHome user={user} logout={logout} />;
  }

  return (
    <div className="bg-white min-h-screen text-slate-800 font-sans selection:bg-pink-100 selection:text-pink-600 m-0 p-0 w-full relative border-none overflow-x-hidden">
      <ScrollProgress />
      <MagicCursor />
      <HeroSection />
      <TickerSection />
      
      {/* ★ お花屋さんの最新作品ギャラリーを追加 */}
      <FloristWorksSection />

      <CultureSection />
      <ProblemSection />
      <FeaturesSection />
      <SafetySection />
      <PartnerJoinSection />
      <ShowcaseSection />
      <VoiceSection />
      <FlowDetailSection />
      <FaqSection />
      <NewsSection />
      <ContactAndCtaSection />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-shine { animation: shine 1.5s ease-in-out infinite; }
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-bounce-slow { animation: bounce 3s infinite; }
        @keyframes bounce {
          0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
          50% { transform: translateY(0); animation-timing-function: cubic-bezier(0,0,0.2,1); }
        }
        /* 日本語フォントの読み込み速度とレンダリングの最適化 */
        body {
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
        }
      `}</style>
    </div>
  );
}