'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
// ★ FiAward (タグアイコンとして使用) を追加
import { FiSearch, FiMapPin, FiCamera, FiLoader, FiX, FiZap, FiAward } from 'react-icons/fi'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ★★★ 共通タグ定義 (バックエンドの specialties と一致させる) ★★★
const STYLE_TAGS = [
    'かわいい/キュート', 'クール/かっこいい', 'おしゃれ/モダン', '和風/和モダン',
    'ゴージャス/豪華', 'パステルカラー', 'ビビッドカラー', 'ニュアンスカラー',
    'バルーン装飾', 'ペーパーフラワー', '布・リボン装飾', 'キャラクター/モチーフ',
    '大型/連結', '卓上/楽屋花'
];

// 都道府県リスト (簡易版)
const prefectures = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', 
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', 
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', 
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県', '全国対応' // 全国対応を追加
];

// お花屋さんカード
function FloristCard({ florist, projectId, onOffer, isOffering }) {
  const thumbnailUrl = florist.portfolioImages?.[0] || florist.iconUrl;

  const cardContent = (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full flex flex-col group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative">
      
      {/* サムネイル */}
      <div className="h-48 bg-pink-100 flex items-center justify-center relative overflow-hidden">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={florist.platformName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <span className="text-4xl">💐</span> 
        )}
        <div className="absolute bottom-2 left-2 flex items-center gap-2">
             {florist.iconUrl && <img src={florist.iconUrl} className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover"/>}
        </div>
      </div>

      {/* ★★★ お急ぎ対応バッジ ★★★ */}
      {florist.acceptsRushOrders && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center z-10">
              <FiZap className="mr-1 fill-yellow-900"/> お急ぎOK
          </div>
      )}

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-800 mb-1">{florist.platformName}</h3>
        
        <div className="flex flex-wrap gap-1 mb-2">
            {/* specialtiesが配列の場合のみ表示 */}
            {Array.isArray(florist.specialties) && florist.specialties?.slice(0, 3).map(tag => (
                <span key={tag} className="text-[10px] bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full border border-pink-100">
                    {tag.split('/')[0]}
                </span>
            ))}
            {Array.isArray(florist.specialties) && florist.specialties.length > 3 && <span className="text-[10px] text-gray-400">+</span>}
        </div>

        <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
          <FiMapPin className="shrink-0"/> {florist.address || '住所未設定'}
        </p>
        
        <div className="mt-auto border-t pt-3 flex items-center justify-between">
           {/* レビュー情報がAPIで返される前提 */}
           {florist.reviewCount > 0 ? (
              <span className="text-xs text-orange-500 font-bold">★ 平均 {florist.averageRating?.toFixed(1) || '—'} ({florist.reviewCount}件)</span>
            ) : (
              <span className="text-xs text-gray-400">レビューなし</span>
            )}
        </div>

        {projectId ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              onOffer(florist.id);
            }}
            disabled={isOffering}
            className="w-full mt-3 py-2 px-4 bg-pink-500 text-white text-sm font-semibold rounded-lg hover:bg-pink-600 transition-colors disabled:bg-gray-400"
          >
            {isOffering ? '送信中...' : 'オファーする'}
          </button>
        ) : (
          <span className="mt-3 text-center block text-pink-500 text-xs font-bold group-hover:underline">
            詳しく見る →
          </span>
        )}
      </div>
    </div>
  );

  if (projectId) return <div className="h-full cursor-pointer">{cardContent}</div>;
  return <Link href={`/florists/${florist.id}`} className="block h-full cursor-pointer">{cardContent}</Link>;
}

// リストコンポーネント
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

  // ★★★ フィルター Stateに tag を追加 ★★★
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    prefecture: searchParams.get('prefecture') || '',
    isRush: searchParams.get('rush') === 'true',
    tag: searchParams.get('tag') || '' // ★ tagを追加
  });

  const fetchFlorists = useCallback(async (currentFilters) => {
    setLoading(true);
    setDetectedTags([]); 

    try {
      const url = new URL(`${API_URL}/api/florists`);
      
      // クエリパラメータを構築
      if (currentFilters.keyword && currentFilters.keyword.trim() !== '') url.searchParams.append('keyword', currentFilters.keyword);
      if (currentFilters.prefecture && currentFilters.prefecture.trim() !== '') url.searchParams.append('prefecture', currentFilters.prefecture);
      if (currentFilters.isRush) url.searchParams.append('rush', 'true');
      if (currentFilters.tag) url.searchParams.append('tag', currentFilters.tag); // ★ tagをAPIに渡す

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('データの取得に失敗しました。');
      const data = await response.json();
      
      setFlorists(data);

      // URLも更新
      const queryString = url.searchParams.toString();
      router.replace(`/florists?${queryString}`, undefined, { shallow: true });

      if (data.length === 0 && (currentFilters.keyword || currentFilters.prefecture || currentFilters.isRush || currentFilters.tag)) {
        toast.success('その条件に一致するお花屋さんは見つかりませんでした。');
      }
    } catch (error) {
      console.error(error);
      toast.error('お花屋さん一覧の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchFlorists(filters);
  }, [filters, fetchFlorists]);

  // ★★★ フィルターハンドラを統合 ★★★
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
          // 選択されたタグが現在のタグと同じなら解除、そうでなければ設定
          tag: prev.tag === tag ? '' : tag
      }));
  };
    
  const handleResetSearch = () => {
      setFilters({
          keyword: '',
          prefecture: '',
          isRush: false,
          tag: ''
      });
  };
  // ★★★ フィルターハンドラ統合 終わり ★★★

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

        if (!res.ok) throw new Error('解析に失敗しました');
        
        const data = await res.json();
        
        // AI検索結果でフィルターを上書き
        const firstTag = data.analyzedTags[0] || '';
        setFilters({
            keyword: '',
            prefecture: '',
            isRush: false,
            tag: firstTag // AIが検出した最初のタグで検索開始
        });
        
        setDetectedTags(data.analyzedTags);
        
        if (data.florists.length > 0) {
            toast.success('似ているお花屋さんを見つけました！', { id: toastId });
        } else {
            toast.error('条件に合うお花屋さんが見つかりませんでした', { id: toastId });
        }

    } catch (error) {
        console.error(error);
        toast.error('検索に失敗しました', { id: toastId });
    } finally {
        setIsSearchingImage(false);
        e.target.value = '';
    }
  };

  const handleOffer = async (floristId) => {
    if (!projectId) return;
    if (!window.confirm('このお花屋さんにオファーを送信しますか？\n承認されるとチャットルームが開設されます。')) {
      return;
    }
    setIsOffering(true);
    const toastId = toast.loading('オファーを送信中...');
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/api/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ projectId, floristId }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'オファーの送信に失敗しました。');
      }
      toast.success('オファーを送信しました！', { id: toastId });
      router.push(`/projects/${projectId}`);
    } catch (error) {
      toast.error(error.message, { id: toastId });
      setIsOffering(false);
    }
  };

  return (
    <main>
      <div className="relative w-full bg-pink-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">お花屋さん一覧</h1>
          {projectId ? (
            <div className="mt-4">
                <p className="text-lg text-pink-600 font-semibold bg-white inline-block px-6 py-2 rounded-full shadow-sm border border-pink-200">
                企画ID: {projectId} のオファー先を選択中
                </p>
                <p className="text-sm text-gray-500 mt-2">気になるお花屋さんに「オファー」を送ってみましょう。</p>
            </div>
          ) : (
            <p className="mt-2 text-gray-600">あなたの想いを形にしてくれる、素敵なお花屋さんを見つけましょう。</p>
          )}
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        
        {/* AI画像検索 */}
        <div className="max-w-xl mx-auto mb-10 text-center">
            <button 
                onClick={() => fileInputRef.current.click()}
                disabled={isSearchingImage || isOffering}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center group"
            >
                {isSearchingImage ? (
                    <><FiLoader className="animate-spin mr-2"/> AIが解析中...</>
                ) : (
                    <><FiCamera className="mr-2 text-xl group-hover:scale-110 transition-transform"/> 画像で検索する (AI解析)</>
                )}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImageSearch} accept="image/*" className="hidden" />
            <p className="text-xs text-gray-500 mt-2">
                SNSで見つけた「理想の画像」をアップロードすると、AIが似たスタイルのお花屋さんを探します。
            </p>
        </div>

        {/* AIタグ表示 */}
        {detectedTags.length > 0 && (
            <div className="mb-10 p-6 bg-purple-50 border border-purple-200 rounded-xl text-center animate-fadeIn shadow-inner">
                <p className="text-sm text-purple-800 font-bold mb-3 flex items-center justify-center">
                    <span className="mr-2 text-xl">🤖</span> AIが画像から検出したキーワード
                </p>
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {detectedTags.map(tag => (
                        <span key={tag} className="bg-white text-purple-600 px-3 py-1 rounded-full text-sm font-medium border border-purple-100 shadow-sm">
                            #{tag}
                        </span>
                    ))}
                </div>
                {/* AI検索後に全リセットボタンを表示 */}
                <button onClick={handleResetSearch} className="text-xs text-gray-500 underline flex items-center justify-center mx-auto hover:text-gray-800">
                    <FiX className="mr-1"/> 検索条件をクリアして全件表示
                </button>
            </div>
        )}
        
        {/* 検索フォーム */}
        {/* ★★★ onKeyDown を追加して Enter キーの処理を統合 ★★★ */}
        <form onSubmit={(e) => { e.preventDefault(); fetchFlorists(filters); }} className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 mb-8 grid grid-cols-1 gap-6">
          
          {/* 1. キーワード/エリア/お急ぎ */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              
              {/* キーワード */}
              <div className="md:col-span-1">
                <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-1">キーワード</label>
                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input 
                        type="text" 
                        id="keyword" 
                        name="keyword"
                        value={filters.keyword} 
                        onChange={handleFilterChange} 
                        placeholder="名前、特徴など..." 
                        className="w-full pl-10 p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-pink-500 focus:border-pink-500" 
                    />
                </div>
              </div>
              
              {/* エリア */}
              <div className="md:col-span-1">
                <label htmlFor="prefecture" className="block text-sm font-medium text-gray-700 mb-1">エリア</label>
                <select 
                    id="prefecture" 
                    name="prefecture"
                    value={filters.prefecture} 
                    onChange={handleFilterChange} 
                    className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-pink-500 focus:border-pink-500 bg-white"
                >
                  <option value="">すべてのエリア</option>
                  {prefectures.map(pref => <option key={pref} value={pref}>{pref}</option>)}
                </select>
              </div>
              
              {/* お急ぎ便チェックボックス */}
              <div className="md:col-span-1 pb-1">
                 <label className="flex items-center cursor-pointer p-2 border border-yellow-300 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                    <input 
                        type="checkbox" 
                        name="isRush"
                        checked={filters.isRush} 
                        onChange={handleFilterChange} 
                        className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm font-bold text-yellow-800 flex items-center">
                        <FiZap className="mr-1 fill-yellow-600"/> お急ぎ便対応のみ
                    </span>
                 </label>
              </div>

              {/* 絞り込みボタン */}
              <div className="md:col-span-1">
                  <button type="submit" disabled={loading || isOffering} className="w-full bg-pink-500 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-pink-600 disabled:bg-gray-400 transition-colors">
                    <FiSearch className="inline mr-1"/> 絞り込む
                  </button>
              </div>
          </div>

          {/* 2. タグフィルター */}
          <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <FiAward className="mr-1 text-pink-500"/> 得意な装飾で絞り込む:
              </h3>
              <div className="flex flex-wrap gap-2">
                  {STYLE_TAGS.map(tag => (
                      <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagSelect(tag)}
                          className={`px-3 py-1 text-xs rounded-full font-medium transition-colors border ${filters.tag === tag ? 'bg-pink-500 text-white border-pink-500 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:bg-pink-50'}`}
                      >
                          {tag.split('/')[0]}
                          {filters.tag === tag && <FiX className="inline ml-1 w-3 h-3"/>}
                      </button>
                  ))}
              </div>
          </div>

          {/* 3. クリアボタン */}
          {(filters.keyword || filters.prefecture || filters.isRush || filters.tag) && (
              <div className="mt-4 flex justify-end">
                  <button 
                      type="button"
                      onClick={handleResetSearch}
                      className="text-sm text-red-500 hover:underline flex items-center font-medium"
                  >
                      <FiX className="mr-1"/> フィルターをクリア
                  </button>
              </div>
          )}
        </form>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div></div>
        ) : (
          florists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {florists.map((florist) => (
                <FloristCard key={florist.id} florist={florist} projectId={projectId} onOffer={handleOffer} isOffering={isOffering} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
              <p className="text-lg mb-2">該当するお花屋さんは見つかりませんでした。</p>
              <button onClick={handleResetSearch} className="text-pink-600 font-bold hover:underline">条件をリセットする</button>
            </div>
          )
        )}
      </div>
    </main>
  );
}

export default function FloristsPage() {
  return (
    <div className="bg-white min-h-screen">
      <Suspense fallback={<div className="text-center py-20">読み込み中...</div>}>
        <FloristsListContent />
      </Suspense>
    </div>
  );
}