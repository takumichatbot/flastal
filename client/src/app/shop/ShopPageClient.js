'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { ShoppingCart, Search, Package, ChevronRight, Tag, Star, Truck } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...c) { return c.filter(Boolean).join(' '); }

const FREE_SHIPPING_THRESHOLD = 10000;
const SHIPPING_FEE = 800;

function ProductCard({ product, onAddToCart, cartLoading }) {
  const discount = product.comparePrice
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col">
      <Link href={`/shop/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-slate-50">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {product.category?.emoji || '🌸'}
          </div>
        )}
        {discount && (
          <span className="absolute top-2 left-2 bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {discount}% OFF
          </span>
        )}
        {product.isFeatured && (
          <span className="absolute top-2 right-2 bg-amber-400 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Star size={10} /> おすすめ
          </span>
        )}
        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute bottom-2 left-2 bg-orange-500/90 text-white text-xs px-2 py-0.5 rounded-full">
            残り{product.stock}{product.unit}
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-bold text-sm">在庫切れ</span>
          </div>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <span className="text-xs text-sky-500 font-medium mb-1">
          {product.category?.emoji} {product.category?.name}
        </span>
        <Link href={`/shop/product/${product.id}`}>
          <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 mb-2 hover:text-sky-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg font-black text-slate-800">
              ¥{(product.price * 1.1).toLocaleString('ja-JP', { maximumFractionDigits: 0 })}
              <span className="text-xs font-normal text-slate-400 ml-1">税込</span>
            </span>
            {product.comparePrice && (
              <span className="text-xs text-slate-400 line-through">
                ¥{Math.round(product.comparePrice * 1.1).toLocaleString()}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 mb-3">
            税抜 ¥{product.price.toLocaleString()} / {product.unit}
            {product.minOrder > 1 && <span className="ml-2 text-amber-600">最低{product.minOrder}{product.unit}〜</span>}
          </div>

          <button
            onClick={() => onAddToCart(product)}
            disabled={product.stock === 0 || cartLoading === product.id}
            className={cn(
              "w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
              product.stock === 0
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-sky-500 hover:bg-sky-600 text-white active:scale-95"
            )}
          >
            {cartLoading === product.id ? (
              <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <ShoppingCart size={15} />
            )}
            {product.stock === 0 ? '在庫切れ' : 'カートに追加'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FloristShopPage() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(null);
  const [activeCategory, setActiveCategory] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 24;

  const isFlorist = user?.role === 'FLORIST';

  const fetchCategories = useCallback(async () => {
    const res = await fetch(`${API_URL}/api/shop/categories`);
    if (res.ok) setCategories(await res.json());
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (activeCategory) params.set('category', activeCategory);
    if (search) params.set('q', search);

    try {
      const res = await fetch(`${API_URL}/api/shop/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setTotal(data.total);
      } else {
        throw new Error();
      }
    } catch {
      toast.error('商品の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [activeCategory, search, page]);

  const fetchCartCount = useCallback(async () => {
    if (!isFlorist || !token) return;
    const res = await fetch(`${API_URL}/api/shop/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setCartCount(data.items?.length || 0);
    }
  }, [isFlorist, token]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount]);

  const handleAddToCart = async (product) => {
    if (!isFlorist) {
      toast.error('花屋アカウントでログインしてください。');
      router.push('/florists/login');
      return;
    }
    setCartLoading(product.id);
    try {
      const res = await fetch(`${API_URL}/api/shop/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id, quantity: product.minOrder || 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCartCount(c => c + 1);
      toast.success(`「${product.name}」をカートに追加しました`);
    } catch (err) {
      toast.error(err.message || 'カートへの追加に失敗しました');
    } finally {
      setCartLoading(null);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      {/* ヘッダー */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-black text-slate-800">🌸 花屋さん向けショップ</h1>
            <p className="text-xs text-slate-400">花材・資材・梱包材を仕入れる</p>
          </div>
          <div className="flex items-center gap-3">
            {isFlorist && (
              <>
                <Link href="/shop/orders" className="text-xs text-slate-500 hover:text-sky-600 transition-colors">
                  注文履歴
                </Link>
                <Link href="/shop/cart" className="relative">
                  <div className="bg-sky-500 text-white p-2.5 rounded-xl hover:bg-sky-600 transition-colors">
                    <ShoppingCart size={18} />
                  </div>
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center min-w-[18px] px-1">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </>
            )}
            {!isFlorist && (
              <Link href="/florists/login" className="text-xs bg-sky-500 text-white px-3 py-1.5 rounded-lg hover:bg-sky-600 transition-colors">
                花屋でログイン
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 送料無料バナー */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
          <Truck size={18} className="text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-700 font-medium">
            ¥{FREE_SHIPPING_THRESHOLD.toLocaleString()}以上のご注文で<strong>送料無料</strong>
            <span className="text-emerald-500 text-xs ml-2">（¥{SHIPPING_FEE}未満は送料¥{SHIPPING_FEE}）</span>
          </p>
        </div>

        <div className="flex gap-6">
          {/* サイドバー：カテゴリ */}
          <aside className="hidden md:block w-52 shrink-0">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 sticky top-20">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">カテゴリ</h2>
              <button
                onClick={() => { setActiveCategory(''); setPage(1); }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm font-medium mb-1 transition-colors",
                  !activeCategory ? "bg-sky-50 text-sky-700" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                すべての商品
                <span className="float-right text-xs text-slate-400">{total}</span>
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.slug); setPage(1); }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm font-medium mb-1 transition-colors",
                    activeCategory === cat.slug ? "bg-sky-50 text-sky-700" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {cat.emoji} {cat.name}
                  <span className="float-right text-xs text-slate-400">{cat._count?.products || 0}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* メインコンテンツ */}
          <main className="flex-1 min-w-0">
            {/* 検索 */}
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="商品を検索..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
              />
            </div>

            {/* モバイルカテゴリ横スクロール */}
            <div className="md:hidden flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
              <button
                onClick={() => { setActiveCategory(''); setPage(1); }}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  !activeCategory ? "bg-sky-500 text-white border-sky-500" : "bg-white text-slate-600 border-slate-200"
                )}
              >
                すべて
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.slug); setPage(1); }}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    activeCategory === cat.slug ? "bg-sky-500 text-white border-sky-500" : "bg-white text-slate-600 border-slate-200"
                  )}
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
            </div>

            {/* 件数・ソート */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">
                {loading ? '読み込み中...' : `${total}件の商品`}
              </p>
            </div>

            {/* 商品グリッド */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                    <div className="aspect-square bg-slate-100" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-slate-100 rounded w-2/3" />
                      <div className="h-4 bg-slate-100 rounded" />
                      <div className="h-8 bg-slate-100 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <Package size={40} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-400 font-medium">該当する商品がありません</p>
                <button onClick={() => { setSearch(''); setActiveCategory(''); }} className="mt-3 text-sky-500 text-sm hover:underline">
                  すべての商品を見る
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    cartLoading={cartLoading}
                  />
                ))}
              </div>
            )}

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {page > 1 && (
                  <button onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50">
                    前へ
                  </button>
                )}
                <span className="px-4 py-2 text-sm text-slate-500">
                  {page} / {totalPages}
                </span>
                {page < totalPages && (
                  <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50">
                    次へ
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
