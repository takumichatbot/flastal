'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast'; // ★ トーストをインポート
import StarRating from '../components/StarRating';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// 都道府県のリスト
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
function FloristCard({ florist }) {
  return (
    <Link href={`/florists/${florist.id}`} className="block h-full">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full flex flex-col group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
        <div className="bg-gradient-to-br from-pink-100 to-rose-200 h-32 flex items-center justify-center">
          <span className="text-4xl">💐</span>
        </div>
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-lg font-bold text-gray-800 group-hover:text-pink-600 transition-colors mb-2">{florist.platformName}</h3>
          
          {/* ★ 住所を表示（絞り込み確認用） */}
          <p className="text-sm text-gray-500 mt-1 truncate">
            {florist.address || '住所未設定'}
          </p>

          <div className="mt-auto pt-4 flex items-center gap-2">
            {florist.reviews && florist.reviews.length > 0 ? (
              <>
                {/* <StarRating rating={florist.averageRating} /> */}
                <span className="text-xs text-gray-500">({florist.reviews.length}件のレビュー)</span>
              </>
            ) : (
              <span className="text-xs text-gray-500">レビューはまだありません</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ★★★ お花屋さん一覧ページの本体 ★★★
export default function FloristsPage() {
  const [florists, setFlorists] = useState([]);
  const [loading, setLoading] = useState(true);

  // ★ 検索フォーム用の state を追加
  const [keyword, setKeyword] = useState('');
  const [prefecture, setPrefecture] = useState('');

  // ★ 検索条件に基づいてお花屋さんを取得する関数
  const fetchFlorists = async (searchKeyword, searchPrefecture) => {
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
      toast.error(error.message);
    } 
    finally { setLoading(false); }
  };

  // ★ ページ読み込み時に、まず全件を取得する
  useEffect(() => {
    fetchFlorists(null, null); // 最初は検索条件なしで全件取得
  }, []);

  // ★ 検索フォームが送信されたときの処理
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFlorists(keyword, prefecture);
  };

  return (
    <div className="bg-white min-h-screen">
      <main>
        <div className="relative w-full bg-pink-50">
           <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
             <h1 className="text-3xl font-bold text-gray-900">お花屋さんを探す</h1>
             <p className="mt-2 text-gray-600">あなたの想いを形にしてくれる、素敵なお花屋さんを見つけましょう。</p>
           </div>
        </div>
        
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          
          {/* ★★★ 検索フォームを追加 ★★★ */}
          <form onSubmit={handleSearchSubmit} className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-sm mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* キーワード入力 */}
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

            {/* 都道府県プルダウン */}
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

            {/* 検索ボタン */}
            <div className="md:col-span-1 flex items-end">
              <button type="submit" disabled={loading} className="w-full bg-pink-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-pink-600 disabled:bg-gray-400">
                {loading ? '検索中...' : '検索する'}
              </button>
            </div>
          </form>
          {/* ★★★ 検索フォームここまで ★★★ */}

          {loading ? <p className="text-center">読み込み中...</p> : (
            florists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {florists.map((florist) => (
                  <FloristCard key={florist.id} florist={florist} />
                ))}
              </div>
            ) : (
              // 検索結果が0件の場合
              <div className="bg-white rounded-lg shadow-md p-10 text-center text-gray-500">
                <p>該当するお花屋さんは見つかりませんでした。</p>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}