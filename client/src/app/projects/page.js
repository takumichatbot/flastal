'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast'; // ユーザーへのフィードバック用

const API_URL = process.env.NEXT_PUBLIC_API_URL_PYTHON || 'https://flastal-backend.onrender.com';

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

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // ★ 検索フォーム用の state を追加
  const [keyword, setKeyword] = useState('');
  const [prefecture, setPrefecture] = useState('');

  // ★ 検索条件に基づいてプロジェクトを取得する関数
  const fetchProjects = async (searchKeyword, searchPrefecture) => {
    setLoading(true);
    try {
      // URLオブジェクトを使ってクエリパラメータを安全に構築
      const url = new URL(`${API_URL}/api/projects`);
      
      if (searchKeyword && searchKeyword.trim() !== '') {
        url.searchParams.append('keyword', searchKeyword);
      }
      if (searchPrefecture && searchPrefecture.trim() !== '') {
        url.searchParams.append('prefecture', searchPrefecture);
      }

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('データの取得に失敗しました。');
      const data = await response.json();
      setProjects(data);

      // 検索結果が0件だった場合、ユーザーに通知
      if (data.length === 0 && (searchKeyword || searchPrefecture)) {
        toast.success('その条件に一致する企画はありませんでした。');
      }

    } catch (error) { 
      console.error(error);
      toast.error(error.message); // エラー時もトースト表示
    } 
    finally { setLoading(false); }
  };

  // ★ ページ読み込み時に、まず全件を取得する
  useEffect(() => {
    fetchProjects(null, null); // 最初は検索条件なしで全件取得
  }, []);

  // ★ 検索フォームが送信されたときの処理
  const handleSearchSubmit = (e) => {
    e.preventDefault(); // ページの再読み込みを防ぐ
    fetchProjects(keyword, prefecture); // フォームの state を使ってAPIを呼び出す
  };

  return (
    <div className="bg-sky-50 min-h-screen">
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">みんなの企画</h1>
          <Link href="/projects/create">
            <span className="rounded-full bg-sky-500 px-6 py-2 text-base font-semibold text-white shadow-md hover:bg-sky-600">
              企画を作成する
            </span>
          </Link>
        </div>

        {/* ★★★ 検索フォームを追加 ★★★ */}
        <form onSubmit={handleSearchSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          
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
              placeholder="企画タイトル、説明文..."
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
            />
          </div>

          {/* 都道府県プルダウン */}
          <div className="md:col-span-1">
            <label htmlFor="prefecture" className="block text-sm font-medium text-gray-700">
              お届け先 (都道府県)
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
            <button type="submit" disabled={loading} className="w-full bg-sky-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-sky-600 disabled:bg-gray-400">
              {loading ? '検索中...' : '検索する'}
            </button>
          </div>
        </form>
        {/* ★★★ 検索フォームここまで ★★★ */}


        {/* 企画一覧 */}
        {loading ? <p className="text-center">読み込み中...</p> : (
          projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <h2 className="text-lg font-bold text-sky-600 truncate">{project.title}</h2>
                    {/* ★ バグ修正: project.organizer -> project.planner.handleName */}
                    <p className="text-sm text-gray-600 mt-2">企画者: {project.planner?.handleName || '不明'}</p>
                    {/* ★ お届け先も表示（検索の確認用） */}
                    <p className="text-sm text-gray-500 mt-1 truncate">お届け先: {project.deliveryAddress}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            // 検索結果が0件の場合
            <div className="bg-white rounded-lg shadow-md p-10 text-center text-gray-500">
              <p>該当する企画は見つかりませんでした。</p>
            </div>
          )
        )}
      </main>
    </div>
  );
}