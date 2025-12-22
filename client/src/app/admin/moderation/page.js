'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { 
  FiSearch, FiMessageSquare, FiUser, FiFilter, 
  FiAlertCircle, FiCheckCircle, FiClock, FiActivity 
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function ModerationProjectListPage() {
  const [projects, setProjects] = useState([]);
  const [loadingData, setLoadingData] = useState(true); 
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, OPEN, CLOSED
  
  const router = useRouter();
  const { user, isAuthenticated, loading, logout } = useAuth();

  // データ取得
  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      toast.error('ログインが必要です。');
      router.push('/login');
      return;
    }

    if (!user || user.role !== 'ADMIN') {
      toast.error('管理者権限がありません。');
      router.push('/mypage');
      return;
    }

    const fetchProjects = async () => {
      setLoadingData(true); 
      try {
        const token = localStorage.getItem('authToken');
        // チャットルームが存在するプロジェクトのみを取得するのが理想的
        // 現状は全プロジェクトを取得してクライアント側で表示
        const res = await fetch(`${API_URL}/api/admin/projects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('プロジェクト一覧の取得に失敗しました。');

        const data = await res.json();
        setProjects(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch projects', error);
        toast.error('データの取得に失敗しました');
        setProjects([]);
      } finally {
        setLoadingData(false); 
      }
    };
    fetchProjects();
    
  }, [isAuthenticated, user, router, loading]); 

  // フィルタリング処理
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = (project.title && project.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (project.planner?.handleName && project.planner.handleName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'ALL' || project.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  // ロード中・権限チェック中
  if (loading || !isAuthenticated || !user || user.role !== 'ADMIN') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto">
        
        {/* ヘッダー */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <FiMessageSquare className="text-sky-500"/> チャットルーム監視
            </h1>
            <p className="text-sm text-gray-500 mt-1">各プロジェクトのトークルームを確認・管理します。</p>
          </div>
          <button 
            onClick={() => { logout(); router.push('/login'); }} 
            className="text-sm font-bold text-gray-500 hover:text-red-500 transition-colors"
          >
              ログアウト
          </button>
        </div>

        {/* タブナビゲーション */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 mb-8 inline-flex flex-wrap gap-1">
          {[
            { name: 'ダッシュボード', path: '/admin' },
            { name: '出金管理', path: '/admin/payouts' },
            { name: 'チャット監視', path: '/admin/moderation', active: true },
            { name: '花屋審査', path: '/admin/florist-approval' },
            { name: '企画審査', path: '/admin/project-approval' },
          ].map((nav) => (
            <Link 
              key={nav.path}
              href={nav.path}
              className={`
                px-4 py-2 text-sm font-bold rounded-lg transition-all
                ${nav.active 
                  ? 'bg-sky-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
              `}
            >
              {nav.name}
            </Link>
          ))}
        </div>

        {/* 検索・フィルターエリア */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input 
              type="text" 
              placeholder="プロジェクト名、企画者名で検索..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 shadow-sm"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 shadow-sm text-sm font-bold text-gray-600"
          >
            <option value="ALL">全てのステータス</option>
            <option value="RECRUITING">参加者募集中</option>
            <option value="IN_PROGRESS">進行中</option>
            <option value="COMPLETED">完了</option>
          </select>
        </div>

        {/* プロジェクトリスト */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden min-h-[400px]">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              <FiActivity className="text-sky-500"/> 監視対象プロジェクト
              <span className="bg-sky-100 text-sky-700 text-xs px-2 py-0.5 rounded-full">{filteredProjects.length}</span>
            </h2>
          </div>

          <div className="p-6">
            {loadingData ? (
              <div className="flex justify-center py-20 text-gray-400">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-xl">
                <FiMessageSquare className="mx-auto text-4xl text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">該当するプロジェクトはありません。</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProjects.map(project => (
                    project && project.id ? (
                    <Link key={project.id} href={`/admin/moderation/${project.id}`} className="group">
                        <div className="h-full p-5 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-sky-300 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden">
                          {/* ホバー時のアクセント */}
                          <div className="absolute top-0 left-0 w-1 h-full bg-sky-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          
                          <div>
                            <div className="flex justify-between items-start mb-3">
                              <StatusBadge status={project.status} />
                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                ID: {project.id.substring(0, 6)}...
                              </span>
                            </div>

                            <h3 className="font-bold text-gray-800 mb-1 group-hover:text-sky-600 transition-colors line-clamp-1">
                              {project.title || 'タイトルなし'}
                            </h3>
                            
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                              <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                                <FiUser className="text-gray-400" size={12}/>
                              </div>
                              <span className="truncate max-w-[150px]">
                                {project.planner?.handleName || '主催者不明'}
                              </span>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                             <span className="text-gray-400">最終更新: {new Date(project.updatedAt || Date.now()).toLocaleDateString()}</span>
                             <span className="text-sky-600 font-bold flex items-center gap-1 group-hover:underline">
                               ルームを見る <FiMessageSquare />
                             </span>
                          </div>
                        </div>
                    </Link>
                    ) : null
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ステータスバッジコンポーネント
function StatusBadge({ status }) {
  const config = {
    RECRUITING: { color: 'bg-green-100 text-green-700', icon: <FiCheckCircle />, label: '募集中' },
    IN_PROGRESS: { color: 'bg-blue-100 text-blue-700', icon: <FiActivity />, label: '進行中' },
    COMPLETED: { color: 'bg-gray-100 text-gray-600', icon: <FiClock />, label: '完了' },
    DRAFT: { color: 'bg-yellow-100 text-yellow-700', icon: <FiAlertCircle />, label: '下書き' },
  };

  const style = config[status] || { color: 'bg-gray-100 text-gray-500', icon: null, label: status };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${style.color}`}>
      {style.icon} {style.label}
    </span>
  );
}