'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { RefreshCw, Package, ChevronLeft, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const STATUS_LABEL = {
  active: { label: '有効', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: '解約済み', color: 'bg-slate-100 text-slate-500' },
  past_due: { label: '支払い遅延', color: 'bg-rose-100 text-rose-600' },
};

export default function SubscriptionsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFlorist = user?.role === 'FLORIST';

  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    if (searchParams.get('success') === '1') {
      toast.success('定期購入を開始しました！');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isFlorist) return;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/shop/subscriptions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setSubs(await res.json());
      } catch {
        toast.error('定期購入一覧の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    })();
  }, [isFlorist, token]);

  const handleCancel = async (sub) => {
    if (!confirm(`「${sub.product.name}」の定期購入を解約しますか？\n次回以降の請求は停止されます。`)) return;
    setCancelling(sub.id);
    try {
      const res = await fetch(`${API_URL}/api/shop/subscriptions/${sub.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('定期購入を解約しました');
      setSubs(prev => prev.map(s => s.id === sub.id ? { ...s, status: 'cancelled', cancelledAt: new Date().toISOString() } : s));
    } catch (err) {
      toast.error(err.message || '解約に失敗しました');
    } finally {
      setCancelling(null);
    }
  };

  if (!isFlorist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-slate-500">
        <AlertCircle size={40} className="text-slate-300" />
        <p className="font-semibold">花屋アカウントでログインしてください</p>
        <Link href="/florists/login" className="text-sm text-sky-600 underline">ログインページへ</Link>
      </div>
    );
  }

  const activeSubs = subs.filter(s => s.status === 'active');
  const inactiveSubs = subs.filter(s => s.status !== 'active');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/shop" className="text-slate-400 hover:text-slate-600 transition-colors">
              <ChevronLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <RefreshCw size={18} className="text-sky-500" />
              <h1 className="text-base font-black text-slate-800">定期購入</h1>
            </div>
          </div>
          <Link
            href="/shop"
            className="text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl transition-colors"
          >
            + 新しい定期購入を設定
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* 説明バナー */}
        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <RefreshCw size={18} className="text-sky-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-sky-800 mb-0.5">月次自動発注とは？</p>
            <p className="text-xs text-sky-600 leading-relaxed">
              毎月1回、設定した商品を自動で発注・決済します。在庫補充の手間を省けます。いつでも解約可能です。
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : subs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <Package size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="font-bold text-slate-500 mb-2">定期購入はまだありません</p>
            <p className="text-xs text-slate-400 mb-6">商品ページから「定期購入する」を選択して設定できます</p>
            <Link
              href="/shop"
              className="inline-block bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors"
            >
              ショップを見る
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 有効な定期購入 */}
            {activeSubs.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500" /> 有効中 ({activeSubs.length}件)
                </h2>
                <div className="space-y-3">
                  {activeSubs.map(sub => (
                    <SubscriptionCard
                      key={sub.id}
                      sub={sub}
                      onCancel={handleCancel}
                      cancelling={cancelling === sub.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 解約済み・遅延 */}
            {inactiveSubs.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock size={13} /> 過去の定期購入 ({inactiveSubs.length}件)
                </h2>
                <div className="space-y-3">
                  {inactiveSubs.map(sub => (
                    <SubscriptionCard
                      key={sub.id}
                      sub={sub}
                      onCancel={handleCancel}
                      cancelling={cancelling === sub.id}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SubscriptionCard({ sub, onCancel, cancelling }) {
  const priceWithTax = Math.round(sub.product.price * 1.1) * sub.quantity;
  const statusInfo = STATUS_LABEL[sub.status] || { label: sub.status, color: 'bg-slate-100 text-slate-500' };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col sm:flex-row gap-4">
      {/* 商品画像 */}
      <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center text-2xl">
        {sub.product.images?.[0] ? (
          <Image src={sub.product.images[0]} alt={sub.product.name} width={64} height={64} className="w-full h-full object-cover" unoptimized />
        ) : (
          sub.product.category?.emoji || '🌸'
        )}
      </div>

      {/* 商品情報 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link
            href={`/shop/product/${sub.productId}`}
            className="font-bold text-slate-800 text-sm hover:text-sky-600 transition-colors line-clamp-2"
          >
            {sub.product.name}
          </Link>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-2">{sub.product.category?.name} / {sub.quantity}{sub.product.unit}／月</p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="font-bold text-slate-700 text-sm">
            月額 ¥{priceWithTax.toLocaleString()}<span className="text-xs font-normal text-slate-400 ml-1">税込</span>
          </span>
          {sub.nextBillingDate && sub.status === 'active' && (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              次回請求：{new Date(sub.nextBillingDate).toLocaleDateString('ja-JP')}
            </span>
          )}
          {sub.cancelledAt && (
            <span className="text-slate-400">
              解約日：{new Date(sub.cancelledAt).toLocaleDateString('ja-JP')}
            </span>
          )}
        </div>
      </div>

      {/* 解約ボタン */}
      {sub.status === 'active' && (
        <div className="flex items-center shrink-0">
          <button
            onClick={() => onCancel(sub)}
            disabled={cancelling}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 border border-rose-200 hover:border-rose-300 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            {cancelling ? (
              <span className="w-4 h-4 border border-rose-400 border-t-transparent rounded-full animate-spin inline-block" />
            ) : '解約する'}
          </button>
        </div>
      )}
    </div>
  );
}
