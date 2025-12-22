'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext'; 
import toast from 'react-hot-toast';
import { 
    FiAlertTriangle, FiCheckCircle, FiExternalLink, FiSlash, 
    FiMessageSquare, FiCalendar, FiFlag, FiTrash2, FiXCircle, 
    FiEye, FiChevronLeft, FiRefreshCw, FiUser 
} from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// --- 詳細確認モーダル ---
function ReportDetailModal({ report, type, onClose, onAction }) {
    if (!report) return null;

    const renderContent = () => {
        if (type === 'CHAT') {
            return (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                    <p className="text-xs text-gray-500 mb-1">通報されたメッセージ:</p>
                    {/* ★修正箇所: エスケープ処理 */}
                    <p className="text-gray-800 font-medium whitespace-pre-wrap">&quot;{report.content}&quot;</p>
                    <div className="mt-2 text-xs text-gray-400 flex gap-2">
                        <span>Type: {report.type}</span>
                        <span>ID: {report.messageId}</span>
                    </div>
                </div>
            );
        }
        if (type === 'PROJECT') {
            return (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                    <p className="text-xs text-gray-500 mb-1">対象プロジェクト:</p>
                    <h3 className="font-bold text-gray-800">{report.project?.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-3">{report.project?.description}</p>
                    {report.project?.id && (
                        <Link href={`/projects/${report.project.id}`} target="_blank" className="text-indigo-600 text-xs flex items-center mt-2 hover:underline">
                            <FiExternalLink className="mr-1"/> 実際のページを確認
                        </Link>
                    )}
                </div>
            );
        }
        if (type === 'EVENT') {
             return (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                    <p className="text-xs text-gray-500 mb-1">対象イベント:</p>
                    <h3 className="font-bold text-gray-800">{report.event?.title}</h3>
                    {report.event?.id && (
                        <Link href={`/events/${report.event.id}`} target="_blank" className="text-indigo-600 text-xs flex items-center mt-2 hover:underline">
                            <FiExternalLink className="mr-1"/> 実際のページを確認
                        </Link>
                    )}
                </div>
            );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <FiAlertTriangle className="text-red-500"/> 通報詳細確認
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full"><FiXCircle size={20} className="text-gray-400"/></button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    {/* 通報理由 */}
                    <div className="mb-6">
                        <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold mb-2">
                            {report.reason}
                        </span>
                        <p className="text-sm text-gray-600 bg-red-50 p-3 rounded border border-red-100">
                            {report.details || report.reason || '詳細な理由の記載はありません'}
                        </p>
                    </div>

                    {/* 通報者情報 */}
                    <div className="flex items-center gap-2 mb-6 pb-6 border-b border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <FiUser className="text-gray-500"/>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">通報者</p>
                            <p className="text-sm font-bold">{report.reporter?.handleName || '匿名'}</p>
                        </div>
                    </div>

                    {/* コンテンツ内容 */}
                    {renderContent()}
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button onClick={() => onAction(report, 'DISMISS')} className="flex-1 py-2.5 border border-gray-300 bg-white text-gray-600 rounded-lg hover:bg-gray-50 font-bold text-sm">
                        問題なし (却下)
                    </button>
                    <button onClick={() => onAction(report, 'BAN')} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-sm shadow-md flex items-center justify-center gap-2">
                        <FiSlash /> 処罰・削除する
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminReportsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [reports, setReports] = useState({ project: [], event: [], chat: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('event'); 
  const [selectedReport, setSelectedReport] = useState(null); // モーダル用
  
  const router = useRouter();

  // データ取得
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const headers = { 'Authorization': `Bearer ${token}` };

      // 並列取得 (エラーがあっても他は取得する簡易実装)
      const results = await Promise.allSettled([
        fetch(`${API_URL}/api/admin/reports`, { headers }),       // projects
        fetch(`${API_URL}/api/admin/event-reports`, { headers }), // events
        fetch(`${API_URL}/api/admin/chat-reports`, { headers })   // chats
      ]);

      const newReports = { project: [], event: [], chat: [] };

      if (results[0].status === 'fulfilled' && results[0].value.ok) newReports.project = await results[0].value.json();
      if (results[1].status === 'fulfilled' && results[1].value.ok) newReports.event = await results[1].value.json();
      if (results[2].status === 'fulfilled' && results[2].value.ok) newReports.chat = await results[2].value.json();

      setReports(newReports);

    } catch (err) {
      console.error(err);
      toast.error('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || user?.role !== 'ADMIN') {
        toast.error('管理者権限が必要です');
        router.push('/login');
      } else {
        fetchData();
      }
    }
  }, [authLoading, isAuthenticated, user, router, fetchData]);

  // アクションハンドラ (モーダルから呼ばれる)
  const handleReportAction = async (report, action) => {
    if (!report) return;
    const token = localStorage.getItem('authToken');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    
    let endpoint = '';
    let method = 'PATCH';
    let body = {};
    let successMessage = '';

    // 1. DISMISS (却下) の処理
    if (action === 'DISMISS') {
        if (!window.confirm('この通報を「問題なし」として処理済みリストに移動しますか？')) return;
        
        // 各種APIエンドポイント (実装状況に合わせて調整)
        if (activeTab === 'event') endpoint = `/api/admin/event-reports/${report.id}/dismiss`;
        else if (activeTab === 'chat') endpoint = `/api/admin/chat-reports/${report.id}/dismiss`;
        else if (activeTab === 'project') endpoint = `/api/admin/projects/${report.id}/dismiss`; // 仮

        // ★ API未実装の場合はフロントのみ消去のフォールバック
        if (!endpoint || endpoint.includes('projects')) {
            toast.success('リストから除外しました');
            setReports(prev => ({ ...prev, [activeTab]: prev[activeTab].filter(r => r.id !== report.id) }));
            setSelectedReport(null);
            return;
        }
        
        successMessage = '通報を却下しました';
    } 
    // 2. BAN (削除/非公開) の処理
    else if (action === 'BAN') {
        if (!window.confirm('本当に対象コンテンツを削除または非公開にしますか？')) return;

        if (activeTab === 'event') {
            endpoint = `/api/admin/events/${report.eventId}/ban`;
            body = { isBanned: true };
            successMessage = 'イベントをBANしました';
        } else if (activeTab === 'chat') {
            method = 'DELETE';
            // GROUP or DIRECT
            const chatTypePath = report.type === 'GROUP' ? 'group-chat' : 'florist-chat';
            endpoint = `/api/admin/${chatTypePath}/messages/${report.messageId}`;
            successMessage = 'メッセージを削除しました';
        } else if (activeTab === 'project') {
            endpoint = `/api/admin/projects/${report.project.id}/visibility`;
            body = { isVisible: false };
            successMessage = '企画を非公開にしました';
        }
    }

    try {
        const res = await fetch(`${API_URL}${endpoint}`, { method, headers, body: JSON.stringify(body) });
        
        if (res.ok) {
            toast.success(successMessage);
            setReports(prev => ({ ...prev, [activeTab]: prev[activeTab].filter(r => r.id !== report.id) }));
            setSelectedReport(null);
        } else {
            throw new Error('処理に失敗しました');
        }
    } catch (error) {
        toast.error('エラーが発生しました');
        console.error(error);
    }
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><FiRefreshCw className="animate-spin text-3xl text-gray-400"/></div>;

  const currentList = reports[activeTab] || [];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto">
        
        {/* ヘッダー */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <Link href="/admin" className="text-sm text-gray-500 hover:text-indigo-600 flex items-center mb-1 transition-colors">
                    <FiChevronLeft size={16}/> ダッシュボードに戻る
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FiFlag className="text-red-500"/> 通報・違反報告管理
                </h1>
            </div>
            <button onClick={fetchData} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors shadow-sm" title="更新">
                <FiRefreshCw />
            </button>
        </div>

        {/* タブナビゲーション */}
        <div className="flex gap-2 mb-0 border-b border-gray-200">
          {[
            { id: 'event', label: 'イベント', icon: <FiCalendar/>, count: reports.event.length },
            { id: 'chat', label: 'チャット', icon: <FiMessageSquare/>, count: reports.chat.length },
            { id: 'project', label: '企画', icon: <FiAlertTriangle/>, count: reports.project.length },
          ].map(tab => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                    px-6 py-3 rounded-t-xl font-bold text-sm flex items-center gap-2 transition-all relative top-[1px]
                    ${activeTab === tab.id 
                        ? 'bg-white text-indigo-600 border border-gray-200 border-b-white shadow-sm z-10' 
                        : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'}
                `}
            >
                {tab.icon} {tab.label}
                {tab.count > 0 && (
                    <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-red-100 text-red-600' : 'bg-gray-300 text-white'}`}>
                        {tab.count}
                    </span>
                )}
            </button>
          ))}
        </div>

        {/* メインリスト */}
        <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm border border-gray-200 p-0 overflow-hidden min-h-[400px]">
            {currentList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <FiCheckCircle className="text-4xl text-green-100 mb-3" />
                    <p className="font-medium">現在、未処理の通報はありません</p>
                    <p className="text-xs mt-1">健全な状態です！</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold tracking-wider border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">通報日時</th>
                                <th className="px-6 py-4">理由</th>
                                <th className="px-6 py-4">対象コンテンツ (抜粋)</th>
                                <th className="px-6 py-4">通報者</th>
                                <th className="px-6 py-4 text-center">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {currentList.map((report) => {
                                // コンテンツの表示用テキスト生成
                                let contentPreview = '';
                                if(activeTab === 'chat') contentPreview = report.content;
                                else if(activeTab === 'event') contentPreview = report.event?.title;
                                else if(activeTab === 'project') contentPreview = report.project?.title;

                                return (
                                    <tr key={report.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                            {new Date(report.createdAt).toLocaleDateString()}
                                            <div className="text-xs opacity-70">{new Date(report.createdAt).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                                {report.reason}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <div className="font-bold text-gray-800 truncate" title={contentPreview}>
                                                {contentPreview || <span className="text-gray-400 italic">削除済みまたは不明</span>}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate mt-0.5">
                                                ID: {report.id.substring(0,8)}...
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                                                    <FiUser />
                                                </div>
                                                {report.reporter?.handleName || '匿名'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => setSelectedReport(report)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:text-indigo-600 hover:border-indigo-400 hover:shadow-sm transition-all text-xs font-bold"
                                            >
                                                <FiEye /> 詳細・対応
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>

      {/* 詳細モーダル */}
      <ReportDetailModal 
        report={selectedReport} 
        type={activeTab.toUpperCase()} 
        onClose={() => setSelectedReport(null)}
        onAction={handleReportAction}
      />
    </div>
  );
}