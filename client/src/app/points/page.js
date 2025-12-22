'use client';

// プリレンダリングを強制停止
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { CreditCard, ShieldCheck, Zap, Star, Gem, ArrowRight, Info, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const POINT_PACKAGES = [
  { id: 'starter', points: 1000, amount: 1000, label: 'Starter', icon: <Zap className="w-6 h-6 text-emerald-500" />, bg: "bg-emerald-50", description: 'まずは少しだけ。' },
  { id: 'standard', points: 5000, amount: 5000, label: 'Standard', icon: <Star className="w-6 h-6 text-white" />, isRecommended: true, bg: "bg-white", description: '一番人気。' },
  { id: 'premium', points: 10000, amount: 10000, label: 'Premium', icon: <Gem className="w-6 h-6 text-purple-500" />, bg: "bg-purple-50", description: 'たっぷり応援。' },
];

function PointsPageContent() {
  const { user, loading: authLoading } = useAuth();
  const [processingId, setProcessingId] = useState(null);
  const router = useRouter();

  // useSearchParams の代わりに window.location.search を使用（副作用内なのでビルドを壊さない）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      // 必要ならここで params.get('xxx') を実行
    }
  }, []);

  const handleCheckout = async (pkg) => {
    if (!user) {
      toast.error('ログインが必要です');
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
      if (data.url) { window.location.href = data.url; }
      else { throw new Error('決済URLの取得に失敗しました'); }
    } catch (error) {
      toast.error(error.message);
      setProcessingId(null);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Link href="/login" className="px-6 py-3 bg-pink-500 text-white rounded-full font-bold shadow-lg">ログインして購入</Link>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen p-8">
      <div className="max-w-6xl mx-auto text-center pt-20">
        <h1 className="text-4xl font-black mb-12">ポイントチャージ</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {POINT_PACKAGES.map((pkg) => (
            <div key={pkg.id} className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 flex flex-col items-center">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">{pkg.icon}</div>
              <h3 className="text-xl font-bold mb-4">{pkg.label}</h3>
              <p className="text-3xl font-black mb-2">{pkg.points.toLocaleString()} pt</p>
              <p className="text-sm text-slate-400 mb-8">¥{pkg.amount.toLocaleString()} (税込)</p>
              <button 
                onClick={() => handleCheckout(pkg)}
                disabled={!!processingId}
                className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 transition-all disabled:opacity-50"
              >
                {processingId === pkg.id ? <Loader2 className="animate-spin mx-auto" /> : "購入する"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PointsPage() {
  return (
    <Suspense fallback={null}>
      <PointsPageContent />
    </Suspense>
  );
}