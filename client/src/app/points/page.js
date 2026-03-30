'use client';

// Next.js のビルド時の静的解析を強制的にスキップ
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Loader2, Zap, Star, Gem, Sparkles, Gift, CreditCard, ChevronLeft } from 'lucide-react';
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
        <motion.div key={i} className="absolute w-4 h-4 bg-sky-200 rounded-full mix-blend-multiply filter blur-[2px] opacity-30"
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -100], x: [null, (Math.random() - 0.5) * 50], opacity: [0.2, 0.4, 0.2], scale: [1, 1.2, 1] }}
          transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

const POINT_PACKAGES = [
  { id: 'pkg_1000', points: 1000, price: 1000, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', button: 'bg-amber-500 hover:bg-amber-600' },
  { id: 'pkg_3000', points: 3000, price: 3000, icon: Star, color: 'text-sky-500', bg: 'bg-sky-50', border: 'border-sky-100', button: 'bg-sky-500 hover:bg-sky-600' },
  { id: 'pkg_5000', points: 5000, price: 5000, icon: Gem, color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-200', button: 'bg-pink-500 hover:bg-pink-600', popular: true },
  { id: 'pkg_10000', points: 10000, price: 10000, icon: Gift, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100', button: 'bg-purple-500 hover:bg-purple-600' },
];

/**
 * コンテンツ本体
 */
function PointsPageContent() {
  const { user, isLoading: authLoading, authenticatedFetch } = useAuth();
  const [processingId, setProcessingId] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      toast.success('決済が完了しました！ポイントがチャージされました✨', { duration: 5000 });
      router.replace('/points');
    } else if (status === 'cancel') {
      toast.error('決済がキャンセルされました');
      router.replace('/points');
    }
  }, [searchParams, router]);

  const handlePurchase = async (pkgId, amount, points) => {
    if (!user) {
      toast.error('ログインが必要です');
      router.push('/login');
      return;
    }
    
    setProcessingId(pkgId);
    const toastId = toast.loading('決済ページへ移動中...');
    
    try {
      // ★ 修正: 正しいエンドポイント & authenticatedFetch を使用
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

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-sky-400" size={40}/></div>;

  return (
    <div className="bg-slate-50/50 min-h-screen pb-32 md:pb-24 font-sans text-slate-800 relative overflow-hidden">
      <FloatingParticles />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-sky-200/30 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-200/30 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 relative z-10">
        
        {/* ヘッダーエリア */}
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <Sparkles className="text-sky-500" size={28}/> ポイントチャージ
                </h1>
                <p className="text-sm font-bold text-slate-500 mt-2">支援やアイテムの購入に使えるポイントを追加します。</p>
            </div>
            {user && (
                <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">現在の残高</p>
                    <p className="text-xl font-black text-slate-800 tracking-tight">{user.points?.toLocaleString() || 0} <span className="text-sm text-slate-500">pt</span></p>
                </div>
            )}
        </div>

        {/* パッケージリスト */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {POINT_PACKAGES.map((pkg) => (
            <motion.div 
                key={pkg.id}
                whileHover={{ y: -4 }}
                className={cn(
                    "bg-white rounded-[2rem] p-6 text-center relative overflow-hidden transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] border",
                    pkg.popular ? "border-pink-200 shadow-[0_8px_30px_rgba(244,114,182,0.15)] ring-2 ring-pink-50" : "border-slate-100 hover:border-slate-200"
                )}
            >
                {pkg.popular && (
                    <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-pink-400 to-rose-400 text-white text-[10px] font-black uppercase tracking-widest py-1.5 shadow-sm">
                        Most Popular
                    </div>
                )}
                
                <div className={cn("w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 mt-2", pkg.bg, pkg.border, "border")}>
                    <pkg.icon className={cn(pkg.color)} size={28} />
                </div>
                
                <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-1">{pkg.points.toLocaleString()} <span className="text-sm text-slate-500">pt</span></h3>
                <p className="text-slate-400 text-sm font-bold mb-6">¥{pkg.price.toLocaleString()}</p>
                
                <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePurchase(pkg.id, pkg.price, pkg.points)}
                    disabled={!!processingId}
                    className={cn(
                        "w-full py-3.5 text-white rounded-xl font-black transition-all flex justify-center items-center gap-2 shadow-md",
                        pkg.button,
                        processingId === pkg.id ? 'opacity-70 cursor-not-allowed' : '',
                        processingId && processingId !== pkg.id ? 'opacity-50 grayscale' : ''
                    )}
                >
                    {processingId === pkg.id ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                    {processingId === pkg.id ? '処理中...' : '購入する'}
                </motion.button>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
            <Link href="/mypage" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
                <ChevronLeft size={16}/> マイページに戻る
            </Link>
        </div>

      </div>
    </div>
  );
}

/**
 * メインエクスポート (Suspense でラップして useSearchParams のエラーを防ぐ)
 */
export default function PointsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-sky-400" size={40} />
      </div>
    }>
      <PointsPageContent />
    </Suspense>
  );
}