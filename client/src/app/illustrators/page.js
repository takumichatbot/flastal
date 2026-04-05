'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// Lucide Icons
import { 
  Search, Brush, Star, Filter, Loader2, Sparkles, 
  ChevronRight, Clock, Coins, User, Heart, PenTool
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// ===========================================
// 🎨 UI COMPONENTS
// ===========================================
const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute w-4 h-4 bg-amber-300 rounded-full mix-blend-multiply filter blur-[2px] opacity-20"
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -150], x: [null, (Math.random() - 0.5) * 80], opacity: [0.1, 0.5, 0.1], scale: [1, 1.5, 1] }}
          transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(245,158,11,0.05)] rounded-[2.5rem]", className)}>
    {children}
  </div>
);

function SkeletonCard() {
  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-[2.5rem] shadow-sm border border-white overflow-hidden h-full animate-pulse p-4">
      <div className="h-52 bg-slate-200/50 rounded-[2rem]" />
      <div className="p-4 mt-2 space-y-4">
        <div className="h-5 bg-slate-200/50 rounded-full w-3/4" />
        <div className="flex gap-2">
          <div className="h-4 bg-slate-200/50 rounded-full w-12" />
          <div className="h-4 bg-slate-200/50 rounded-full w-12" />
        </div>
        <div className="h-12 bg-slate-200/50 rounded-[1rem] w-full mt-4" />
      </div>
    </div>
  );
}

// イラストレーターカードコンポーネント
function IllustratorCard({ illustrator, projectId }) {
  const thumbnailSrc = illustrator.portfolioUrls?.[0]; // ポートフォリオの1枚目をサムネイルに

  const CardBody = () => (
    <GlassCard className="!p-4 sm:!p-5 group h-full flex flex-col transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(245,158,11,0.15)] hover:border-amber-200 bg-white">
      {/* サムネイル画像 */}
      <div className="relative h-48 md:h-52 rounded-[2rem] bg-slate-100 overflow-hidden shrink-0">
        {thumbnailSrc ? (
          <Image 
            src={thumbnailSrc} alt={illustrator.name || '作品'} fill sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-700" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-amber-50/50">
             <Brush className="text-amber-200" size={48} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
        
        {/* 受付状況バッジ */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
            {illustrator.isAcceptingRequests ? (
                <div className="bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1 border border-emerald-400">
                    <Sparkles size={12}/> 受付中
                </div>
            ) : (
                <div className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1 border border-slate-700">
                    受付停止中
                </div>
            )}
        </div>

        {/* 浮かぶアイコン */}
        <div className="absolute -bottom-6 left-5 w-14 h-14 rounded-[1rem] border-2 border-white shadow-lg overflow-hidden bg-white z-20">
            {illustrator.iconUrl || illustrator.user?.iconUrl ? (
                <Image src={illustrator.iconUrl || illustrator.user.iconUrl} alt="" fill style={{objectFit: 'cover'}} />
            ) : (
                <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300"><User size={24}/></div>
            )}
        </div>
      </div>

      <div className="pt-8 px-2 flex flex-col flex-grow relative">
        <div className="mb-3">
          <h3 className="text-lg font-black text-slate-800 group-hover:text-amber-500 transition-colors line-clamp-1">{illustrator.name || illustrator.user?.handleName}</h3>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1"><PenTool size={10}/> Creator</p>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
            {Array.isArray(illustrator.tags) && illustrator.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[9px] bg-slate-50 text-slate-500 px-2 py-1 rounded-md border border-slate-100 font-bold tracking-wider">
                    #{tag}
                </span>
            ))}
            {Array.isArray(illustrator.tags) && illustrator.tags.length > 3 && (
              <span className="text-[9px] text-slate-400 font-bold px-1 flex items-center">+{illustrator.tags.length - 3}</span>
            )}
        </div>

        <div className="mt-auto space-y-3">
          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Base Price</span>
                <span className="font-black text-amber-500 text-sm md:text-base leading-none">
                    {illustrator.basePrice?.toLocaleString() || '---'} <span className="text-[10px] text-slate-400">pt〜</span>
                </span>
            </div>
            <div className="flex flex-col text-right">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Delivery</span>
                <span className="font-bold text-slate-700 text-xs md:text-sm flex items-center gap-1 justify-end">
                    <Clock size={12} className="text-sky-400"/> 約{illustrator.deliveryDays || '-'}日
                </span>
            </div>
          </div>

          <div className="w-full py-3 mt-2 text-center text-xs font-black text-amber-600 bg-amber-50 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-all flex items-center justify-center gap-1">
            ポートフォリオを見る <ChevronRight size={14}/>
          </div>
        </div>
      </div>
    </GlassCard>
  );

  const targetUrl = projectId ? `/illustrators/${illustrator.userId}?projectId=${projectId}` : `/illustrators/${illustrator.userId}`;
  return <Link href={targetUrl} className="block h-full cursor-pointer"><CardBody/></Link>;
}

// ===========================================
// MAIN CONTENT (Suspense wrapped)
// ===========================================
function IllustratorsListContent() {
  const [illustrators, setIllustrators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState(null);
  
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({ keyword: '', tag: '' });

  // データ取得
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setProjectId(searchParams.get('projectId'));
      setFilters(prev => ({
          ...prev,
          keyword: searchParams.get('keyword') || '',
          tag: searchParams.get('tag') || ''
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchIllustrators = async () => {
      setLoading(true);
      try {
        // バックエンドにエンドポイントがある想定 (承認済みの絵師一覧を取得)
        const res = await fetch(`${API_URL}/api/illustrators`);
        if (res.ok) {
            const data = await res.json();
            // とりあえず全員表示 (バックエンドで isAcceptingRequests=true や STATUS=APPROVED の絞り込みが行われている前提)
            setIllustrators(data);
        }
      } catch (error) {
        console.error('Failed to fetch illustrators:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchIllustrators();
  }, []);

  // タグの抽出
  const availableTags = useMemo(() => {
    const tagsSet = new Set();
    illustrators.forEach(ill => {
        if (Array.isArray(ill.tags)) ill.tags.forEach(t => tagsSet.add(t));
    });
    return Array.from(tagsSet).sort();
  }, [illustrators]);

  // フィルタリング処理
  const filteredIllustrators = useMemo(() => {
      return illustrators.filter(ill => {
          const matchKeyword = !filters.keyword || 
              (ill.name || '').toLowerCase().includes(filters.keyword.toLowerCase()) || 
              (ill.bio || '').toLowerCase().includes(filters.keyword.toLowerCase());
          const matchTag = !filters.tag || (Array.isArray(ill.tags) && ill.tags.includes(filters.tag));
          return matchKeyword && matchTag;
      });
  }, [illustrators, filters]);

  const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleTagSelect = (tag) => setFilters(prev => ({ ...prev, tag: prev.tag === tag ? '' : tag }));
  const handleResetSearch = () => setFilters({ keyword: '', tag: '' });

  return (
    <main className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 min-h-screen py-10 md:py-16 font-sans text-slate-800 relative overflow-hidden pb-24">
      <FloatingParticles />
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-amber-200/30 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-rose-200/20 rounded-full blur-[100px] translate-y-1/3 translate-x-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ヘッダーセクション */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 gap-6 text-center md:text-left">
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-[1.5rem] shadow-sm border border-amber-100 mb-4 text-amber-500 rotate-3">
                <Brush size={32} className="animate-pulse" />
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-2">クリエイターを探す</h1>
            <p className="text-slate-500 font-bold text-sm md:text-base">フラスタを彩るイラストパネルを描いてくれる絵師さんを見つけよう🎨</p>
          </div>
          {projectId && (
             <span className="inline-flex items-center px-6 py-3 bg-amber-500 text-white font-black rounded-full shadow-lg border border-amber-400 animate-pulse text-sm">
                オファー先を選択中 (企画ID: {projectId})
             </span>
          )}
        </motion.div>

        {/* 検索・フィルターエリア */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard className="p-6 md:p-8 mb-12">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  <div className="md:col-span-12 relative">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-2">Keyword</label>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                        <input type="text" name="keyword" value={filters.keyword} onChange={handleFilterChange} placeholder="絵師の名前やキーワードで検索..." className="w-full pl-12 pr-4 py-4 bg-white/60 backdrop-blur-sm border-2 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-amber-100 focus:border-amber-300 outline-none transition-all font-bold text-slate-700" />
                      </div>
                  </div>
              </div>

              {/* スタイルタグ */}
              {availableTags.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-slate-100/50">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1"><Filter size={12}/> Filter by Tags</p>
                      <div className="flex flex-wrap gap-2">
                          <button onClick={() => setFilters(prev => ({ ...prev, tag: '' }))} className={cn("px-4 py-2 text-xs rounded-full font-black transition-all border", !filters.tag ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300 hover:text-amber-600')}>すべて</button>
                          {availableTags.map(tag => (
                              <button key={tag} onClick={() => handleTagSelect(tag)} className={cn("px-4 py-2 text-xs rounded-full font-black transition-all border", filters.tag === tag ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300 hover:text-amber-600')}>#{tag}</button>
                          ))}
                      </div>
                  </div>
              )}
          </GlassCard>
        </motion.div>

        {/* 結果表示 */}
        <div className="mb-6 flex justify-between items-end px-2">
             <h2 className="text-lg font-black text-slate-800">{loading ? 'Searching...' : `${filteredIllustrators.length}人のクリエイター`}</h2>
             {!loading && (filters.keyword || filters.tag) && (
               <button onClick={handleResetSearch} className="text-xs font-bold text-slate-400 hover:text-amber-500 transition-colors">条件をリセット</button>
             )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
             {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          filteredIllustrators.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              <AnimatePresence>
                {filteredIllustrators.map((ill, i) => (
                  <motion.div key={ill.id || i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="h-full">
                    <IllustratorCard illustrator={ill} projectId={projectId} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/60 backdrop-blur-md rounded-[3rem] border border-white shadow-sm p-24 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 text-slate-300 -rotate-3"><Search size={36}/></div>
              <p className="text-xl font-black text-slate-800 mb-2">クリエイターが見つかりませんでした</p>
              <p className="text-sm font-bold text-slate-500 mb-8">別のキーワードやタグで検索してみてください🎨</p>
              <button onClick={handleResetSearch} className="px-8 py-3.5 bg-slate-900 text-white font-black rounded-full shadow-lg hover:bg-slate-800 transition-colors">検索条件をリセットする</button>
            </motion.div>
          )
        )}
      </div>
    </main>
  );
}

export default function IllustratorsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-amber-50/50"><Loader2 className="animate-spin text-amber-500" size={48} /></div>}>
      <IllustratorsListContent />
    </Suspense>
  );
}