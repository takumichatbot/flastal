'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Zap, Star, Gem, Sparkles, Gift, CreditCard, ChevronLeft, History, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// ===========================================
// 🎨 UI COMPONENTS
// ===========================================
const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(8)].map((_, i) => (
        <motion.div key={i} className="absolute w-4 h-4 bg-amber-200 rounded-full mix-blend-multiply filter blur-[2px] opacity-30"
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -100], x: [null, (Math.random() - 0.5) * 50], opacity: [0.2, 0.4, 0.2], scale: [1, 1.2, 1] }}
          transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

const POINT_PACKAGES = [
  { id: 'pkg_1000', points: 1000, price: 1000, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', button: 'bg-gradient-to-r from-amber-400 to-orange-500' },
  { id: 'pkg_3000', points: 3000, price: 3000, icon: Star, color: 'text-sky-500', bg: 'bg-sky-50', border: 'border-sky-100', button: 'bg-gradient-to-r from-sky-400 to-blue-500' },
  { id: 'pkg_5000', points: 5000, price: 5000, icon: Gem, color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-200', button: 'bg-gradient-to-r from-pink-400 to-rose-500', popular: true },
  { id: 'pkg_10000', points: 10000, price: 10000, icon: Gift, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100', button: 'bg-gradient-to-r from-purple-400 to-indigo-500' },
];

/**
 * コンテンツ本体
 */
function PointsPageContent() {
  const { user, isLoading: authLoading, authenticatedFetch, fetchUser } = useAuth();
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState('buy'); // 'buy' or 'history'
  const [transactions, setTransactions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      toast.success('決済が完了しました！ポイントがチャージされました✨', { duration: 5000 });
      fetchUser(); // ユーザー情報を再取得して残高を更新
      router.replace('/points');
    } else if (status === 'cancel') {
      toast.error('決済がキャンセルされました');
      router.replace('/points');
    }
  }, [searchParams, router, fetchUser]);

  // 履歴の取得
  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      // ※Pledge（支援履歴）と、ポイント購入履歴（Payment）をバックエンドから取得する想定
      const res = await authenticatedFetch(`${API_URL}/api/payment/history`);
      if (res.ok) {
          const data = await res.json();
          setTransactions(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  }, [user, authenticatedFetch]);

  useEffect(() => {
      if (activeTab === 'history') {
          fetchTransactions();
      }
  }, [activeTab, fetchTransactions]);

  const handlePurchase = async (pkgId, amount, points) => {
    if (!user) {
      toast.error('ログインが必要です');
      router.push('/login');
      return;
    }
    
    setProcessingId(pkgId);
    const toastId = toast.loading('決済ページへ移動中...');
    
    try {
      const res = await authenticatedFetch(`${API_URL}/api/payment/checkout/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, points }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '決済セッションの作成に失敗しました');
      
      if (data.url) {
        toast.dismiss(toastId);
        window.location.href = data.url;
      } else {
        throw new Error('決済URLの取得に失敗しました');
      }
    } catch (error) {
      toast.error(error.message, { id: toastId });
      setProcessingId(null);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-amber-400" size={40}/></div>;

  return (
    <div className="bg-slate-50/50 min-h-screen pb-32 md:pb-24 font-sans text-slate-800 relative overflow-hidden">
      <FloatingParticles />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-200/30 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-200/30 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 relative z-10">
        
        {/* マイページへ戻るリンク */}
        <div className="mb-6">
            <Link href="/mypage" className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/60 backdrop-blur-md rounded-full text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors shadow-sm border border-white">
                <ChevronLeft size={16}/> マイページに戻る
            </Link>
        </div>

        {/* ヘッダーエリア（現在の残高カード） */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl mb-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border-4 border-white">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
            <div className="relative z-10 text-center md:text-left">
                <p className="text-[10px] md:text-xs font-black text-amber-400 uppercase tracking-[0.3em] mb-2 flex items-center justify-center md:justify-start gap-1.5">
                    <Zap size={14}/> Current Balance
                </p>
                <h1 className="text-4xl md:text-6xl font-black font-mono tracking-tighter flex items-baseline justify-center md:justify-start gap-2">
                    {(user?.points || 0).toLocaleString()} <span className="text-xl md:text-2xl text-slate-400 font-bold">pt</span>
                </h1>
                <p className="text-xs font-bold text-slate-400 mt-2">1pt = 1円として、企画の支援やアイテムの購入に使用できます。</p>
            </div>
            
            <div className="relative z-10 w-full md:w-auto flex flex-row md:flex-col gap-2 bg-white/10 p-2 rounded-2xl backdrop-blur-md">
                <button onClick={() => setActiveTab('buy')} className={cn("flex-1 md:w-48 py-3 px-4 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2", activeTab === 'buy' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300 hover:bg-white/10')}>
                    <CreditCard size={16}/> チャージする
                </button>
                <button onClick={() => setActiveTab('history')} className={cn("flex-1 md:w-48 py-3 px-4 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2", activeTab === 'history' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300 hover:bg-white/10')}>
                    <History size={16}/> ご利用履歴
                </button>
            </div>
        </div>

        {/* --- コンテンツエリア --- */}
        <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                
                {/* === チャージ画面 === */}
                {activeTab === 'buy' && (
                    <>
                        <div className="text-center mb-8">
                            <h2 className="text-xl font-black text-slate-800 flex items-center justify-center gap-2"><Sparkles className="text-amber-500" size={20}/> ポイントパッケージを選択</h2>
                            <p className="text-xs font-bold text-slate-500 mt-2">※決済にはStripeの安全なシステムを利用します。<br className="md:hidden"/>テストカード (4242 4242...) で購入可能です。</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {POINT_PACKAGES.map((pkg) => (
                            <motion.div 
                                key={pkg.id}
                                whileHover={{ y: -4 }}
                                className={cn(
                                    "bg-white rounded-[2rem] p-6 text-center relative overflow-hidden transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] border",
                                    pkg.popular ? "border-pink-200 shadow-[0_8px_30px_rgba(244,114,182,0.15)] ring-4 ring-pink-50" : "border-slate-100 hover:border-slate-200"
                                )}
                            >
                                {pkg.popular && (
                                    <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-pink-400 to-rose-400 text-white text-[10px] font-black uppercase tracking-widest py-1.5 shadow-sm">
                                        Most Popular
                                    </div>
                                )}
                                
                                <div className={cn("w-16 h-16 mx-auto rounded-[1rem] flex items-center justify-center mb-4 mt-2 shadow-inner", pkg.bg, pkg.border, "border-2")}>
                                    <pkg.icon className={cn(pkg.color)} size={28} />
                                </div>
                                
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-1">{pkg.points.toLocaleString()} <span className="text-sm text-slate-500">pt</span></h3>
                                <p className="text-slate-400 text-sm font-bold mb-6">¥{pkg.price.toLocaleString()}</p>
                                
                                <motion.button 
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handlePurchase(pkg.id, pkg.price, pkg.points)}
                                    disabled={!!processingId}
                                    className={cn(
                                        "w-full py-4 text-white rounded-xl font-black transition-all flex justify-center items-center gap-2 shadow-lg",
                                        pkg.button,
                                        processingId === pkg.id ? 'opacity-70 cursor-not-allowed' : '',
                                        processingId && processingId !== pkg.id ? 'opacity-50 grayscale' : ''
                                    )}
                                >
                                    {processingId === pkg.id ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                                    {processingId === pkg.id ? '処理中...' : '購入する'}
                                </motion.button>
                            </motion.div>
                        ))}
                        </div>
                    </>
                )}

                {/* === 履歴画面 === */}
                {activeTab === 'history' && (
                    <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-6 md:p-10">
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6"><History className="text-slate-400" size={20}/> ご利用履歴</h2>
                        
                        {loadingHistory ? (
                            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-slate-300" size={32}/></div>
                        ) : transactions.length > 0 ? (
                            <div className="space-y-3">
                                {transactions.map((tx, idx) => (
                                    <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest", tx.type === 'CHARGE' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600')}>
                                                    {tx.type === 'CHARGE' ? '購入' : '使用'}
                                                </span>
                                                <span className="font-bold text-sm text-slate-800">{tx.description || (tx.type === 'CHARGE' ? 'ポイント購入' : '企画への支援')}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(tx.createdAt).toLocaleString()}</p>
                                        </div>
                                        <div className={cn("text-lg font-black font-mono", tx.type === 'CHARGE' ? 'text-emerald-500' : 'text-slate-800')}>
                                            {tx.type === 'CHARGE' ? '+' : '-'}{tx.amount.toLocaleString()} pt
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50">
                                <History size={48} className="mx-auto text-slate-300 mb-4"/>
                                <p className="text-slate-500 font-bold">まだポイントの利用履歴はありません。</p>
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