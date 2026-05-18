// src/app/annex/page.js
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Crown, ShieldCheck, Gem, Briefcase, 
  ArrowRight, FileText, CheckCircle2, Leaf, 
  Mail, ArrowDownRight, Sprout, Star, Sparkles
} from 'lucide-react';
import Link from 'next/link';

// --- モーション・エフェクト・プリセット ---
const revealText = {
  hidden: { y: "100%" },
  visible: { y: 0, transition: { duration: 1.2, ease: [0.76, 0, 0.24, 1] } }
};

const imageReveal = {
  hidden: { scale: 1.15, clipPath: "inset(100% 0 0 0)" },
  visible: { 
    scale: 1, 
    clipPath: "inset(0% 0 0 0)", 
    transition: { duration: 1.6, ease: [0.76, 0, 0.24, 1], delay: 0.2 } 
  }
};

const floatingElement = {
  animate: {
    y: [0, -10, 0],
    rotate: [0, 5, -5, 0],
    transition: { duration: 5, ease: "easeInOut", repeat: Infinity }
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 35 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

export default function AnnexPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. おまとめ受付フローのデータ
  const smartFlow = [
    { step: "01", title: "専用の「お祝い窓口」を開設", desc: "移転や開店、イベント開催にあわせて、受取側（企業・主催者）がFLASTAL上に専用の受付ページを作成します。" },
    { step: "02", title: "関係者へURLをご案内", desc: "取引先やファンへURLをシェア。コンプライアンスに準拠した透明な資金管理で、皆様からのお祝いを安全にお預かりします。" },
    { step: "03", title: "集まった資金で、最適な装飾を", desc: "受付金額を集計し、受取側が「空間に合った観葉植物」や「統一感のある豪華なロビー装花」を自由にオーダーできます。" }
  ];

  // 2. 導入のメリット
  const features = [
    { title: "厳選されたプロの品質", desc: "FLASTALが独自に提携し、厳しい審査を通過した実績のあるお花屋さんとクリエイターのみが対応いたします。", icon: Star },
    { title: "請求書・掛け払い対応", desc: "法人企業様、エンタメ事務所様向けに、柔軟な決済手段と適格請求書（インボイス）対応の明細発行機能をご用意しています。", icon: FileText },
    { title: "手配・資金の一元管理", desc: "誰から、いつ、いくらお預かりしたか。ダッシュボードからすべてリアルタイムで確認・管理が可能です。", icon: Briefcase },
    { title: "専任コンシェルジュ", desc: "大規模なイベントや特殊なオーダーにも、FLASTALの専任スタッフが責任を持って手厚くサポートいたします。", icon: ShieldCheck },
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#FDFBFB] text-[#4A3E3A] font-sans selection:bg-[#EAD8D4] selection:text-[#4A3E3A] overflow-x-hidden">
      
      {/* 背景に浮かぶ大人可愛い有機的グラデーション玉（シャンパンゴールド調） */}
      <div className="absolute top-[-10%] left-[-20%] w-[60vw] h-[60vw] bg-gradient-to-tr from-[#F8F4E6] to-[#FFFBF5] rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute top-[30%] right-[-10%] w-[45vw] h-[45vw] bg-gradient-to-br from-[#FAF3F0] to-[#FDFBFB] rounded-full blur-[100px] pointer-events-none -z-10" />

      <main className="pt-20">
        
        {/* ===== HERO SECTION (Premium Concierge Style) ===== */}
        <section className="relative min-h-[90vh] flex flex-col justify-center px-6 lg:px-16 pb-12 overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full max-w-[1500px] mx-auto relative z-10">
            
            {/* 左側：気品あふれるタイポグラフィ領域 */}
            <div className="lg:col-span-7 flex flex-col justify-center z-20">
              <div className="overflow-hidden mb-6 flex items-center gap-3">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} className="w-2 h-2 rounded-full bg-[#BFA181]" />
                <motion.span initial="hidden" animate="visible" variants={revealText} className="block text-[10px] md:text-[11px] tracking-[0.25em] font-bold text-[#A68F7C]">
                  法人・イベント主催者様へ
                </motion.span>
              </div>
              
              {/* スマホで文字が落ちないようにサイズと改行を制御 */}
              <h1 className="font-serif text-[2.5rem] sm:text-[3.5rem] lg:text-[4.5rem] xl:text-[5.5rem] leading-[1.15] tracking-tight font-normal mb-8 text-[#3A3330]">
                <div className="overflow-hidden pb-1 lg:pb-3">
                  <motion.span initial="hidden" animate="visible" variants={revealText} className="block">
                    確かな信頼と、
                  </motion.span>
                </div>
                <div className="overflow-hidden flex items-center gap-2 sm:gap-4 pb-1 lg:pb-3">
                  <motion.span initial="hidden" animate="visible" variants={revealText} className="block text-[#C5A491] whitespace-nowrap">
                    洗練された祝花を。
                  </motion.span>
                  <motion.div initial={{ width: 0 }} animate={{ width: "60px" }} transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }} className="h-[1px] bg-[#E8D8CF] hidden md:block" />
                </div>
              </h1>

              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 1 }} className="max-w-xl">
                <p className="text-sm md:text-base leading-relaxed text-[#7A6B65] tracking-wide font-light">
                  ビジネスのお祝いや、エンターテインメントの熱狂を、確かな安心と共に。<br/><br/>
                  FLASTAL ANNEX（フラスタル アネックス）は、透明性の高い「おまとめ受付」や、事務所公認の「公式フラスタシステム」を提供する、法人専用のコンシェルジュサービスです。コンプライアンスを遵守し、すべての企業様に上質な祝花体験をお約束いたします。
                </p>
                <div className="mt-10 flex flex-wrap gap-6 items-center">
                  <a href="#contact" className="group flex items-center gap-3 text-xs tracking-widest font-bold pb-1.5 border-b-2 border-[#BFA181] text-[#A68F7C] hover:text-[#4A3E3A] hover:border-[#4A3E3A] transition-all">
                    資料請求・ご相談 <ArrowDownRight size={14} className="group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform text-[#BFA181]" />
                  </a>
                  <Link href="/login" className="group flex items-center gap-2 text-xs tracking-widest font-semibold text-[#8C7A70] hover:text-[#BFA181] transition-colors">
                    法人アカウント作成
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* 右側：エレガントなアシンメトリー・キャンバス */}
            <div className="lg:col-span-5 relative h-[45vh] lg:h-[75vh] w-full flex items-center justify-center mt-8 lg:mt-0">
              
              <motion.div 
                initial="hidden" animate="visible" variants={imageReveal}
                className="absolute w-[90%] h-full bg-gradient-to-br from-[#FFFDF5] via-[#F8F1E5] to-[#EAE0D3] shadow-[0_35px_90px_rgba(191,161,129,0.15)] overflow-hidden relative border border-[#F3EBE1]"
                style={{ borderRadius: "180px 30px 180px 180px" }}
              >
                {/* 内部グラフィック：回転する刻印スタンプ */}
                <div className="absolute inset-0 flex flex-col justify-between p-8 md:p-10 pointer-events-none select-none z-10">
                  <div className="flex justify-between items-start">
                    <span className="font-serif text-[10px] tracking-widest text-[#B5A498] uppercase font-bold">Annex Premium</span>
                    <Sparkles size={16} className="text-[#C5A491] animate-pulse" />
                  </div>
                  
                  {/* エレガントなサークルベクター */}
                  <div className="absolute w-[120%] h-[120%] -right-10 -top-10 opacity-20 text-[#C5A491]">
                    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.25" className="w-full h-full animate-[spin_120s_linear_infinite]">
                      <circle cx="50" cy="50" r="40" strokeDasharray="1 3" />
                      <circle cx="50" cy="50" r="30" strokeOpacity="0.5" />
                    </svg>
                  </div>

                  <div className="text-left relative z-20">
                    <p className="font-serif text-5xl text-[#8A7863] leading-none mb-2 opacity-40">A.</p>
                    <p className="text-[8px] tracking-[0.2em] text-[#A68F7C] font-bold">フラスタル 法人特別版</p>
                  </div>
                </div>
              </motion.div>

              {/* 装飾レイヤー：ホバーする実績バッジ */}
              <motion.div 
                variants={floatingElement} animate="animate"
                className="absolute -bottom-4 -right-2 md:-right-4 bg-white/95 backdrop-blur-md border border-[#F3EBE1] p-4 md:p-5 rounded-3xl shadow-[0_15px_40px_rgba(191,161,129,0.15)] max-w-[180px] md:max-w-[200px] z-30"
              >
                <div className="flex items-center gap-2 mb-1.5 text-[#BFA181]">
                  <Leaf size={14} />
                  <span className="text-[10px] tracking-[0.1em] font-bold text-[#A68F7C]">サステナブル</span>
                </div>
                <p className="text-[10px] md:text-[11px] text-[#5A4A45] leading-relaxed font-light">
                  お祝い花の<span className="text-[#A68F7C] font-bold">無駄な廃棄をゼロ</span>にし、理想の空間緑化へ変換します。
                </p>
              </motion.div>

              {/* 装飾レイヤー：左上で輝くサークル */}
              <motion.div 
                variants={floatingElement} animate="animate" style={{ animationDelay: "-2s" }}
                className="absolute top-8 md:top-12 -left-2 md:-left-6 bg-gradient-to-br from-[#A68F7C] to-[#C5A491] text-white p-3 rounded-full w-16 h-16 md:w-20 md:h-20 flex flex-col items-center justify-center text-center shadow-[0_15px_35px_rgba(191,161,129,0.3)] z-30"
              >
                <Crown size={12} className="mb-0.5 text-[#FFF5F0]" />
                <span className="font-serif text-[10px] md:text-xs font-bold tracking-tighter">BtoB</span>
                <span className="text-[6px] md:text-[7px] tracking-widest opacity-80">公式窓口</span>
              </motion.div>
            </div>

          </div>
        </section>

        {/* ===== NEW: SMART RECEPTION FLOW (おまとめ受付の仕組み) ===== */}
        <section className="py-24 bg-white">
          <div className="max-w-[90%] mx-auto">
            <div className="mb-16 md:mb-20 text-center lg:text-left">
              <h2 className="font-serif text-3xl md:text-4xl text-[#3A3330] tracking-tight mb-3">次世代の「おまとめ受付」</h2>
              <p className="text-[11px] md:text-xs tracking-[0.2em] text-[#A68F7C] font-light">企業や主催者が窓口を作り、安心・透明な資金管理を実現</p>
              <div className="w-10 h-[2px] bg-[#BFA181] mt-4 mx-auto lg:mx-0" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* PC用 コネクトライン */}
              <div className="absolute top-12 left-1/6 right-1/6 h-[1px] bg-[#F3EBE1] hidden md:block -z-10 border-t border-dashed border-[#D2C5B8]" />
              
              {smartFlow.map((flow, idx) => (
                <motion.div key={idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="relative pt-8 bg-[#FDFBFB] border border-[#F3EBE1] p-8 rounded-[40px_10px_40px_10px] hover:border-[#BFA181] transition-colors group bg-white shadow-sm hover:shadow-[0_20px_40px_rgba(191,161,129,0.1)]">
                  <span className="absolute -top-4 left-6 font-serif text-5xl leading-none text-[#F3EBE1] font-extrabold -z-0 group-hover:text-[#F8F1E5] transition-colors">{flow.step}</span>
                  <h3 className="text-sm font-bold text-[#4A3E3A] mb-4 pt-4 border-t border-[#A68F7C]/20 tracking-wider relative z-10">{flow.title}</h3>
                  <p className="text-xs text-[#7A6B65] leading-relaxed font-light relative z-10">{flow.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FOR CORPORATE (一般企業向け：サステナブル祝花) ===== */}
        <section className="py-24 md:py-28 bg-[#FAF6F2] border-t border-[#F3EBE1]">
          <div className="max-w-[90%] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="order-2 lg:order-1 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D2C5B8]/20 to-[#EAE0D3]/40 rounded-[3rem] blur-2xl" />
              <div className="relative bg-white border border-[#E8D8CF] rounded-[3rem] p-8 md:p-14 overflow-hidden shadow-xl">
                <div className="flex items-center gap-4 mb-8 border-b border-[#F3EBE1] pb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#F8F1E5] flex items-center justify-center text-[#A68F7C]">
                    <Sprout size={24} />
                  </div>
                  <div>
                    <h3 className="text-[#4A3E3A] font-bold text-lg font-serif">サステナブル祝花</h3>
                    <p className="text-[#A68F7C] text-[10px] font-bold tracking-[0.15em]">オフィス緑化・祝花手配</p>
                  </div>
                </div>
                
                <ul className="space-y-6">
                  {[
                    { title: "胡蝶蘭の渋滞・大量廃棄を防止", desc: "雰囲気に合わないお花が大量に届き、枯れた後の処分に苦労する…そんな総務部門の負担と廃棄ロス（SDGs課題）をゼロにします。" },
                    { title: "統一感のあるオフィス緑化へ", desc: "おまとめ受付で集まった資金を活用し、新オフィスに完璧に調和する「観葉植物の定期レンタル」や「エントランスの本格的な緑化施工」へ変換可能です。" },
                    { title: "芳名帳・お礼状を自動化", desc: "誰からいくら頂いたか、システムが自動でリスト化。お礼状の送信もスムーズに行えます。" }
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <CheckCircle2 className="text-[#C5A491] shrink-0 mt-0.5" size={18} />
                      <div>
                        <h4 className="text-[#4A3E3A] font-bold text-xs mb-1.5">{item.title}</h4>
                        <p className="text-[#7A6B65] text-[11px] font-light leading-relaxed">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            <div className="order-1 lg:order-2">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
                <span className="text-[#A68F7C] font-black text-[10px] md:text-xs tracking-[0.2em] block mb-4">ソリューション 01: 一般法人様向け</span>
                <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-[#3A3330] tracking-tighter leading-tight mb-6">
                  ビジネスの祝花を、<br className="hidden sm:block" />もっとスマートに美しく。
                </h2>
                <p className="text-[#7A6B65] text-sm md:text-base leading-relaxed font-light mb-8">
                  取引先の移転祝いや上場祝い。毎回電話やFAXで花屋を探す手間はもう不要です。<br /><br />
                  FLASTAL ANNEXなら、全国の厳選された高品質なフローリストから、PC・スマホでワンクリック手配。請求書払いにも対応し、コンプライアンスを遵守した手配業務の効率化を実現します。
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ===== FOR ENTERTAINMENT (エンタメ事務所向け：公式フラスタ) ===== */}
        <section className="py-24 md:py-28 bg-white border-t border-[#F3EBE1]">
          <div className="max-w-[90%] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            <div>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
                <span className="text-[#A68F7C] font-black text-[10px] md:text-xs tracking-[0.2em] block mb-4">ソリューション 02: 事務所・主催者様向け</span>
                
                {/* ★ 炎上リスクをなくし、ポジティブで美しい表現に変更 */}
                <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-[#3A3330] tracking-tighter leading-tight mb-6">
                  ファンと創り上げる、<br />最高のお祝い空間。
                </h2>
                <p className="text-[#7A6B65] text-sm md:text-base leading-relaxed font-light mb-8">
                  VTuber事務所様、アイドル運営企業様、イベント主催者様へ。<br /><br />
                  ファンの皆様からの「お祝いしたい」という温かいお気持ちを、公式がサポートすることで、より美しく記憶に残る形へと昇華させます。<br />
                  ロビーを彩る統一感のある装花や、ファン参加型のメモリアルな空間演出を通じて、イベントの一体感をさらに高めるお手伝いをいたします。
                </p>
              </motion.div>
            </div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D2C5B8]/20 to-[#EAE0D3]/40 rounded-[3rem] blur-2xl" />
              <div className="relative bg-white border border-[#E8D8CF] rounded-[3rem] p-8 md:p-14 overflow-hidden shadow-xl">
                <div className="flex items-center gap-4 mb-8 border-b border-[#F3EBE1] pb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#F8F1E5] flex items-center justify-center text-[#A68F7C]">
                    <Crown size={24} />
                  </div>
                  <div>
                    <h3 className="text-[#4A3E3A] font-bold text-lg font-serif">公式フラスタ・サポート</h3>
                    <p className="text-[#A68F7C] text-[10px] font-bold tracking-[0.15em]">Official Flower System</p>
                  </div>
                </div>
                
                {/* ★ 項目内容も「ファンへの感謝」と「空間プロデュース」を強調 */}
                <ul className="space-y-6">
                  {[
                    { title: "参加ファンへの感謝を伝える「デジタル芳名帳」", desc: "ご協賛いただいたファンの皆様のお名前を、スタイリッシュなデジタルボードとして自動生成。会場のモニター等で美しく掲出することができます。" },
                    { title: "イベントコンセプトに調和する「空間プロデュース」", desc: "公式窓口で取りまとめることで、イベントのテーマや世界観に完全にマッチした、フォトジェニックで豪華な巨大フラスタ・装飾ブースを実現します。" },
                    { title: "ファンも運営も安心な「公式お祝い窓口」", desc: "公式が安全な受付窓口をご用意することで、ファンの皆様も迷わず気軽にお祝いに参加できます。複雑な手配や資金管理はすべてシステムが代行します。" }
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <CheckCircle2 className="text-[#C5A491] shrink-0 mt-0.5" size={18} />
                      <div>
                        <h4 className="text-[#4A3E3A] font-bold text-xs mb-1.5">{item.title}</h4>
                        <p className="text-[#7A6B65] text-[11px] font-light leading-relaxed">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

          </div>
        </section>

        {/* ===== COMMON BENEFITS (共通のメリット) ===== */}
        <section className="py-24 bg-[#FAF6F2] border-t border-[#F3EBE1]">
          <div className="max-w-[90%] mx-auto">
            <div className="mb-16 text-center lg:text-left">
              <h2 className="font-serif text-3xl md:text-4xl text-[#3A3330] tracking-tight mb-2">プラットフォームの強み</h2>
              <p className="text-[11px] md:text-xs tracking-[0.2em] text-[#A68F7C] font-light">信頼と実績に基づく、FLASTAL ANNEXの機能</p>
              <div className="w-10 h-[2px] bg-[#BFA181] mt-4 mx-auto lg:mx-0" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feat, i) => (
                <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="bg-white p-8 rounded-3xl border border-[#F3EBE1] hover:shadow-[0_20px_40px_rgba(191,161,129,0.1)] transition-all">
                  <div className="w-10 h-10 rounded-xl bg-[#F8F1E5] flex items-center justify-center text-[#C5A491] mb-5">
                    <feat.icon size={20} />
                  </div>
                  <h3 className="text-[#4A3E3A] font-bold text-sm mb-3">{feat.title}</h3>
                  <p className="text-[#7A6B65] text-[11px] font-light leading-relaxed">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CONTACT & CTA ===== */}
        <section id="contact" className="py-28 bg-white border-t border-[#F3EBE1] text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF6F2] to-white pointer-events-none" />
          
          <div className="max-w-3xl mx-auto px-6 relative z-10">
            <span className="text-[10px] tracking-[0.3em] text-[#A68F7C] font-bold block mb-4">お問い合わせ</span>
            <h2 className="font-serif text-3xl md:text-4xl text-[#3A3330] tracking-tight mb-6">お気軽にご相談ください。</h2>
            <p className="text-xs text-[#7A6B65] font-light mb-14 leading-relaxed max-w-lg mx-auto">
              FLASTAL ANNEX の導入・資料請求に関するお問い合わせは、以下のフォームよりご連絡ください。<br/>担当コンシェルジュより1〜2営業日以内にご返信いたします。
            </p>
            
            <form className="max-w-2xl mx-auto bg-[#FDFBFB] p-8 md:p-12 rounded-[2rem] border border-[#F3EBE1] text-left shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-[10px] font-bold text-[#A68F7C] tracking-widest mb-2">御社名</label>
                  <input type="text" className="w-full bg-white border border-[#E8D8CF] rounded-xl px-4 py-3 text-[#4A3E3A] focus:outline-none focus:border-[#BFA181] transition-all text-sm" placeholder="株式会社 FLASTAL" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#A68F7C] tracking-widest mb-2">ご担当者名</label>
                  <input type="text" className="w-full bg-white border border-[#E8D8CF] rounded-xl px-4 py-3 text-[#4A3E3A] focus:outline-none focus:border-[#BFA181] transition-all text-sm" placeholder="山田 太郎" />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-[10px] font-bold text-[#A68F7C] tracking-widest mb-2">メールアドレス</label>
                <input type="email" className="w-full bg-white border border-[#E8D8CF] rounded-xl px-4 py-3 text-[#4A3E3A] focus:outline-none focus:border-[#BFA181] transition-all text-sm" placeholder="info@flastal.com" />
              </div>
              <div className="mb-8">
                <label className="block text-[10px] font-bold text-[#A68F7C] tracking-widest mb-2">お問い合わせ内容</label>
                <select className="w-full bg-white border border-[#E8D8CF] rounded-xl px-4 py-3 text-[#4A3E3A] focus:outline-none focus:border-[#BFA181] transition-all text-sm appearance-none">
                  <option>公式フラスタシステム（エンタメ事務所向け）について</option>
                  <option>法人向け祝花・胡蝶蘭手配（おまとめ受付）について</option>
                  <option>その他のお問い合わせ</option>
                </select>
              </div>
              <button type="button" className="w-full py-4 bg-[#4A3E3A] text-white rounded-xl font-bold text-sm hover:bg-[#BFA181] transition-colors flex items-center justify-center gap-2 shadow-md">
                <Mail size={16}/> この内容で送信する
              </button>
            </form>
          </div>
        </section>

      </main>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#FAF6F2] pt-20 pb-10 border-t border-[#E8D8CF]">
        <div className="max-w-[90%] mx-auto flex flex-col md:flex-row justify-between items-center text-[10px] text-[#A68F7C] tracking-[0.1em]">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
             <Building2 size={16} className="text-[#C5A491]" />
             <span className="font-serif font-bold text-[#4A3E3A] text-sm md:text-base tracking-widest">FLASTAL ANNEX</span>
          </div>
          <span>&copy; 2026 FLASTAL 法人専用エディション. All Rights Reserved.</span>
        </div>
      </footer>

    </div>
  );
}