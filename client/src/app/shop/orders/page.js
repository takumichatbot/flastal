'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Package, CheckCircle2, Truck, Clock, XCircle, ArrowLeft, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const STATUS_CONFIG = {
  PENDING:    { label: '支払い待ち', icon: Clock,         color: 'text-amber-600  bg-amber-50  border-amber-200' },
  PAID:       { label: '支払い完了', icon: CheckCircle2,  color: 'text-sky-600    bg-sky-50    border-sky-200' },
  PROCESSING: { label: '出荷準備中', icon: Package,       color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  SHIPPED:    { label: '発送済み',   icon: Truck,         color: 'text-violet-600 bg-violet-50 border-violet-200' },
  DELIVERED:  { label: '配達完了',   icon: CheckCircle2,  color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  CANCELLED:  { label: 'キャンセル', icon: XCircle,       color: 'text-rose-600   bg-rose-50   border-rose-200' },
  REFUNDED:   { label: '返金済み',   icon: XCircle,       color: 'text-slate-600  bg-slate-50  border-slate-200' },
};

function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = status.icon;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div
        className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${status.color}`}>
            <StatusIcon size={13} />
            {status.label}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              注文 #{order.id.slice(-8).toUpperCase()}
            </p>
            <p className="text-xs text-slate-400">
              {new Date(order.createdAt).toLocaleDateString('ja-JP', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/shop/orders/${order.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-pink-50 text-pink-600 border border-pink-200 hover:bg-pink-100 transition-colors shrink-0"
          >
            <MessageCircle size={13} />
            詳細・チャット
          </Link>
          <div className="text-right shrink-0">
            <p className="text-base font-black text-slate-800">¥{order.total.toLocaleString()}</p>
            <p className="text-xs text-slate-400">{order.items.length}点</p>
          </div>
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-5 space-y-3">
          {/* 注文明細 */}
          {order.items.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                {item.product?.images?.[0] ? (
                  <Image src={item.product.images[0]} alt={item.productName} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">
                    {item.product?.category?.emoji || '📦'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 line-clamp-1">{item.productName}</p>
                <p className="text-xs text-slate-400">
                  ¥{Math.round(item.price * 1.1).toLocaleString()} × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-bold text-slate-700">
                ¥{Math.round(item.price * 1.1 * item.quantity).toLocaleString()}
              </p>
            </div>
          ))}

          {/* 金額サマリー */}
          <div className="border-t border-slate-100 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>小計（税抜）</span>
              <span>¥{order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>消費税</span>
              <span>¥{order.tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>送料</span>
              <span>{order.shippingFee === 0 ? '無料' : `¥${order.shippingFee.toLocaleString()}`}</span>
            </div>
            <div className="flex justify-between font-black text-slate-800 text-base pt-1">
              <span>合計</span>
              <span>¥{order.total.toLocaleString()}</span>
            </div>
          </div>

          {/* 追跡番号 */}
          {order.trackingNumber && (
            <div className="bg-violet-50 rounded-xl p-3 flex items-center gap-2">
              <Truck size={15} className="text-violet-600" />
              <div>
                <p className="text-xs font-semibold text-violet-700">追跡番号</p>
                <p className="text-sm text-violet-800 font-mono">{order.trackingNumber}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const { user, token } = useAuth();
  const searchParams = useSearchParams();
  const success = searchParams.get('success');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const isFlorist = user?.role === 'FLORIST';

  useEffect(() => {
    if (success) {
      toast.success('ご注文ありがとうございます！', { duration: 5000 });
    }
  }, [success]);

  useEffect(() => {
    if (!isFlorist || !token) { setLoading(false); return; }
    (async () => {
      const res = await fetch(`${API_URL}/api/shop/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setOrders(await res.json());
      setLoading(false);
    })();
  }, [isFlorist, token]);

  if (!isFlorist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Package size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 mb-4">花屋アカウントでログインが必要です</p>
          <Link href="/florists/login" className="bg-sky-500 text-white px-6 py-3 rounded-xl font-bold">
            ログイン
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/shop" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-black text-slate-800">注文履歴</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium mb-2">注文履歴がありません</p>
            <Link href="/shop" className="bg-sky-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-sky-600 transition-colors">
              ショップを見る
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
