'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, useCallback, Suspense, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// lucide-reactに統一
import { 
  Search, MapPin, Camera, Loader2, X, Zap, Award, Filter, Star, CheckCircle2, Sparkles, ChevronRight, User, Send
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// --- 共通コンポーネント ---
const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute w-3 h-3 bg-pink-300 rounded-full mix-blend-multiply filter blur-[1px] opacity-40"
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -200], x: [null, (Math.random() - 0.5) * 100], opacity: [0.2, 0.6, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: Math.random() * 10 + 15, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(244,114,182,0.1)] rounded-[2.5rem]", className)}>
    {children}
  </div>
);

const STYLE_TAGS = [
    'かわいい/キュート', 'クール/かっこいい', 'おしゃれ/モダン', '和風/和モダン',
    'ゴージャス/豪華', 'パステルカラー', 'ビビッドカラー', 'ニュアンスカラー',
    'バルーン装飾', 'ペーパーフラワー', '布・リボン装飾', 'キャラクター/モチーフ',
    '大型/連結', '卓上/楽屋花', 'リーズナブル'
];

const prefectures = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', 
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', 
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', 
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県', '全国対応'
];

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
        <div className="h-4 bg-slate-200/50 rounded-full w-1/2" />
        <div className="h-12 bg-slate-200/50 rounded-[1rem] w-full mt-4" />
      </div>
    </div>
  );
}

function FloristCard({ florist, projectId, onOffer, isOffering }) {
  const thumbnailSrc = florist.portfolioImages?.[0] || florist.iconUrl;

  const CardBody = () => (
    <GlassCard className="!p-4 sm:!p-5 group h-full flex flex-col transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(244,114,182,0.15)] hover:border-pink-200 bg-white">
      <div className="relative h-48 md:h-52 rounded-[2rem] bg-slate-100 overflow-hidden shrink-0">
        {thumbnailSrc ? (
          <Image 
            src={thumbnailSrc} alt={florist.platformName || ''} fill sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-700" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-slate-50 opacity-50">💐</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
        
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
            {florist.acceptsRushOrders && (
                <div className="bg-white/90 backdrop-blur-md text-amber-500 text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1 border border-white">
                    <Zap size={12} className="fill-amber-500"/> お急ぎOK
                </div>
            )}
        </div>

        {/* 浮かぶアイコン */}
        <div className="absolute -bottom-6 left-5 w-14 h-14 rounded-[1rem] border-2 border-white shadow-lg overflow-hidden bg-white z-20">
            {florist.iconUrl ? (
                <Image src={florist.iconUrl} alt="" fill style={{objectFit: 'cover'}} />
            ) : (
                <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300"><User size={24}/></div>
            )}
        </div>
      </div>

      <div className="pt-8 px-2 flex flex-col flex-grow relative">
        <div className="mb-3">
          <h3 className="text-lg font-black text-slate-800 group-hover:text-pink-500 transition-colors line-clamp-1">{florist.platformName || florist.shopName}</h3>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1"><Award size={10}/> Florist Partner</p>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
            {Array.isArray(florist.specialties) && florist.specialties.slice(0, 3).map(tag => (
                <span key={tag} className="text-[9px] bg-slate-50 text-slate-500 px-2 py-1 rounded-md border border-slate-100 font-bold tracking-wider">
                    #{tag.split('/')[0]}
                </span>
            ))}
            {Array.isArray(florist.specialties) && florist.specialties.length > 3 && (
              <span className="text-[9px] text-slate-400 font-bold px-1 flex items-center">+{florist.specialties.length - 3}</span>
            )}
        </div>

        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between text-xs font-bold pt-4 border-t border-slate-100">
            <span className="flex items-center text-slate-500 truncate mr-2">
                <MapPin className="mr-1.5 text-sky-400 shrink-0" size={14}/> 
                <span className="truncate">{florist.address || '全国対応'}</span>
            </span>
            {florist.reviewCount > 0 && (
               <span className="flex items-center gap-1 text-yellow-500 font-black shrink-0">
                 <Star size={14} className="fill-yellow-500"/> {florist.averageRating?.toFixed(1)}
               </span>
            )}
          </div>

          {projectId ? (
            <button onClick={(e) => { e.preventDefault(); onOffer(florist.id); }} disabled={isOffering}
              className="w-full py-3.5 bg-gradient-to-r from-sky-400 to-indigo-500 text-white text-xs font-black rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:shadow-none mt-2 flex justify-center items-center gap-2"
            >
              {isOffering ? <Loader2 className="animate-spin mx-auto" size={16}/> : <><Send size={14}/> この花屋さんにオファー</>}
            </button>
          ) : (
            <div className="w-full py-3 mt-2 text-center text-xs font-black text-pink-500 bg-pink-50 rounded-xl group-hover:bg-pink-500 group-hover:text-white transition-all flex items-center justify-center gap-1">
              詳細を見る <ChevronRight size={14}/>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );

  if (projectId) return <div className="h-full cursor-pointer"><CardBody/></div>;
  return <Link href={`/florists/${florist.id}`} className="block h-full cursor-pointer"><CardBody/></Link>;
}

function FloristsListContent() {
  const { user, authenticatedFetch } = useAuth();
  const [florists, setFlorists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffering, setIsOffering] = useState(false);
  const [projectId, setProjectId] = useState(null);
  
  const fileInputRef = useRef(null);
  const [isSearchingImage, setIsSearchingImage] = useState(false);
  const [detectedTags, setDetectedTags] = useState([]); 

  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    keyword: '', prefecture: '', isRush: false, tag: '' 
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setProjectId(searchParams.get('projectId'));
      setFilters({
        keyword: searchParams.get('keyword') || '',
        prefecture: searchParams.get('prefecture') || '',
        isRush: searchParams.get('rush') === 'true',
        tag: searchParams.get('tag') || ''
      });
    }
  }, [searchParams]);

  const fetchFlorists = useCallback(async (currentFilters) => {
    setLoading(true);
    try {
      const url = new URL(`${API_URL}/api/florists`);
      if (currentFilters.keyword?.trim()) url.searchParams.append('keyword', currentFilters.keyword);
      if (currentFilters.prefecture?.trim()) url.searchParams.append('prefecture', currentFilters.prefecture);
      if (currentFilters.isRush) url.searchParams.append('rush', 'true');
      if (currentFilters.tag) url.searchParams.append('tag', currentFilters.tag);

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('データ取得エラー');
      setFlorists(await response.json());

      const params = new URLSearchParams();
      if (currentFilters.keyword) params.set('keyword', currentFilters.keyword);
      if (currentFilters.prefecture) params.set('prefecture', currentFilters.prefecture);
      if (currentFilters.isRush) params.set('rush', 'true');
      if (currentFilters.tag) params.set('tag', currentFilters.tag);
      if (projectId) params.set('projectId', projectId);
      
      router.replace(`/florists?${params.toString()}`, { scroll: false });
    } catch (error) {
      toast.error('お花屋さん一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [router, projectId]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchFlorists(filters); }, 300);
    return () => clearTimeout(timer);
  }, [filters, fetchFlorists]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
    
  const handleTagSelect = (tag) => setFilters(prev => ({ ...prev, tag: prev.tag === tag ? '' : tag }));
  const handleResetSearch = () => { setFilters({ keyword: '', prefecture: '', isRush: false, tag: '' }); setDetectedTags([]); };

  const handleImageSearch = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsSearchingImage(true);
    setDetectedTags([]);
    const toastId = toast.loading('AIが画像を解析中...');
    try {
        const formData = new FormData();
        formData.append('image', file);
        const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      
        const res = await fetch(`${API_URL}/api/ai/search-florist-by-image`, { 
            method: 'POST', body: formData, headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('解析失敗');
        const data = await res.json();
        const firstTag = data.analyzedTags[0] || '';
        setDetectedTags(data.analyzedTags);
        setFilters(prev => ({ ...prev, tag: firstTag }));
        toast.success(`「${firstTag}」などの特徴が見つかりました！`, { id: toastId });
        
    } catch (error) {
        toast.error('画像検索に失敗しました', { id: toastId });
    } finally {
        setIsSearchingImage(false);
        e.target.value = '';
    }
  };

  // ★ 修正箇所: URLを正しい /api/florists/offers に変更しました！
  const handleOffer = async (floristId) => {
    if (!projectId) return;
    if (!user) return toast.error('ログインが必要です');
    
    if (!window.confirm('このお花屋さんにオファーを送信しますか？')) return;
    
    setIsOffering(true);
    const toastId = toast.loading('オファー送信中...');
    
    try {
      const res = await authenticatedFetch(`${API_URL}/api/florists/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, floristId }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
          throw new Error(data.message || 'オファーの送信に失敗しました');
      }
      
      toast.success('オファーを送信しました！🎉\nお花屋さんからの返答をお待ちください。', { id: toastId, duration: 6000 });
      router.push(`/mypage`);
      
    } catch (error) {
      console.error('Offer Error:', error);
      toast.error(error.message, { id: toastId, duration: 5000 });
    } finally {
      setIsOffering(false);
    }
  };

  return (
    <main className="bg-gradient-to-br from-pink-50/80 to-sky-50/80 min-h-screen py-10 md:py-16 font-sans text-slate-800 relative overflow-hidden pb-24">
      <FloatingParticles />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-200/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute top-40 left-0 w-[400px] h-[400px] bg-sky-200/30 rounded-full blur-[100px] -translate-x-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ヘッダーセクション */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 gap-6 text-center md:text-left">
          <div>
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-2xl shadow-sm border border-pink-100 mb-4 text-pink-500 rotate-3"><Sparkles size={24} className="animate-pulse" /></div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-2">お花屋さんを探す</h1>
            <p className="text-slate-500 font-bold text-sm md:text-base">あなたの想いをカタチにする、プロフェッショナルな制作者たち🌸</p>
          </div>
          {projectId && (
             <span className="inline-flex items-center px-6 py-3 bg-indigo-500 text-white font-black rounded-full shadow-lg border border-indigo-400 animate-pulse text-sm">
                オファー先を選択中 (企画ID: {projectId})
             </span>
          )}
        </motion.div>

        {/* 検索・フィルターエリア */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard className="p-6 md:p-8 mb-12">
              {/* AI画像検索ボタン */}
              <div className="mb-8 flex flex-col items-center">
                  <motion.button 
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => fileInputRef.current.click()} disabled={isSearchingImage || isOffering}
                      className="w-full max-w-lg py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black rounded-full shadow-lg flex items-center justify-center gap-3 transition-all"
                  >
                      {isSearchingImage ? <Loader2 className="animate-spin text-xl"/> : <Camera className="text-xl"/>}
                      {isSearchingImage ? 'AI解析中...' : '理想の画像でAI検索する✨'}
                  </motion.button>
                  <input type="file" ref={fileInputRef} onChange={handleImageSearch} accept="image/*" className="hidden" />
                  
                  {detectedTags.length > 0 && (
                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                          {detectedTags.map(tag => (
                              <button key={tag} onClick={() => handleTagSelect(tag)} className={cn("px-4 py-1.5 rounded-full text-xs font-black border transition-all", filters.tag === tag ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-purple-500 border-purple-200')}>#{tag}</button>
                          ))}
                      </div>
                  )}
              </div>

              {/* テキスト検索・条件フィルター */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  <div className="md:col-span-5 relative">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-2">Keyword</label>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                        <input type="text" name="keyword" value={filters.keyword} onChange={handleFilterChange} placeholder="キーワード（店名、装飾など）" className="w-full pl-12 pr-4 py-4 bg-white/60 backdrop-blur-sm border-2 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all font-bold text-slate-700" />
                      </div>
                  </div>
                  <div className="md:col-span-3 relative">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-2">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                        <select name="prefecture" value={filters.prefecture} onChange={handleFilterChange} className="w-full pl-12 pr-10 py-4 bg-white/60 backdrop-blur-sm border-2 border-slate-100 rounded-2xl outline-none appearance-none cursor-pointer font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-pink-100 focus:border-pink-300 transition-all">
                            <option value="">すべてのエリア</option>
                            {prefectures.map(pref => <option key={pref} value={pref}>{pref}</option>)}
                        </select>
                        <Filter size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                      </div>
                  </div>
                  <div className="md:col-span-4 flex items-end">
                      <label className={cn("flex items-center cursor-pointer px-4 py-4 border-2 rounded-2xl w-full justify-center transition-all shadow-sm", filters.isRush ? 'bg-amber-50 border-amber-400 text-amber-600' : 'bg-white/60 border-slate-100 hover:border-amber-200 text-slate-500')}>
                          <input type="checkbox" name="isRush" checked={filters.isRush} onChange={handleFilterChange} className="hidden" />
                          <span className="text-sm font-black flex items-center gap-2"><Zap size={18} className={filters.isRush ? "fill-amber-500" : ""}/> お急ぎ便対応可能のみ</span>
                      </label>
                  </div>
              </div>

              {/* スタイルタグ */}
              <div className="mt-8 pt-6 border-t border-slate-100/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Filter by Style</p>
                  <div className="flex flex-wrap gap-2">
                      {STYLE_TAGS.map(tag => (
                          <button key={tag} onClick={() => handleTagSelect(tag)} className={cn("px-4 py-2 text-xs rounded-full font-black transition-all border", filters.tag === tag ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-pink-300 hover:text-pink-500')}>{tag.split('/')[0]}</button>
                      ))}
                  </div>
              </div>
          </GlassCard>
        </motion.div>

        {/* 結果表示 */}
        <div className="mb-6 flex justify-between items-end px-2">
             <h2 className="text-lg font-black text-slate-800">{loading ? 'Searching...' : `${florists.length}件のお花屋さん`}</h2>
             {!loading && (
               <button onClick={handleResetSearch} className="text-xs font-bold text-slate-400 hover:text-pink-500 transition-colors">条件をリセット</button>
             )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
             {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          florists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              <AnimatePresence>
                {florists.map((florist, i) => (
                  <motion.div key={florist.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="h-full">
                    <FloristCard florist={florist} projectId={projectId} onOffer={handleOffer} isOffering={isOffering} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/60 backdrop-blur-md rounded-[3rem] border border-white shadow-sm p-24 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300"><Search size={36}/></div>
              <p className="text-xl font-black text-slate-800 mb-2">条件に合うお花屋さんが見つかりませんでした</p>
              <p className="text-sm font-bold text-slate-500 mb-8">別のキーワードやエリアで検索してみてください🌸</p>
              <button onClick={handleResetSearch} className="px-8 py-3.5 bg-slate-900 text-white font-black rounded-full shadow-lg hover:bg-slate-800 transition-colors">検索条件をリセットする</button>
            </motion.div>
          )
        )}
      </div>
    </main>
  );
}

export default function FloristsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-pink-50/50"><Loader2 className="animate-spin text-pink-500" size={48} /></div>}>
      <FloristsListContent />
    </Suspense>
  );
}