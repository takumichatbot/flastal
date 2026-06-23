// src/app/florists/dashboard/analytics/page.js
'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, DollarSign, Package, Star, Heart,
  ChevronLeft, Loader2, AlertCircle, MessageSquare
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// --- Glassmorphism UI Components ---
const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-6 md:p-8", className)}>
    {children}
  </div>
);

const Reveal = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

// --- KPIカード ---
const KpiCard = ({ title, value, icon: Icon, color = 'sky', unit = '' }) => {
  const colorMap = {
    sky: 'bg-sky-50 text-sky-500 border-sky-100',
    pink: 'bg-pink-50 text-pink-500 border-pink-100',
    emerald: 'bg-emerald-50 text-emerald-500 border-emerald-100',
    violet: 'bg-violet-50 text-violet-500 border-violet-100',
  };
  return (
    <div className="bg-white/60 backdrop-blur-md p-6 md:p-8 rounded-[2rem] border border-white shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1">
      <div className={cn('p-4 rounded-[1.5rem] border shadow-inner shrink-0', colorMap[color])}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-[10px] md:text-xs text-slate-400 font-black uppercase tracking-widest mb-1">{title}</p>
        <p className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter">
          {value.toLocaleString()}<span className="text-base font-bold text-slate-400 ml-1">{unit}</span>
        </p>
      </div>
    </div>
  );
};

// --- ステータスラベル ---
const PRODUCTION_STATUS_LABELS = {
  NOT_STARTED: '未着手',
  FLORIST_MATCHED: '相談中',
  DESIGN_FIXED: 'デザイン決定',
  PANELS_RECEIVED: 'パネル受取済',
  IN_PRODUCTION: '制作中',
  PRE_COMPLETION: '前日写真UP済',
  COMPLETED: '完了済',
};

const OFFER_STATUS_LABELS = {
  PENDING: '受付中',
  ACCEPTED: '受諾済み',
  REJECTED: '辞退',
};

// 円グラフ用カラー
const PIE_COLORS = ['#f472b6', '#38bdf8', '#34d399', '#a78bfa', '#fb923c', '#facc15'];

// カスタムTooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl px-4 py-3 text-xs font-bold">
        <p className="text-slate-500 mb-2">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color }} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }} />
            {entry.name}: {entry.value.toLocaleString()}
            {entry.name === '売上' ? ' pt' : ' 件'}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// --- メインページ ---
export default function FloristAnalyticsPage() {
  const { user, isLoading, authenticatedFetch } = useAuth();
  const router = useRouter();

  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);
  const [fetching, setFetching] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setFetching(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/api/florists/analytics`);
      if (!res || !res.ok) throw new Error('データの取得に失敗しました');
      const data = await res.json();
      setAnalytics(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setFetching(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role !== 'FLORIST') {
        router.push('/');
        return;
      }
      fetchAnalytics();
    }
  }, [isLoading, user, fetchAnalytics, router]);

  // ローディング
  if (isLoading || fetching) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-pink-500 mb-4" size={40} />
        <p className="text-xs font-black tracking-widest text-slate-400 uppercase">Loading Analytics...</p>
      </div>
    );
  }

  // エラー
  if (error || !analytics) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-10 rounded-[3rem] border border-red-100 flex flex-col items-center max-w-md w-full shadow-xl">
          <AlertCircle className="text-red-400 mb-4" size={48} />
          <h1 className="text-xl font-black text-slate-800 mb-2">取得エラー</h1>
          <p className="text-xs font-bold text-slate-400 mb-8 text-center">{error || 'データを取得できませんでした。'}</p>
          <button onClick={fetchAnalytics} className="px-8 py-3 bg-slate-900 text-white rounded-full font-black text-sm hover:bg-slate-800 transition-colors">
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  const { kpi, monthlyData, offerStatusCounts, productionStatusCounts, recentReviews } = analytics;

  // 円グラフ用データ変換
  const offerPieData = Object.entries(offerStatusCounts)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: OFFER_STATUS_LABELS[key] || key, value }));

  const productionPieData = Object.entries(productionStatusCounts)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: PRODUCTION_STATUS_LABELS[key] || key, value }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/40 via-white to-sky-50/40 font-sans text-slate-800">
      {/* 背景装飾 */}
      <div className="fixed top-[-15%] right-[-5%] w-[500px] h-[500px] bg-pink-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-sky-200/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 relative z-10 space-y-8">

        {/* ヘッダー */}
        <Reveal>
          <div className="flex items-center gap-4 mb-2">
            <Link
              href="/florists/dashboard"
              className="w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-md border border-white rounded-full shadow-sm hover:bg-pink-50 hover:border-pink-200 transition-all"
            >
              <ChevronLeft size={20} className="text-slate-500" />
            </Link>
            <div>
              <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-1">Florist Dashboard</p>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
                <TrendingUp className="text-pink-400" size={28} />
                アナリティクス
              </h1>
            </div>
          </div>
        </Reveal>

        {/* (A) KPIカード */}
        <Reveal delay={0.1}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="今月の売上"
              value={kpi.thisMonthRevenue}
              icon={DollarSign}
              color="emerald"
              unit="pt"
            />
            <KpiCard
              title="今月の受注件数"
              value={kpi.thisMonthOrderCount}
              icon={Package}
              color="sky"
              unit="件"
            />
            <KpiCard
              title="累計レビュー数"
              value={kpi.totalReviewCount}
              icon={Star}
              color="pink"
              unit="件"
            />
            <KpiCard
              title="総支援貢献額"
              value={kpi.totalContribution}
              icon={Heart}
              color="violet"
              unit="pt"
            />
          </div>
        </Reveal>

        {/* (B) 月別売上グラフ + (E) 月別件数トレンド */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Reveal delay={0.15}>
            <GlassCard>
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-400" />
                月別売上（過去6ヶ月）
              </h2>
              {monthlyData.every(d => d.revenue === 0) ? (
                <div className="flex flex-col items-center justify-center h-[240px] text-slate-400">
                  <TrendingUp size={40} className="mb-3 opacity-30" />
                  <p className="text-xs font-bold">売上データがありません</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v.toLocaleString()}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" name="売上" fill="#34d399" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </GlassCard>
          </Reveal>

          <Reveal delay={0.2}>
            <GlassCard>
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                <TrendingUp size={16} className="text-sky-400" />
                月別受注トレンド（過去6ヶ月）
              </h2>
              {monthlyData.every(d => d.orders === 0) ? (
                <div className="flex flex-col items-center justify-center h-[240px] text-slate-400">
                  <Package size={40} className="mb-3 opacity-30" />
                  <p className="text-xs font-bold">受注データがありません</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                    <Line type="monotone" dataKey="orders" name="受注件数" stroke="#38bdf8" strokeWidth={3} dot={{ r: 5, fill: '#38bdf8', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                    <Line type="monotone" dataKey="totalOffers" name="オファー数" stroke="#f472b6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: '#f472b6', strokeWidth: 2, stroke: '#fff' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </GlassCard>
          </Reveal>
        </div>

        {/* (C) 受注ステータス分布 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Reveal delay={0.25}>
            <GlassCard>
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Package size={16} className="text-violet-400" />
                オファーステータス分布
              </h2>
              {offerPieData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[240px] text-slate-400">
                  <Package size={40} className="mb-3 opacity-30" />
                  <p className="text-xs font-bold">オファーデータがありません</p>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={offerPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {offerPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} 件`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 min-w-[120px]">
                    {offerPieData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
                        {entry.name}: <span className="text-slate-800">{entry.value}件</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          </Reveal>

          <Reveal delay={0.3}>
            <GlassCard>
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                <TrendingUp size={16} className="text-pink-400" />
                制作進捗ステータス分布
              </h2>
              {productionPieData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[240px] text-slate-400">
                  <TrendingUp size={40} className="mb-3 opacity-30" />
                  <p className="text-xs font-bold">受注データがありません</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={productionPieData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip formatter={(value) => [`${value} 件`, '']} />
                    <Bar dataKey="value" name="件数" fill="#f472b6" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </GlassCard>
          </Reveal>
        </div>

        {/* (D) 直近レビュー一覧 */}
        <Reveal delay={0.35}>
          <GlassCard>
            <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-6 flex items-center gap-2">
              <MessageSquare size={16} className="text-pink-400" />
              直近のレビュー
            </h2>
            {recentReviews.length === 0 ? (
              <div className="text-center py-16 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                <Star className="mx-auto text-slate-300 mb-4" size={40} />
                <p className="text-xs font-bold text-slate-400">レビューはまだありません。</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentReviews.map((review, idx) => (
                  <motion.div
                    key={review.id || idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * idx }}
                    className="flex items-start gap-4 p-5 bg-white/60 rounded-[1.5rem] border border-slate-100 hover:border-pink-200 hover:shadow-sm transition-all"
                  >
                    {/* アバター */}
                    {review.user?.iconUrl ? (
                      <img
                        src={review.user.iconUrl}
                        alt={review.user.handleName || 'ユーザー'}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-200 to-sky-200 flex items-center justify-center shrink-0">
                        <span className="text-xs font-black text-white">
                          {(review.user?.handleName || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-black text-slate-800">
                          {review.user?.handleName || '匿名ユーザー'}
                        </span>
                        {review.project?.title && (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full truncate max-w-[160px]">
                            {review.project.title}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-300 ml-auto">
                          {new Date(review.createdAt).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                      {review.comment ? (
                        <p className="text-sm font-bold text-slate-600 leading-relaxed line-clamp-3">
                          {review.comment}
                        </p>
                      ) : (
                        <p className="text-xs font-bold text-slate-300 italic">コメントなし</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </Reveal>

      </div>
    </div>
  );
}
