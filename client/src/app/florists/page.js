'use client';

import { useState, useEffect, useCallback, Suspense } from 'react'; // ★ useCallback と Suspense を追加
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import StarRating from '../components/StarRating';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const prefectures = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', 
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', 
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', 
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

// ★★★ お花屋さんカード ★★★
function FloristCard({ florist, projectId, onOffer, isOffering }) {
  
  // サムネイルURLを決定 (ポートフォリオ画像の1枚目、なければアイコン)
  const thumbnailUrl = florist.portfolioImages?.[0] || florist.iconUrl;

  const cardContent = (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full flex flex-col group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      
      {/* ★ サムネイル画像エリア */}
      <div className="h-48 bg-pink-100 flex items-center justify-center">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={florist.platformName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">💐</span> 
        )}
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-800 mb-2">{florist.platformName}</h3>
        <p className="text-sm text-gray-500 mt-1 truncate">
          {florist.address || '住所未設定'}
        </p>
        
        <div className="mt-auto pt-4 flex items-center gap-2">
           {florist.reviews && florist.reviews.length > 0 ? (
              <span className="text-xs text-gray-500">({florist.reviews.length}件のレビュー)</span>
            ) : (
              <span className="text-xs text-gray-500">レビューはまだありません</span>
            )}
        </div>

        {projectId ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              onOffer(florist.id);
            }}
            disabled={isOffering}
            className="w-full mt-4 py-2 px-4 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-600 transition-colors disabled:bg-gray-400"
          >
            {isOffering ? '送信中...' : 'この花屋さんにオファー'}
          </button>
        ) : (
          <span className="mt-4 text-pink-500 text-sm font-semibold group-hover:underline">
            プロフィールを見る →
          </span>
        )}
      </div>
    </div>
  );

  if (projectId) {
    return <div className="h-full cursor-pointer">{cardContent}</div>;
  }
  return (
    <Link href={`/florists/${florist.id}`} className="block h-full cursor-pointer">
      {cardContent}
    </Link>
  );
}

// ★★★ お花屋さん一覧リストの中身 ★★★
function FloristsListContent() {
  const [florists, setFlorists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffering, setIsOffering] = useState(false);
  
  const [keyword, setKeyword] = useState('');
  const [prefecture, setPrefecture] = useState('');

  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const router = useRouter();

  const fetchFlorists = useCallback(async (searchKeyword, searchPrefecture) => {
    setLoading(true);
    try {
      const url = new URL(`${API_URL}/api/florists`);
      if (searchKeyword && searchKeyword.trim() !== '') {
        url.searchParams.append('keyword', searchKeyword);
      }
      if (searchPrefecture && searchPrefecture.trim() !== '') {
        url.searchParams.append('prefecture', searchPrefecture);
      }

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('データの取得に失敗しました。');
      const data = await response.json();
      setFlorists(data);

      if (data.length === 0 && (searchKeyword || searchPrefecture)) {
        toast.success('その条件に一致するお花屋さんは見つかりませんでした。');
      }
    } catch (error) {
      console.error(error);
      toast.error('お花屋さん一覧の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlorists(null, null);
  }, [fetchFlorists]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFlorists(keyword, prefecture);
  };

  const handleOffer = async (floristId) => {
    if (!projectId) return;
    if (!window.confirm('このお花屋さんにオファーを送信しますか？\n承認されるとチャットルームが開設されます。')) {
      return;
    }
    setIsOffering(true);
    const toastId = toast.loading('オファーを送信中...');
    try {
      const res = await fetch(`${API_URL}/api/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          {/* ★ タイトル修正 */}
          <h1 className="text-3xl font-bold text-gray-900">お花屋さん一覧</h1>
          {projectId ? (
            <p className="mt-4 text-lg text-pink-600 font-semibold bg-white inline-block px-6 py-2 rounded-full shadow-sm">
              企画ID: {projectId} のオファー先を選択中
            </p>
          ) : (
            <p className="mt-2 text-gray-600">あなたの想いを形にしてくれる、素敵なお花屋さんを見つけましょう。</p>
          )}
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        
        {/* ★★★ 検索フォーム ★★★ */}
        <form onSubmit={handleSearchSubmit} className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-sm mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label htmlFor="keyword" className="block text-sm font-medium text-gray-700">
              キーワード
            </label>
            <input
              type="text"
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="活動名、自己紹介..."
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
            />
          </div>
          <div className="md:col-span-1">
            <label htmlFor="prefecture" className="block text-sm font-medium text-gray-700">
              住所 (都道府県)
            </label>
            <select
              id="prefecture"
              value={prefecture}
              onChange={(e) => setPrefecture(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
            >
              <option value="">すべての都道府県</option>
              {prefectures.map(pref => (
                <option key={pref} value={pref}>{pref}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1 flex items-end">
            <button type="submit" disabled={loading || isOffering} className="w-full bg-pink-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-pink-600 disabled:bg-gray-400">
              {loading ? '検索中...' : '検索する'}
            </button>
          </div>
        </form>

        {loading ? (
          <p className="text-center">読み込み中...</p>
        ) : (
          florists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
            <div className="bg-white rounded-lg shadow-md p-10 text-center text-gray-500">
              <p>該当するお花屋さんは見つかりませんでした。</p>
            </div>
          )
        )}
      </div>
    </main>
  );
}

// ★★★ メインコンポーネント (Suspenseラッパー) ★★★
export default function FloristsPage() {
  return (
    <div className="bg-white min-h-screen">
      <Suspense fallback={<div className="text-center py-20">読み込み中...</div>}>
        <FloristsListContent />
      </Suspense>
    </div>
  );
}