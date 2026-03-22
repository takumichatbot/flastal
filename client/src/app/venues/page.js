'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext'; 
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// lucide-reactに統一
import { 
  Search, MapPin, CheckCircle2, Loader2, Plus, Trash2, ShieldCheck, Filter, Building2 
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', 
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', 
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', 
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// ふわふわ浮かぶパーティクル（会場らしい爽やかなスカイブルー系）
const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute w-3 h-3 bg-sky-300 rounded-full mix-blend-multiply filter blur-[1px] opacity-30"
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -200], x: [null, (Math.random() - 0.5) * 100], opacity: [0.2, 0.5, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: Math.random() * 10 + 15, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(56,189,248,0.05)] rounded-[2.5rem] p-6", className)}>
    {children}
  </div>
);

function SkeletonCard() {
  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-[2.5rem] shadow-sm border border-white overflow-hidden h-80 animate-pulse flex flex-col p-4">
      <div className="h-40 bg-slate-200/50 rounded-[2rem]" />
      <div className="p-4 mt-2 flex-grow space-y-3">
        <div className="h-5 bg-slate-200/50 rounded-full w-3/4" />
        <div className="h-3 bg-slate-200/50 rounded-full w-1/2" />
        <div className="mt-auto pt-4 flex justify-between">
            <div className="h-4 bg-slate-200/50 rounded-full w-1/3" />
        </div>
      </div>
    </div>
  );
}

function VenuesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, authenticatedFetch, isLoading: authLoading } = useAuth();

  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [prefecture, setPrefecture] = useState(searchParams.get('prefecture') || '');

  const fetchVenues = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    try {
      const isAdmin = user?.role === 'ADMIN';
      const endpoint = isAdmin ? `${API_URL}/api/venues/admin` : `${API_URL}/api/venues`;
      const res = await authenticatedFetch(endpoint);
      
      if (res && res.ok) {
        setVenues(await res.json());
      }
    } catch (error) {
      toast.error('会場データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [user, authenticatedFetch, authLoading]);

  useEffect(() => { fetchVenues(); }, [fetchVenues]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (keyword.trim()) params.set('keyword', keyword);
    else params.delete('keyword');
    if (prefecture) params.set('prefecture', prefecture);
    else params.delete('prefecture');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('この会場情報を削除しますか？')) return;
    try {
      const res = await authenticatedFetch(`${API_URL}/api/venues/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('削除しました');
        fetchVenues();
      }
    } catch (error) {
      toast.error('削除に失敗しました');
    }
  };

  const filteredVenues = venues.filter(v => {
    const matchesKeyword = v.venueName.toLowerCase().includes(keyword.toLowerCase()) || 
                          (v.address && v.address.toLowerCase().includes(keyword.toLowerCase()));
    const matchesPrefecture = !prefecture || (v.address && v.address.includes(prefecture));
    return matchesKeyword && matchesPrefecture;
  });

  return (
    <div className="bg-gradient-to-br from-indigo-50/50 to-sky-50/50 min-h-screen py-10 md:py-16 font-sans text-slate-800 relative overflow-hidden pb-24">
      <FloatingParticles />
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-sky-200/30 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/3 pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[100px] translate-y-1/3 translate-x-1/3 pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ヘッダーセクション */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 gap-6 text-center md:text-left">
          <div>
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-2xl shadow-sm border border-sky-100 mb-4 text-sky-500 rotate-3">
              <Building2 size={24} className="animate-pulse" />
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-2">会場・施設を探す</h1>
            <p className="text-slate-500 font-bold text-sm md:text-base">推しへ想いを届けるための全国の会場データベース🏛️</p>
          </div>
          <Link href="/venues/add">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-sky-400 to-indigo-500 text-white font-black rounded-full shadow-lg shadow-sky-200 transition-all w-full md:w-auto justify-center gap-2">
              <Plus size={18}/> 新しい会場情報を教える
            </motion.button>
          </Link>
        </motion.div>

        {/* 検索フォーム */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard className="p-6 md:p-8 mb-12">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
              <div className="md:col-span-6">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-2">Keyword</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                  <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="会場名、建物名など..." className="w-full pl-12 pr-4 py-4 bg-white/60 backdrop-blur-sm border-2 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-sky-100 focus:border-sky-300 outline-none transition-all font-bold text-slate-700" />
                </div>
              </div>
              
              <div className="md:col-span-4 relative">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-2">Area</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                  <select value={prefecture} onChange={(e) => setPrefecture(e.target.value)} className="w-full pl-12 pr-10 py-4 bg-white/60 backdrop-blur-sm border-2 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-sky-100 focus:border-sky-300 outline-none appearance-none cursor-pointer transition-all font-bold text-slate-700">
                    <option value="">すべてのエリア</option>
                    {PREFECTURES.map(pref => <option key={pref} value={pref}>{pref}</option>)}
                  </select>
                  <Filter size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                </div>
              </div>

              <div className="md:col-span-2">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2">
                  <Search size={18}/> 検索
                </motion.button>
              </div>
            </form>
          </GlassCard>
        </motion.div>

        {/* 結果表示 */}
        <div className="mb-6 px-2">
             <h2 className="text-lg font-black text-slate-800">{loading ? 'Searching...' : `${filteredVenues.length}件の会場`}</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
             {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredVenues.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            <AnimatePresence>
              {filteredVenues.map((venue, i) => (
                <motion.div key={venue.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="h-full">
                  <Link href={`/venues/${venue.id}`} className="group h-full block">
                    <GlassCard className="!p-4 sm:!p-5 flex flex-col h-full hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(56,189,248,0.15)] hover:border-sky-200 transition-all duration-500 bg-white">
                      
                      <div className="relative h-40 bg-gradient-to-br from-slate-100 to-sky-50 rounded-[2rem] flex items-center justify-center overflow-hidden shrink-0">
                        <span className="text-6xl drop-shadow-sm group-hover:scale-110 transition-transform duration-500">🏛️</span>
                        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                            {venue.isOfficial ? (
                                <span className="bg-sky-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-sm flex items-center gap-1 uppercase tracking-widest">
                                    <ShieldCheck size={10}/> OFFICIAL
                                </span>
                            ) : (
                                <span className="bg-white/90 backdrop-blur-md text-amber-500 text-[9px] font-black px-3 py-1 rounded-full shadow-sm uppercase tracking-widest border border-amber-100">
                                    User Submitted
                                </span>
                            )}
                        </div>
                      </div>

                      <div className="pt-5 flex flex-col flex-grow px-2">
                        <h2 className="text-base font-black text-slate-800 group-hover:text-sky-600 transition-colors line-clamp-2 mb-3 leading-snug">
                            {venue.venueName}
                        </h2>
                        
                        <div className="mb-4">
                            <p className="text-[11px] font-bold text-slate-500 flex items-start gap-1">
                                <MapPin className="text-sky-400 shrink-0 mt-0.5" size={14}/> 
                                <span className="line-clamp-2">{venue.address || '所在地情報なし'}</span>
                            </p>
                        </div>
                        
                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                {venue.isStandAllowed ? (
                                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 flex items-center gap-1 uppercase tracking-widest"><CheckCircle2 size={12}/> 許可実績あり</span>
                                ) : (
                                    <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 uppercase tracking-widest">要詳細確認</span>
                                )}
                            </div>
                            {user?.role === 'ADMIN' && (
                                <button onClick={(e) => handleDelete(e, venue.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shadow-sm bg-white border border-slate-100">
                                    <Trash2 size={14}/>
                                </button>
                            )}
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 bg-white/60 backdrop-blur-md rounded-[3rem] border border-white shadow-sm text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-6 text-slate-300 shadow-inner rotate-3">
                <Search size={36}/>
            </div>
            <p className="text-xl font-black text-slate-800 mb-2">該当する会場が見つかりませんでした</p>
            <p className="text-sm font-bold text-slate-500">条件を変えて検索するか、新しい会場を登録してください。</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function VenuesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-sky-50/50"><Loader2 className="animate-spin text-sky-500" size={40} /></div>}>
      <VenuesContent />
    </Suspense>
  );
}