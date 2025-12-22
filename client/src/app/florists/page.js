'use client';

// Next.js 15 ビルドエラー回避用
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  FiSearch, FiMapPin, FiCamera, FiLoader, FiX, FiZap, FiAward, FiFilter, FiStar, FiCheckCircle 
} from 'react-icons/fi'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

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
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden h-full border border-gray-100 animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="flex gap-1">
          <div className="h-4 bg-gray-200 rounded w-12" />
          <div className="h-4 bg-gray-200 rounded w-12" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-10 bg-gray-200 rounded w-full mt-4" />
      </div>
    </div>
  );
}

function FloristCard({ florist, projectId, onOffer, isOffering }) {
  const thumbnailSrc = florist.portfolioImages?.[0] || florist.iconUrl;

  const CardBody = () => (
    <div className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative">
      <div className="relative h-56 w-full bg-gray-100 overflow-hidden">
        {thumbnailSrc ? (
          <Image 
            src={thumbnailSrc} 
            alt={florist.platformName} 
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-pink-50">💐</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
             {florist.iconUrl ? (
               <div className="relative w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-white">
                 <Image src={florist.iconUrl} alt="icon" fill className="object-cover" />
               </div>
             ) : (
               <div className="w-10 h-10 rounded-full border-2 border-white shadow-md bg-white flex items-center justify-center text-xs text-gray-400">No Img</div>
             )}
        </div>
        {florist.acceptsRushOrders && (
            <div className="absolute top-3 right-3 bg-yellow-400/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center z-10">
                <FiZap className="mr-0.5 fill-white"/> お急ぎOK
            </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{florist.platformName}</h3>
        </div>
        <div className="flex flex-wrap gap-1 mb-3 min-h-[24px]">
            {Array.isArray(florist.specialties) && florist.specialties.slice(0, 3).map(tag => (
                <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                    {tag.split('/')[0]}
                </span>
            ))}
            {Array.isArray(florist.specialties) && florist.specialties.length > 3 && (
              <span className="text-[10px] text-gray-400 px-1">+{florist.specialties.length - 3}</span>
            )}
        </div>
        <div className="flex items-center text-xs text-gray-500 mb-4 gap-3">
          <span className="flex items-center gap-0.5"><FiMapPin /> {florist.address || '未設定'}</span>
          {florist.reviewCount > 0 && (
             <span className="flex items-center gap-0.5 text-orange-500 font-bold">
               <FiStar className="fill-orange-500"/> {florist.averageRating?.toFixed(1)} ({florist.reviewCount})
             </span>
          )}
        </div>
        <div className="mt-auto">
          {projectId ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                onOffer(florist.id);
              }}
              disabled={isOffering}
              className="w-full py-2.5 px-4 bg-pink-500 text-white text-sm font-bold rounded-xl hover:bg-pink-600 transition-colors shadow-md disabled:bg-gray-300 transform active:scale-95"
            >
              {isOffering ? '送信中...' : 'このお花屋さんにオファー'}
            </button>
          ) : (
            <div className="w-full py-2 text-center text-sm font-bold text-pink-500 bg-pink-50 rounded-xl group-hover:bg-pink-500 group-hover:text-white transition-colors">
              詳細を見る
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (projectId) return <div className="h-full cursor-pointer">{CardBody()}</div>;
  return <Link href={`/florists/${florist.id}`} className="block h-full cursor-pointer">{CardBody()}</Link>;
}

function FloristsListContent() {
  const [florists, setFlorists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffering, setIsOffering] = useState(false);
  const [projectId, setProjectId] = useState(null);
  
  const fileInputRef = useRef(null);
  const [isSearchingImage, setIsSearchingImage] = useState(false);
  const [detectedTags, setDetectedTags] = useState([]); 

  const router = useRouter();

  const [filters, setFilters] = useState({
    keyword: '',
    prefecture: '',
    isRush: false,
    tag: '' 
  });

  // URLパラメータの初期取得 (windowオブジェクトから直接)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setProjectId(params.get('projectId'));
      setFilters({
        keyword: params.get('keyword') || '',
        prefecture: params.get('prefecture') || '',
        isRush: params.get('rush') === 'true',
        tag: params.get('tag') || ''
      });
    }
  }, []);

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
      const data = await response.json();
      setFlorists(data);

      const params = new URLSearchParams();
      if (currentFilters.keyword) params.set('keyword', currentFilters.keyword);
      if (currentFilters.prefecture) params.set('prefecture', currentFilters.prefecture);
      if (currentFilters.isRush) params.set('rush', 'true');
      if (currentFilters.tag) params.set('tag', currentFilters.tag);
      if (projectId) params.set('projectId', projectId);
      
      router.replace(`/florists?${params.toString()}`, { scroll: false });
    } catch (error) {
      console.error(error);
      toast.error('お花屋さん一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [router, projectId]);

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchFlorists(filters);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, fetchFlorists]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
    
  const handleTagSelect = (tag) => {
      setFilters(prev => ({ ...prev, tag: prev.tag === tag ? '' : tag }));
  };
    
  const handleResetSearch = () => {
      setFilters({ keyword: '', prefecture: '', isRush: false, tag: '' });
      setDetectedTags([]);
  };

  const handleImageSearch = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsSearchingImage(true);
    setDetectedTags([]);
    const toastId = toast.loading('AIが画像を解析中...');
    try {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch(`${API_URL}/api/ai/search-florist-by-image`, { method: 'POST', body: formData });
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

  const handleOffer = async (floristId) => {
    if (!projectId) return;
    if (!window.confirm('このお花屋さんにオファーを送信しますか？')) return;
    setIsOffering(true);
    const toastId = toast.loading('オファー送信中...');
    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const res = await fetch(`${API_URL}/api/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ projectId, floristId }),
      });
      if (!res.ok) throw new Error('送信失敗');
      toast.success('オファーを送信しました！', { id: toastId });
      router.push(`/projects/${projectId}`);
    } catch (error) {
      toast.error('オファーの送信に失敗しました', { id: toastId });
      setIsOffering(false);
    }
  };

  return (
    <main className="bg-slate-50 min-h-screen pb-20 pt-20">
      <div className="relative bg-gradient-to-r from-pink-500 to-rose-400 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto py-16 px-4 text-center relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">想いをカタチにする、最高のお花屋さんを見つけよう</h1>
          {projectId && (
            <div className="inline-block bg-white/20 backdrop-blur-md px-6 py-2 rounded-full border border-white/30">
                <p className="text-sm font-bold text-white flex items-center justify-center gap-2">
                   <FiCheckCircle className="text-green-300"/> 企画ID: {projectId} のオファー先を選択中
                </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto -mt-8 px-4 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mb-10">
            <div className="mb-8 flex flex-col items-center">
                <button 
                    onClick={() => fileInputRef.current.click()}
                    disabled={isSearchingImage || isOffering}
                    className="w-full max-w-lg py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3"
                >
                    {isSearchingImage ? <FiLoader className="animate-spin text-xl"/> : <FiCamera className="text-2xl"/>}
                    {isSearchingImage ? 'AIが画像を解析中...' : '理想の画像でAI検索する'}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImageSearch} accept="image/*" className="hidden" />
                {detectedTags.length > 0 && (
                    <div className="mt-4 p-4 bg-purple-50 rounded-xl w-full max-w-2xl text-center">
                        <div className="flex flex-wrap justify-center gap-2">
                            {detectedTags.map(tag => (
                                <button key={tag} onClick={() => handleTagSelect(tag)} className={`px-3 py-1 rounded-full text-xs font-bold border ${filters.tag === tag ? 'bg-purple-600 text-white' : 'bg-white text-purple-600'}`}>#{tag}</button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5 relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input type="text" name="keyword" value={filters.keyword} onChange={handleFilterChange} placeholder="キーワードで検索" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                </div>
                <div className="md:col-span-3 relative">
                     <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                     <select name="prefecture" value={filters.prefecture} onChange={handleFilterChange} className="w-full pl-10 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none appearance-none">
                        <option value="">すべてのエリア</option>
                        {prefectures.map(pref => <option key={pref} value={pref}>{pref}</option>)}
                    </select>
                </div>
                <div className="md:col-span-4 flex items-center justify-end">
                    <label className="flex items-center cursor-pointer p-2.5 bg-yellow-50 border border-yellow-200 rounded-xl w-full md:w-auto justify-center">
                        <input type="checkbox" name="isRush" checked={filters.isRush} onChange={handleFilterChange} className="w-5 h-5 text-yellow-600 rounded mr-2" />
                        <span className="text-sm font-bold text-yellow-800 flex items-center gap-1"><FiZap className="fill-yellow-600"/> お急ぎ対応のみ</span>
                    </label>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                    {STYLE_TAGS.map(tag => (
                        <button key={tag} onClick={() => handleTagSelect(tag)} className={`px-3 py-1.5 text-xs rounded-full font-bold transition-all border ${filters.tag === tag ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-gray-600 border-gray-200'}`}>{tag.split('/')[0]}</button>
                    ))}
                </div>
            </div>
        </div>

        <div className="mb-4">
             <h2 className="text-xl font-bold text-gray-800">{loading ? '検索中...' : `${florists.length}件のお花屋さん`}</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          florists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {florists.map((florist) => (
                <FloristCard key={florist.id} florist={florist} projectId={projectId} onOffer={handleOffer} isOffering={isOffering} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-16 text-center">
              <p className="text-xl font-bold text-gray-700">条件に合うお花屋さんが見つかりませんでした</p>
              <button onClick={handleResetSearch} className="mt-6 px-6 py-3 bg-pink-500 text-white font-bold rounded-full">すべての条件をクリア</button>
            </div>
          )
        )}
      </div>
    </main>
  );
}

export default function FloristsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-slate-50"><FiLoader className="animate-spin text-pink-500" size={48} /></div>}>
      <FloristsListContent />
    </Suspense>
  );
}