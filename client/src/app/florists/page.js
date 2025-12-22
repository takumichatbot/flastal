'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Next.jsの画像最適化
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  FiSearch, FiMapPin, FiCamera, FiLoader, FiX, FiZap, FiAward, FiFilter, FiStar 
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

// ローディング中のスケルトンカード
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

// お花屋さんカード
function FloristCard({ florist, projectId, onOffer, isOffering }) {
  // ポートフォリオ画像があればそれを、なければアイコン、それもなければプレースホルダー
  const thumbnailSrc = florist.portfolioImages?.[0] || florist.iconUrl;

  const CardBody = () => (
    <div className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative">
      
      {/* サムネイル画像エリア */}
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
        
        {/* オーバーレイグラデーション */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* 左下アイコン */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
             {florist.iconUrl ? (
               <div className="relative w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-white">
                 <Image src={florist.iconUrl} alt="icon" fill className="object-cover" />
               </div>
             ) : (
               <div className="w-10 h-10 rounded-full border-2 border-white shadow-md bg-white flex items-center justify-center text-xs text-gray-400">No Img</div>
             )}
        </div>

        {/* お急ぎ対応バッジ */}
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
        
        {/* タグ (最大3つ表示) */}
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
              className="w-full py-2.5 px-4 bg-pink-500 text-white text-sm font-bold rounded-xl hover:bg-pink-600 transition-colors shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:shadow-none transform active:scale-95"
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

// リストコンポーネント (メインロジック)
function FloristsListContent() {
  const [florists, setFlorists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffering, setIsOffering] = useState(false);
  
  const fileInputRef = useRef(null);
  const [isSearchingImage, setIsSearchingImage] = useState(false);
  const [detectedTags, setDetectedTags] = useState([]); 

  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const router = useRouter();

  // フィルター
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    prefecture: searchParams.get('prefecture') || '',
    isRush: searchParams.get('rush') === 'true',
    tag: searchParams.get('tag') || '' 
  });

  // データ取得関数
  const fetchFlorists = useCallback(async (currentFilters) => {
    setLoading(true);
    // 画像検索以外の通常の検索時、detectedTagsをクリアするかは仕様次第だが、ここではクリアしないでおく（タグ併用可能にするため）
    
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

      // URL更新 (shallow routing)
      const params = new URLSearchParams();
      if (currentFilters.keyword) params.set('keyword', currentFilters.keyword);
      if (currentFilters.prefecture) params.set('prefecture', currentFilters.prefecture);
      if (currentFilters.isRush) params.set('rush', 'true');
      if (currentFilters.tag) params.set('tag', currentFilters.tag);
      if (projectId) params.set('projectId', projectId); // projectIdも維持
      
      router.replace(`/florists?${params.toString()}`, { scroll: false });

    } catch (error) {
      console.error(error);
      toast.error('お花屋さん一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [router, projectId]);

  // 初回およびフィルター変更時に取得
  useEffect(() => {
    // 依存配列に filters を入れているので、フィルター変更時に自動fetchされる
    // 無駄なfetchを防ぐため、Debounceを入れるのが理想だが、ここではシンプルに実装
    const timer = setTimeout(() => {
        fetchFlorists(filters);
    }, 300); // 300msのデバウンス
    return () => clearTimeout(timer);
  }, [filters, fetchFlorists]);

  // ハンドラ
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
    }));
  };
    
  const handleTagSelect = (tag) => {
      setFilters(prev => ({
          ...prev,
          tag: prev.tag === tag ? '' : tag // トグル動作
      }));
  };
    
  const handleResetSearch = () => {
      setFilters({
          keyword: '',
          prefecture: '',
          isRush: false,
          tag: ''
      });
      setDetectedTags([]);
  };

  const handleImageSearch = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsSearchingImage(true);
    setDetectedTags([]);
    const toastId = toast.loading('AIが画像を解析中... (約10秒)');

    try {
        const formData = new FormData();
        formData.append('image', file);

        const res = await fetch(`${API_URL}/api/ai/search-florist-by-image`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error('解析失敗');
        
        const data = await res.json();
        const firstTag = data.analyzedTags[0] || '';
        
        setDetectedTags(data.analyzedTags);
        
        // フィルターを更新（これによりuseEffectが発火してリストが更新される）
        setFilters(prev => ({
            ...prev,
            tag: firstTag 
        }));
        
        toast.success(`「${firstTag}」などの特徴が見つかりました！`, { id: toastId });

    } catch (error) {
        console.error(error);
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
    <main className="bg-slate-50 min-h-screen pb-20">
      
      {/* 1. ヒーローセクション */}
      <div className="relative bg-gradient-to-r from-pink-500 to-rose-400 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10"></div> {/* 背景パターン用 */}
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">
            想いをカタチにする、<br className="sm:hidden"/>最高のお花屋さんを見つけよう
          </h1>
          {projectId ? (
            <div className="inline-block bg-white/20 backdrop-blur-md px-6 py-2 rounded-full border border-white/30">
                <p className="text-sm md:text-base font-bold text-white flex items-center justify-center gap-2">
                   <FiCheckCircle className="text-green-300"/> 企画ID: {projectId} のオファー先を選択中
                </p>
            </div>
          ) : (
            <p className="text-pink-100 text-lg max-w-2xl mx-auto">
              AI画像検索や詳細な条件で、あなたの企画にぴったりのパートナーが見つかります。
            </p>
          )}
        </div>
        
        {/* 装飾 */}
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-10 right-10 w-60 h-60 bg-yellow-300/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto -mt-8 px-4 sm:px-6 lg:px-8 relative z-20">
        
        {/* 2. 検索・フィルターカード */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mb-10">
            
            {/* AI検索ボタン (目立つように配置) */}
            <div className="mb-8 flex flex-col items-center">
                <button 
                    onClick={() => fileInputRef.current.click()}
                    disabled={isSearchingImage || isOffering}
                    className="w-full max-w-lg py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                    {isSearchingImage ? (
                        <><FiLoader className="animate-spin text-xl"/> AIが画像を解析中...</>
                    ) : (
                        <><FiCamera className="text-2xl"/> 理想の画像でAI検索する</>
                    )}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImageSearch} accept="image/*" className="hidden" />
                
                {/* AI検出タグの表示エリア */}
                {detectedTags.length > 0 && (
                    <div className="mt-4 p-4 bg-purple-50 border border-purple-100 rounded-xl w-full max-w-2xl text-center animate-fadeIn">
                        <p className="text-xs font-bold text-purple-600 mb-2 flex items-center justify-center gap-1">
                            ✨ AIが画像から特徴を検出しました
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {detectedTags.map(tag => (
                                <button 
                                    key={tag} 
                                    onClick={() => handleTagSelect(tag)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${filters.tag === tag ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-600 border-purple-200'}`}
                                >
                                    #{tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 通常フィルター */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* キーワード */}
                <div className="md:col-span-5 relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input 
                        type="text" 
                        name="keyword"
                        value={filters.keyword} 
                        onChange={handleFilterChange} 
                        placeholder="キーワードで検索 (例: 赤, リボン)" 
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none transition-all" 
                    />
                </div>
                
                {/* エリア */}
                <div className="md:col-span-3 relative">
                     <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                     <select 
                        name="prefecture"
                        value={filters.prefecture} 
                        onChange={handleFilterChange} 
                        className="w-full pl-10 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none transition-all appearance-none cursor-pointer"
                    >
                        <option value="">すべてのエリア</option>
                        {prefectures.map(pref => <option key={pref} value={pref}>{pref}</option>)}
                    </select>
                </div>

                {/* お急ぎスイッチ */}
                <div className="md:col-span-4 flex items-center justify-end">
                    <label className="flex items-center cursor-pointer p-2.5 bg-yellow-50 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition-colors w-full md:w-auto justify-center md:justify-start">
                        <input 
                            type="checkbox" 
                            name="isRush"
                            checked={filters.isRush} 
                            onChange={handleFilterChange} 
                            className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500 border-gray-300 mr-2"
                        />
                        <span className="text-sm font-bold text-yellow-800 flex items-center gap-1">
                            <FiZap className="fill-yellow-600"/> お急ぎ対応のみ
                        </span>
                    </label>
                </div>
            </div>

            {/* タグフィルター */}
            <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                    <FiFilter className="text-pink-500"/>
                    <span className="text-sm font-bold text-gray-700">スタイルで絞り込む</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => handleTagSelect('')}
                        className={`px-3 py-1.5 text-xs rounded-full font-bold transition-all border ${!filters.tag ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                    >
                        すべて
                    </button>
                    {STYLE_TAGS.map(tag => (
                        <button
                            key={tag}
                            onClick={() => handleTagSelect(tag)}
                            className={`px-3 py-1.5 text-xs rounded-full font-bold transition-all border ${filters.tag === tag ? 'bg-pink-500 text-white border-pink-500 shadow-md transform scale-105' : 'bg-white text-gray-600 border-gray-200 hover:border-pink-300 hover:text-pink-500'}`}
                        >
                            {tag.split('/')[0]}
                        </button>
                    ))}
                </div>
            </div>

            {/* 条件クリア */}
            {(filters.keyword || filters.prefecture || filters.isRush || filters.tag) && (
                <div className="mt-4 flex justify-end">
                    <button 
                        onClick={handleResetSearch}
                        className="text-sm text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                    >
                        <FiX /> 検索条件をリセット
                    </button>
                </div>
            )}
        </div>

        {/* 3. リスト表示エリア */}
        <div className="mb-4 flex justify-between items-end">
             <h2 className="text-xl font-bold text-gray-800">
                 {loading ? '検索中...' : `${florists.length}件のお花屋さん`}
             </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          florists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fadeIn">
              {florists.map((florist) => (
                <FloristCard 
                    key={florist.id} 
                    florist={florist} 
                    projectId={projectId} 
                    onOffer={handleOffer} 
                    isOffering={isOffering} 
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-16 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiSearch className="text-3xl text-gray-300"/>
              </div>
              <p className="text-xl font-bold text-gray-700 mb-2">条件に合うお花屋さんが見つかりませんでした</p>
              <p className="text-gray-500 mb-6">条件を変更して、もう一度検索してみてください。</p>
              <button 
                  onClick={handleResetSearch} 
                  className="px-6 py-3 bg-pink-500 text-white font-bold rounded-full hover:bg-pink-600 transition-colors shadow-lg"
              >
                  すべての条件をクリア
              </button>
            </div>
          )
        )}
      </div>
    </main>
  );
}

// Suspense Wrapper
import { FiCheckCircle } from 'react-icons/fi';

export default function FloristsPage() {
  return (
    <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
    }>
      <FloristsListContent />
    </Suspense>
  );
}