'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  CreditCard, ShieldCheck, Zap, Star, Gem, 
  ArrowRight, Info, Loader2 
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const POINT_PACKAGES = [
  { id: 'starter', points: 1000, amount: 1000, label: 'Starter', icon: <Zap className="w-6 h-6 text-emerald-500" />, bg: "bg-emerald-50" },
  { id: 'standard', points: 5000, amount: 5000, label: 'Standard', icon: <Star className="w-6 h-6 text-white" />, isRecommended: true, bg: "bg-white" },
  { id: 'premium', points: 10000, amount: 10000, label: 'Premium', icon: <Gem className="w-6 h-6 text-purple-500" />, bg: "bg-purple-50" },
];

/**
 * 【動的部分】
 * ロジック、フック、デザインの本体。
 */
function PointsCore() {
  const searchParams = useSearchParams(); // ビルドエラーの根源
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [processingId, setProcessingId] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleCheckout = async (pkg) => {
    if (!user) {
      toast.error('ポイントを購入するにはログインが必要です');
      router.push('/login');
      return;
    }
    setProcessingId(pkg.id);
    try {
      const response = await fetch(`${API_URL}/api/checkout/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: pkg.amount, points: pkg.points, userId: user.id }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      toast.error('エラーが発生しました');
      setProcessingId(null);
    }
  };

  // ビルド時（マウント前）または認証確認中は、何も表示させないことで解析を回避
  if (!isMounted || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-32 font-sans text-slate-800">
      <section className="bg-white pt-20 pb-32 text-center">
        <div className="container mx-auto px-6">
          <span className="inline-block py-1 px-3 rounded-full bg-pink-100 text-pink-600 text-xs font-bold mb-6 tracking-wider">POINT CHARGE</span>
          <h1 className="text-4xl md:text-6xl font-black text-slate-800 mb-6">エネルギーチャージ</h1>
          <div className="inline-block bg-white shadow-xl border p-4 rounded-full">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Current Balance</p>
            <p className="text-2xl font-black text-slate-800">{(user?.points || 0).toLocaleString()} pt</p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 -mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl">
        {POINT_PACKAGES.map((pkg) => (
          <div key={pkg.id} className={`p-8 rounded-[40px] border bg-white ${pkg.isRecommended ? 'shadow-2xl border-pink-200 z-10 scale-105 md:scale-110' : 'shadow-lg border-slate-100'}`}>
            <div className="mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${pkg.isRecommended ? 'bg-pink-500 text-white' : pkg.bg}`}>{pkg.icon}</div>
              <h3 className="text-lg font-black">{pkg.label}</h3>
            </div>
            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black tracking-tight">{pkg.points.toLocaleString()}</span>
                <span className="text-sm font-bold text-slate-400">pt</span>
              </div>
              <p className="text-sm font-bold text-slate-400 mt-1">¥{pkg.amount.toLocaleString()}</p>
            </div>
            <button 
              onClick={() => handleCheckout(pkg)} 
              disabled={!!processingId} 
              className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${pkg.isRecommended ? 'bg-pink-500 text-white' : 'bg-slate-800 text-white'}`}
            >
              {processingId === pkg.id ? <Loader2 className="animate-spin" /> : <>購入する <ArrowRight size={18} /></>}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}

/**
 * 【静的部分】
 * メインエクスポート。ここを Suspense だけで包むことで
 * Next.js 15 のビルドエンジンに対して「中身は実行時まで触るな」と指示します。
 */
export default function PointsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
      </div>
    }>
      <PointsCore />
    </Suspense>
  );
}