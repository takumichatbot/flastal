// src/app/annex/page.js
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Crown, ShieldCheck, Briefcase,
  FileText, CheckCircle2, Leaf, Sprout,
  Star, Sparkles, ArrowLeft, ChevronDown,
  TrendingUp, Award, Send, CheckCircle, ArrowRight
} from 'lucide-react';
import Link from 'next/link';

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

const floatingA = {
  animate: {
    y: [0, -10, 0],
    rotate: [0, 3, -3, 0],
    transition: { duration: 5.5, ease: "easeInOut", repeat: Infinity }
  }
};

const floatingB = {
  animate: {
    y: [0, -8, 0],
    rotate: [0, -4, 4, 0],
    transition: { duration: 6.5, ease: "easeInOut", repeat: Infinity }
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.12 }
  })
};

function StatCounter({ target, suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          let start = null;
          const step = (ts) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setCount(Math.floor(eased * target));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function FaqItem({ q, a, isOpen, onToggle }) {
  return (
    <div className="border-b border-[#F3EBE1] last:border-none">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
      >
        <span className="text-sm font-bold text-[#4A3E3A] group-hover:text-[#A68F7C] transition-colors leading-relaxed pr-2">
          {q}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="shrink-0 text-[#BFA181]"
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-xs text-[#7A6B65] leading-relaxed font-light">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AnnexPage() {
  const [mounted, setMounted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [formData, setFormData] = useState({
    company: '', name: '', email: '',
    category: '公式フラスタシステム（エンタメ事務所向け）について',
    message: ''
  });
  const [formStatus, setFormStatus] = useState('idle');

  useEffect(() => { setMounted(true); }, []);

  const stats = [
    { label: "導入企業・団体", value: 120, suffix: "社以上", icon: Building2 },
    { label: "お祝い花の手配実績", value: 3800, suffix: "件以上", icon: Star },
    { label: "厳選パートナー店舗", value: 85, suffix: "店舗", icon: Award },
    { label: "ご利用者様満足度", value: 98, suffix: "%", icon: TrendingUp },
  ];

  const smartFlow = [
    {
      step: "01",
      title: "専用の「お祝い窓口」を開設",
      desc: "移転や開店、イベント開催にあわせて、受取側（企業・主催者）がFLASTAL上に専用の受付ページを作成します。"
    },
    {
      step: "02",
      title: "関係者へURLをご案内",
      desc: "取引先やファンへURLをシェア。コンプライアンスに準拠した透明な資金管理で、皆様からのお祝いを安全にお預かりします。"
    },
    {
      step: "03",
      title: "集まった資金で、最適な装飾を",
      desc: "受付金額を集計し、受取側が「空間に合った観葉植物」や「統一感のある豪華なロビー装花」を自由にオーダーできます。"
    }
  ];

  const features = [
    {
      title: "厳選されたプロの品質",
      desc: "FLASTALが独自に提携し、厳しい審査を通過した実績のあるお花屋さんとクリエイターのみが対応いたします。",
      icon: Star
    },
    {
      title: "請求書・掛け払い対応",
      desc: "法人企業様、エンタメ事務所様向けに、柔軟な決済手段と適格請求書（インボイス）対応の明細発行機能をご用意しています。",
      icon: FileText
    },
    {
      title: "手配・資金の一元管理",
      desc: "誰から、いつ、いくらお預かりしたか。ダッシュボードからすべてリアルタイムで確認・管理が可能です。",
      icon: Briefcase
    },
    {
      title: "専任コンシェルジュ",
      desc: "大規模なイベントや特殊なオーダーにも、FLASTALの専任スタッフが責任を持って手厚くサポートいたします。",
      icon: ShieldCheck
    },
  ];

  const faqs = [
    {
      q: "契約はどのような形になりますか？",
      a: "月額利用料のサブスクリプション型と、案件ごとの従量課金型をご用意しています。利用規模や目的に合わせてご提案いたします。まずはお気軽にお問い合わせください。"
    },
    {
      q: "インボイス（適格請求書）の発行はできますか？",
      a: "はい、対応しております。法人向けのご利用では、適格請求書（インボイス）の発行に完全対応しております。経理・総務部門での利用も安心してお使いいただけます。"
    },
    {
      q: "エンタメ事務所以外の法人でも利用できますか？",
      a: "もちろんです。一般企業様の移転祝い・周年祝い・開店祝いなどの手配一元管理にも幅広くご活用いただいております。業種を問わず対応いたしますので、まずはお問い合わせください。"
    },
    {
      q: "全国で対応できますか？",
      a: "主要都市を中心に全国の厳選パートナー店舗と提携しており、広域での対応が可能です。詳しい対応エリアについてはお問い合わせ時にご確認ください。"
    },
    {
      q: "導入までどのくらいの期間がかかりますか？",
      a: "お問い合わせから最短3営業日でアカウント開設・ご利用開始が可能です。大規模な導入や独自カスタマイズが必要な場合は、別途スケジュールをご相談させていただきます。"
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.company || !formData.name || !formData.email) return;
    setFormStatus('submitting');
    setTimeout(() => setFormStatus('success'), 1400);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#FDFBFB] text-[#4A3E3A] font-sans selection:bg-[#EAD8D4] selection:text-[#4A3E3A] overflow-x-hidden">

      <div className="absolute top-[-10%] left-[-20%] w-[60vw] h-[60vw] bg-gradient-to-tr from-[#F8F4E6] to-[#FFFBF5] rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[30%] right-[-10%] w-[45vw] h-[45vw] bg-gradient-to-br from-[#FAF3F0] to-[#FDFBFB] rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="px-6 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-black text-[#4A3E3A]/50 hover:text-[#4A3E3A] transition-colors bg-white/80 px-4 py-2 rounded-full shadow-sm border border-[#EAD8D4]"
        >
          <ArrowLeft size={14} /> トップページに戻る
        </Link>
      </div>

      <main className="pt-10">

        {/* ===== HERO ===== */}
        <section className="relative min-h-[85vh] flex flex-col justify-center px-6 lg:px-16 pb-12 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full max-w-[1500px] mx-auto relative z-10">

            <div className="lg:col-span-7 flex flex-col justify-center z-20">
              <div className="overflow-hidden mb-6 flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="w-2 h-2 rounded-full bg-[#BFA181]"
                />
                <motion.span
                  initial="hidden" animate="visible" variants={revealText}
                  className="block text-[10px] md:text-[11px] tracking-[0.25em] font-bold text-[#A68F7C]"
                >
                  法人・イベント主催者様へ
                </motion.span>
              </div>

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
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: "60px" }}
                    transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                    className="h-[1px] bg-[#E8D8CF] hidden md:block"
                  />
                </div>
              </h1>

              <motion.div
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 1 }}
                className="max-w-xl"
              >
                <p className="text-sm md:text-base leading-relaxed text-[#7A6B65] tracking-wide font-light">
                  ビジネスのお祝いや、エンターテインメントの熱狂を、確かな安心と共に。<br /><br />
                  FLASTAL ANNEX（フラスタル アネックス）は、透明性の高い「おまとめ受付」や、事務所公認の「公式フラスタシステム」を提供する、法人専用のコンシェルジュサービスです。
                </p>
                <div className="mt-10 flex flex-wrap gap-6 items-center">
                  <a
                    href="#contact"
                    className="group flex items-center gap-3 text-xs tracking-widest font-bold pb-1.5 border-b-2 border-[#BFA181] text-[#A68F7C] hover:text-[#4A3E3A] hover:border-[#4A3E3A] transition-all"
                  >
                    資料請求・ご相談 <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                  <Link
                    href="/login"
                    className="flex items-center gap-1.5 text-xs tracking-widest font-semibold text-[#8C7A70] hover:text-[#BFA181] transition-colors"
                  >
                    法人アカウント作成 →
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* Right: decorative canvas */}
            <div className="lg:col-span-5 relative h-[40vh] lg:h-[75vh] w-full flex items-center justify-center mt-8 lg:mt-0">
              <motion.div
                initial="hidden" animate="visible" variants={imageReveal}
                className="absolute w-[90%] h-full bg-gradient-to-br from-[#FFFDF5] via-[#F8F1E5] to-[#EAE0D3] shadow-[0_35px_90px_rgba(191,161,129,0.15)] overflow-hidden relative border border-[#F3EBE1]"
                style={{ borderRadius: "180px 30px 180px 180px" }}
              >
                <div className="absolute inset-0 flex flex-col justify-between p-8 md:p-10 pointer-events-none select-none z-10">
                  <div className="flex justify-between items-start">
                    <span className="font-serif text-[10px] tracking-widest text-[#B5A498] uppercase font-bold">Annex Premium</span>
                    <Sparkles size={16} className="text-[#C5A491] animate-pulse" />
                  </div>

                  <div className="absolute w-[120%] h-[120%] -right-10 -top-10 opacity-20 text-[#C5A491]">
                    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.25" className="w-full h-full animate-[spin_120s_linear_infinite]">
                      <circle cx="50" cy="50" r="40" strokeDasharray="1 3" />
                      <circle cx="50" cy="50" r="30" strokeOpacity="0.5" />
                    </svg>
                  </div>

                  <div className="relative z-20 space-y-3">
                    {["おまとめ受付システム", "請求書・インボイス対応", "専任コンシェルジュ", "全国厳選パートナー対応"].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.6 + i * 0.15, duration: 0.5 }}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle2 size={12} className="text-[#A68F7C] shrink-0" />
                        <span className="text-[10px] md:text-[11px] font-medium text-[#5A4A45]">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={floatingA} animate="animate"
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

              <motion.div
                variants={floatingB} animate="animate"
                className="absolute top-8 md:top-12 -left-2 md:-left-6 bg-gradient-to-br from-[#A68F7C] to-[#C5A491] text-white p-3 rounded-full w-16 h-16 md:w-20 md:h-20 flex flex-col items-center justify-center text-center shadow-[0_15px_35px_rgba(191,161,129,0.3)] z-30"
              >
                <Crown size={12} className="mb-0.5 text-[#FFF5F0]" />
                <span className="font-serif text-[10px] md:text-xs font-bold tracking-tighter">BtoB</span>
                <span className="text-[6px] md:text-[7px] tracking-widest opacity-80">公式窓口</span>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ===== STATS BAR ===== */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#3A3330] via-[#4A3E3A] to-[#5A4A45]" />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="text-center"
              >
                <div className="flex justify-center mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <stat.icon size={18} className="text-[#D2C5B8]" />
                  </div>
                </div>
                <div className="font-serif text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
                  <StatCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-[10px] tracking-[0.1em] text-[#B5A498] font-light">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ===== SMART FLOW ===== */}
        <section className="py-24 bg-white">
          <div className="max-w-[90%] mx-auto">
            <div className="mb-16 md:mb-20 text-center lg:text-left">
              <h2 className="font-serif text-3xl md:text-4xl text-[#3A3330] tracking-tight mb-3">次世代の「おまとめ受付」</h2>
              <p className="text-[11px] md:text-xs tracking-[0.2em] text-[#A68F7C] font-light">企業や主催者が窓口を作り、安心・透明な資金管理を実現</p>
              <div className="w-10 h-[2px] bg-[#BFA181] mt-4 mx-auto lg:mx-0" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="absolute top-12 left-[16.66%] right-[16.66%] hidden md:block border-t border-dashed border-[#D2C5B8]" />
              {smartFlow.map((flow, idx) => (
                <motion.div
                  key={idx}
                  custom={idx}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeInUp}
                  className="relative pt-8 bg-white border border-[#F3EBE1] p-8 rounded-[40px_10px_40px_10px] hover:border-[#BFA181] transition-all group hover:shadow-[0_20px_40px_rgba(191,161,129,0.1)]"
                >
                  <span className="absolute -top-4 left-6 font-serif text-5xl leading-none text-[#F3EBE1] font-extrabold group-hover:text-[#F8F1E5] transition-colors">{flow.step}</span>
                  <h3 className="text-sm font-bold text-[#4A3E3A] mb-4 pt-4 border-t border-[#A68F7C]/20 tracking-wider relative z-10">{flow.title}</h3>
                  <p className="text-xs text-[#7A6B65] leading-relaxed font-light relative z-10">{flow.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SOLUTION 01: Corporate ===== */}
        <section className="py-24 md:py-28 bg-[#FAF6F2] border-t border-[#F3EBE1]">
          <div className="max-w-[90%] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
              className="order-2 lg:order-1 relative"
            >
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
                <a href="#contact" className="inline-flex items-center gap-2 text-xs tracking-widest font-bold text-[#A68F7C] border-b-2 border-[#BFA181] pb-1 hover:text-[#4A3E3A] hover:border-[#4A3E3A] transition-all">
                  詳細を相談する <ArrowRight size={12} />
                </a>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ===== SOLUTION 02: Entertainment ===== */}
        <section className="py-24 md:py-28 bg-white border-t border-[#F3EBE1]">
          <div className="max-w-[90%] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            <div>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
                <span className="text-[#A68F7C] font-black text-[10px] md:text-xs tracking-[0.2em] block mb-4">ソリューション 02: 事務所・主催者様向け</span>
                <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-[#3A3330] tracking-tighter leading-tight mb-6">
                  ファンと創り上げる、<br />最高のお祝い空間。
                </h2>
                <p className="text-[#7A6B65] text-sm md:text-base leading-relaxed font-light mb-8">
                  VTuber事務所様、アイドル運営企業様、イベント主催者様へ。<br /><br />
                  ファンの皆様からの「お祝いしたい」という温かいお気持ちを、公式がサポートすることで、より美しく記憶に残る形へと昇華させます。ロビーを彩る統一感のある装花や、ファン参加型のメモリアルな空間演出を通じて、イベントの一体感をさらに高めるお手伝いをいたします。
                </p>
                <a href="#contact" className="inline-flex items-center gap-2 text-xs tracking-widest font-bold text-[#A68F7C] border-b-2 border-[#BFA181] pb-1 hover:text-[#4A3E3A] hover:border-[#4A3E3A] transition-all">
                  詳細を相談する <ArrowRight size={12} />
                </a>
              </motion.div>
            </div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
              className="relative"
            >
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

        {/* ===== FEATURES GRID ===== */}
        <section className="py-24 bg-[#FAF6F2] border-t border-[#F3EBE1]">
          <div className="max-w-[90%] mx-auto">
            <div className="mb-16 text-center lg:text-left">
              <h2 className="font-serif text-3xl md:text-4xl text-[#3A3330] tracking-tight mb-2">プラットフォームの強み</h2>
              <p className="text-[11px] md:text-xs tracking-[0.2em] text-[#A68F7C] font-light">信頼と実績に基づく、FLASTAL ANNEXの機能</p>
              <div className="w-10 h-[2px] bg-[#BFA181] mt-4 mx-auto lg:mx-0" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feat, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeInUp}
                  className="bg-white p-8 rounded-3xl border border-[#F3EBE1] hover:shadow-[0_20px_40px_rgba(191,161,129,0.1)] hover:border-[#D2C5B8] transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#F8F1E5] flex items-center justify-center text-[#C5A491] mb-5 group-hover:bg-[#F3EBE1] transition-colors">
                    <feat.icon size={20} />
                  </div>
                  <h3 className="text-[#4A3E3A] font-bold text-sm mb-3">{feat.title}</h3>
                  <p className="text-[#7A6B65] text-[11px] font-light leading-relaxed">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section className="py-24 bg-white border-t border-[#F3EBE1]">
          <div className="max-w-3xl mx-auto px-6">
            <div className="mb-12 text-center">
              <h2 className="font-serif text-3xl md:text-4xl text-[#3A3330] tracking-tight mb-2">よくあるご質問</h2>
              <p className="text-[11px] md:text-xs tracking-[0.2em] text-[#A68F7C] font-light mt-3">ご導入前のご不明点にお答えします</p>
              <div className="w-10 h-[2px] bg-[#BFA181] mt-4 mx-auto" />
            </div>
            <div className="bg-[#FDFBFB] rounded-3xl border border-[#F3EBE1] px-6 md:px-10 py-2">
              {faqs.map((faq, i) => (
                <FaqItem
                  key={i}
                  q={faq.q}
                  a={faq.a}
                  isOpen={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ===== CTA BANNER ===== */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#3A3330] to-[#5A4A45]" />
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%" viewBox="0 0 800 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="150" cy="150" r="300" stroke="white" strokeWidth="0.5" />
              <circle cx="650" cy="150" r="250" stroke="white" strokeWidth="0.5" />
              <circle cx="400" cy="350" r="200" stroke="white" strokeWidth="0.3" />
            </svg>
          </div>
          <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
              <Sparkles size={22} className="text-[#D2C5B8] mx-auto mb-4" />
              <h2 className="font-serif text-2xl md:text-4xl text-white tracking-tight mb-4 leading-tight">
                上質な祝花体験を、<br className="sm:hidden" />あなたの企業へ。
              </h2>
              <p className="text-[#C5B8AF] text-sm font-light mb-8 leading-relaxed">
                専任コンシェルジュが、貴社に合ったプランをご提案いたします。
              </p>
              <a
                href="#contact"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-[#4A3E3A] rounded-full font-bold text-sm hover:bg-[#F8F1E5] transition-colors shadow-lg"
              >
                無料で相談する <ArrowRight size={16} />
              </a>
            </motion.div>
          </div>
        </section>

        {/* ===== CONTACT FORM ===== */}
        <section id="contact" className="py-28 bg-[#FDFBFB] border-t border-[#F3EBE1] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white to-[#FAF6F2] pointer-events-none" />

          <div className="max-w-3xl mx-auto px-6 relative z-10">
            <div className="text-center mb-14">
              <span className="text-[10px] tracking-[0.3em] text-[#A68F7C] font-bold block mb-4">お問い合わせ</span>
              <h2 className="font-serif text-3xl md:text-4xl text-[#3A3330] tracking-tight mb-4">お気軽にご相談ください。</h2>
              <p className="text-xs text-[#7A6B65] font-light leading-relaxed max-w-lg mx-auto">
                FLASTAL ANNEX の導入・資料請求に関するお問い合わせは、以下のフォームよりご連絡ください。<br />
                担当コンシェルジュより1〜2営業日以内にご返信いたします。
              </p>
            </div>

            <AnimatePresence mode="wait">
              {formStatus === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white border border-[#F3EBE1] rounded-3xl p-12 text-center shadow-sm"
                >
                  <div className="w-16 h-16 bg-[#F8F1E5] rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={32} className="text-[#A68F7C]" />
                  </div>
                  <h3 className="font-serif text-2xl text-[#3A3330] mb-3">ありがとうございます。</h3>
                  <p className="text-xs text-[#7A6B65] font-light leading-relaxed">
                    お問い合わせを受け付けました。<br />
                    担当コンシェルジュより1〜2営業日以内にご連絡いたします。
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="bg-white p-8 md:p-12 rounded-[2rem] border border-[#F3EBE1] text-left shadow-sm"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-[10px] font-bold text-[#A68F7C] tracking-widest mb-2">
                        御社名 <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.company}
                        onChange={e => setFormData(p => ({ ...p, company: e.target.value }))}
                        className="w-full bg-[#FDFBFB] border border-[#E8D8CF] rounded-xl px-4 py-3 text-[#4A3E3A] focus:outline-none focus:border-[#BFA181] focus:bg-white transition-all text-sm"
                        placeholder="株式会社 FLASTAL"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#A68F7C] tracking-widest mb-2">
                        ご担当者名 <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                        className="w-full bg-[#FDFBFB] border border-[#E8D8CF] rounded-xl px-4 py-3 text-[#4A3E3A] focus:outline-none focus:border-[#BFA181] focus:bg-white transition-all text-sm"
                        placeholder="山田 太郎"
                      />
                    </div>
                  </div>
                  <div className="mb-6">
                    <label className="block text-[10px] font-bold text-[#A68F7C] tracking-widest mb-2">
                      メールアドレス <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                      className="w-full bg-[#FDFBFB] border border-[#E8D8CF] rounded-xl px-4 py-3 text-[#4A3E3A] focus:outline-none focus:border-[#BFA181] focus:bg-white transition-all text-sm"
                      placeholder="info@example.com"
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-[10px] font-bold text-[#A68F7C] tracking-widest mb-2">お問い合わせ種別</label>
                    <div className="relative">
                      <select
                        value={formData.category}
                        onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                        className="w-full bg-[#FDFBFB] border border-[#E8D8CF] rounded-xl px-4 py-3 text-[#4A3E3A] focus:outline-none focus:border-[#BFA181] focus:bg-white transition-all text-sm appearance-none"
                      >
                        <option>公式フラスタシステム（エンタメ事務所向け）について</option>
                        <option>法人向け祝花・胡蝶蘭手配（おまとめ受付）について</option>
                        <option>請求書・インボイス対応について</option>
                        <option>その他のお問い合わせ</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#BFA181] pointer-events-none" />
                    </div>
                  </div>
                  <div className="mb-8">
                    <label className="block text-[10px] font-bold text-[#A68F7C] tracking-widest mb-2">お問い合わせ内容</label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                      className="w-full bg-[#FDFBFB] border border-[#E8D8CF] rounded-xl px-4 py-3 text-[#4A3E3A] focus:outline-none focus:border-[#BFA181] focus:bg-white transition-all text-sm resize-none"
                      placeholder="ご質問やご要望をご自由にお書きください。"
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={formStatus === 'submitting'}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-[#4A3E3A] text-white rounded-xl font-bold text-sm hover:bg-[#BFA181] transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {formStatus === 'submitting' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        送信中...
                      </>
                    ) : (
                      <><Send size={16} /> この内容で送信する</>
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </section>

      </main>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#4A3E3A] pt-16 pb-10">
        <div className="max-w-[90%] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Building2 size={18} className="text-[#C5A491]" />
                <span className="font-serif font-bold text-white text-lg tracking-widest">FLASTAL ANNEX</span>
              </div>
              <p className="text-[#A68F7C] text-[11px] font-light leading-relaxed max-w-xs">
                法人・イベント主催者様向けの<br />プレミアム祝花コンシェルジュサービス
              </p>
            </div>
            <div className="flex flex-wrap gap-10 text-[11px] text-[#A68F7C]">
              <div>
                <p className="text-[#D2C5B8] font-bold mb-3 tracking-widest text-[10px]">サービス</p>
                <ul className="space-y-2">
                  <li><a href="#contact" className="hover:text-white transition-colors">おまとめ受付</a></li>
                  <li><a href="#contact" className="hover:text-white transition-colors">公式フラスタ</a></li>
                  <li><a href="#contact" className="hover:text-white transition-colors">資料請求</a></li>
                </ul>
              </div>
              <div>
                <p className="text-[#D2C5B8] font-bold mb-3 tracking-widest text-[10px]">リンク</p>
                <ul className="space-y-2">
                  <li><Link href="/" className="hover:text-white transition-colors">FLASTALトップ</Link></li>
                  <li><Link href="/terms" className="hover:text-white transition-colors">利用規約</Link></li>
                  <li><Link href="/privacy" className="hover:text-white transition-colors">プライバシーポリシー</Link></li>
                  <li><Link href="/tokushoho" className="hover:text-white transition-colors">特定商取引法</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-[#6A5A54] pt-8 text-center">
            <span className="text-[10px] text-[#7A6B65] tracking-[0.1em]">
              &copy; 2026 FLASTAL 法人専用エディション. All Rights Reserved.
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
