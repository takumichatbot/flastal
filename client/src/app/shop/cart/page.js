'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { ShoppingCart, Trash2, Plus, Minus, ChevronRight, Truck, Package, ArrowLeft } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
const FREE_SHIPPING_THRESHOLD = 10000;
const SHIPPING_FEE = 800;
const TAX_RATE = 0.10;

export default function CartPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const cancelled = searchParams.get('cancelled');

  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);

  const isFlorist = user?.role === 'FLORIST';

  const fetchCart = useCallback(async () => {
    if (!isFlorist || !token) { setLoading(false); return; }
    const res = await fetch(`${API_URL}/api/shop/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setCart(await res.json());
    setLoading(false);
  }, [isFlorist, token]);

  useEffect(() => {
    fetchCart();
    if (cancelled) toast('決済をキャンセルしました', { icon: '↩️' });
  }, [fetchCart, cancelled]);

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) return removeItem(productId);
    setUpdating(productId);
    try {
      const res = await fetch(`${API_URL}/api/shop/cart`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchCart();
    } catch (err) {
      toast.error(err.message || '更新に失敗しました');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (productId) => {
    setUpdating(productId);
    try {
      const res = await fetch(`${API_URL}/api/shop/cart/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      await fetchCart();
      toast.success('カートから削除しました');
    } catch {
      toast.error('削除に失敗しました');
    } finally {
      setUpdating(null);
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const res = await fetch(`${API_URL}/api/shop/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      window.location.href = data.url;
    } catch (err) {
      toast.error(err.message || 'チェックアウトに失敗しました');
      setCheckingOut(false);
    }
  };

  if (!isFlorist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <ShoppingCart size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 mb-4">花屋アカウントでログインが必要です</p>
          <Link href="/florists/login" className="bg-sky-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-sky-600 transition-colors">
            花屋ログイン
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = cart.items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + tax + shippingFee;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/shop" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-black text-slate-800">
            カート
            {cart.items.length > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-400">({cart.items.length}点)</span>
            )}
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cart.items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium mb-2">カートに商品がありません</p>
            <p className="text-slate-400 text-sm mb-6">花材や資材を探してみましょう</p>
            <Link href="/shop" className="bg-sky-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-sky-600 transition-colors">
              ショップに戻る
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* カートアイテム一覧 */}
            <div className="lg:col-span-2 space-y-3">
              {cart.items.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-4 items-start">
                  <Link href={`/shop/product/${item.productId}`} className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                    {item.product.images?.[0] ? (
                      <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        {item.product.category?.emoji || '🌸'}
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link href={`/shop/product/${item.productId}`}>
                      <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 hover:text-sky-600 transition-colors mb-1">
                        {item.product.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-400 mb-2">
                      {item.product.category?.emoji} {item.product.category?.name}
                    </p>
                    <p className="text-base font-black text-slate-800">
                      ¥{Math.round(item.product.price * 1.1 * item.quantity).toLocaleString()}
                      <span className="text-xs font-normal text-slate-400 ml-1">税込</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      ¥{Math.round(item.product.price * 1.1).toLocaleString()} × {item.quantity}{item.product.unit}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <button
                      onClick={() => removeItem(item.productId)}
                      disabled={updating === item.productId}
                      className="text-slate-300 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        disabled={updating === item.productId}
                        className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-50"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">
                        {updating === item.productId ? (
                          <span className="w-4 h-4 border border-sky-500 border-t-transparent rounded-full animate-spin inline-block" />
                        ) : item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={updating === item.productId || item.quantity >= item.product.stock}
                        className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-50"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 注文サマリー */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-slate-100 p-5 sticky top-20">
                <h2 className="text-base font-black text-slate-800 mb-4">注文サマリー</h2>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between text-slate-600">
                    <span>小計（税抜）</span>
                    <span>¥{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>消費税（10%）</span>
                    <span>¥{tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      <Truck size={13} /> 送料
                    </span>
                    <span className={shippingFee === 0 ? 'text-emerald-600 font-bold' : ''}>
                      {shippingFee === 0 ? '無料' : `¥${shippingFee.toLocaleString()}`}
                    </span>
                  </div>
                  {subtotal < FREE_SHIPPING_THRESHOLD && (
                    <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                      あと¥{(FREE_SHIPPING_THRESHOLD - subtotal).toLocaleString()}で送料無料
                    </p>
                  )}
                  <div className="border-t border-slate-100 pt-2 flex justify-between font-black text-slate-800 text-base">
                    <span>合計（税込）</span>
                    <span>¥{total.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkingOut || cart.items.length === 0}
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 shadow-lg shadow-sky-200"
                >
                  {checkingOut ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Stripeで支払う <ChevronRight size={16} />
                    </>
                  )}
                </button>

                <p className="text-xs text-slate-400 text-center mt-3">
                  安全なStripe決済。カード情報はFLASTALに送信されません。
                </p>

                <Link href="/shop" className="block text-center text-sm text-sky-500 hover:underline mt-4">
                  ← ショップに戻る
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
