'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Star, Shield, Zap, Users, Heart, TrendingUp, Mail, Building2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const PLANS = [
  {
    id: 'bronze',
    name: 'ブロンズ',
    price: '30,000',
    period: '月額',
    color: 'from-amber-700 to-amber-500',
    borderColor: 'border-amber-200',
    bgColor: 'bg-amber-50',
    badgeColor: 'bg-amber-100 text-amber-800',
    icon: Star,
    features: [
      '企画への協賛クレジット掲載',
      'FLASTALロゴバッジ（ブロンズ）',
      '月次レポート（PDF）',
      'メールサポート',
    ],
    cta: '申し込む',
    popular: false,
  },
  {
    id: 'silver',
    name: 'シルバー',
    price: '100,000',
    period: '月額',
    color: 'from-slate-500 to-slate-400',
    borderColor: 'border-slate-300',
    bgColor: 'bg-slate-50',
    badgeColor: 'bg-slate-200 text-slate-800',
    icon: Shield,
    features: [
      'ロゴ掲載（イベント・企画ページ）',
      'SNSメンション（月2回）',
      'FLASTALロゴバッジ（シルバー）',
      '月次詳細レポート',
      'メール＋チャットサポート',
      'ブロンズの全特典',
    ],
    cta: '申し込む',
    popular: true,
  },
  {
    id: 'gold',
    name: 'ゴールド',
    price: '300,000',
    period: '月額',
    color: 'from-yellow-500 to-amber-400',
    borderColor: 'border-yellow-300',
    bgColor: 'bg-yellow-50',
    badgeColor: 'bg-yellow-100 text-yellow-800',
    icon: Zap,
    features: [
      '専用ランディングページ作成',
      '優先サポート（専任担当）',
      'SNSメンション（月4回）',
      'ロゴ掲載（全ページ・トップ表示）',
      'FLASTALロゴバッジ（ゴールド）',
      'カスタムキャンペーン設計',
      'シルバーの全特典',
    ],
    cta: 'お問い合わせ',
    popular: false,
  },
];

const STATS = [
  { label: '登録企画数', value: '1,000+', icon: Heart },
  { label: '支援者数', value: '10,000+', icon: Users },
  { label: '累計支援額', value: '¥50,000,000+', icon: TrendingUp },
];

const PLACEHOLDER_SPONSORS = [
  { name: '株式会社サンプル', category: 'エンターテインメント', logo: null, comment: 'FLASTALを通じて熱量の高いファンコミュニティと繋がることができました。' },
  { name: '〇〇フラワーショップ', category: '花・ギフト', logo: null, comment: '協賛を通じて多くのファンの方に認知いただき、大変好評です。' },
  { name: 'XYZイベント企画', category: 'イベント', logo: null, comment: 'ゴールドプランで専用ページを作成いただき、問い合わせ数が増加しました。' },
];

function PlanCard({ plan, index }) {
  const Icon = plan.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`relative rounded-3xl border-2 ${plan.borderColor} ${plan.bgColor} p-7 flex flex-col shadow-sm hover:shadow-lg transition-all duration-300 ${plan.popular ? 'ring-2 ring-pink-400 ring-offset-2' : ''}`}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-black rounded-full shadow-md shadow-pink-200">
            人気 No.1
          </span>
        </div>
      )}

      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black w-fit mb-5 ${plan.badgeColor}`}>
        <Icon size={13} />
        {plan.name}
      </div>

      <div className="mb-6">
        <div className="flex items-end gap-1">
          <span className="text-3xl font-black text-slate-900">¥{plan.price}</span>
          <span className="text-sm text-slate-500 font-bold mb-1">/ {plan.period}</span>
        </div>
        <p className="text-xs text-slate-400 font-bold mt-1">税別・最低3ヶ月契約</p>
      </div>

      <ul className="space-y-2.5 flex-1 mb-7">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
            <CheckCircle2 size={15} className="text-pink-500 shrink-0 mt-0.5" />
            <span className="font-medium">{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/contact"
        className={`flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-black transition-all active:scale-95 shadow-sm hover:shadow-md ${
          plan.popular
            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-200/40'
            : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-pink-300 hover:text-pink-600'
        }`}
      >
        {plan.cta} <ArrowRight size={14} />
      </Link>
    </motion.div>
  );
}

function SponsorCard({ sponsor, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all"
    >
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center mb-4 border border-pink-100">
        <Building2 size={24} className="text-pink-300" />
      </div>
      <div className="mb-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sponsor.category}</span>
      </div>
      <h3 className="font-black text-slate-800 mb-3">{sponsor.name}</h3>
      <p className="text-sm text-slate-500 leading-relaxed italic">&ldquo;{sponsor.comment}&rdquo;</p>
    </motion.div>
  );
}

export default function CorporatePage() {
  const [sponsors, setSponsors] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/corporate-sponsors`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && (Array.isArray(data) ? data.length > 0 : data?.sponsors?.length > 0)) {
          setSponsors(Array.isArray(data) ? data : data.sponsors);
        } else {
          setSponsors(PLACEHOLDER_SPONSORS);
        }
      })
      .catch(() => setSponsors(PLACEHOLDER_SPONSORS));
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">

      {/* ヒーロー */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 pb-24 px-4">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-pink-600/10 blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-rose-500/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-slate-700/30 blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-pink-500/20 border border-pink-500/30 text-pink-300 rounded-full text-xs font-black uppercase tracking-widest mb-6">
              <Building2 size={12} /> Corporate Partnership
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-5"
          >
            法人・企業の<br />
            <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">皆様へ</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-slate-300 text-lg sm:text-xl font-medium max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            FLASTALで推し活コミュニティとつながる<br />
            <span className="text-slate-400 text-base">熱量の高いファンへの最短距離</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-2xl shadow-xl shadow-pink-900/30 hover:opacity-90 transition-all active:scale-95 text-base"
            >
              <Mail size={18} /> お問い合わせ <ArrowRight size={16} />
            </Link>
            <a
              href="#plans"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white font-black rounded-2xl hover:bg-white/20 transition-all text-base"
            >
              プランを見る
            </a>
          </motion.div>
        </div>
      </div>

      {/* 実績数字 */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 sm:gap-8">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="text-center text-white"
              >
                <Icon size={20} className="mx-auto mb-1 opacity-80" />
                <div className="text-2xl sm:text-3xl font-black">{stat.value}</div>
                <div className="text-xs sm:text-sm font-bold opacity-80 mt-1">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* スポンサープラン */}
      <div id="plans" className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <span className="text-xs font-black text-pink-500 uppercase tracking-widest">Sponsor Plans</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 mb-3">スポンサープラン</h2>
          <p className="text-slate-500 font-medium max-w-xl mx-auto text-sm leading-relaxed">
            ご予算・目的に合わせてお選びください。<br />
            いずれのプランもFLASTALのコミュニティに深く関わることができます。
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {PLANS.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} index={i} />
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 font-bold mt-8">
          ご不明な点は
          <Link href="/contact" className="text-pink-500 hover:underline mx-1">お問い合わせ</Link>
          ください。カスタムプランのご相談も承ります。
        </p>
      </div>

      {/* 導入事例 */}
      <div className="bg-slate-50 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-black text-pink-500 uppercase tracking-widest">Case Studies</span>
            <h2 className="text-3xl font-black text-slate-900 mt-2 mb-3">導入事例</h2>
            <p className="text-slate-500 font-medium text-sm">FLASTALで活躍する法人パートナーの声</p>
          </div>

          {sponsors === null ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 rounded-full border-2 border-pink-400 border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {sponsors.map((sponsor, i) => (
                <SponsorCard key={sponsor.name || i} sponsor={sponsor} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTAバナー */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 py-20 px-4 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-pink-600/10 blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              まずはお気軽に<br />
              <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                ご相談ください
              </span>
            </h2>
            <p className="text-slate-400 font-medium mb-8 leading-relaxed">
              ご要望に合わせたカスタムプランもご提案可能です。<br />
              専任担当者が丁寧にご対応いたします。
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-2xl shadow-2xl shadow-pink-900/40 hover:opacity-90 transition-all active:scale-95 text-base"
            >
              <Mail size={18} /> お問い合わせフォームへ <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
