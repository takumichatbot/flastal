'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext'; // ★追加
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { FiSearch, FiMapPin, FiCalendar, FiUser, FiLoader, FiFilter } from 'react-icons/fi';

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', 
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', 
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', 
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

function ProjectsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { authenticatedFetch } = useAuth(); // ★AuthContextから取得

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [prefecture, setPrefecture] = useState(searchParams.get('prefecture') || '');

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const currentKeyword = searchParams.get('keyword');
      const currentPrefecture = searchParams.get('prefecture');

      // ★authenticatedFetchを使用するように変更。パスだけでOK
      let queryPath = '/projects';
      const params = new URLSearchParams();
      if (currentKeyword) params.append('keyword', currentKeyword);
      if (currentPrefecture) params.append('prefecture', currentPrefecture);
      
      const queryString = params.toString();
      const finalPath = queryString ? `${queryPath}?${queryString}` : queryPath;

      const res = await authenticatedFetch(finalPath);
      
      if (!res || !res.ok) throw new Error('データの取得に失敗しました');
      
      const data = await res.json();
      setProjects(data);
      
      if (data.length === 0 && (currentKeyword || currentPrefecture)) {
        toast('条件に一致する企画はありませんでした', { icon: '🔍' });
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('通信エラーが発生しました。再読み込みしてください。');
    } finally {
      setLoading(false);
    }
  }, [searchParams, authenticatedFetch]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    
    if (keyword.trim()) params.set('keyword', keyword);
    else params.delete('keyword');
    
    if (prefecture) params.set('prefecture', prefecture);
    else params.delete('prefecture');

    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">みんなの企画</h1>
            <p className="text-gray-500 text-sm">現在進行中のフラスタ企画を探して応援しよう</p>
          </div>
          <Link href="/projects/create">
            <span className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-pointer">
              <span className="mr-2">+</span> 企画を立てる
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-10">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-6">
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">キーワード</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="企画名、アーティスト名..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
            
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">お届け先 (都道府県)</label>
              <div className="relative">
                <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <select
                  value={prefecture}
                  onChange={(e) => setPrefecture(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none appearance-none cursor-pointer transition-all"
                >
                  <option value="">すべてのエリア</option>
                  {PREFECTURES.map(pref => (
                    <option key={pref} value={pref}>{pref}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <FiFilter size={12} />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? <FiLoader className="animate-spin"/> : '検索'}
              </button>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
             {[...Array(6)].map((_, i) => (
                 <div key={i} className="bg-white rounded-2xl h-80 shadow-sm border border-gray-100 animate-pulse">
                     <div className="h-48 bg-gray-200 rounded-t-2xl"></div>
                     <div className="p-5 space-y-3">
                         <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                         <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                     </div>
                 </div>
             ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="group h-full block">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col relative">
                  
                  <div className="relative h-52 bg-gray-100 overflow-hidden">
                    {project.imageUrl ? (
                      <Image 
                        src={project.imageUrl} 
                        alt={project.title} 
                        fill 
                        sizes="(max-width: 768px) 100vw, 33vw"
                        style={{ objectFit: 'cover' }}
                        className="group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 bg-slate-50">
                        <span className="text-4xl">💐</span>
                      </div>
                    )}
                    
                    <div className="absolute top-3 right-3">
                        {project.status === 'FUNDRAISING' ? (
                            <span className="bg-white/90 backdrop-blur text-pink-600 text-xs font-bold px-3 py-1 rounded-full shadow-sm">募集中</span>
                        ) : project.status === 'COMPLETED' ? (
                            <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">完了</span>
                        ) : (
                            <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">受付終了</span>
                        )}
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <h2 className="text-lg font-bold text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-2 mb-2 leading-snug">
                        {project.title}
                    </h2>
                    
                    <div className="space-y-1 mb-4">
                        {project.deliveryDateTime && (
                            <p className="text-xs text-gray-500 flex items-center">
                                <FiCalendar className="mr-1.5 text-indigo-400 shrink-0"/> 
                                {new Date(project.deliveryDateTime).toLocaleDateString()}
                            </p>
                        )}
                        <p className="text-xs text-gray-500 flex items-center truncate">
                            <FiMapPin className="mr-1.5 text-indigo-400 shrink-0"/> 
                            <span className="truncate">{project.deliveryAddress || '場所未定'}</span>
                        </p>
                    </div>

                    <div className="flex-grow"></div> 

                    <div className="mt-4 pt-4 border-t border-gray-50">
                        <div className="flex justify-between items-end mb-1 text-xs">
                            <span className="font-bold text-gray-700">{Math.min((project.collectedAmount / (project.targetAmount || 1)) * 100, 100).toFixed(0)}%</span>
                            <span className="text-gray-400">あと {((project.targetAmount || 0) - (project.collectedAmount || 0)).toLocaleString()}pt</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-pink-400 to-rose-500 h-full rounded-full" 
                                style={{ width: `${Math.min((project.collectedAmount / (project.targetAmount || 1)) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                        {project.planner?.iconUrl ? (
                            <Image src={project.planner.iconUrl} alt="" width={20} height={20} className="rounded-full object-cover border border-gray-200" />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-500"><FiUser/></div>
                        )}
                        <span className="text-xs text-gray-500 truncate max-w-[150px]">{project.planner?.handleName}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                <FiSearch size={32}/>
            </div>
            <p className="text-lg font-bold text-gray-600 mb-2">企画が見つかりませんでした</p>
            <p className="text-sm text-gray-400 mb-6">条件を変更するか、新しい企画を立ち上げてみませんか？</p>
            <Link href="/projects/create">
                <span className="text-sm font-bold text-pink-500 hover:text-pink-600 underline">企画を作成する &rarr;</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-300"></div>
        </div>
    }>
      <ProjectsContent />
    </Suspense>
  );
}