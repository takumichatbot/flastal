// src/app/annex/page.js
'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  Building2, Crown, ShieldCheck, Gem, Briefcase, 
  ArrowRight, FileText, CheckCircle2, Star, 
  TrendingUp, Clock, Mail, ChevronRight, Phone
} from 'lucide-react';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);
  return isMounted;
}

// ==========================================
// 🪄 ANIMATION COMPONENTS (BtoB Premium)
// ==========================================

const Reveal = ({ children, delay = 0, className = "" }) => {
  const isMounted = useIsMounted();
  if (!isMounted) return <div className={className}>{children}</div>;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true, margin: "-10%" }} 
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }} 
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ==========================================
// 🚀 PAGE SECTIONS
// ==========================================

// --- 1. HERO SECTION ---
const Hero = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 250]);
  const opacity = useTransform(scrollY, [0, 600], [1, 0]);

  return (
    <section className="relative w-full min-h-[90svh] flex items-center justify-center overflow-hidden bg-slate-950 pt-20 pb-12 z-10">
      
      {/* プレミアムな背景装飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -right-[10%] w-[80vw] h-[80vw] rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute top-[40%] -left-[20%] w-[60vw] h-[60vw] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
      </div>

      <motion.div style={{ y, opacity }} className="container relative z-10 max-w-5xl mx-auto px-4 md:px-6 flex flex-col items-center text-center">
        <Reveal delay={0.1}>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
            <Building2 size={16} className="text-amber-400" />
            <span className="text-[11px] md:text-xs font-black text-amber-50/80 tracking-[0.2em] uppercase">For Enterprise & Organizer</span>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter leading-[1.1] mb-6">
            ビジネスと推し活の架け橋となる、<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200">
              プレミアムな祝花体験。
            </span>
          </h1>
        </Reveal>
        
        <Reveal delay={0.3}>
          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed font-bold mb-10 md:mb-14">
            FLASTAL ANNEX（フラスタル アネックス）は、<br className="hidden sm:block"/>
            エンタメ事務所様向けの「公式フラスタシステム」から、<br className="hidden sm:block"/>
            一般企業様向けの「スマートな胡蝶蘭・祝花手配」までを提供する法人専用パッケージです。
          </p>
        </Reveal>

        <Reveal delay={0.4} className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto px-4 sm:px-0">
          <Link href="#contact" className="w-full sm:w-auto block">
            <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 rounded-full font-black text-sm md:text-base shadow-[0_0_30px_rgba(251,191,36,0.3)] hover:shadow-[0_0_40px_rgba(251,191,36,0.5)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
              <Mail size={18} /> お問い合わせ・資料請求
            </button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto block">
            <button className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white rounded-full font-black text-sm md:text-base border border-white/10 hover:bg-white/10 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
              <Briefcase size={18} /> 法人アカウント作成
            </button>
          </Link>
        </Reveal>
      </motion.div>
    </section>
  );
};

// --- 2. FOR ENTERTAINMENT (案A: エンタメ向け) ---
const ForEntertainment = () => {
  return (
    <section className="py-24 md:py-36 bg-slate-900 relative z-10 border-t border-white/5">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          <div className="order-2 lg:order-1 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 rounded-[3rem] blur-2xl" />
            <div className="relative bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl rounded-[3rem] p-8 md:p-12 overflow-hidden">
              <div className="flex items-center gap-4 mb-8 border-b border-slate-700/50 pb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <Crown size={24} />
                </div>
                <div>
                  <h3 className="text-white font-black text-xl">公式フラスタ・サポート</h3>
                  <p className="text-slate-400 text-xs font-bold">For Entertainment Agencies</p>
                </div>
              </div>
              
              <ul className="space-y-6">
                {[
                  { title: "勝手な企画・トラブルを未然に防止", desc: "ファン有志による非公式企画の乱立や、金銭トラブルを公式がシステムで安全に統括・管理できます。" },
                  { title: "ファンからの協賛金を公式売上に", desc: "公式企画としてフラスタの協賛を募ることで、お花の制作費を超えた金額をイベントの売上として還元します。" },
                  { title: "レギュレーションの完全コントロール", desc: "搬入サイズや設置場所の指定、参加クリエイターの審査まで、公式が安全にコントロール可能です。" }
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <CheckCircle2 className="text-purple-400 shrink-0 mt-1" size={20} />
                    <div>
                      <h4 className="text-slate-200 font-black text-sm mb-1">{item.title}</h4>
                      <p className="text-slate-400 text-xs font-bold leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <Reveal>
              <span className="text-purple-400 font-black text-[10px] md:text-xs tracking-[0.2em] uppercase block mb-4">Solution 01</span>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight mb-6">
                ファンの熱量を、<br />安全に公式のチカラへ。
              </h2>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed font-bold mb-8">
                VTuber事務所様、アイドル運営企業様、イベント主催者様へ。<br />
                ファンの「お祝いしたい」というピュアな熱量を、非公式のトラブルリスクから守り、安全かつ透明性のある「公式フラスタ企画」として昇華させます。
              </p>
              <button className="px-6 py-3 bg-white/5 text-white rounded-full font-bold text-sm border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-2">
                エンタメ向け資料をダウンロード <ArrowRight size={16} />
              </button>
            </Reveal>
          </div>

        </div>
      </div>
    </section>
  );
};

// --- 3. FOR CORPORATE (案B: 一般企業向け) ---
const ForCorporate = () => {
  return (
    <section className="py-24 md:py-36 bg-slate-950 relative z-10 border-t border-white/5">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          <div>
            <Reveal>
              <span className="text-amber-400 font-black text-[10px] md:text-xs tracking-[0.2em] uppercase block mb-4">Solution 02</span>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight mb-6">
                ビジネスの祝花を、<br />もっとスマートに美しく。
              </h2>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed font-bold mb-8">
                取引先の移転祝いや上場祝い。毎回電話やFAXで花屋を探す手間はもう不要です。<br />
                FLASTAL ANNEXなら、全国の厳選された高品質なフローリストから、PC・スマホでワンクリック手配。請求書払いにも対応し、総務・秘書部門の負担を劇的に削減します。
              </p>
              <button className="px-6 py-3 bg-white/5 text-white rounded-full font-bold text-sm border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-2">
                法人向け祝花サービスについて <ArrowRight size={16} />
              </button>
            </Reveal>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 rounded-[3rem] blur-2xl" />
            <div className="relative bg-slate-900 border border-slate-700/50 backdrop-blur-xl rounded-[3rem] p-8 md:p-12 overflow-hidden shadow-2xl">
              <div className="flex items-center gap-4 mb-8 border-b border-slate-800 pb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Gem size={24} />
                </div>
                <div>
                  <h3 className="text-white font-black text-xl">スマート祝花・胡蝶蘭手配</h3>
                  <p className="text-slate-400 text-xs font-bold">For Corporate BtoB</p>
                </div>
              </div>
              
              <ul className="space-y-6">
                {[
                  { title: "全国の厳選フローリスト・胡蝶蘭", desc: "独自の審査を通過したプロのお花屋さんネットワークを活用し、他社と差がつく高品質なお花をお届けします。" },
                  { title: "スマホ・PCから1分で手配完了", desc: "アナログなFAXや電話確認は不要。システム上で宛先と予算を選ぶだけで発注が完了します。" },
                  { title: "請求書払い（掛け払い）対応", desc: "法人様向けに月末締め翌月末払いの請求書払いに対応。手配履歴もダッシュボードで一元管理できます。" }
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <CheckCircle2 className="text-amber-400 shrink-0 mt-1" size={20} />
                    <div>
                      <h4 className="text-slate-200 font-black text-sm mb-1">{item.title}</h4>
                      <p className="text-slate-400 text-xs font-bold leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

// --- 4. FEATURES GRID ---
const FeaturesGrid = () => {
  const features = [
    { title: "厳選されたプロの品質", desc: "FLASTALが独自に提携した、実績のあるお花屋さんとクリエイターのみが対応します。", icon: Star },
    { title: "請求書・後払い対応", desc: "法人企業様、エンタメ事務所様向けに、柔軟な決済手段と明細発行機能をご用意しています。", icon: FileText },
    { title: "手配履歴の一元管理", desc: "誰が・いつ・どこへ手配したか。ダッシュボードからすべてリアルタイムで確認可能です。", icon: TrendingUp },
    { title: "専任コンシェルジュ", desc: "大規模なイベントや特殊なオーダーにも、FLASTALの専任スタッフが手厚くサポートします。", icon: ShieldCheck },
  ];

  return (
    <section className="py-24 md:py-32 bg-slate-900 relative z-10 border-t border-white/5">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl text-center">
        <Reveal>
          <h2 className="text-2xl md:text-4xl font-black text-white mb-16 tracking-tighter">
            FLASTAL ANNEX の共通メリット
          </h2>
        </Reveal>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feat, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-8 text-left hover:bg-slate-800 transition-colors group">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-amber-400 mb-6 border border-slate-700 group-hover:border-amber-500/50 transition-colors">
                  <feat.icon size={24} />
                </div>
                <h3 className="text-white font-black text-lg mb-2">{feat.title}</h3>
                <p className="text-slate-400 text-sm font-bold leading-relaxed">{feat.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- 5. CONTACT CTA ---
const ContactCTA = () => {
  return (
    <section id="contact" className="py-24 md:py-36 bg-slate-950 relative z-10 border-t border-white/10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6 max-w-4xl relative z-10 text-center">
        <Reveal>
          <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center text-amber-400 mx-auto mb-8 shadow-2xl">
            <Building2 size={36} />
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-6">
            ビジネスに、彩りと安心を。
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-bold mb-12 max-w-xl mx-auto leading-relaxed">
            FLASTAL ANNEX の導入・資料請求に関するお問い合わせは、以下のフォームよりお気軽にご連絡ください。担当者より1〜2営業日以内にご返信いたします。
          </p>

          <form className="max-w-2xl mx-auto bg-slate-900/50 backdrop-blur-md p-8 md:p-10 rounded-[3rem] border border-slate-800 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">御社名</label>
                <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-bold" placeholder="株式会社 FLASTAL" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ご担当者名</label>
                <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-bold" placeholder="山田 太郎" />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">メールアドレス</label>
              <input type="email" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-bold" placeholder="info@flastal.com" />
            </div>
            <div className="mb-8">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">お問い合わせ内容</label>
              <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-bold appearance-none">
                <option>公式フラスタシステム（エンタメ向け）について</option>
                <option>法人向け祝花・胡蝶蘭手配について</option>
                <option>提携フローリストとしての登録について</option>
                <option>その他のお問い合わせ</option>
              </select>
            </div>
            <button type="button" className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 rounded-xl font-black text-base hover:shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all flex items-center justify-center gap-2">
              <Mail size={18}/> この内容で送信する
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
};

// ==========================================
// 👑 MAIN EXPORT
// ==========================================
export default function AnnexPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) return null; 

  return (
    <main className="bg-slate-950 min-h-screen text-slate-200 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      <Hero />
      <ForEntertainment />
      <ForCorporate />
      <FeaturesGrid />
      <ContactCTA />
    </main>
  );
}