'use client';

// Next.js のビルド時の静的解析を強制的にスキップ
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Loader2, Zap, Star, Gem } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

/**
 * コンテンツ本体
 */
function PointsPageContent() {
  const { user, isLoading: authLoading } = useAuth();
  const [processingId, setProcessingId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const status = params.get('status');
      
      if (status === 'success') {
        toast.success('決済が完了しました！');
        // パラメータをクリアするためにリプレイス
        router.replace('/points');
      } else if (status === 'cancel') {
        toast.error('決済がキャンセルされました');
        router.replace('/points');
      }
    }
  }, [router]);

  const handlePurchase = async (pkgId, amount, points) => {
    if (!user) {
      toast.error('ログインが必要です');
      router.push('/login');
      return;
    }
    setProcessingId(pkgId);
    try {
      const res = await fetch(`${API_URL}/api/checkout/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, points, userId: user.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('決済URLの取得に失敗しました');
      }
    } catch (error) {
      toast.error(error.message);
      setProcessingId(null);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="bg-slate-50 min-h-screen p-8 pt-24">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-3xl font-black mb-12">ポイントチャージ</h1>
        <div className="grid md:grid-cols-3 gap-6">
          {/* 例: パッケージ1 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <Zap className="mx-auto mb-4 text-emerald-500" />
            <h3 className="font-bold mb-2">1,000 pt</h3>
            <p className="text-slate-400 text-sm mb-6">¥1,000</p>
            <button 
              onClick={() => handlePurchase('p1', 1000, 1000)}
              disabled={!!processingId}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all"
            >
              購入する
            </button>
          </div>
          {/* 他のパッケージも同様に追加... */}
        </div>
      </div>
    </div>
  );
}

/**
 * メインエクスポート
 */
export default function PointsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-300" size={40} />
      </div>
    }>
      <PointsPageContent />
    </Suspense>
  );
}