'use client';

// Next.js 15 のビルドエラーを確実に回避する設定
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from './contexts/AuthContext';
import Image from 'next/image';
import { 
  motion, useScroll, useSpring, AnimatePresence 
} from 'framer-motion';

import { 
  Sparkles, Heart, Search, ArrowRight, ShieldCheck, 
  CreditCard, Lock, Flower, HelpCircle, ChevronDown, 
  PlusCircle, Loader2, Gift, Send, CheckCircle2
} from 'lucide-react';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// 日本語の変な改行を防ぐ
const JpText = ({ children, className }) => (
  <span className={cn("inline-block", className)}>{children}</span>
);

// --- 🪄 MAGIC UI & EFFECTS ---

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 origin-left z-[100] shadow-sm" style={{ scaleX }} />;
};

// フワフワ浮かぶ背景のキラキラパーティクル
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    {[...Array(15)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-pink-300/20 mix-blend-multiply"
        style={{
          width: Math.random() * 60 + 20,
          height: Math.random() * 60 + 20,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -100, 0],
          x: [0, Math.random() * 50 - 25, 0],
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: Math.random() * 10 + 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

const Reveal = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.7, delay, type: "spring", bounce: 0.3 }}
    className={className}
  >
    {children}
  </motion.div>
);

// 見出しコンポーネント（スマホで text-2xl/3xl と控えめに）
const SectionHeader = ({ en, ja, desc }) => (
  <div className="text-center mb-8 md:mb-16 relative z-10 px-4">
    <Reveal>
      <span className="inline-flex items-center justify-center font-bold tracking-[0.2em] uppercase text-[10px] md:text-xs mb-3 font-mono px-4 py-1.5 rounded-full bg-pink-50 text-pink-500 border border-pink-100">
        <Sparkles size={12} className="mr-1" /> {en}
      </span>
      <h2 className="text-2xl md:text-4xl font-black text-slate-800 mb-3 tracking-tighter leading-tight">
        {ja}
      </h2>
      {desc && <p className="text-slate-500 max-w-lg mx-auto text-xs md:text-sm font-medium leading-relaxed">{desc}</p>}
    </Reveal>
  </div>
);

// キラッと光る可愛いボタン
const KawaiiButton = ({ href, icon: Icon, children, variant = "primary" }) => {
  const isPrimary = variant === "primary";
  return (
    <Link href={href} className="w-full sm:w-auto block">
      <motion.button 
        whileHover={{ scale: 1.03 }} 
        whileTap={{ scale: 0.97 }}
        className={cn(
          "relative w-full sm:w-auto px-8 py-4 rounded-full font-black text-sm md:text-base transition-all overflow-hidden group flex items-center justify-center gap-2",
          isPrimary 
            ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xl shadow-pink-200 border-none" 
            : "bg-white text-pink-500 border-2 border-pink-100 hover:bg-pink-50 shadow-sm"
        )}
      >
        <Icon size={20} className={cn("transition-transform group-hover:rotate-12", isPrimary ? "text-pink-100" : "text-pink-400")} />
        <span className="relative z-10">{children}</span>
        {isPrimary && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />}
      </motion.button>
    </Link>
  );
};

// --- 🌸 1. HERO SECTION (可愛くポップに) ---
const HeroSection = () => (
  <section className="relative w-full min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-pink-50 to-white overflow-hidden px-4 md:px-6">
    <div className="absolute inset-0 bg-[radial-gradient(#fbcfe8_1.5px,transparent_1px)] [background-size:24px_24px] opacity-50" />
    <FloatingParticles />

    <div className="container relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center pt-24 pb-16">
      <Reveal>
        <motion.div 
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-pink-100 mb-6"
        >
          <span className="flex h-2.5 w-2.5 rounded-full bg-pink-500 animate-pulse" />
          <span className="text-[10px] font-bold text-pink-500 tracking-widest uppercase">ファン発のフラスタ応援</span>
        </motion.div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-800 leading-[1.2] md:leading-[1.1] mb-6 tracking-tighter">
          <JpText>推しへの想いを、</JpText><br className="md:hidden"/>
          <span className="relative inline-block px-2">
            <span className="absolute inset-0 bg-pink-200 -rotate-2 rounded-xl blur-sm opacity-50"></span>
            <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">お花</span>
          </span>
          <JpText>にしよう。</JpText>
        </h1>
        
        <p className="text-xs md:text-base text-slate-500 mb-10 leading-relaxed max-w-lg mx-auto font-medium">
          FLASTALは、ファンのみんなでお祝い花（フラスタ）を贈れる<br className="hidden md:block"/>
          推し活特化型のクラウドファンディングサービスです。
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md mx-auto">
          <KawaiiButton href="/projects/create" icon={Sparkles} variant="primary">企画を立てる</KawaiiButton>
          <KawaiiButton href="/projects" icon={Search} variant="secondary">企画を探す</KawaiiButton>
        </div>
      </Reveal>
      
      {/* ヒーロー下の可愛い画像プレビュー群 */}
      <Reveal delay={0.2} className="w-full mt-16 md:mt-24">
        <div className="flex justify-center items-center gap-4 md:gap-8 max-w-4xl mx-auto">
          <div className="relative w-24 h-32 md:w-48 md:h-64 rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-xl -rotate-6 border-4 border-white">
            <Image src="https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=600" alt="Flasta 1" fill className="object-cover" />
          </div>
          <div className="relative w-32 h-40 md:w-64 md:h-80 rounded-2xl md:rounded-[3rem] overflow-hidden shadow-2xl z-10 border-8 border-white">
            <Image src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=800" alt="Flasta 2" fill className="object-cover" />
            <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[8px] md:text-xs font-bold text-pink-500 shadow-sm flex items-center gap-1">
              <Heart size={12} className="fill-pink-500" /> 125% 達成
            </div>
          </div>
          <div className="relative w-24 h-32 md:w-48 md:h-64 rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-xl rotate-6 border-4 border-white">
            <Image src="https://images.unsplash.com/photo-1519378018457-4c29a3a2ecdf?q=80&w=600" alt="Flasta 3" fill className="object-cover" />
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);

// --- 💡 2. WHY FLASTAL (ミンサカ風・スマホで横スワイプ) ---
const WhyFlastalSection = () => {
  const features = [
    { title: "集金・未払いゼロ", icon: CreditCard, color: "sky", desc: "面倒なDMや振込確認は不要。クレカやコンビニ払いで全自動集金。" },
    { title: "完全匿名で安心", icon: Lock, color: "emerald", desc: "本名や住所を公開する必要なし。ハンドルネームのまま安全に利用。" },
    { title: "プロ花屋にお任せ", icon: Flower, color: "pink", desc: "フラスタ制作に特化した全国の提携フローリストへ簡単に発注。" },
  ];

  return (
    <section className="py-16 md:py-24 bg-white relative">
      <div className="container mx-auto max-w-5xl">
        <SectionHeader en="Why Flastal?" ja="FLASTALが選ばれる理由" desc="面倒な裏方はすべてシステムにお任せ。あなたはデザインと想いに集中できます。" color="pink" />
        
        {/* スマホでは横スクロール(Snap)、PCでは3列グリッド */}
        <div className="flex overflow-x-auto pb-6 snap-x snap-mandatory no-scrollbar px-6 md:px-0 md:grid md:grid-cols-3 gap-4 md:gap-8">
          {features.map((f, i) => (
            <div key={i} className="min-w-[80vw] sm:min-w-[300px] md:min-w-0 snap-center flex shrink-0">
              <Reveal delay={i * 0.1} className="w-full">
                <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100 hover:border-pink-200 hover:bg-pink-50/30 transition-all duration-300 h-full flex flex-col items-center text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 md:mb-6 bg-white shadow-sm text-${f.color}-500`}>
                    <f.icon size={28} />
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-slate-800 mb-2 md:mb-3">{f.title}</h3>
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium">{f.desc}</p>
                </div>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- 📝 3. SIMPLE FLOW (かんたん3ステップ) ---
const SimpleFlowSection = () => {
  const steps = [
    { title: "企画を立ち上げ", icon: PlusCircle, desc: "スマホから3分で専用ページを作成。" },
    { title: "SNSでシェア", icon: Send, desc: "URLを共有して参加者を募ります。" },
    { title: "目標達成・お届け", icon: Gift, desc: "集まった資金でお花屋さんが制作・納品！" },
  ];

  return (
    <section className="py-16 md:py-24 bg-pink-50 relative overflow-hidden">
      <div className="container mx-auto max-w-5xl px-6">
        <SectionHeader en="How to Use" ja="かんたん3ステップ" color="pink" />
        
        <div className="relative">
          {/* PC用の横線コネクター */}
          <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-1 bg-pink-200 -translate-y-1/2 z-0" />
          
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative z-10">
            {steps.map((s, i) => (
              <Reveal key={i} delay={i * 0.15}>
                <div className="flex flex-col items-center text-center relative group">
                  <div className="w-8 h-8 rounded-full bg-pink-500 text-white font-black flex items-center justify-center mb-4 shadow-lg absolute -top-4 md:-top-12 z-20">
                    {i + 1}
                  </div>
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-pink-500 mb-4 shadow-xl shadow-pink-100 group-hover:scale-110 transition-transform">
                    <s.icon size={40} />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 mb-2">{s.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// --- 📸 4. GALLERY (お花屋さんの実績) ---
const GallerySection = () => {
  const [posts, setPosts] = useState([]);
  
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com'}/api/florists/posts/public`)
      .then(res => res.json())
      .then(data => { if(Array.isArray(data)) setPosts(data.slice(0, 5)); })
      .catch(() => {});
  }, []);

  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-0 md:px-6 max-w-6xl">
        <SectionHeader en="Gallery" ja="最新のフラスタ実績" desc="提携お花屋さんが制作した、こだわりの作品たち。" color="blue" />
        
        <div className="flex overflow-x-auto pb-8 snap-x snap-mandatory no-scrollbar px-6 md:px-0 gap-4">
          {posts.length > 0 ? posts.map((post, i) => (
            <div key={post.id} className="min-w-[70vw] sm:min-w-[280px] snap-center shrink-0">
              <Reveal delay={i * 0.1}>
                <Link href={`/florists/${post.floristId}`}>
                  <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-md group border border-slate-50">
                    <Image src={post.imageUrl} alt="制作実績" fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="(max-width: 768px) 70vw, 280px" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-white text-xs font-bold line-clamp-2 mb-2 leading-relaxed shadow-sm">{post.content}</p>
                      <span className="inline-block px-2 py-1 bg-white/20 backdrop-blur-md rounded text-[10px] text-white font-bold truncate max-w-full">
                        {post.florist?.platformName}
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            </div>
          )) : (
             // ダミー
             [1,2,3,4].map((i) => <div key={i} className="min-w-[70vw] sm:min-w-[280px] bg-slate-100 aspect-[4/5] rounded-[2rem] animate-pulse shrink-0" />)
          )}
        </div>
      </div>
    </section>
  );
};

// --- ❓ 5. FAQ (シンプルに) ---
const FaqMini = () => (
  <section id="faq" className="py-16 md:py-24 bg-slate-50 scroll-mt-20">
    <div className="container mx-auto px-4 max-w-3xl">
      <SectionHeader en="Q&A" ja="よくある質問" color="purple" />
      <div className="space-y-3 md:space-y-4">
        {[
          { q: "目標金額に届かなかった場合はどうなりますか？", a: "企画作成時に「All-in（集まった金額だけで実施）」か「All-or-Nothing（未達なら全額返金して中止）」のどちらかを選ぶことができます。" },
          { q: "利用手数料はかかりますか？", a: "企画の立ち上げや支援は無料です。企画が達成し、売上を引き出す際（または花屋へ支払う際）に、システム・決済手数料として集まった金額の10%を頂戴します。" },
          { q: "本名や住所を隠して参加（支援）できますか？", a: "はい、可能です。FLASTALでは参加者も主催者もハンドルネームで活動でき、お花屋さんへの配送情報などはシステムが安全に仲介するため、個人情報が漏れることはありません。" }
        ].map((item, i) => (
          <Reveal key={i} delay={i * 0.05}>
            <details className="group bg-white rounded-2xl p-5 md:p-6 border border-slate-100 cursor-pointer shadow-sm">
              <summary className="flex items-center justify-between font-bold text-slate-800 list-none outline-none text-sm md:text-base">
                <span className="flex items-center gap-2 md:gap-3"><HelpCircle className="text-purple-400 shrink-0" size={18}/> <JpText>{item.q}</JpText></span>
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

// --- 💌 6. CTA (プロ向けも統合) ---
const ContactAndCtaSection = () => (
  <section className="py-20 md:py-28 bg-white text-center px-4">
    <Reveal>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 tracking-tighter text-slate-800">さあ、推しへの愛を形に。</h2>
        <p className="text-xs md:text-sm text-slate-500 mb-8 md:mb-10 font-medium">企画の作成は無料。あなたの「贈りたい」が、誰かの勇気になります。</p>
        
        <Link href="/projects/create">
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-rose-500 text-white px-10 md:px-14 py-4 md:py-5 rounded-full text-base md:text-xl font-black shadow-xl shadow-pink-200 transition-all flex items-center justify-center gap-2 mx-auto"
          >
            <Sparkles size={20} /> 今すぐ企画を立てる
          </motion.button>
        </Link>
        
        {/* お花屋さん等のプロ向けリンクを小さく配置 */}
        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-wrap justify-center gap-4 text-[10px] md:text-xs font-bold text-slate-400">
          <span>プロフェッショナルの方へ:</span>
          <Link href="/florists/register" className="hover:text-pink-500 underline">お花屋さん登録</Link>
          <Link href="/venues/register" className="hover:text-sky-500 underline">会場・ホール登録</Link>
          <Link href="/organizers/register" className="hover:text-purple-500 underline">イベント主催者・絵師登録</Link>
        </div>
      </div>
    </Reveal>
  </section>
);

// --- 🏠 DASHBOARD WRAPPER (ログイン済みユーザー向け) ---
const AuthenticatedHome = ({ user, logout }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-6 m-0">
    <div className="max-w-sm md:max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 text-center border border-slate-100">
      <div className="w-16 h-16 md:w-20 md:h-20 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6"><ShieldCheck size={32} /></div>
      <h1 className="text-xl md:text-2xl font-black text-slate-800 mb-2 tracking-tight uppercase">Welcome Back</h1>
      <p className="text-slate-400 mb-6 md:mb-8 font-bold text-[10px] md:text-xs uppercase tracking-widest">
        {user?.handleName || user?.shopName || 'MEMBER'} Signed In
      </p>
      <div className="space-y-3">
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
      <WhyFlastalSection />
      <SimpleFlowSection />
      <GallerySection />
      <FaqMini />
      <ContactAndCtaSection />
      
      {/* スマホの横スクロールバーを隠す & キラキラアニメーション定義 */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}