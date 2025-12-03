'use client';

import { useState, useEffect, Suspense } from 'react'; // ★ Suspenseを追加
import { useSearchParams } from 'next/navigation'; // ★ 追加（URLパラメータ対応のため）
import Link from 'next/link';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL_PYTHON || 'https://flastal-backend.onrender.com';

const prefectures = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', 
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', 
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', 
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

// ★★★ メインコンテンツを別コンポーネントとして切り出し ★★★
function ProjectsContent() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState('');
  const [prefecture, setPrefecture] = useState('');
  
  // ★ URLクエリパラメータから初期値を読み込む (任意)
  const searchParams = useSearchParams(); 

  const fetchProjects = async (searchKeyword, searchPrefecture) => {
    setLoading(true);
    try {
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
      if (data.length === 0 && (searchKeyword || searchPrefecture)) {
        toast.success('その条件に一致する企画はありませんでした。');
      }
    } catch (error) { 
      console.error(error);
      toast.error(error.message);
    } 
    finally { setLoading(false); }
  };

  // 初回読み込み時
  useEffect(() => {
    // URLパラメータがあればそれを初期検索条件にする
    const queryKeyword = searchParams.get('keyword') || '';
    const queryPrefecture = searchParams.get('prefecture') || '';
    
    if(queryKeyword) setKeyword(queryKeyword);
    if(queryPrefecture) setPrefecture(queryPrefecture);

    fetchProjects(queryKeyword, queryPrefecture);
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault(); 
    fetchProjects(keyword, prefecture);
  };

  return (
    <div className="bg-sky-50 min-h-screen">
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">みんなの企画</h1>
          <Link href="/projects/create">
            <span className="rounded-full bg-sky-500 px-6 py-2 text-base font-semibold text-white shadow-md hover:bg-sky-600 cursor-pointer transition-colors">
              企画を作成する
            </span>
          </Link>
        </div>

        {/* 検索フォーム */}
        <form onSubmit={handleSearchSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
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
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
          <div className="md:col-span-1">
            <label htmlFor="prefecture" className="block text-sm font-medium text-gray-700">
              お届け先 (都道府県)
            </label>
            <select
              id="prefecture"
              value={prefecture}
              onChange={(e) => setPrefecture(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="">すべての都道府県</option>
              {prefectures.map(pref => (
                <option key={pref} value={pref}>{pref}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1 flex items-end">
            <button type="submit" disabled={loading} className="w-full bg-sky-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-sky-600 disabled:bg-gray-400 transition-colors">
              {loading ? '検索中...' : '検索する'}
            </button>
          </div>
        </form>

        {/* 企画一覧 */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
          </div>
        ) : (
          projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`} className="block h-full group">
                  <div className="bg-white rounded-lg shadow-md cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 h-full flex flex-col overflow-hidden border border-gray-100">
                    
                    {/* サムネイル画像エリア */}
                    <div className="h-48 bg-gray-200 flex items-center justify-center relative overflow-hidden">
                      {project.imageUrl ? (
                        <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1.586-1.586a2 2 0 00-2.828 0L6 16m6 6H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      )}
                    </div>

                    <div className="p-6 flex flex-col flex-grow">
                      <h2 className="text-lg font-bold text-gray-800 group-hover:text-sky-600 transition-colors truncate mb-2">{project.title}</h2>
                      <p className="text-sm text-gray-500 mt-1 truncate flex items-center">
                        <span className="mr-1">📍</span> {project.deliveryAddress}
                      </p>
                      
                      <div className="flex-grow"></div> 

                      {/* 企画者情報 (下揃え) */}
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                        {project.planner?.iconUrl ? (
                          <img src={project.planner.iconUrl} alt="icon" className="h-8 w-8 rounded-full object-cover border" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4m0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4"/></svg>
                          </div>
                        )}
                        <span className="text-xs font-bold text-gray-600">{project.planner?.handleName || '企画者'}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-10 text-center text-gray-500 border border-dashed border-gray-300">
              <p className="text-lg font-bold mb-2">該当する企画は見つかりませんでした。</p>
              <p className="text-sm">キーワードを変えるか、新しい企画を立ててみませんか？</p>
              <Link href="/projects/create" className="inline-block mt-4 text-sky-600 font-bold hover:underline">
                企画を作成する &rarr;
              </Link>
            </div>
          )
        )}
      </main>
    </div>
  );
}

// ===========================================
// ★★★ デフォルトエクスポート (Suspenseでラップ) ★★★
// ===========================================
export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen text-gray-500">読み込み中...</div>}>
      <ProjectsContent />
    </Suspense>
  );
}