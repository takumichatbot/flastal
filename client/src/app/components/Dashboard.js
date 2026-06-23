'use client';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, CreditCard, Award, Heart, Clock, ChevronRight, User } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function Dashboard() {
  const { user } = useAuth();
  
  const [createdProjects, setCreatedProjects] = useState([]);
  const [pledgedProjects, setPledgedProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // スタッツ計算用
  const totalCreated = createdProjects.length;
  const totalPledged = pledgedProjects.length;

  useEffect(() => {
    if (user && user.id) { 
      const fetchMyData = async () => {
        setLoading(true);
        try {
          const [createdRes, pledgedRes] = await Promise.all([
            fetch(`${API_URL}/api/users/${user.id}/created-projects`), 
            fetch(`${API_URL}/api/users/${user.id}/pledged-projects`)
          ]);

          if (!createdRes.ok || !pledgedRes.ok) {
              throw new Error('データの取得に失敗しました');
          }

          const createdData = await createdRes.json();
          const pledgedData = await pledgedRes.json();
          
          setCreatedProjects(createdData);
          setPledgedProjects(pledgedData);

        } catch (error) {
          console.error(error);
          toast.error(error.message);
        } finally {
          setLoading(false);
        }
      };
      fetchMyData();
    } else {
      setLoading(false); 
    }
  }, [user]);

  if (!user) return null;

  // タイムラインアイテム
  const TimelineItem = ({ href, title, date, type }) => (
    <Link href={href} className="group flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
      <div className={`p-2 rounded-full shrink-0 ${type === 'created' ? 'bg-pink-100 text-pink-600' : 'bg-rose-100 text-rose-600'}`}>
        {type === 'created' ? <Award /> : <Heart />}
      </div>
      <div className="flex-grow min-w-0">
        <p className="text-sm font-bold text-gray-800 truncate group-hover:text-pink-600 transition-colors">
            {title}
        </p>
        <p className="text-xs text-gray-400 mt-1 flex items-center">
            <Clock className="mr-1" size={10} />
            {new Date(date).toLocaleDateString()} に{type === 'created' ? '作成' : '支援'}
        </p>
      </div>
      <ChevronRight className="text-gray-300 group-hover:text-pink-400 self-center" />
    </Link>
  );

  return (
    <div className="w-full bg-slate-50 min-h-screen py-10 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ヘッダーエリア */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                    👋 Hello, {user.handleName}
                </h1>
                <p className="mt-2 text-gray-500 text-sm">
                    今日も推し活を楽しみましょう！
                </p>
            </div>
            
            {/* スタッツカード (簡易) */}
            <div className="flex gap-4">
                <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 text-center">
                    <p className="text-xs text-gray-400 font-bold uppercase">Created</p>
                    <p className="text-xl font-black text-pink-600">{totalCreated}</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 text-center">
                    <p className="text-xs text-gray-400 font-bold uppercase">Backed</p>
                    <p className="text-xl font-black text-pink-600">{totalPledged}</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content (Left: 2/3) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* クイックアクション (スマホ向けに上部配置も考慮) */}
            <div className="grid grid-cols-2 gap-4">
                <Link href="/projects/create" className="bg-gradient-to-br from-pink-500 to-rose-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all group">
                    <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Plus size={24} />
                    </div>
                    <h3 className="font-bold text-lg">企画を立てる</h3>
                    <p className="text-xs text-pink-100 mt-1">新しいフラスタ企画を作成</p>
                </Link>
                <Link href="/projects" className="bg-white border border-slate-200 text-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
                    <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center mb-4 text-slate-600 group-hover:scale-110 transition-transform">
                        <Search size={24} />
                    </div>
                    <h3 className="font-bold text-lg">企画を探す</h3>
                    <p className="text-xs text-gray-400 mt-1">現在募集中の企画をチェック</p>
                </Link>
            </div>

            {/* アクティビティ */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Clock className="text-pink-500"/> 最近のアクティビティ
                    </h2>
                    <Link href="/mypage" className="text-xs font-bold text-pink-500 hover:text-pink-700 hover:underline">すべて見る</Link>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {/* 最新の作成企画と支援企画をマージして日付順に表示するのが理想ですが、今回は簡易的に結合 */}
                        {createdProjects.slice(0, 3).map(p => (
                            <TimelineItem key={`c-${p.id}`} href={`/projects/${p.id}`} title={p.title} date={p.createdAt} type="created" />
                        ))}
                        {pledgedProjects.slice(0, 3).map(p => (
                            // pledgedProjectの構造に合わせて調整 (p.projectが存在前提)
                            p.project && <TimelineItem key={`p-${p.id}`} href={`/projects/${p.project.id}`} title={p.project.title} date={p.createdAt} type="pledged" />
                        ))}
                        
                        {createdProjects.length === 0 && pledgedProjects.length === 0 && (
                            <div className="text-center py-10 text-gray-400 text-sm">
                                まだアクティビティはありません。<br/>企画を探してみましょう！
                            </div>
                        )}
                    </div>
                )}
            </div>
          </div>

          {/* Sidebar (Right: 1/3) */}
          <div className="space-y-6">
            
            {/* ポイントカード */}
            <div className="bg-gradient-to-br from-gray-900 to-slate-800 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <CreditCard size={120} />
                </div>
                <div className="relative z-10">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Balance</p>
                    <p className="text-4xl font-black tracking-tight mb-6">
                        {(user.points || 0).toLocaleString()} <span className="text-lg font-medium text-slate-400">pt</span>
                    </p>
                    
                    <Link href="/points" className="block w-full text-center py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-sm font-bold transition-colors border border-white/10">
                        ポイントを購入する
                    </Link>
                </div>
            </div>

            {/* プロフィールカード */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center text-slate-300 overflow-hidden">
                    {user.iconUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={user.iconUrl} alt={`${user.handleName}のアイコン`} className="w-full h-full object-cover" />
                    ) : (
                        <User size={40} />
                    )}
                </div>
                <h3 className="font-bold text-gray-800 text-lg">{user.handleName}</h3>
                <p className="text-xs text-gray-400 mb-6">@{user.id.slice(0, 8)}</p>
                
                <Link href="/mypage/profile" className="block w-full py-2.5 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                    プロフィール編集
                </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}