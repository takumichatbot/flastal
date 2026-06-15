'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Zap, Star, Gem, Sparkles, Gift, CreditCard,
  ChevronLeft, History, ArrowRight,
} from 'lucide-react';
import FloatingParticles from '@/app/components/FloatingParticles';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

const POINT_PACKAGES = [
  {
    id: 'pkg_1000', points: 1000, price: 1000,
    icon: Zap, label: 'ライト',
    gradient: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50', border: 'border-amber-100', iconColor: 'text-amber-500',
    description: 'お試し支援に',
  },
  {
    id: 'pkg_3000', points: 3000, price: 3000,
    icon: Star, label: 'スタンダード',
    gradient: 'from-violet-400 to-purple-500',
    bg: 'bg-violet-50', border: 'border-violet-100', iconColor: 'text-violet-500',
    description: '1〜2企画に参加',
  },
  {
    id: 'pkg_5000', points: 5000, price: 5000,
    icon: Gem, label: 'プレミアム', popular: true,
    gradient: 'from-pink-500 to-rose-500',
    bg: 'bg-pink-50', border: 'border-pink-200', iconColor: 'text-pink-500',
    description: '複数企画に参加',
  },
  {
    id: 'pkg_10000', points: 10000, price: 10000,
    icon: Gift, label: 'スーパー',
    gradient: 'from-purple-500 to-indigo-500',
    bg: 'bg-purple-50', border: 'border-purple-100', iconColor: 'text-purple-500',
    description: '大型企画の立役者',
  },
];

function PointsPageContent() {
  const { user, isLoading: authLoading, authenticatedFetch, fetchUser } = useAuth();
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState('buy');
  const [transactions, setTransactions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      toast.success('決済が完了しました！ポイントがチャージされました✨', { duration: 5000 });
      fetchUser();
      router.replace('/points');
    } else if (status === 'cancel') {
      toast.error('決済がキャンセルされました');
      router.replace('/points');
    }
  }, [searchParams, router, fetchUser]);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/api/payment/history`);
      if (res.ok) setTransactions(await res.json() || []);
    } catch { /* ignore */ }
    finally { setLoadingHistory(false); }
  }, [user, authenticatedFetch]);

  useEffect(() => {
    if (activeTab === 'history') fetchTransactions();
  }, [activeTab, fetchTransactions]);

  const handlePurchase = async (pkgId, price, points) => {
    if (!user) {
      toast.error('ログインが必要です');
      router.push('/login');
      return;
    }
    setProcessingId(pkgId);
    const tid = toast.loading('決済ページへ移動中...');
    try {
      const res = await authenticatedFetch(`${API_URL}/api/payment/checkout/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: price, points }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '決済セッションの作成に失敗しました');
      if (data.url) { toast.dismiss(tid); window.location.href = data.url; }
      else throw new Error('決済URLの取得に失敗しました');
    } catch (err) {
      toast.error(err.message, { id: tid });
      setProcessingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-amber-400" size={40} />
      </div>
    );
  }

  const pts = user?.points || 0;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-amber-50/30 min-h-screen font-sans text-slate-800 relative overflow-hidden">
      <FloatingParticles />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-200/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-rose-100/20 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      {/* ── Fixed Header ─────────────────────────────── */}
      <div
        className="fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:bg-slate-200 transition-colors shrink-0">
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-black text-slate-800 text-base flex-1">ポイント</h1>
          <div className="font-black text-lg text-amber-500 font-mono">
            {pts.toLocaleString()} <span className="text-xs font-bold text-slate-400">pt</span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2">
          {[
            { id: 'buy',     label: 'チャージする', icon: CreditCard },
            { id: 'history', label: '利用履歴',     icon: History },
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl font-black text-xs transition-all',
                  isActive ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                )}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────── */}
      <div
        className="relative z-10 max-w-2xl mx-auto px-4"
        style={{
          paddingTop: 'calc(8rem + env(safe-area-inset-top))',
          paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))',
        }}
      >
        {/* Balance hero card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-6 text-white shadow-xl mb-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')" }} />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.25em] mb-1.5 flex items-center gap-1">
                <Zap size={11} /> Current Balance
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black font-mono tracking-tighter">{pts.toLocaleString()}</span>
                <span className="text-lg text-slate-400 font-bold">pt</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-1">1pt = 1円として企画の支援に使えます</p>
            </div>
            <div className="w-16 h-16 bg-white/10 rounded-[1.25rem] flex items-center justify-center border border-white/10 shrink-0">
              <Sparkles className="text-amber-400" size={28} />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}>

            {/* ── BUY TAB ────────────────────────────── */}
            {activeTab === 'buy' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="font-black text-slate-800">パッケージを選択</h2>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Stripe安全決済</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {POINT_PACKAGES.map(pkg => {
                    const Icon = pkg.icon;
                    const isProcThis = processingId === pkg.id;
                    const isProcOther = !!processingId && !isProcThis;

                    return (
                      <motion.div key={pkg.id}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          'relative bg-white rounded-[2rem] overflow-hidden border-2 transition-all',
                          pkg.popular
                            ? 'border-pink-300 shadow-[0_8px_32px_rgba(244,114,182,0.2)] ring-4 ring-pink-50'
                            : 'border-slate-100 shadow-sm hover:border-slate-200',
                          isProcOther && 'opacity-50 grayscale',
                        )}>
                        {pkg.popular && (
                          <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[9px] font-black uppercase tracking-widest py-1.5 text-center">
                            ✨ Most Popular
                          </div>
                        )}
                        <div className="p-5">
                          <div className={cn('w-12 h-12 rounded-[1rem] flex items-center justify-center mb-3 border-2', pkg.bg, pkg.border)}>
                            <Icon className={pkg.iconColor} size={24} />
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{pkg.label}</p>
                          <p className="text-2xl font-black text-slate-800 tracking-tight">
                            {pkg.points.toLocaleString()}
                            <span className="text-sm text-slate-400 font-bold"> pt</span>
                          </p>
                          <p className="text-xs font-bold text-slate-400 mb-1">¥{pkg.price.toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-slate-400 mb-4">{pkg.description}</p>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handlePurchase(pkg.id, pkg.price, pkg.points)}
                            disabled={!!processingId}
                            className={cn(
                              'w-full py-3 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all',
                              `bg-gradient-to-r ${pkg.gradient}`,
                              isProcThis ? 'opacity-80' : '',
                            )}>
                            {isProcThis ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
                            {isProcThis ? '処理中...' : '購入する'}
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <p className="text-center text-[10px] font-bold text-slate-400 pt-2">
                  ※ポイントの有効期限は購入日から1年間です
                </p>
              </div>
            )}

            {/* ── HISTORY TAB ────────────────────────── */}
            {activeTab === 'history' && (
              <div className="bg-white/80 backdrop-blur-xl border border-white shadow-sm rounded-[2rem] overflow-hidden">
                {loadingHistory ? (
                  <div className="py-20 flex justify-center">
                    <Loader2 className="animate-spin text-slate-300" size={32} />
                  </div>
                ) : transactions.length > 0 ? (
                  <div className="divide-y divide-slate-50">
                    {transactions.map((tx, i) => (
                      <div key={i} className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                            tx.type === 'CHARGE' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500',
                          )}>
                            {tx.type === 'CHARGE' ? <ArrowRight size={15} /> : <Zap size={15} />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-slate-800 text-sm truncate">
                              {tx.description || (tx.type === 'CHARGE' ? 'ポイント購入' : '企画への支援')}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400">
                              {new Date(tx.createdAt).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className={cn(
                          'font-black font-mono text-base shrink-0 ml-3',
                          tx.type === 'CHARGE' ? 'text-emerald-500' : 'text-slate-700',
                        )}>
                          {tx.type === 'CHARGE' ? '+' : '−'}{tx.amount.toLocaleString()} pt
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <History size={40} className="mx-auto text-slate-200 mb-3" />
                    <p className="font-black text-slate-500 text-sm mb-1">まだ履歴がありません</p>
                    <p className="text-xs font-bold text-slate-400">ポイントを購入して企画を支援しましょう</p>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function PointsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-amber-400" size={40} />
      </div>
    }>
      <PointsPageContent />
    </Suspense>
  );
}
