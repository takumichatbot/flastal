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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full animate-pulse">
      <div className="h-52 bg-gray-200" />
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
    <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative">
      <div className="relative h-52 bg-gray-100 overflow-hidden">
        {thumbnailSrc ? (
          <Image 
            src={thumbnailSrc} 
            alt={florist.platformName} 
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-slate-50 opacity-50">💐</div>
        )}
        
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
            {florist.acceptsRushOrders && (
                <div className="bg-white/90 backdrop-blur text-pink-600 text-[10px] font-black px-3 py-1 rounded-full shadow-sm flex items-center gap-1 border border-pink-100">
                    <FiZap size={10} className="fill-pink-600"/> お急ぎOK
                </div>
            )}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow relative">
        {/* アイコンをカードの境界線に浮かせるデザイン */}
        <div className="absolute -top-10 left-5 w-16 h-16 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white">
            {florist.iconUrl ? (
                <Image src={florist.iconUrl} alt="" fill style={{objectFit: 'cover'}} />
            ) : (
                <div className="w-full h-full bg-slate-50 flex items-center justify-center text-gray-300"><FiAward size={24}/></div>
            )}
        </div>

        <div className="mt-6 mb-1">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-1">{florist.platformName}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Florist Partner</p>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
            {Array.isArray(florist.specialties) && florist.specialties.slice(0, 3).map(tag => (
                <span key={tag} className="text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100 font-bold">
                    #{tag.split('/')[0]}
                </span>
            ))}
            {Array.isArray(florist.specialties) && florist.specialties.length > 3 && (
              <span className="text-[10px] text-gray-400 font-bold px-1 flex items-center">+{florist.specialties.length - 3}</span>
            )}
        </div>

        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between text-xs font-medium pt-4 border-t border-gray-50">
            <span className="flex items-center text-gray-500 truncate mr-2">
                <FiMapPin className="mr-1.5 text-indigo-400 shrink-0" size={14}/> 
                <span className="truncate">{florist.address || '全国対応'}</span>
            </span>
            {florist.reviewCount > 0 && (
               <span className="flex items-center gap-1 text-yellow-500 font-black shrink-0">
                 <FiStar size={14} className="fill-yellow-500"/> {florist.averageRating?.toFixed(1)}
               </span>
            )}
          </div>

          {projectId ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                onOffer(florist.id);
              }}
              disabled={isOffering}
              className="w-full py-3 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-pink-600 transition-all shadow-md disabled:bg-gray-300"
            >
              {isOffering ? <FiLoader className="animate-spin mx-auto"/> : 'この花屋さんにオファー'}
            </button>
          ) : (
            <div className="w-full py-2.5 text-center text-xs font-black text-pink-500 bg-pink-50 rounded-xl group-hover:bg-pink-500 group-hover:text-white transition-all">
              詳細を見る &rarr;
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
    <main className="bg-slate-50 min-h-screen py-10 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ヘッダーセクション */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">お花屋さんを探す</h1>
            <p className="text-gray-500 text-sm">あなたの想いをカタチにする、プロフェッショナルな制作者たち</p>
          </div>
          {projectId && (
             <span className="inline-flex items-center px-6 py-3 bg-pink-500 text-white font-black rounded-xl shadow-lg border border-pink-400 animate-pulse">
                オファー先を選択中 (企画: {projectId})
             </span>
          )}
        </div>

        {/* 検索・フィルターエリア */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-10">
            {/* AI画像検索ボタン */}
            <div className="mb-8 flex flex-col items-center">
                <button 
                    onClick={() => fileInputRef.current.click()}
                    disabled={isSearchingImage || isOffering}
                    className="w-full max-w-lg py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white font-black rounded-2xl shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                >
                    {isSearchingImage ? <FiLoader className="animate-spin text-xl"/> : <FiCamera className="text-xl"/>}
                    {isSearchingImage ? 'AI解析中...' : '理想の画像でAI検索する'}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImageSearch} accept="image/*" className="hidden" />
                
                {detectedTags.length > 0 && (
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        {detectedTags.map(tag => (
                            <button key={tag} onClick={() => handleTagSelect(tag)} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${filters.tag === tag ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-600 border-purple-200'}`}>#{tag}</button>
                        ))}
                    </div>
                )}
            </div>

            {/* テキスト検索・条件フィルター */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5 relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input type="text" name="keyword" value={filters.keyword} onChange={handleFilterChange} placeholder="キーワード（店名、装飾など）" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all" />
                </div>
                <div className="md:col-span-3 relative">
                     <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                     <select name="prefecture" value={filters.prefecture} onChange={handleFilterChange} className="w-full pl-10 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none appearance-none cursor-pointer">
                        <option value="">すべてのエリア</option>
                        {prefectures.map(pref => <option key={pref} value={pref}>{pref}</option>)}
                    </select>
                </div>
                <div className="md:col-span-4 flex items-center">
                    <label className="flex items-center cursor-pointer p-3 bg-amber-50 border border-amber-100 rounded-xl w-full justify-center hover:bg-amber-100 transition-colors">
                        <input type="checkbox" name="isRush" checked={filters.isRush} onChange={handleFilterChange} className="w-5 h-5 text-amber-600 rounded mr-2" />
                        <span className="text-sm font-black text-amber-800 flex items-center gap-1.5"><FiZap size={16} className="fill-amber-600"/> お急ぎ対応可能のみ</span>
                    </label>
                </div>
            </div>

            {/* スタイルタグ */}
            <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Filter by Style</p>
                <div className="flex flex-wrap gap-2">
                    {STYLE_TAGS.map(tag => (
                        <button key={tag} onClick={() => handleTagSelect(tag)} className={`px-4 py-2 text-xs rounded-full font-bold transition-all border ${filters.tag === tag ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-500 border-gray-200 hover:border-pink-300'}`}>{tag.split('/')[0]}</button>
                    ))}
                </div>
            </div>
        </div>

        {/* 結果表示 */}
        <div className="mb-8 flex justify-between items-end px-2">
             <h2 className="text-lg font-black text-gray-900">{loading ? 'Searching...' : `${florists.length}件のお花屋さん`}</h2>
             {!loading && (
               <button onClick={handleResetSearch} className="text-xs font-bold text-gray-400 hover:text-pink-500 underline decoration-dotted">条件をすべてクリア</button>
             )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
             {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          florists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-fadeIn">
              {florists.map((florist) => (
                <FloristCard key={florist.id} florist={florist} projectId={projectId} onOffer={handleOffer} isOffering={isOffering} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-20 text-center">
              <FiSearch size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-lg font-bold text-gray-400">条件に合うお花屋さんが見つかりませんでした</p>
              <button onClick={handleResetSearch} className="mt-6 px-8 py-3 bg-pink-500 text-white font-black rounded-xl shadow-lg">検索条件を戻す</button>
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