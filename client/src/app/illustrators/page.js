'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Brush, Loader2, Sparkles, ChevronRight, Clock, User, PenTool, X, ChevronLeft } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

function SkeletonCard() {
  return (
    <div className="bg-white rounded-[1.5rem] overflow-hidden animate-pulse border border-slate-100 shadow-sm">
      <div className="h-44 bg-slate-100" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-slate-100 rounded-full w-3/4" />
        <div className="flex gap-2">
          <div className="h-2 bg-slate-100 rounded-full w-14" />
          <div className="h-2 bg-slate-100 rounded-full w-14" />
        </div>
        <div className="h-9 bg-slate-100 rounded-xl w-full" />
      </div>
    </div>
  );
}

function IllustratorCard({ illustrator, projectId, index }) {
  const thumb = illustrator.portfolioUrls?.[0];
  const targetUrl = projectId
    ? `/illustrators/${illustrator.userId}?projectId=${projectId}`
    : `/illustrators/${illustrator.userId}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
    >
      <Link href={targetUrl} className="group block bg-white rounded-[1.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg hover:border-amber-200 transition-all duration-300 hover:-translate-y-1">
        {/* Thumbnail */}
        <div className="relative h-44 bg-slate-100 overflow-hidden">
          {thumb ? (
            <Image src={thumb} alt={illustrator.name || '作品'} fill sizes="(max-width:640px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full bg-amber-50 flex items-center justify-center">
              <Brush size={36} className="text-amber-200" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />

          {/* Status badge */}
          <div className="absolute top-2.5 right-2.5">
            {illustrator.isAcceptingRequests ? (
              <span className="bg-emerald-500/90 backdrop-blur-sm text-white text-[9px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Sparkles size={9} /> 受付中
              </span>
            ) : (
              <span className="bg-slate-900/70 backdrop-blur-sm text-white text-[9px] font-black px-2.5 py-1 rounded-full">
                停止中
              </span>
            )}
          </div>

          {/* Avatar overlap */}
          <div className="absolute -bottom-5 left-3 w-11 h-11 rounded-[0.75rem] border-2 border-white shadow-md overflow-hidden bg-white z-10">
            {illustrator.iconUrl || illustrator.user?.iconUrl ? (
              <Image src={illustrator.iconUrl || illustrator.user.iconUrl} alt={`${illustrator.name || illustrator.user?.handleName || 'クリエイター'}のアイコン`} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                <User size={18} className="text-slate-300" />
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="pt-7 px-3.5 pb-3.5">
          <div className="mb-2">
            <h3 className="font-black text-slate-800 text-sm leading-tight group-hover:text-amber-500 transition-colors truncate">
              {illustrator.name || illustrator.user?.handleName || 'クリエイター'}
            </h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
              <PenTool size={9} /> Creator
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {(illustrator.tags || []).slice(0, 3).map(tag => (
              <span key={tag} className="text-[9px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100 font-bold">
                #{tag}
              </span>
            ))}
            {(illustrator.tags || []).length > 3 && (
              <span className="text-[9px] text-slate-400 font-bold">+{illustrator.tags.length - 3}</span>
            )}
          </div>

          {/* Stats row */}
          <div className="flex justify-between items-center border-t border-slate-100 pt-2.5 mb-3">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Base Price</p>
              <p className="font-black text-amber-500 text-sm leading-none">
                {illustrator.basePrice?.toLocaleString() || '---'} <span className="text-[9px] text-slate-400">pt〜</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Delivery</p>
              <p className="font-bold text-slate-600 text-xs flex items-center gap-1 justify-end">
                <Clock size={11} className="text-sky-400" /> 約{illustrator.deliveryDays || '-'}日
              </p>
            </div>
          </div>

          <div className="w-full py-2.5 text-center text-xs font-black text-amber-600 bg-amber-50 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-all flex items-center justify-center gap-1">
            ポートフォリオを見る <ChevronRight size={13} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function IllustratorsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [illustrators, setIllustrators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [activeTag, setActiveTag] = useState('');

  useEffect(() => {
    setProjectId(searchParams.get('projectId'));
    setKeyword(searchParams.get('keyword') || '');
    setActiveTag(searchParams.get('tag') || '');
  }, [searchParams]);

  useEffect(() => {
    const fetchIllustrators = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/illustrators`);
        if (res.ok) setIllustrators(await res.json());
      } catch { /* ignore */ } finally { setLoading(false); }
    };
    fetchIllustrators();
  }, []);

  const availableTags = useMemo(() => {
    const s = new Set();
    illustrators.forEach(ill => (ill.tags || []).forEach(t => s.add(t)));
    return Array.from(s).sort();
  }, [illustrators]);

  const filtered = useMemo(() => illustrators.filter(ill => {
    const kw = keyword.toLowerCase();
    const matchKw = !kw || (ill.name || '').toLowerCase().includes(kw) || (ill.bio || '').toLowerCase().includes(kw);
    const matchTag = !activeTag || (ill.tags || []).includes(activeTag);
    return matchKw && matchTag;
  }), [illustrators, keyword, activeTag]);

  const hasFilter = keyword || activeTag;

  return (
    <div className="flex flex-col bg-[#FAF8F5] font-sans min-h-screen">

      {/* ── Fixed Header ── */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">

          {/* Top row */}
          <div className="h-14 flex items-center gap-3">
            <button onClick={() => router.back()}
              className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:bg-slate-200 transition-colors shrink-0">
              <ChevronLeft size={20} />
            </button>

            {/* Search */}
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="search"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="絵師の名前で検索..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-100 rounded-full text-[16px] text-slate-800 placeholder:text-slate-400 font-medium outline-none focus:bg-white focus:ring-2 focus:ring-amber-200 transition-all text-sm"
              />
            </div>

            {hasFilter && (
              <button onClick={() => { setKeyword(''); setActiveTag(''); }}
                className="shrink-0 flex items-center gap-1 text-[11px] font-black text-rose-500 active:opacity-70 whitespace-nowrap">
                <X size={12} /> リセット
              </button>
            )}
          </div>

          {/* Tag chips */}
          {availableTags.length > 0 && (
            <div className="pb-3 flex gap-2 overflow-x-auto no-scrollbar">
              <button onClick={() => setActiveTag('')}
                className={cn('shrink-0 px-3 py-1.5 rounded-full font-black text-xs border transition-all',
                  !activeTag ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-100')}>
                すべて
              </button>
              {availableTags.map(tag => (
                <button key={tag} onClick={() => setActiveTag(tag === activeTag ? '' : tag)}
                  className={cn('shrink-0 px-3 py-1.5 rounded-full font-black text-xs border transition-all',
                    activeTag === tag ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-500 border-slate-100')}>
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-5">

        {/* Offer mode banner */}
        {projectId && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3">
            <p className="text-sm font-black text-amber-700">この企画へのクリエイターを選んでください</p>
            <button onClick={() => router.back()} className="text-xs font-bold text-slate-500 bg-white border border-slate-100 px-3 py-1.5 rounded-full">
              キャンセル
            </button>
          </div>
        )}

        {/* Count */}
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-xs font-bold text-slate-400">
            {loading ? '検索中...' : `${filtered.length}人のクリエイター`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((ill, i) => (
              <IllustratorCard key={ill.id || i} illustrator={ill} projectId={projectId} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 text-slate-300 shadow-sm border border-slate-100">
              <Brush size={28} />
            </div>
            <p className="font-black text-slate-700 text-base mb-1.5">クリエイターが見つかりませんでした</p>
            <p className="text-xs font-bold text-slate-400 mb-6">別のキーワードやタグで検索してみてください</p>
            <button onClick={() => { setKeyword(''); setActiveTag(''); }}
              className="px-6 py-3 bg-slate-900 text-white font-black rounded-full text-sm">
              条件をリセット
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function IllustratorsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-amber-50/30">
        <Loader2 className="animate-spin text-amber-500" size={40} />
      </div>
    }>
      <IllustratorsListContent />
    </Suspense>
  );
}
