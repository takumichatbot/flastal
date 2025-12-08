'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FiAlertTriangle, FiCheckCircle, FiExternalLink, FiSlash, FiMessageSquare, FiUser } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function AdminReportsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // 3種類の通報データ
  const [projectReports, setProjectReports] = useState([]);
  const [eventReports, setEventReports] = useState([]);
  const [chatReports, setChatReports] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('event'); // 初期タブ: event, project, chat
  
  const router = useRouter();

  // データ一括取得
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('認証トークンがありません');

      const headers = { 'Authorization': `Bearer ${token}` };

      // 並列で取得
      const [resProjects, resEvents, resChats] = await Promise.all([
        fetch(`${API_URL}/api/admin/reports`, { headers }),
        fetch(`${API_URL}/api/admin/event-reports`, { headers }),
        fetch(`${API_URL}/api/admin/chat-reports`, { headers }) // ★追加
      ]);

      if (resProjects.ok) setProjectReports(await resProjects.json());
      if (resEvents.ok) setEventReports(await resEvents.json());
      if (resChats.ok) setChatReports(await resChats.json());

    } catch (err) {
      console.error(err);
      toast.error('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || user?.role !== 'ADMIN') {
        toast.error('管理者権限が必要です');
        router.push('/login');
      } else {
        fetchData();
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  // --- アクション関数群 ---

  // 1. イベントBAN
  const handleBanEvent = async (eventId, reportId) => {
    if (!window.confirm('本当にこのイベントをBAN（非表示）にしますか？')) return;
    const token = localStorage.getItem('authToken');
    const res = await fetch(`${API_URL}/api/admin/events/${eventId}/ban`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ isBanned: true })
    });
    if (res.ok) {
      toast.success('イベントをBANしました');
      fetchData();
    } else {
      toast.error('失敗しました');
    }
  };

  // 2. 企画非公開
  const handleToggleProjectVisibility = async (projectId, currentVisibility) => {
    if (!window.confirm(`この企画を非公開にしますか？`)) return;
    const token = localStorage.getItem('authToken');
    const res = await fetch(`${API_URL}/api/admin/projects/${projectId}/visibility`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ isVisible: false }),
    });
    if (res.ok) {
      toast.success('企画を非公開にしました');
      fetchData(); // 企画情報は一覧からは消える想定
    } else {
      toast.error('失敗しました');
    }
  };

  // 3. チャットメッセージ削除 (BAN)
  const handleDeleteChatMessage = async (messageId, type) => {
    if (!window.confirm('このメッセージを削除しますか？（元に戻せません）')) return;
    const token = localStorage.getItem('authToken');
    
    // typeは 'GROUP' か 'DIRECT'
    const endpoint = type === 'GROUP' 
      ? `/api/admin/group-chat/${messageId}` 
      : `/api/admin/florist-chat/${messageId}`;

    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      toast.success('メッセージを削除しました');
      setChatReports(prev => prev.filter(r => r.messageId !== messageId));
    } else {
      toast.error('削除に失敗しました');
    }
  };

  // 共通: 通報を却下（問題なし）
  const handleDismissReport = async (reportId, type) => {
    if (!window.confirm('通報を「問題なし」として処理済みにしますか？')) return;
    const token = localStorage.getItem('authToken');
    
    // APIエンドポイントの振り分け
    let url = '';
    if (type === 'EVENT') url = `/api/admin/event-reports/${reportId}/dismiss`;
    // 企画やチャット用にも同様のAPIがあればここで分岐。今回はイベントのみ実装済みと仮定して他は省略または実装が必要
    // ※ 簡易的にフロントでの非表示のみ行う場合
    if (type !== 'EVENT') {
        toast.success('リストから除外しました（DB更新は未実装）');
        if(type === 'CHAT') setChatReports(prev => prev.filter(r => r.id !== reportId));
        if(type === 'PROJECT') setProjectReports(prev => prev.filter(r => r.id !== reportId));
        return;
    }

    const res = await fetch(`${API_URL}${url}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      toast.success('解決済みにしました');
      setEventReports(prev => prev.filter(r => r.id !== reportId));
    }
  };

  if (authLoading || loading) return <div className="p-8 text-center text-gray-500">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <FiAlertTriangle className="mr-2 text-red-500"/> 通報管理ダッシュボード
        </h1>

        {/* タブ切り替え */}
        <div className="flex gap-2 mb-6 border-b border-gray-300 pb-1">
          <button 
            onClick={() => setActiveTab('event')}
            className={`px-4 py-2 rounded-t-lg font-bold text-sm ${activeTab === 'event' ? 'bg-white text-indigo-600 border-t border-l border-r border-gray-300' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            イベント ({eventReports.length})
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-t-lg font-bold text-sm ${activeTab === 'chat' ? 'bg-white text-indigo-600 border-t border-l border-r border-gray-300' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            チャット ({chatReports.length})
          </button>
          <button 
            onClick={() => setActiveTab('project')}
            className={`px-4 py-2 rounded-t-lg font-bold text-sm ${activeTab === 'project' ? 'bg-white text-indigo-600 border-t border-l border-r border-gray-300' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            企画 ({projectReports.length})
          </button>
        </div>

        {/* === イベント通報タブ === */}
        {activeTab === 'event' && (
          <section className="bg-white rounded-b-xl rounded-tr-xl shadow-md p-6">
            {eventReports.length === 0 ? <p className="text-gray-500">未処理の通報はありません。</p> : (
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-3">通報日時</th>
                    <th className="px-4 py-3">対象イベント</th>
                    <th className="px-4 py-3">理由</th>
                    <th className="px-4 py-3">通報者</th>
                    <th className="px-4 py-3 text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {eventReports.map((report) => (
                    <tr key={report.id} className="bg-white border-b">
                      <td className="px-4 py-4">{new Date(report.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-4 font-bold">
                        {report.event?.title || '削除済'}
                        {report.event?.id && <Link href={`/events/${report.event.id}`} target="_blank" className="ml-2 text-indigo-500"><FiExternalLink/></Link>}
                      </td>
                      <td className="px-4 py-4 text-red-600">{report.reason}</td>
                      <td className="px-4 py-4">{report.reporter?.handleName}</td>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => handleBanEvent(report.eventId, report.id)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded mr-2">BAN</button>
                        <button onClick={() => handleDismissReport(report.id, 'EVENT')} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">却下</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {/* === チャット通報タブ (新規) === */}
        {activeTab === 'chat' && (
          <section className="bg-white rounded-b-xl rounded-tr-xl shadow-md p-6">
            {chatReports.length === 0 ? <p className="text-gray-500">未処理の通報はありません。</p> : (
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-3">種類</th>
                    <th className="px-4 py-3">メッセージ内容</th>
                    <th className="px-4 py-3">通報理由</th>
                    <th className="px-4 py-3">通報者</th>
                    <th className="px-4 py-3 text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {chatReports.map((report) => (
                    <tr key={report.id} className="bg-white border-b">
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${report.type === 'GROUP' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                          {report.type === 'GROUP' ? '掲示板' : 'DM'}
                        </span>
                      </td>
                      <td className="px-4 py-4 max-w-xs truncate">"{report.content}"</td>
                      <td className="px-4 py-4 text-red-600">{report.reason}</td>
                      <td className="px-4 py-4">{report.reporter?.handleName}</td>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => handleDeleteChatMessage(report.messageId, report.type)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded mr-2">削除</button>
                        <button onClick={() => handleDismissReport(report.id, 'CHAT')} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">却下</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {/* === 企画通報タブ === */}
        {activeTab === 'project' && (
          <section className="bg-white rounded-b-xl rounded-tr-xl shadow-md p-6">
            {projectReports.length === 0 ? <p className="text-gray-500">未処理の通報はありません。</p> : (
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-3">対象企画</th>
                    <th className="px-4 py-3">理由・詳細</th>
                    <th className="px-4 py-3">通報者</th>
                    <th className="px-4 py-3 text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {projectReports.map((report) => (
                    <tr key={report.id} className="bg-white border-b">
                      <td className="px-4 py-4 font-bold">
                        {report.project?.title}
                        {report.project?.id && <Link href={`/projects/${report.project.id}`} target="_blank" className="ml-2 text-indigo-500"><FiExternalLink/></Link>}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-red-600 font-bold">{report.reason}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">{report.details}</div>
                      </td>
                      <td className="px-4 py-4">{report.reporter?.handleName}</td>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => handleToggleProjectVisibility(report.project.id, true)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded mr-2">非公開</button>
                        <button onClick={() => handleDismissReport(report.id, 'PROJECT')} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">却下</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

      </div>
    </div>
  );
}