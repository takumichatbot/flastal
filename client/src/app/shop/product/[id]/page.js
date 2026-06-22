'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { ShoppingCart, ChevronLeft, Plus, Minus, Package, Truck, Star, Tag } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
const FREE_SHIPPING_THRESHOLD = 10000;
const SHIPPING_FEE = 800;

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const router = useRouter();
  const isFlorist = user?.role === 'FLORIST';

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    (async () => {
      const res = await fetch(`${API_URL}/api/shop/products/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
        setQuantity(data.minOrder || 1);
      } else {
        toast.error('商品が見つかりません');
        router.push('/shop');
      }
      setLoading(false);
    })();
  }, [id, router]);

  const handleAddToCart = async () => {
    if (!isFlorist) {
      toast.error('花屋アカウントでログインしてください。');
      router.push('/florists/login');
      return;
    }
    if (quantity < product.minOrder) {
      toast.error(`最低注文数は${product.minOrder}${product.unit}です`);
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(`${API_URL}/api/shop/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id, quantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('カートに追加しました');
    } catch (err) {
      toast.error(err.message || 'エラーが発生しました');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!product) return null;

  const priceWithTax = Math.round(product.price * 1.1);
  const comparePriceWithTax = product.comparePrice ? Math.round(product.comparePrice * 1.1) : null;
  const discount = product.comparePrice
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* パンくずリスト */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/shop" className="hover:text-sky-600 flex items-center gap-1">
            <ChevronLeft size={13} /> ショップ
          </Link>
          <span>/</span>
          <span>{product.category?.emoji} {product.category?.name}</span>
          <span>/</span>
          <span className="text-slate-700 font-medium line-clamp-1">{product.name}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 画像エリア */}
          <div>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-white border border-slate-100 mb-3">
              {product.images?.[activeImg] ? (
                <Image
                  src={product.images[activeImg]}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">
                  {product.category?.emoji || '🌸'}
                </div>
              )}
              {discount && (
                <span className="absolute top-3 left-3 bg-rose-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                  {discount}% OFF
                </span>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-colors ${
                      i === activeImg ? 'border-sky-500' : 'border-transparent'
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 商品情報 */}
          <div className="flex flex-col">
            <span className="text-sm text-sky-500 font-medium mb-2">
              {product.category?.emoji} {product.category?.name}
            </span>
            {product.isFeatured && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full w-fit mb-3">
                <Star size={12} /> おすすめ商品
              </span>
            )}
            <h1 className="text-xl md:text-2xl font-black text-slate-800 mb-4">{product.name}</h1>

            {/* 価格 */}
            <div className="bg-sky-50 rounded-2xl p-4 mb-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-slate-800">
                  ¥{priceWithTax.toLocaleString()}
                  <span className="text-sm font-normal text-slate-400 ml-1">税込</span>
                </span>
                {comparePriceWithTax && (
                  <span className="text-base text-slate-400 line-through">¥{comparePriceWithTax.toLocaleString()}</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                税抜 ¥{product.price.toLocaleString()} / {product.unit}
              </p>
            </div>

            {/* 在庫・注文条件 */}
            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-2 text-sm">
                <Package size={15} className="text-slate-400" />
                <span className="text-slate-600">
                  在庫：
                  <span className={product.stock === 0 ? 'text-rose-500 font-bold' : product.stock <= 10 ? 'text-orange-500 font-bold' : 'text-emerald-600 font-bold'}>
                    {product.stock === 0 ? '在庫切れ' : `残り${product.stock}${product.unit}`}
                  </span>
                </span>
              </div>
              {product.minOrder > 1 && (
                <div className="flex items-center gap-2 text-sm">
                  <Tag size={15} className="text-slate-400" />
                  <span className="text-slate-600">最低注文数：{product.minOrder}{product.unit}〜</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Truck size={15} className="text-slate-400" />
                <span className="text-slate-600">
                  ¥{FREE_SHIPPING_THRESHOLD.toLocaleString()}以上で送料無料（未満は¥{SHIPPING_FEE}）
                </span>
              </div>
            </div>

            {/* 数量選択 */}
            {product.stock > 0 && (
              <div className="mb-5">
                <label className="text-sm font-semibold text-slate-700 mb-2 block">数量</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(q => Math.max(product.minOrder || 1, q - 1))}
                    className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-16 text-center font-bold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                    className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                  <span className="text-sm text-slate-400">{product.unit}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  小計：¥{(priceWithTax * quantity).toLocaleString()}（税込）
                </p>
              </div>
            )}

            {/* カートに追加ボタン */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || adding}
              className={`py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all ${
                product.stock === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-sky-500 hover:bg-sky-600 text-white active:scale-95 shadow-lg shadow-sky-200'
              }`}
            >
              {adding ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ShoppingCart size={18} />
              )}
              {product.stock === 0 ? '在庫切れ' : 'カートに追加'}
            </button>

            {isFlorist && (
              <Link
                href="/shop/cart"
                className="mt-3 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border border-sky-300 text-sky-600 hover:bg-sky-50 transition-colors"
              >
                カートを見る <ChevronLeft size={14} className="rotate-180" />
              </Link>
            )}
          </div>
        </div>

        {/* 商品説明 */}
        {product.description && (
          <div className="mt-8 bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="text-base font-bold text-slate-800 mb-4">商品説明</h2>
            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{product.description}</p>
          </div>
        )}

        {/* タグ */}
        {product.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {product.tags.map(tag => (
              <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
