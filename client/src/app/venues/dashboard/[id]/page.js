'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, Zap, Star, Gem, 
  ArrowRight, Info, Loader2, Edit3, 
  MapPin, Calendar, Truck, CheckCircle, 
  Activity, BarChart3, Settings
} from 'lucide-react';

// 強制的に動的レンダリング（ビルド時のエラー回避）を設定
export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const Reveal = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, type: "spring", stiffness: 100 }}
  >
    {children}
  </motion.div>
);

function VenueDashboardContent() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 会場情報の取得
    const fetchVenueData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/venues/${id}`);
        if (!response.ok) throw new Error('会場データの取得に失敗しました');
        const data = await response.json();
        setVenue(data);
      } catch (error) {
        console.error(error);
        toast.error('会場情報を読み込めませんでした');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchVenueData();
  }, [id]);

  // 権限チェック: ログインしていない、または会場本人でも管理者でもない場合
  const hasAccess = user && (user.id === id || user.role === 'ADMIN' || user.role === 'VENUE');

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!user || !hasAccess) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full p-10 text-center bg-white rounded-[40px] shadow-2xl border border-slate-100"
        >
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
             <ShieldCheck size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-4">アクセス権限がありません</h2>
          <p className="text-slate-500 mb-8 leading-relaxed font-medium">
            会場ダッシュボードを利用するには、会場アカウントでログインしてください。
          </p>
          <Link href="/login" className="block w-full py-4 font-bold text-white bg-slate-900 rounded-full hover:shadow-lg transition-all">
              ログインページへ
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-32 font-sans text-slate-800 overflow-x-hidden">
      {/* ヒーローセクション: 会場概要 */}
      <section className="relative bg-white pt-20 pb-32 overflow-hidden border-b border-slate-100">
        <div className="container mx-auto px-6 relative z-10">
          <Reveal>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <span className="inline-block py-1 px-3 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold tracking-wider mb-6 border border-indigo-200">
                  VENUE DASHBOARD
                </span>
                <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4 tracking-tight">
                  {venue?.venueName || '会場名未設定'}
                </h1>
                <p className="text-slate-500 flex items-center justify-center md:justify-start gap-2 font-medium">
                  <MapPin size={18} className="text-indigo-500" /> {venue?.address || '住所未設定'}
                </p>
              </div>
              
              <div className="flex gap-4">
                <Link href={`/venues/${id}/edit`} className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm">
                  <Edit3 size={18} /> 情報を編集
                </Link>
                <Link href={`/venues/${id}`} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 rounded-2xl font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                  公開ページを確認 <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ステータスカードセクション */}
      <section className="container mx-auto px-6 -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* 受入設定カード */}
          <Reveal delay={0.2}>
            <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 h-full">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2">受入ステータス</h3>
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm font-bold text-slate-500">スタンド花</span>
                  <span className={`text-xs font-black px-2 py-1 rounded-md ${venue?.isStandAllowed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {venue?.isStandAllowed ? '許可' : '禁止'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm font-bold text-slate-500">楽屋花</span>
                  <span className={`text-xs font-black px-2 py-1 rounded-md ${venue?.isBowlAllowed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {venue?.isBowlAllowed ? '許可' : '禁止'}
                  </span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* 実績サマリーカード */}
          <Reveal delay={0.3}>
            <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 h-full">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2">フラスタ実績</h3>
              <div className="mt-4">
                <p className="text-4xl font-black text-slate-800">
                  {venue?.projects?.length || 0} <span className="text-sm font-bold text-slate-400 uppercase">Projects</span>
                </p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  これまでにFLASTALを通じてこの会場に贈られたお花の総数です。
                </p>
              </div>
            </div>
          </Reveal>

          {/* 搬入スケジュール(簡易) */}
          <Reveal delay={0.4}>
            <div className="bg-slate-900 p-8 rounded-[40px] shadow-xl text-white h-full relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-6">
                  <Calendar size={24} />
                </div>
                <h3 className="text-lg font-black mb-2">直近の搬入予定</h3>
                <div className="mt-4 space-y-3">
                  <p className="text-xs text-slate-400 italic">※ 現在、確定した搬入予定はありません。</p>
                  <Link href={`/venues/${id}/logistics`} className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 mt-4 transition-colors">
                    搬入ルール・搬入口の設定 <Settings size={14} />
                  </Link>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500 opacity-20 rounded-full blur-3xl"></div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 注意事項・ヘルプ */}
      <section className="container mx-auto px-6 mt-20 max-w-4xl">
        <Reveal delay={0.5}>
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                <Info size={20} />
              </div>
              <h3 className="font-black text-slate-800">会場オーナーへのご案内</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-8 text-sm">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 font-bold text-slate-400">1</div>
                  <p className="text-slate-500 leading-relaxed">
                    <strong className="text-slate-700 block mb-1">レギュレーションの正確性</strong>
                    ファンは会場の情報を頼りに企画を立てます。変更がある場合は速やかに更新をお願いします。
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 font-bold text-slate-400">2</div>
                  <p className="text-slate-500 leading-relaxed">
                    <strong className="text-slate-700 block mb-1">搬入トラブルの防止</strong>
                    搬入口や回収ルールを明文化することで、当日のお花屋さんとのトラブルを未然に防げます。
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl">
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Activity size={16} className="text-indigo-500" /> システム連携
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  イベント主催者（イベンター）様との連携機能は現在開発中です。公式レギュレーションの自動同期が可能になります。
                </p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span> Coming Soon
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

// メインエクスポート
export default function VenueDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>}>
      <VenueDashboardContent />
    </Suspense>
  );
}