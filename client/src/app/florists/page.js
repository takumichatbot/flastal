'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Search, MapPin, Camera, Loader2, Zap, Award, Filter, Star,
  Sparkles, ChevronRight, User, Send, Truck, ArrowLeft, X, SlidersHorizontal,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

const extractPrefecture = (address) => {
  if (!address) return '非公開';
  const prefs = [
    '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
    '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
    '新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県',
    '静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県',
    '奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県',
    '徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県',
    '熊本県','大分県','宮崎県','鹿児島県','沖縄県',
  ];
  return prefs.find(p => address.includes(p)) || address;
};

const STYLE_TAGS = [
  'かわいい/キュート','クール/かっこいい','おしゃれ/モダン','和風/和モダン',
  'ゴージャス/豪華','パステルカラー','ビビッドカラー','ニュアンスカラー',
  'バルーン装飾','ペーパーフラワー','布・リボン装飾','キャラクター/モチーフ',
  '大型/連結','卓上/楽屋花','リーズナブル',
];

const PREFECTURES = [
  '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
  '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
  '新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県',
  '静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県',
  '奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県',
  '徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県',
  '熊本県','大分県','宮崎県','鹿児島県','沖縄県','全国対応',
];

// ── Skeleton ─────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white/50 rounded-[2rem] border border-white overflow-hidden animate-pulse">
      <div className="h-44 bg-slate-100" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-100 rounded-full w-3/4" />
        <div className="flex gap-2">
          <div className="h-3 bg-slate-100 rounded-full w-12" />
          <div className="h-3 bg-slate-100 rounded-full w-12" />
        </div>
        <div className="h-3 bg-slate-100 rounded-full w-1/2" />
        <div className="h-10 bg-slate-100 rounded-2xl w-full mt-2" />
      </div>
    </div>
  );
}

// ── FloristCard ───────────────────────────────────────────────
function FloristCard({ florist, projectId, onOffer, isOffering }) {
  const thumb = florist.portfolioImages?.[0] || florist.iconUrl;

  const body = (
    <div className="group h-full flex flex-col bg-white border border-slate-100 rounded-[2rem] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(244,114,182,0.12)] hover:border-pink-200">
      {/* Thumbnail */}
      <div className="relative h-44 bg-slate-100 shrink-0 overflow-hidden">
        {thumb ? (
          <Image src={thumb} alt={florist.platformName || ''} fill sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-slate-50 opacity-40">💐</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent" />
        {florist.acceptsRushOrders && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-amber-500 text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 border border-white">
            <Zap size={11} className="fill-amber-500" /> お急ぎOK
          </div>
        )}
        <div className="absolute -bottom-5 left-4 w-12 h-12 rounded-[0.75rem] border-2 border-white shadow-lg overflow-hidden bg-white z-20">
          {florist.iconUrl ? (
            <Image src={florist.iconUrl} alt="" fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300"><User size={20} /></div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="pt-7 px-4 pb-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="min-w-0">
            <h3 className="font-black text-slate-800 group-hover:text-pink-500 transition-colors text-base leading-tight truncate">
              {florist.platformName || florist.shopName}
            </h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
              <Award size={9} /> Florist Partner
            </p>
          </div>
          {florist.reviewCount > 0 && (
            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg shrink-0 border border-yellow-100">
              <Star size={11} className="fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-black text-yellow-600">{florist.averageRating?.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {(florist.specialties || []).slice(0, 3).map(tag => (
            <span key={tag} className="text-[9px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md border border-slate-100 font-bold">
              #{tag.split('/')[0]}
            </span>
          ))}
          {(florist.specialties || []).length > 3 && (
            <span className="text-[9px] text-slate-400 font-bold px-1 flex items-center">
              +{florist.specialties.length - 3}
            </span>
          )}
        </div>

        <div className="mt-auto">
          <div className="border-t border-slate-100 pt-3 space-y-1.5 mb-3">
            <div className="flex items-center text-xs font-bold text-slate-500 gap-1.5">
              <MapPin size={12} className="text-slate-300 shrink-0" />
              <span className="truncate">店舗: {extractPrefecture(florist.address)}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
              <span className="flex items-center gap-1 truncate max-w-[65%]">
                <Truck size={12} className="shrink-0" />
                <span className="truncate">{florist.baseDeliveryArea || '全国対応'}</span>
              </span>
              <span className="shrink-0 font-black text-[10px]">
                {!florist.baseDeliveryFee ? '送料無料' : `送料${florist.baseDeliveryFee.toLocaleString()}円〜`}
              </span>
            </div>
          </div>

          {projectId ? (
            <button
              onClick={e => { e.preventDefault(); onOffer(florist.id); }}
              disabled={isOffering}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-black rounded-2xl hover:shadow-lg hover:shadow-pink-200 transition-all disabled:opacity-50 flex justify-center items-center gap-1.5"
            >
              {isOffering ? <Loader2 className="animate-spin" size={14} /> : <><Send size={13} /> この花屋さんにオファー</>}
            </button>
          ) : (
            <div className="w-full py-3 text-center text-xs font-black text-pink-500 bg-pink-50 rounded-2xl group-hover:bg-pink-500 group-hover:text-white transition-all flex items-center justify-center gap-1">
              詳細を見る <ChevronRight size={13} />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (projectId) return <div className="h-full cursor-pointer">{body}</div>;
  return <Link href={`/florists/${florist.id}`} className="block h-full cursor-pointer">{body}</Link>;
}

// ── Filter Sheet (mobile bottom drawer) ──────────────────────
function FilterSheet({ filters, onFilterChange, onTagSelect, onClose }) {
  const activeCount = [filters.prefecture, filters.tag, filters.isRush, filters.sort !== 'newest'].filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-t-[2.5rem] shadow-2xl max-h-[80vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-800">絞り込み</h3>
            {activeCount > 0 && (
              <p className="text-[10px] font-bold text-pink-500 mt-0.5">{activeCount}件の条件を適用中</p>
            )}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* Prefecture */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">配送エリア</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <select name="prefecture" value={filters.prefecture} onChange={onFilterChange}
                className="w-full pl-10 pr-8 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none appearance-none cursor-pointer font-bold text-slate-700 text-[16px]">
                <option value="">すべてのエリア</option>
                {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <Filter size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Rush */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">オプション</label>
            <label className={cn(
              'flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all',
              filters.isRush ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-100',
            )}>
              <input type="checkbox" name="isRush" checked={filters.isRush} onChange={onFilterChange} className="sr-only" />
              <Zap size={18} className={filters.isRush ? 'text-amber-500 fill-amber-500' : 'text-slate-400'} />
              <span className={cn('text-sm font-black', filters.isRush ? 'text-amber-700' : 'text-slate-600')}>お急ぎ便対応可能のみ表示</span>
            </label>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">並び順</label>
            <div className="flex gap-2">
              {[{ value: 'newest', label: '新着順' }, { value: 'reviews', label: '実績数順' }].map(opt => (
                <button key={opt.value} onClick={() => onFilterChange({ target: { name: 'sort', value: opt.value, type: 'select-one' } })}
                  className={cn(
                    'flex-1 py-2.5 text-xs rounded-2xl font-black transition-all border',
                    filters.sort === opt.value ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-100',
                  )}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Style tags */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">スタイル</label>
            <div className="flex flex-wrap gap-2">
              {STYLE_TAGS.map(tag => (
                <button key={tag} onClick={() => onTagSelect(tag)}
                  className={cn(
                    'px-3.5 py-2 text-xs rounded-full font-black transition-all border',
                    filters.tag === tag ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200',
                  )}>
                  {tag.split('/')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100">
          <button onClick={onClose}
            className="w-full h-12 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-2xl shadow-lg shadow-pink-200 text-sm">
            この条件で絞り込む
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Content ──────────────────────────────────────────────
function FloristsListContent() {
  const { user, authenticatedFetch } = useAuth();
  const [florists, setFlorists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffering, setIsOffering] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const loaderRef = useRef(null);

  const fileInputRef = useRef(null);
  const [isSearchingImage, setIsSearchingImage] = useState(false);
  const [detectedTags, setDetectedTags] = useState([]);

  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({ keyword: '', prefecture: '', isRush: false, tag: '', sort: 'newest' });

  useEffect(() => {
    setProjectId(searchParams.get('projectId'));
    setFilters({
      keyword: searchParams.get('keyword') || '',
      prefecture: searchParams.get('prefecture') || '',
      isRush: searchParams.get('rush') === 'true',
      tag: searchParams.get('tag') || '',
      sort: searchParams.get('sort') || 'newest',
    });
  }, [searchParams]);

  const fetchFlorists = useCallback(async (f) => {
    setLoading(true);
    try {
      const url = new URL(`${API_URL}/api/florists`);
      if (f.keyword?.trim()) url.searchParams.append('keyword', f.keyword);
      if (f.prefecture?.trim()) url.searchParams.append('prefecture', f.prefecture);
      if (f.isRush) url.searchParams.append('rush', 'true');
      if (f.tag) url.searchParams.append('tag', f.tag);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error();
      let data = await res.json();

      if (f.sort === 'reviews') {
        data = [...data].sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
      }
      setFlorists(data);

      const params = new URLSearchParams();
      if (f.keyword) params.set('keyword', f.keyword);
      if (f.prefecture) params.set('prefecture', f.prefecture);
      if (f.isRush) params.set('rush', 'true');
      if (f.tag) params.set('tag', f.tag);
      if (f.sort && f.sort !== 'newest') params.set('sort', f.sort);
      if (projectId) params.set('projectId', projectId);
      router.replace(`/florists?${params.toString()}`, { scroll: false });
    } catch { toast.error('お花屋さん一覧の取得に失敗しました'); }
    finally { setLoading(false); }
  }, [router, projectId]);

  useEffect(() => {
    const t = setTimeout(() => fetchFlorists(filters), 300);
    return () => clearTimeout(t);
  }, [filters, fetchFlorists]);

  // フィルター変更時に表示件数リセット
  useEffect(() => { setVisibleCount(20); }, [filters]);

  // Infinite Scroll
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisibleCount(prev => prev + 20); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };
  const handleTagSelect = (tag) => setFilters(p => ({ ...p, tag: p.tag === tag ? '' : tag }));
  const handleReset = () => { setFilters({ keyword: '', prefecture: '', isRush: false, tag: '', sort: 'newest' }); setDetectedTags([]); };

  const handleImageSearch = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsSearchingImage(true);
    setDetectedTags([]);
    const tid = toast.loading('AIが画像を解析中...');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const res = await fetch(`${API_URL}/api/ai/search-florist-by-image`, {
        method: 'POST', body: fd, headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const first = data.analyzedTags[0] || '';
      setDetectedTags(data.analyzedTags);
      setFilters(p => ({ ...p, tag: first }));
      toast.success(`「${first}」などの特徴が見つかりました！`, { id: tid });
    } catch { toast.error('画像検索に失敗しました', { id: tid }); }
    finally { setIsSearchingImage(false); e.target.value = ''; }
  };

  const handleOffer = async (floristId) => {
    if (!projectId) return;
    if (!user) return toast.error('ログインが必要です');
    setIsOffering(true);
    const tid = toast.loading('オファー送信中...');
    try {
      const res = await authenticatedFetch(`${API_URL}/api/florists/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, floristId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'オファーの送信に失敗しました');
      toast.success('オファーを送信しました！🎉\nお花屋さんからの返答をお待ちください。', { id: tid, duration: 6000 });
      router.push('/mypage');
    } catch (err) {
      toast.error(err.message, { id: tid, duration: 5000 });
    } finally {
      setIsOffering(false);
    }
  };

  const activeFilterCount = [filters.prefecture, filters.tag, filters.isRush].filter(Boolean).length;

  return (
    <div className="bg-[#FAF8F5] min-h-screen font-sans text-slate-800">

      {/* ── Fixed Header ─────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        {/* Title row */}
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:bg-slate-200 transition-colors shrink-0">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            {projectId ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-full text-xs">
                  オファー先を選択中
                </span>
              </div>
            ) : (
              <h1 className="font-black text-slate-800 text-base">お花屋さんを探す</h1>
            )}
          </div>
          {/* AI image search button */}
          <button
            onClick={() => fileInputRef.current.click()}
            disabled={isSearchingImage}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-purple-200 active:scale-95 transition-transform shrink-0"
          >
            {isSearchingImage ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImageSearch} accept="image/*" className="hidden" />
        </div>

        {/* Search + filter row */}
        <div className="max-w-7xl mx-auto px-4 pb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
            <input
              type="text" name="keyword" value={filters.keyword} onChange={handleFilterChange}
              placeholder="キーワードで検索..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-100 rounded-full text-[16px] font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-pink-200 transition-all text-sm"
            />
          </div>
          <button
            onClick={() => setIsFilterOpen(true)}
            className={cn(
              'h-10 px-3 rounded-full flex items-center gap-1.5 font-black text-xs border transition-all shrink-0',
              activeFilterCount > 0
                ? 'bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-200'
                : 'bg-white text-slate-500 border-slate-200',
            )}
          >
            <SlidersHorizontal size={14} />
            {activeFilterCount > 0 ? `絞り込み (${activeFilterCount})` : '絞り込み'}
          </button>
        </div>

        {/* AI detected tag chips */}
        <AnimatePresence>
          {detectedTags.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden">
              <div className="px-4 pb-2.5 flex gap-2 overflow-x-auto">
                <span className="text-[10px] font-black text-purple-500 flex items-center gap-1 shrink-0">
                  <Sparkles size={10} /> AI検出:
                </span>
                {detectedTags.map(tag => (
                  <button key={tag} onClick={() => handleTagSelect(tag)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-black border shrink-0 transition-all',
                      filters.tag === tag ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-500 border-purple-200',
                    )}>
                    #{tag}
                  </button>
                ))}
                <button onClick={() => setDetectedTags([])} className="shrink-0 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active style tag chip row */}
        {filters.tag && !detectedTags.includes(filters.tag) && (
          <div className="px-4 pb-2.5 flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400">スタイル:</span>
            <span className="px-3 py-1 bg-slate-900 text-white text-xs font-black rounded-full flex items-center gap-1">
              {filters.tag.split('/')[0]}
              <button onClick={() => setFilters(p => ({ ...p, tag: '' }))} className="ml-1">
                <X size={11} />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* ── Content ──────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-5 pb-20">
        {/* Offer mode banner */}
        {projectId && (
          <div className="mb-4 p-4 bg-pink-50 border border-pink-200 rounded-2xl flex items-center justify-between gap-3">
            <p className="text-sm font-black text-pink-700">この企画へのオファー先を選んでください</p>
            <button onClick={() => router.back()} className="text-xs font-bold text-slate-500 bg-white border border-slate-100 px-3 py-1.5 rounded-full">
              キャンセル
            </button>
          </div>
        )}

        {/* Result count */}
        <div className="flex justify-between items-center mb-4 px-1">
          <p className="text-sm font-black text-slate-600">
            {loading ? '検索中...' : `${florists.length}件のお花屋さん`}
          </p>
          {(activeFilterCount > 0 || filters.keyword) && !loading && (
            <button onClick={handleReset} className="text-xs font-bold text-pink-500 flex items-center gap-1">
              <X size={12} /> 条件をリセット
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : florists.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
              <AnimatePresence>
                {florists.slice(0, visibleCount).map((f, i) => (
                  <motion.div key={f.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="h-full">
                    <FloristCard florist={f} projectId={projectId} onOffer={handleOffer} isOffering={isOffering} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {visibleCount < florists.length && (
              <div ref={loaderRef} className="flex justify-center py-10">
                <div className="w-6 h-6 rounded-full border-2 border-pink-300 border-t-pink-500 animate-spin" />
              </div>
            )}
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-white/60 backdrop-blur-md rounded-[2.5rem] border border-white shadow-sm p-16 text-center mt-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Search size={28} />
            </div>
            <p className="text-base font-black text-slate-800 mb-2">条件に合うお花屋さんが見つかりませんでした</p>
            <p className="text-sm font-bold text-slate-500 mb-6">別のキーワードやエリアで検索してみてください🌸</p>
            <button onClick={handleReset}
              className="px-6 py-3 bg-slate-900 text-white font-black rounded-full text-sm">
              条件をリセット
            </button>
          </motion.div>
        )}
      </div>

      {/* ── Filter Sheet ─────────────────────────────── */}
      <AnimatePresence>
        {isFilterOpen && (
          <FilterSheet
            filters={filters}
            onFilterChange={handleFilterChange}
            onTagSelect={(tag) => { handleTagSelect(tag); }}
            onClose={() => setIsFilterOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FloristsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-pink-50/50">
        <Loader2 className="animate-spin text-pink-500" size={40} />
      </div>
    }>
      <FloristsListContent />
    </Suspense>
  );
}
