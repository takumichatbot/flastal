'use client';

// Next.js 15 のビルドエラーを確実に回避する設定
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import Image from 'next/image';
import { 
  motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence 
} from 'framer-motion';

import { 
  Heart, Sparkles, Zap, MessageCircle, Gift, 
  Calendar, Users, ShieldCheck, ChevronDown, 
  Star, Palette, HelpCircle, Mail,
  ArrowRight, CheckCircle2, Search, Flower,
  CreditCard, Lock, Store, MapPin, Ticket, Loader2, PlusCircle
} from 'lucide-react';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const JpText = ({ children, className }) => (
  <span className={cn("inline-block", className)}>{children}</span>
);

// --- 🪄 MAGIC UI COMPONENTS 🪄 ---

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-400 via-purple-400 to-sky-400 origin-left z-[100]" style={{ scaleX }} />;
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

const SectionHeader = ({ en, ja, desc, color = "pink" }) => {
  const colors = {
    pink: "text-pink-500 bg-white border-pink-100",
    blue: "text-sky-500 bg-white border-sky-100",
    purple: "text-purple-500 bg-white border-purple-100",
  };
  return (
    <div className="text-center mb-16 relative z-10 px-4">
      <Reveal>
        <span className={cn("inline-block font-bold tracking-[0.2em] uppercase text-xs mb-4 font-mono px-4 py-1.5 rounded-full border shadow-sm", colors[color])}>
          ✨ {en}
        </span>
        <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-4 leading-tight tracking-tighter">
          {ja}
        </h2>
        {desc && <p className="text-slate-500 max-w-xl mx-auto leading-relaxed text-sm md:text-base font-medium">{desc}</p>}
      </Reveal>
    </div>
  );
};

// --- 🚀 1. HERO SECTION ---
const HeroSection = () => (
  <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden bg-white px-6">
    <div className="absolute inset-0 bg-[radial-gradient(#fdf2f8_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-pink-200/40 blur-[80px] rounded-full mix-blend-multiply pointer-events-none" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-sky-200/40 blur-[80px] rounded-full mix-blend-multiply pointer-events-none" />

    <div className="container relative z-10 max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
      <div className="text-center lg:text-left pt-12 lg:pt-0">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm border border-pink-50 mb-6 mx-auto lg:mx-0">
            <span className="flex h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-[10px] md:text-xs font-bold text-slate-500 tracking-wide uppercase">Next Gen Oshikatsu</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-800 leading-[1.1] mb-6 tracking-tighter">
            <JpText>想いを、</JpText><br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">結晶化</span>
            <JpText>しよう。</JpText>
          </h1>
          <p className="text-base md:text-lg text-slate-500 mb-10 leading-relaxed max-w-lg mx-auto lg:mx-0 font-medium">
            FLASTALは、ファンのみんなでフラスタを贈れる<br className="hidden md:block"/>
            推し活特化型のクラウドファンディング・プラットフォームです。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link href="/projects/create" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-bold shadow-xl shadow-pink-200 hover:scale-105 transition-all flex items-center justify-center gap-2">
                <Sparkles size={20} /> 無料で企画を立てる
              </button>
            </Link>
            <Link href="/projects" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border-2 border-slate-100 rounded-full font-bold hover:border-sky-300 hover:text-sky-500 transition-all flex items-center justify-center gap-2">
                <Search size={20} /> 企画を探す
              </button>
            </Link>
          </div>
        </Reveal>
      </div>

      <div className="hidden lg:block relative h-[600px] w-full">
        <Reveal delay={0.2}>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[85%] aspect-[3/4] bg-slate-100 rounded-[3rem] overflow-hidden shadow-2xl rotate-3 border-8 border-white z-10">
            <Image src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1000" alt="Flasta" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-8 left-8 text-white pr-8">
              <span className="bg-pink-500 px-3 py-1 rounded-full text-[10px] font-bold mb-3 inline-block">125% 達成!</span>
              <h3 className="text-2xl font-bold leading-tight">星街すいせいさんへ<br/>銀河一のフラスタを！</h3>
            </div>
          </div>
          {/* 装飾用の浮遊カード */}
          <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute left-0 bottom-24 bg-white/90 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-white z-20 flex items-center gap-4">
            <div className="bg-emerald-100 text-emerald-500 p-3 rounded-full"><ShieldCheck size={24}/></div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Safe & Secure</p>
              <p className="font-black text-slate-800">完全匿名配送</p>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </div>
  </section>
);

const TickerSection = () => {
  const genres = ["#地下アイドル", "#VTuber", "#歌い手", "#コンカフェ", "#生誕祭", "#周年ライブ", "#e-Sports", "#2.5次元"];
  return (
    <div className="bg-slate-900 py-3 overflow-hidden relative z-20 shadow-xl border-y border-slate-800">
      <motion.div className="flex gap-12 whitespace-nowrap" animate={{ x: [0, -1000] }} transition={{ repeat: Infinity, duration: 40, ease: "linear" }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-12">
            {genres.map((g, j) => (
              <span key={j} className="text-sm font-bold text-slate-400 flex items-center gap-2">
                <Star size={12} className="text-pink-500 fill-pink-500" /> {g}
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// --- 💡 2. WHY FLASTAL (機能・悩み解決・安全性を統合) ---
const WhyFlastalSection = () => {
  const features = [
    { title: "集金の手間・未払いゼロ", icon: CreditCard, color: "sky", desc: "DMでのやり取りや口座の公開は不要。URLをシェアするだけで、クレカやコンビニ払いでの集金が全自動で完了します。" },
    { title: "完全匿名でバレない", icon: Lock, color: "emerald", desc: "参加者はハンドルネームでOK。主催者の本名や住所がお花屋さんや参加者に伝わることは一切ありません。" },
    { title: "全国のプロ花屋と連携", icon: Flower, color: "pink", desc: "フラスタ制作に特化した全国の提携フローリストを検索可能。特殊なデザインやイラストパネルの装飾も思いのまま。" },
  ];

  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-6 max-w-6xl">
        <SectionHeader en="Why Flastal?" ja="企画の「大変」をゼロに" desc="個人情報の管理から集金催促まで、フラスタ企画の面倒な裏方はすべてFLASTALが引き受けます。" color="blue" />
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full flex flex-col">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-${f.color}-50 text-${f.color}-500`}>
                  <f.icon size={28} />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-3">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium flex-grow">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Link href="/features" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-sky-500 transition-colors">
            詳しい機能とご利用の流れを見る <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};

// --- 📸 3. COMMUNITY PROOF (ギャラリーと感想を統合) ---
const CommunityProofSection = () => {
  const [posts, setPosts] = useState([]);
  
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com'}/api/florists/posts/public`)
      .then(res => res.json())
      .then(data => { if(Array.isArray(data)) setPosts(data.slice(0, 4)); })
      .catch(() => {});
  }, []);

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* 左側：メッセージと感想 */}
          <div>
            <span className="text-pink-500 font-bold tracking-[0.2em] uppercase text-xs mb-4 block">Success Stories</span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-800 leading-tight mb-8">想いが形になった、<br/>最高の瞬間。</h2>
            
            <div className="space-y-6">
              {[
                { text: "初めての主催で不安でしたが、集金が自動なのでデザインの相談に集中できました！", name: "VTuberファン A.Sさん" },
                { text: "たった1000円からの支援でも、名前をパネルに載せてもらえて嬉しかったです。", name: "アイドルファン T.Kさん" }
              ].map((v, i) => (
                <Reveal key={i} delay={i * 0.1}>
                  <div className="bg-pink-50 p-6 rounded-3xl relative">
                    <div className="text-4xl text-pink-200 absolute -top-2 left-4 font-serif">“</div>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed relative z-10">「{v.text}」</p>
                    <p className="text-xs text-pink-500 font-bold mt-3 text-right">- {v.name}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* 右側：お花屋さんの作品グリッド */}
          <div className="grid grid-cols-2 gap-4">
            {posts.length > 0 ? posts.map((post, i) => (
              <Reveal key={post.id} delay={i * 0.1} className={i % 2 === 1 ? "mt-8" : ""}>
                <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-lg group">
                  <Image src={post.imageUrl} alt="制作実績" fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="(max-width: 768px) 50vw, 25vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <span className="text-white text-xs font-bold truncate">{post.florist?.platformName}</span>
                  </div>
                </div>
              </Reveal>
            )) : (
              // APIからデータが取れない場合のダミー
              [1,2,3,4].map((i) => (
                <div key={i} className={`bg-slate-100 aspect-[4/5] rounded-[2rem] animate-pulse ${i%2===1?'mt-8':''}`} />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// --- 🤝 4. PARTNERS (プロ向けをコンパクトなバナーに) ---
const PartnerSection = () => (
  <section className="py-16 mx-4 md:mx-auto max-w-6xl mb-24">
    <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,114,182,0.15),transparent)]" />
      <div className="relative z-10">
        <h2 className="text-2xl md:text-4xl font-black text-white mb-4">プロフェッショナルの皆様へ</h2>
        <p className="text-slate-400 text-sm md:text-base mb-10 max-w-2xl mx-auto">
          お花屋さん、ライブ会場、イベント主催者、イラストレーター。<br/>
          FLASTALの安全なエコシステムに参加し、熱量高いファンの想いをサポートしませんか？
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/florists/register" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-bold border border-white/20 transition-all">🌸 お花屋さん登録</Link>
          <Link href="/venues/register" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-bold border border-white/20 transition-all">🏢 会場・ホール登録</Link>
          <Link href="/organizers/register" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-bold border border-white/20 transition-all">🎟 主催者・絵師登録</Link>
        </div>
      </div>
    </div>
  </section>
);

// --- ❓ 5. FAQ (シンプルに) ---
const FaqMini = () => (
  <section id="faq" className="py-20 bg-slate-50 scroll-mt-20">
    <div className="container mx-auto px-6 max-w-3xl">
      <SectionHeader en="Q&A" ja="よくある質問" color="purple" />
      <div className="space-y-4">
        {[
          { q: "目標金額に届かなかった場合はどうなりますか？", a: "企画作成時に「All-in（集まった金額だけで実施）」か「All-or-Nothing（未達なら全額返金して中止）」のどちらかを選ぶことができます。" },
          { q: "利用手数料はかかりますか？", a: "企画の立ち上げや支援は無料です。企画が達成し、売上を引き出す際（または花屋へ支払う際）に、システム・決済手数料として集まった金額の10%を頂戴します。" },
          { q: "本名や住所を隠して参加（支援）できますか？", a: "はい、可能です。FLASTALでは参加者も主催者もハンドルネームで活動でき、お花屋さんへの配送情報などはシステムが安全に仲介するため、個人情報が漏れることはありません。" }
        ].map((item, i) => (
          <Reveal key={i} delay={i * 0.05}>
            <details className="group bg-white rounded-2xl p-6 border border-slate-100 cursor-pointer shadow-sm">
              <summary className="flex items-center justify-between font-bold text-slate-800 list-none outline-none">
                <span className="flex items-center gap-3"><HelpCircle className="text-purple-500 shrink-0" size={20}/> <JpText>{item.q}</JpText></span>
                <ChevronDown size={18} className="text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-4 text-sm text-slate-500 pl-8 leading-relaxed"><JpText>{item.a}</JpText></div>
            </details>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

// --- 💌 6. CONTACT & CTA ---
const ContactAndCtaSection = () => (
  <section className="py-24 bg-white text-center px-6">
    <Reveal>
      <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter text-slate-900">さあ、推しへの愛を形に。</h2>
      <p className="text-slate-500 mb-12 font-medium">企画の作成は無料。あなたの「贈りたい」が、誰かの勇気になります。</p>
      <Link href="/projects/create">
        <button className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-12 py-5 rounded-full text-xl font-black shadow-xl shadow-pink-200 hover:scale-105 transition-all">
          今すぐ企画を立てる
        </button>
      </Link>
    </Reveal>
  </section>
);


// --- 🏠 DASHBOARD WRAPPER (ログイン済みユーザー向け) ---
const AuthenticatedHome = ({ user, logout }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 m-0">
    <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 text-center border border-slate-100">
      <div className="w-20 h-20 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-6"><ShieldCheck size={40} /></div>
      <h1 className="text-2xl font-black text-slate-800 mb-2 tracking-tight uppercase">Welcome Back</h1>
      <p className="text-slate-400 mb-8 font-bold text-xs uppercase tracking-widest">
        {user?.handleName || user?.shopName || 'MEMBER'} Signed In
      </p>
      <div className="space-y-4">
        <Link href={user?.role === 'ADMIN' ? '/admin' : user?.role === 'FLORIST' ? '/florists/dashboard' : '/mypage'} className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-lg text-sm">
          DASHBOARD へ進む <ArrowRight size={18} />
        </Link>
        <button onClick={logout} className="text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-[0.2em] mt-4">Sign Out</button>
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
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-4" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <AuthenticatedHome user={user} logout={logout} />;
  }

  return (
    <div className="bg-white min-h-screen text-slate-800 font-sans selection:bg-pink-100 overflow-x-hidden">
      <ScrollProgress />
      <HeroSection />
      <TickerSection />
      <WhyFlastalSection />
      <CommunityProofSection />
      <PartnerSection />
      <FaqMini />
      <ContactAndCtaSection />
    </div>
  );
}