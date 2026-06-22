'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Calendar, Loader2, SlidersHorizontal,
  PlusCircle, ChevronLeft, X, Heart, Clock, TrendingUp, Sparkles,
} from 'lucide-react';

const PREFECTURES = [
  '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
  '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
  '新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県',
  '静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県',
  '奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県',
  '徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県',
  '熊本県','大分県','宮崎県','鹿児島県','沖縄県',
];

const CATEGORIES = [
  { id: '',          label: 'すべて',   emoji: '🌸' },
  { id: 'idol',      label: 'アイドル', emoji: '🎤' },
  { id: 'vtuber',    label: 'VTuber',   emoji: '💜' },
  { id: 'stage',     label: '舞台',     emoji: '🎭' },
  { id: 'anime',     label: 'アニメ',   emoji: '✨' },
  { id: 'birthday',  label: '生誕祭',   emoji: '🎂' },
  { id: 'voice',     label: '声優',     emoji: '🎙️' },
];

const SORTS = [
  { id: 'newest',   label: '新着順',     icon: Sparkles },
  { id: 'popular',  label: '人気順',     icon: Heart },
  { id: 'deadline', label: '締切が近い', icon: Clock },
  { id: 'percent',  label: '達成率順',   icon: TrendingUp },
];

function cn(...classes) { return classes.filter(Boolean).join(' '); }

// ── Filter Sheet ──────────────────────────────────────────────
function FilterSheet({ open, onClose, prefecture, setPrefecture, sort, setSort, onApply }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[2rem] shadow-2xl overflow-hidden"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            <div className="px-5 pt-2 pb-4 flex items-center justify-between">
              <h3 className="font-black text-slate-800 text-lg">絞り込み・並び替え</h3>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <X size={16} />
              </button>
            </div>

            <div className="px-5 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Sort */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">並び替え</p>
                <div className="grid grid-cols-2 gap-2">
                  {SORTS.map(s => {
                    const Icon = s.icon;
                    const active = sort === s.id;
                    return (
                      <button key={s.id} onClick={() => setSort(s.id)}
                        className={cn(
                          'flex items-center gap-2 px-4 py-3 rounded-2xl font-black text-sm border-2 transition-all',
                          active ? 'border-pink-400 bg-pink-50 text-pink-600' : 'border-slate-100 bg-white text-slate-600',
                        )}>
                        <Icon size={14} /> {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Prefecture */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">都道府県</p>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    value={prefecture}
                    onChange={e => setPrefecture(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 text-[16px]"
                  >
                    <option value="">すべての都道府県</option>
                    {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="px-5 pt-4">
              <button
                onClick={onApply}
                className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-2xl shadow-lg shadow-pink-200 active:scale-[0.98] transition-transform"
              >
                この条件で絞り込む
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Project Card ──────────────────────────────────────────────
function ProjectCard({ project, index }) {
  const router = useRouter();
  const percent = Math.min(Math.round(((project.collectedAmount || 0) / (project.targetAmount || 1)) * 100), 100);
  const isSuccess = percent >= 100;
  const daysLeft = project.deadline
    ? Math.max(0, Math.ceil((new Date(project.deadline) - new Date()) / 86400000))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      onClick={() => router.push(`/projects/${project.id}`)}
      className="bg-white rounded-[1.5rem] overflow-hidden shadow-sm border border-slate-100 cursor-pointer active:scale-[0.98] transition-transform"
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-slate-100 overflow-hidden">
        {project.imageUrl ? (
          <Image src={project.imageUrl} alt={project.title} fill sizes="50vw" className="object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center text-3xl">💐</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-2 left-2">
          <span className={cn(
            'px-2 py-0.5 rounded-full text-[9px] font-black text-white uppercase tracking-wide',
            isSuccess ? 'bg-emerald-500' : project.status === 'COMPLETED' ? 'bg-purple-500' : 'bg-pink-500',
          )}>
            {isSuccess ? '達成' : project.status === 'COMPLETED' ? '完了' : '募集中'}
          </span>
        </div>
        {daysLeft !== null && project.status === 'FUNDRAISING' && (
          <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
            <Clock size={9} className="text-rose-300" />
            <span className="text-[9px] font-black text-white">{daysLeft}日</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3">
        <h3 className="font-black text-slate-800 text-xs leading-snug line-clamp-2 mb-2">{project.title}</h3>

        <div className="space-y-0.5 mb-2.5">
          {project.deliveryDateTime && (
            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 truncate">
              <Calendar size={9} className="text-pink-400 shrink-0" />
              {new Date(project.deliveryDateTime).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
            </p>
          )}
          <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 truncate">
            <MapPin size={9} className="text-rose-400 shrink-0" />
            <span className="truncate">{project.venue?.venueName || project.deliveryAddress || '場所未定'}</span>
          </p>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <p className="text-[11px] font-black text-slate-700">¥{(project.collectedAmount || 0).toLocaleString()}</p>
            <span className={cn('text-[11px] font-black', isSuccess ? 'text-emerald-500' : 'text-pink-500')}>{percent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${percent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={cn('h-full rounded-full', isSuccess ? 'bg-emerald-400' : 'bg-gradient-to-r from-pink-400 to-rose-400')}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Content ──────────────────────────────────────────────
function ProjectsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { authenticatedFetch, isLoading: authLoading } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [sort, setSort] = useState('newest');
  const [category, setCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const loaderRef = useRef(null);
  const searchRef = useRef(null);

  const activeFilterCount = [prefecture, statusFilter].filter(Boolean).length;

  const fetchProjects = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const kw = searchParams.get('keyword');
      const pref = searchParams.get('prefecture');
      if (kw) params.append('keyword', kw);
      if (pref) params.append('prefecture', pref);
      params.append('t', Date.now());

      const res = await authenticatedFetch(`/projects?${params.toString()}`);
      if (!res?.ok) throw new Error(`Status ${res?.status}`);
      const data = await res.json();
      let arr = Array.isArray(data) ? data : (data?.projects || []);
      arr = arr.filter(p => p.visibility !== 'UNLISTED' && p.status !== 'REJECTED' && p.status !== 'CANCELED');
      setProjects(arr);
    } catch {
      toast.error('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [searchParams, authenticatedFetch, authLoading]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // フィルター変更時に表示件数をリセット
  useEffect(() => { setVisibleCount(20); }, [keyword, prefecture, sort, category, statusFilter]);

  // Infinite Scroll: 末尾に達したら20件ずつ追加
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

  const handleSearch = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (keyword.trim()) params.set('keyword', keyword.trim());
    else params.delete('keyword');
    if (prefecture) params.set('prefecture', prefecture);
    else params.delete('prefecture');
    router.replace(`${pathname}?${params.toString()}`);
    searchRef.current?.blur();
  };

  const handleApplyFilter = () => {
    handleSearch();
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setKeyword('');
    setPrefecture('');
    setSort('newest');
    setCategory('');
    setStatusFilter('');
    router.replace(pathname);
  };

  // Sort + category + status filter (client-side)
  const filtered = projects
    .filter(p => !category || (p.eventType || '').toLowerCase().includes(category))
    .filter(p => {
      if (!statusFilter) return true;
      const isSuccess = (p.collectedAmount || 0) >= (p.targetAmount || 1);
      if (statusFilter === 'fundraising') return p.status === 'FUNDRAISING' && !isSuccess;
      if (statusFilter === 'success') return isSuccess && p.status !== 'COMPLETED';
      if (statusFilter === 'completed') return p.status === 'COMPLETED';
      return true;
    })
    .sort((a, b) => {
      if (sort === 'popular') return (b.collectedAmount || 0) - (a.collectedAmount || 0);
      if (sort === 'deadline') {
        const da = a.deadline ? new Date(a.deadline) : new Date(9999, 0);
        const db = b.deadline ? new Date(b.deadline) : new Date(9999, 0);
        return da - db;
      }
      if (sort === 'percent') {
        const pa = Math.round(((a.collectedAmount || 0) / (a.targetAmount || 1)) * 100);
        const pb = Math.round(((b.collectedAmount || 0) / (b.targetAmount || 1)) * 100);
        return pb - pa;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const hasActiveFilters = keyword || prefecture || sort !== 'newest' || category || statusFilter;

  return (
    <div className="flex flex-col bg-[#F7F7FA] font-sans" style={{ minHeight: '100dvh' }}>

      {/* ── Fixed Header ── */}
      <div
        className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-2xl mx-auto px-4">
          {/* Top row */}
          <div className="h-14 flex items-center gap-3">
            <button onClick={() => router.back()}
              className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:bg-slate-200 transition-colors shrink-0">
              <ChevronLeft size={20} />
            </button>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="search"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="企画名・グループ名で検索"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-100 rounded-full text-[16px] font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-pink-200 transition-all text-sm"
              />
            </form>

            {/* Filter button */}
            <button onClick={() => setFilterOpen(true)}
              className={cn(
                'relative w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0',
                activeFilterCount > 0 ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-500 active:bg-slate-200',
              )}>
              <SlidersHorizontal size={16} />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] text-white font-black flex items-center justify-center border border-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* New project */}
            <Link href="/projects/create"
              className="shrink-0 px-3 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-black text-xs shadow-sm shadow-pink-200 flex items-center gap-1 active:scale-95 transition-transform">
              <PlusCircle size={13} /> 作成
            </Link>
          </div>

          {/* Category chips */}
          <div className="pt-1 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)}
                className={cn(
                  'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-xs transition-all border',
                  category === c.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-500 border-slate-100 active:bg-slate-50',
                )}>
                <span>{c.emoji}</span> {c.label}
              </button>
            ))}
          </div>

          {/* Status filter chips */}
          <div className="pb-3 flex gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: '',            label: 'すべて', color: 'bg-slate-900 text-white border-slate-900', inactive: 'bg-white text-slate-400 border-slate-100' },
              { id: 'fundraising', label: '🌸 募集中', color: 'bg-pink-500 text-white border-pink-500',    inactive: 'bg-pink-50 text-pink-500 border-pink-100' },
              { id: 'success',     label: '✅ 達成',   color: 'bg-emerald-500 text-white border-emerald-500', inactive: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
              { id: 'completed',   label: '🎉 完了',   color: 'bg-purple-500 text-white border-purple-500',  inactive: 'bg-purple-50 text-purple-600 border-purple-100' },
            ].map(s => (
              <button key={s.id} onClick={() => setStatusFilter(s.id)}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full font-black text-xs transition-all border',
                  statusFilter === s.id ? s.color : s.inactive,
                )}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div
        className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4"
        style={{
          paddingTop: 'calc(10.5rem + env(safe-area-inset-top))',
          paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))',
        }}
      >
        {/* Active filters / result count */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold text-slate-400">
            {loading ? '検索中...' : `${filtered.length}件`}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 text-[11px] font-black text-rose-500 active:opacity-70">
              <X size={11} /> 絞り込みを解除
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-[1.5rem] overflow-hidden animate-pulse border border-slate-100">
                <div className="aspect-video bg-slate-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-slate-100 rounded-full w-3/4" />
                  <div className="h-2 bg-slate-100 rounded-full w-1/2" />
                  <div className="h-1.5 bg-slate-100 rounded-full w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {filtered.slice(0, visibleCount).map((p, i) => <ProjectCard key={p.id} project={p} index={i} />)}
            </div>
            {visibleCount < filtered.length && (
              <div ref={loaderRef} className="flex justify-center py-8">
                <div className="w-6 h-6 rounded-full border-2 border-pink-300 border-t-pink-500 animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 text-slate-300 shadow-sm border border-slate-100">
              <Search size={28} />
            </div>
            <p className="font-black text-slate-700 text-base mb-1.5">企画が見つかりませんでした</p>
            <p className="text-xs font-bold text-slate-400 mb-6">条件を変えるか、新しい企画を立ち上げましょう</p>
            <Link href="/projects/create"
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-full text-sm shadow-lg shadow-pink-200 active:scale-95 transition-transform">
              企画を作成する
            </Link>
          </div>
        )}
      </div>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        prefecture={prefecture}
        setPrefecture={setPrefecture}
        sort={sort}
        setSort={setSort}
        onApply={handleApplyFilter}
      />
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-pink-500 w-10 h-10" />
      </div>
    }>
      <ProjectsContent />
    </Suspense>
  );
}
