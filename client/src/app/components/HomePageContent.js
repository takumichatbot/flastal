'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Zap, ShieldCheck, Globe, Smartphone, Heart, 
  ArrowRight, Check, Play, MessageCircle, Layers, 
  Calendar, Users, Gift, CreditCard, ChevronDown, Star
} from 'lucide-react';

// --- Utility Components ---

const cn = (...classes) => classes.filter(Boolean).join(' ');

// スクロールプログレスバー
const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return (
    <motion.div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-indigo-500 to-pink-500 origin-left z-50" style={{ scaleX }} />
  );
};

// 3Dチルトカード
const TiltCard = ({ children, className }) => {
  const ref = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setRotateX(((y - centerY) / centerY) * -5);
    setRotateY(((x - centerX) / centerX) * 5);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transformStyle: "preserve-3d", rotateX, rotateY }}
      className={cn("transition-transform duration-200 ease-out", className)}
    >
      {children}
    </motion.div>
  );
};

// --- Main Content Components ---

const HeroSection = () => {
  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-[#030712] text-white">
      {/* 動的背景 (Aurora Effect) */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-[40%] left-[50%] transform -translate-x-1/2 w-[60%] h-[60%] bg-pink-500/10 rounded-full blur-[150px]" />
        {/* グリッドオーバーレイ */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block py-1 px-3 rounded-full bg-white/5 border border-white/10 text-sky-300 text-sm font-medium mb-6 backdrop-blur-md">
            ✨ The Future of Fan Support is Here
          </span>
          <h1 className="text-5xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/50 mb-6">
            想いを、<br className="md:hidden" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-400 to-pink-400">
              結晶化(クリスタル)
            </span>
            する。
          </h1>
          <p className="mt-6 text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            FLASTALは、ファンの熱狂を「透明」で「美しい」体験に変える、<br />
            次世代フラスタ支援プラットフォームです。
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/projects">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)] overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  企画を探す <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-sky-200 to-indigo-200 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            </Link>
            <Link href="/create">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full font-bold text-lg backdrop-blur-sm hover:bg-white/10 transition-colors"
              >
                無料で企画する
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* UI Mockup / Visual */}
        <motion.div 
          initial={{ opacity: 0, y: 100, rotateX: 20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mt-20 relative mx-auto max-w-5xl"
          style={{ perspective: "1000px" }}
        >
          <div className="relative rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-xl">
            <div className="absolute -top-10 -left-10 w-24 h-24 bg-sky-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/dashboard-mockup-dark.png" 
              alt="FLASTAL Dashboard" 
              className="rounded-xl w-full h-auto object-cover opacity-90 shadow-inner bg-slate-900/50 aspect-[16/9]"
              // Note: Replace with actual image path or placeholder
              style={{ minHeight: '300px' }} 
            />
            
            {/* Floating Badges */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -right-4 top-10 bg-slate-900/80 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-xl flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                <Check size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Goal Reached</p>
                <p className="text-sm font-bold text-white">125% 達成！</p>
              </div>
            </motion.div>

             <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              className="absolute -left-4 bottom-20 bg-slate-900/80 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-xl flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400">
                <Heart size={20} fill="currentColor" />
              </div>
              <div>
                <p className="text-xs text-slate-400">New Supporter</p>
                <p className="text-sm font-bold text-white">Yuki.S さんが支援</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// --- Future Feature Section (Bento Grid) ---
const BentoGrid = () => {
  return (
    <section className="py-32 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 md:text-center max-w-3xl mx-auto">
          <h2 className="text-sky-500 font-semibold tracking-wide uppercase">Advanced Technology</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            「不可能」を「標準機能」に。
          </p>
          <p className="mt-6 text-lg text-slate-600">
            FLASTALは単なる集金ツールではありません。AI、AR、リアルタイム通信を駆使した、
            体験共有プラットフォームです。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-3 gap-6 h-auto md:h-[800px]">
          {/* Card 1: Large - AI Assistant */}
          <TiltCard className="md:col-span-2 md:row-span-2 bg-white rounded-3xl p-8 shadow-xl border border-slate-100 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-50" />
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-200">
                  <Sparkles />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">AI Concierge</h3>
                <p className="mt-2 text-slate-600">
                  「どんなメッセージを書けばいい？」<br/>
                  生成AIが、出演者の心を動かすメッセージ案や、企画ページの魅力的な紹介文を数秒で提案します。
                </p>
              </div>
              <div className="mt-6 bg-white/80 backdrop-blur border border-slate-200 rounded-xl p-4 text-sm text-slate-600 shadow-sm">
                <p className="font-mono text-xs text-indigo-500 mb-1">AI Suggestion:</p>
                {/* 修正: ダブルクォーテーションを &quot; に変更 */}
                &quot;いつも感動をありがとう！このフラスタは、私たちの感謝の結晶です...&quot;
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500" />
          </TiltCard>

          {/* Card 2: Medium - AR Preview */}
          <TiltCard className="md:col-span-2 bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-800 relative overflow-hidden text-white group">
            <div className="relative z-10 flex items-center gap-6">
              <div className="flex-1">
                <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-sky-900">
                  <Smartphone />
                </div>
                <h3 className="text-xl font-bold">AR Pre-visualization</h3>
                <p className="mt-2 text-slate-400 text-sm">
                  スマホをかざして、会場にフラスタを仮想配置。サイズ感や色味を事前に確認できます。
                </p>
              </div>
              <div className="w-32 h-32 bg-gradient-to-tr from-sky-500 to-cyan-400 rounded-2xl opacity-80 animate-pulse" />
            </div>
          </TiltCard>

          {/* Card 3: Small - Global Payments */}
          <TiltCard className="md:col-span-1 md:row-span-1 bg-white rounded-3xl p-6 shadow-lg border border-slate-100 flex flex-col justify-center items-center text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <Globe />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Global Support</h3>
            <p className="text-xs text-slate-500 mt-1">海外ファンも参加可能。<br/>多言語・多通貨対応。</p>
          </TiltCard>

          {/* Card 4: Small - Security */}
          <TiltCard className="md:col-span-1 md:row-span-1 bg-white rounded-3xl p-6 shadow-lg border border-slate-100 flex flex-col justify-center items-center text-center">
             <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Escrow Protect</h3>
            <p className="text-xs text-slate-500 mt-1">企画中止時は<br/>全額自動返金保証。</p>
          </TiltCard>

           {/* Card 5: Wide - Realtime Chat */}
           <TiltCard className="md:col-span-2 md:row-span-1 bg-gradient-to-r from-pink-500 to-rose-500 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden flex items-center justify-between">
            <div className="relative z-10">
              <h3 className="text-xl font-bold">Real-time Synergy</h3>
              <p className="text-white/80 text-sm mt-2 max-w-xs">
                お花屋さん・参加者・主催者を繋ぐ専用チャット。NGワードフィルタリングで平和なコミュニティを維持。
              </p>
            </div>
            <div className="relative z-10 bg-white/20 p-3 rounded-full backdrop-blur-md">
              <MessageCircle size={32} />
            </div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          </TiltCard>
        </div>
      </div>
    </section>
  );
};

// --- Timeline/Process Section ---
const ProcessSection = () => {
  const steps = [
    { num: '01', title: 'Project Launch', desc: 'AIサポートで、魅力的な企画ページを3分で作成。' },
    { num: '02', title: 'Team Building', desc: 'SNS連携と招待リンクで、仲間を瞬時に集める。' },
    { num: '03', title: 'Florist Match', desc: '予算とイメージから、最適なアーティスト（花屋）とマッチング。' },
    { num: '04', title: 'Transparent Ops', desc: '収支はブロックチェーン級の透明性でリアルタイム公開。' },
    { num: '05', title: 'Emotional Share', desc: '完成写真と動画で、感動の瞬間を永遠にアーカイブ。' },
  ];

  return (
    <section className="py-32 bg-slate-900 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
              複雑なプロセスを、<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
                美しい物語
              </span>に。
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              従来の手順にあった「不安」や「面倒」をすべて排除しました。<br/>
              あなたはただ、推しへの想いを語るだけ。あとはFLASTALがナビゲートします。
            </p>
            <Link href="/create">
              <button className="flex items-center gap-3 text-sky-400 hover:text-sky-300 transition-colors font-bold text-xl group">
                体験を始める <ArrowRight className="group-hover:translate-x-2 transition-transform"/>
              </button>
            </Link>
          </div>

          <div className="relative">
            {/* 縦のライン */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-sky-500/0 via-sky-500/50 to-sky-500/0"></div>
            
            <div className="space-y-8">
              {steps.map((step, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="relative pl-24 group"
                >
                  <div className="absolute left-0 top-0 w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-2xl font-bold text-slate-500 group-hover:text-sky-400 group-hover:border-sky-500/50 transition-all shadow-lg z-10">
                    {step.num}
                  </div>
                  <h3 className="text-xl font-bold text-slate-200 group-hover:text-white transition-colors">{step.title}</h3>
                  <p className="text-slate-500 group-hover:text-slate-300 transition-colors">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Ecosystem Section (Florists, Venues, Organizers) ---
const EcosystemSection = () => {
  const roles = [
    {
      id: 'florist',
      title: 'For Florists',
      subtitle: 'クリエイティビティの解放',
      desc: '集金の手間や未払いのリスクから解放され、デザインと制作に没頭できる環境を。',
      color: 'from-pink-500 to-rose-500',
      icon: <Gift className="w-6 h-6" />,
      link: '/florists'
    },
    {
      id: 'venue',
      title: 'For Venues',
      subtitle: '完全なるコントロール',
      desc: '搬入トラブルゼロへ。公認フラスタの管理とレギュレーション周知を一元化。',
      color: 'from-blue-500 to-cyan-500',
      icon: <Layers className="w-6 h-6" />,
      link: '/venues'
    },
    {
      id: 'organizer',
      title: 'For Organizers',
      subtitle: 'ファンエンゲージメントの最大化',
      desc: '公式イベントページと連動し、ファンの熱量を可視化。安全な応援文化を醸成します。',
      color: 'from-indigo-500 to-purple-500',
      icon: <Users className="w-6 h-6" />,
      link: '/organizers'
    }
  ];

  return (
    <section className="py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-slate-900">Participate in the Ecosystem</h2>
          <p className="mt-4 text-slate-600">3つのプレイヤーがつながることで、最高のエンターテイメントが生まれます。</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {roles.map((role) => (
            <motion.div 
              key={role.id}
              whileHover={{ y: -10 }}
              className="relative group bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${role.color} opacity-10 rounded-bl-[100px] transition-all group-hover:scale-150 duration-500`} />
              
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center text-white shadow-lg mb-8`}>
                {role.icon}
              </div>
              
              <span className={`text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r ${role.color} uppercase tracking-wider`}>
                {role.title}
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-2 mb-4">{role.subtitle}</h3>
              <p className="text-slate-600 leading-relaxed mb-8">
                {role.desc}
              </p>

              <div className="flex gap-4 mt-auto">
                <Link href={`${role.link}/login`} className="flex-1 py-3 text-center rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                  Login
                </Link>
                <Link href={`${role.link}/register`} className={`flex-1 py-3 text-center rounded-xl text-white font-medium bg-gradient-to-r ${role.color} shadow-lg shadow-black/5 hover:shadow-black/15 transition-all`}>
                  Join
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Testimonials (Infinite Scroll) ---
const Testimonials = () => {
  const reviews = [
    { text: "初めての主催でしたが、AIサポートのおかげで完璧な文章が書けました！", user: "Sakura.M", role: "Organizer" },
    { text: "集金管理のストレスがゼロに。これなしではもう企画できません。", user: "Taro.K", role: "Organizer" },
    { text: "お花屋さんとのチャットがスムーズで、イメージ通りのフラスタができました。", user: "Yui.O", role: "Organizer" },
    { text: "透明性が高いので、安心して支援できました。", user: "Kenji.S", role: "Supporter" },
  ];

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
         <h2 className="text-3xl font-bold text-slate-900">Voices of Delight</h2>
      </div>
      <div className="flex gap-8 animate-scroll-left whitespace-nowrap">
        {[...reviews, ...reviews, ...reviews].map((review, i) => (
          <div key={i} className="inline-block w-[400px] p-8 rounded-2xl bg-slate-50 border border-slate-100 whitespace-normal">
            <div className="flex gap-1 text-yellow-400 mb-4">
              {[1,2,3,4,5].map(n => <Star key={n} size={16} fill="currentColor" />)}
            </div>
            {/* 修正: ダブルクォーテーションを &quot; に変更 */}
            <p className="text-slate-700 text-lg font-medium mb-6">&quot;{review.text}&quot;</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200" />
              <div>
                <p className="text-sm font-bold text-slate-900">{review.user}</p>
                <p className="text-xs text-slate-500">{review.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .animate-scroll-left {
          animation: scroll 40s linear infinite;
        }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
};

// --- FAQ Section (Accordion) ---
const FAQ = () => {
  const faqs = [
    { q: "企画が目標金額に届かなかった場合は？", a: "ご安心ください。All-in方式であれば集まった金額で実施、All-or-Nothing方式であれば全額返金など、企画作成時に柔軟に設定可能です。" },
    { q: "手数料はいくらですか？", a: "基本利用料は無料です。支援が集まった場合のみ、決済手数料とシステム利用料を合わせて〇〇%を頂戴します。" },
    { q: "お花屋さんの指定はできますか？", a: "はい、FLASTALに登録されている全国の提携フローリストから指名できます。未登録のお店への依頼サポートも行っています。" },
  ];

  return (
    <section className="py-32 max-w-4xl mx-auto px-6">
      <h2 className="text-3xl font-bold text-center mb-16 text-slate-900">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <details key={i} className="group bg-white border border-slate-200 rounded-2xl p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer open:ring-2 open:ring-sky-500/20 transition-all">
            <summary className="flex items-center justify-between font-bold text-slate-900 list-none">
              {faq.q}
              <ChevronDown className="transition-transform group-open:rotate-180 text-slate-400" />
            </summary>
            <div className="mt-4 text-slate-600 leading-relaxed text-sm">
              {faq.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
};

// --- Footer / CTA ---
const FooterCTA = () => {
  return (
    <footer className="bg-[#030712] text-white pt-32 pb-12 overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-gradient-to-b from-sky-500/20 to-transparent blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
          Ready to <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-pink-400">
            Make it Bloom?
          </span>
        </h2>
        <p className="text-slate-400 text-xl mb-12 max-w-2xl mx-auto">
          あなたのその想いは、誰かの勇気になる。<br/>
          さあ、世界一優しい革命をここから始めよう。
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link href="/create">
            <button className="px-12 py-5 bg-white text-slate-950 text-xl font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_50px_-10px_rgba(255,255,255,0.3)]">
              無料で企画を作成
            </button>
          </Link>
        </div>

        <div className="mt-32 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
          <p>© 2025 FLASTAL Inc. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function HomePageContent() {
  return (
    <div className="bg-white min-h-screen selection:bg-sky-500 selection:text-white">
      <ScrollProgress />
      <HeroSection />
      <BentoGrid />
      <ProcessSection />
      <EcosystemSection />
      <Testimonials />
      <FAQ />
      <FooterCTA />
    </div>
  );
}