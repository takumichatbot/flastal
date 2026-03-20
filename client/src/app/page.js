'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import Image from 'next/image';
import { motion, useScroll, useSpring } from 'framer-motion';

import { 
  Heart, Sparkles, Star, Search, ArrowRight, CheckCircle2, 
  ShieldCheck, HelpCircle, Flower, CreditCard, Lock, Loader2, PlusCircle, ChevronDown
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
  return <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-400 to-sky-400 origin-left z-[100]" style={{ scaleX }} />;
};

const Reveal = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

const SectionHeader = ({ en, ja, desc, color = "pink" }) => {
  const colors = {
    pink: "text-pink-500 bg-pink-50 border-pink-100",
    blue: "text-sky-500 bg-sky-50 border-sky-100",
    purple: "text-purple-500 bg-purple-50 border-purple-100"
  };
  return (
    <div className="text-center mb-10 md:mb-16 px-4">
      <Reveal>
        <span className={cn("inline-flex items-center justify-center font-bold tracking-[0.2em] uppercase text-[10px] md:text-xs mb-3 font-mono px-4 py-1.5 rounded-full border", colors[color])}>
          <Sparkles size={12} className="mr-1" /> {en}
        </span>
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-slate-800 mb-3 md:mb-4 tracking-tighter leading-tight">
          {ja}
        </h2>
        {desc && <p className="text-slate-500 max-w-xl mx-auto text-xs md:text-sm font-medium leading-relaxed">{desc}</p>}
      </Reveal>
    </div>
  );
};

// --- 🚀 1. HERO SECTION ---
const HeroSection = () => (
  <section className="relative w-full min-h-[75vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-pink-50/50 to-white px-4 md:px-6">
    <div className="absolute inset-0 bg-[radial-gradient(#fbcfe8_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
    <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-pink-300/30 blur-[80px] rounded-full mix-blend-multiply pointer-events-none" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-sky-200/30 blur-[80px] rounded-full mix-blend-multiply pointer-events-none" />

    <div className="container relative z-10 max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 md:gap-12 items-center pt-20 pb-12 md:py-0">
      <div className="text-center lg:text-left">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white rounded-full shadow-sm border border-pink-100 mb-6">
            <span className="flex h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-[10px] md:text-xs font-bold text-pink-500 tracking-wider uppercase">Oshikatsu Crowdfunding</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-800 leading-[1.15] mb-4 md:mb-6 tracking-tighter">
            推しへの想いを、<br/>
            <span className="relative inline-block">
               <span className="absolute inset-0 bg-pink-200 -rotate-2 rounded-lg blur-sm opacity-40"></span>
               <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">フラスタ</span>
            </span>にしよう。
          </h1>
          <p className="text-xs md:text-base text-slate-500 mb-8 md:mb-10 leading-relaxed max-w-md mx-auto lg:mx-0 font-medium">
            FLASTALは、ファンのみんなでお祝い花を贈れる<br className="hidden md:block"/>
            推し活特化型のクラウドファンディングです。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start px-2 sm:px-0">
            <Link href="/projects/create" className="w-full sm:w-auto">
              <button className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-black shadow-xl shadow-pink-200 hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm md:text-base">
                <PlusCircle size={18} /> 企画を立てる
              </button>
            </Link>
            <Link href="/projects" className="w-full sm:w-auto">
              <button className="w-full px-6 py-4 bg-white text-pink-500 border-2 border-pink-100 rounded-full font-black hover:border-pink-300 hover:bg-pink-50 transition-all flex items-center justify-center gap-2 text-sm md:text-base">
                <Search size={18} /> 企画を探す
              </button>
            </Link>
          </div>
        </Reveal>
      </div>

      <div className="hidden lg:block relative aspect-[4/3] w-full max-w-lg mx-auto">
        <Reveal delay={0.2}>
          <div className="relative w-full h-full rounded-[3rem] overflow-hidden shadow-2xl rotate-2 border-8 border-white bg-slate-100">
            <Image src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1000" alt="Flasta" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-pink-900/60 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8 text-white pr-8">
              <span className="bg-pink-500 px-3 py-1 rounded-full text-[10px] font-bold mb-3 inline-block shadow-md">125% 達成!</span>
              <h3 className="text-2xl font-bold leading-tight">星街すいせいさんへ<br/>銀河一のフラスタを！</h3>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  </section>
);

const TickerSection = () => {
  const genres = ["#地下アイドル", "#VTuber", "#歌い手", "#生誕祭", "#周年ライブ", "#e-Sports", "#2.5次元"];
  return (
    <div className="bg-pink-500 py-3 overflow-hidden relative z-20 shadow-md">
      <motion.div className="flex gap-8 md:gap-12 whitespace-nowrap" animate={{ x: [0, -1000] }} transition={{ repeat: Infinity, duration: 35, ease: "linear" }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-8 md:gap-12">
            {genres.map((g, j) => (
              <span key={j} className="text-xs md:text-sm font-bold text-white flex items-center gap-1.5 tracking-widest">
                <Star size={12} className="fill-yellow-300 text-yellow-300" /> {g}
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// --- 💡 2. WHY FLASTAL (スマホで横スワイプに変更・サイズ調整) ---
const WhyFlastalSection = () => {
  const features = [
    { title: "集金の手間がゼロ", icon: CreditCard, color: "sky", desc: "面倒なDMや振込確認は不要。参加者はクレジットカードやコンビニ払いで簡単に支援できます。" },
    { title: "完全匿名でバレない", icon: Lock, color: "emerald", desc: "本名や住所を公開する必要なし。参加者も主催者もハンドルネームのまま安全に利用できます。" },
    { title: "全国のプロと連携", icon: Flower, color: "pink", desc: "フラスタ制作に特化した全国の提携フローリストへ、ワンクリックで正式発注。" },
  ];

  return (
    <section className="py-16 md:py-24 bg-slate-50 overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        <div className="px-4 md:px-6">
          <SectionHeader en="Why Flastal?" ja="企画の「大変」をゼロに" desc="個人情報の管理から集金催促まで、フラスタ企画の面倒な裏方はすべてFLASTALが引き受けます。" color="blue" />
        </div>
        
        {/* モバイルでは Snapスクロールで横に流せるように変更 */}
        <div className="flex overflow-x-auto pb-8 snap-x snap-mandatory no-scrollbar px-4 md:px-6 md:grid md:grid-cols-3 gap-4 md:gap-8">
          {features.map((f, i) => (
            <div key={i} className="min-w-[85vw] sm:min-w-[300px] md:min-w-0 snap-center flex shrink-0">
              <Reveal delay={i * 0.1} className="w-full">
                <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl md:hover:-translate-y-2 transition-all duration-300 h-full flex flex-col w-full">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-4 md:mb-6 bg-${f.color}-50 text-${f.color}-500 shrink-0 shadow-inner`}>
                    <f.icon size={24} className="md:w-7 md:h-7" />
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-slate-800 mb-2 md:mb-3">{f.title}</h3>
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium flex-grow">{f.desc}</p>
                </div>
              </Reveal>
            </div>
          ))}
        </div>
        
        <div className="text-center px-4 mt-2 md:mt-8">
          <Link href="/features" className="inline-flex items-center justify-center gap-2 text-xs md:text-sm font-bold text-slate-500 hover:text-pink-500 transition-colors w-full sm:w-auto px-6 py-4 bg-white md:bg-transparent rounded-full border border-slate-100 md:border-none shadow-sm md:shadow-none">
            詳しい機能とご利用の流れを見る <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};

// --- 📸 3. COMMUNITY PROOF (実績統合) ---
const CommunityProofSection = () => {
  const [posts, setPosts] = useState([]);
  
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com'}/api/florists/posts/public`)
      .then(res => res.json())
      .then(data => { if(Array.isArray(data)) setPosts(data.slice(0, 4)); })
      .catch(() => {});
  }, []);

  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          <div className="text-center lg:text-left">
            <span className="text-pink-500 font-bold tracking-[0.2em] uppercase text-[10px] md:text-xs mb-3 block">Success Stories</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-800 leading-tight mb-8 tracking-tighter">想いが形になった、<br/>最高の瞬間。</h2>
            
            <div className="space-y-4 md:space-y-6 text-left">
              {[
                { text: "初めての主催で不安でしたが、集金が自動なのでデザインの相談に集中できました！", name: "VTuberファン A.Sさん" },
                { text: "たった1000円からの支援でも、名前をパネルに載せてもらえて嬉しかったです。", name: "アイドルファン T.Kさん" }
              ].map((v, i) => (
                <Reveal key={i} delay={i * 0.1}>
                  <div className="bg-pink-50/50 p-5 md:p-6 rounded-3xl relative border border-pink-100">
                    <div className="text-4xl text-pink-200 absolute -top-2 left-4 font-serif">“</div>
                    <p className="text-xs md:text-sm text-slate-700 font-medium leading-relaxed relative z-10 pt-2">「{v.text}」</p>
                    <p className="text-[10px] md:text-xs text-pink-500 font-bold mt-2 text-right">- {v.name}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {posts.length > 0 ? posts.map((post, i) => (
              <Reveal key={post.id} delay={i * 0.1} className={i % 2 === 1 ? "mt-6 md:mt-8" : ""}>
                <div className="relative aspect-[4/5] rounded-2xl md:rounded-[2rem] overflow-hidden shadow-sm md:shadow-lg group bg-slate-100">
                  <Image src={post.imageUrl} alt="制作実績" fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="(max-width: 768px) 50vw, 25vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 md:p-4">
                    <span className="text-white text-[10px] md:text-xs font-bold truncate">{post.florist?.platformName}</span>
                  </div>
                </div>
              </Reveal>
            )) : (
              [1,2,3,4].map((i) => (
                <div key={i} className={`bg-slate-100 aspect-[4/5] rounded-2xl md:rounded-[2rem] animate-pulse ${i%2===1?'mt-6 md:mt-8':''}`} />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// --- 🤝 4. PARTNERS ---
const PartnerSection = () => (
  <section className="py-12 md:py-16 mx-4 md:mx-auto max-w-6xl mb-12 md:mb-20">
    <div className="bg-slate-900 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-16 text-center relative overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,114,182,0.15),transparent)]" />
      <div className="relative z-10">
        <h2 className="text-xl md:text-3xl font-black text-white mb-3 md:mb-4 tracking-tight">プロフェッショナルの皆様へ</h2>
        <p className="text-slate-400 text-xs md:text-sm mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed">
          お花屋さん、ライブ会場、イベント主催者の方。<br className="hidden md:block"/>
          FLASTALの安全なエコシステムに参加し、ファンの熱い想いをサポートしませんか？
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 md:gap-4">
          <Link href="/florists/register" className="px-5 py-3 md:px-6 md:py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs md:text-sm font-bold border border-white/20 transition-all">🌸 お花屋さん登録</Link>
          <Link href="/venues/register" className="px-5 py-3 md:px-6 md:py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs md:text-sm font-bold border border-white/20 transition-all">🏢 会場・ホール登録</Link>
          <Link href="/organizers/register" className="px-5 py-3 md:px-6 md:py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs md:text-sm font-bold border border-white/20 transition-all">🎟 主催者・絵師登録</Link>
        </div>
      </div>
    </div>
  </section>
);

// --- ❓ 5. FAQ ---
const FaqMini = () => (
  <section id="faq" className="py-16 md:py-20 bg-slate-50 scroll-mt-20">
    <div className="container mx-auto px-4 max-w-3xl">
      <SectionHeader en="Q&A" ja="よくある質問" color="purple" />
      <div className="space-y-3 md:space-y-4">
        {[
          { q: "目標金額に届かなかった場合はどうなりますか？", a: "企画作成時に「All-in（集まった金額だけで実施）」か「All-or-Nothing（未達なら全額返金して中止）」のどちらかを選ぶことができます。" },
          { q: "利用手数料はかかりますか？", a: "企画の立ち上げや支援は無料です。企画が達成し、売上を引き出す際（または花屋へ支払う際）に、システム・決済手数料として集まった金額の10%を頂戴します。" },
          { q: "本名や住所を隠して参加（支援）できますか？", a: "はい、可能です。FLASTALでは参加者も主催者もハンドルネームで活動でき、お花屋さんへの配送情報などはシステムが安全に仲介するため、個人情報が漏れることはありません。" }
        ].map((item, i) => (
          <Reveal key={i} delay={i * 0.05}>
            <details className="group bg-white rounded-[1.5rem] p-5 md:p-6 border border-slate-100 cursor-pointer shadow-sm">
              <summary className="flex items-center justify-between font-bold text-slate-800 list-none outline-none text-sm md:text-base">
                <span className="flex items-center gap-2 md:gap-3"><HelpCircle className="text-purple-500 shrink-0" size={18}/> <JpText>{item.q}</JpText></span>
                <ChevronDown size={16} className="text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
              </summary>
              <div className="mt-3 md:mt-4 text-xs md:text-sm text-slate-500 pl-7 md:pl-8 leading-relaxed"><JpText>{item.a}</JpText></div>
            </details>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

// --- 💌 6. CTA ---
const ContactAndCtaSection = () => (
  <section className="py-16 md:py-24 bg-white text-center px-6">
    <Reveal>
      <h2 className="text-3xl md:text-4xl lg:text-6xl font-black mb-4 md:mb-8 tracking-tighter text-slate-900">さあ、推しへの愛を形に。</h2>
      <p className="text-xs md:text-sm text-slate-500 mb-8 md:mb-12 font-medium">企画の作成は無料。あなたの「贈りたい」が、誰かの勇気になります。</p>
      <Link href="/projects/create">
        <button className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 md:px-12 py-4 md:py-5 rounded-full text-base md:text-xl font-black shadow-xl shadow-pink-200 hover:scale-105 transition-all">
          今すぐ企画を立てる
        </button>
      </Link>
    </Reveal>
  </section>
);

// --- 🏠 DASHBOARD WRAPPER ---
const AuthenticatedHome = ({ user, logout }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-6 m-0">
    <div className="max-w-md w-full bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl p-8 md:p-10 text-center border border-slate-100">
      <div className="w-16 h-16 md:w-20 md:h-20 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6"><ShieldCheck size={32} /></div>
      <h1 className="text-xl md:text-2xl font-black text-slate-800 mb-2 tracking-tight uppercase">Welcome Back</h1>
      <p className="text-slate-400 mb-6 md:mb-8 font-bold text-[10px] md:text-xs uppercase tracking-widest">
        {user?.handleName || user?.shopName || 'MEMBER'} Signed In
      </p>
      <div className="space-y-3 md:space-y-4">
        <Link href={user?.role === 'ADMIN' ? '/admin' : user?.role === 'FLORIST' ? '/florists/dashboard' : '/mypage'} className="flex items-center justify-center gap-2 w-full py-3.5 md:py-4 bg-slate-900 text-white font-black rounded-xl md:rounded-2xl hover:bg-slate-800 transition-all shadow-lg text-sm">
          DASHBOARD へ進む <ArrowRight size={16} />
        </Link>
        <button onClick={logout} className="text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-[0.2em] mt-4 p-2">Sign Out</button>
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
    return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-8 h-8 text-pink-500 animate-spin" /></div>;
  }

  if (isAuthenticated) {
    return <AuthenticatedHome user={user} logout={logout} />;
  }

  return (
    <div className="bg-white min-h-screen text-slate-800 font-sans selection:bg-pink-100 selection:text-pink-600 overflow-x-hidden">
      <ScrollProgress />
      <HeroSection />
      <TickerSection />
      <WhyFlastalSection />
      <CommunityProofSection />
      <PartnerSection />
      <FaqMini />
      <ContactAndCtaSection />
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}