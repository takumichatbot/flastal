'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  FiArrowLeft, FiSearch, FiTrash2, FiCopy, FiMessageSquare, 
  FiUser, Fiusers, FiShoppingBag, FiRefreshCw 
} from 'react-icons/fi';
import { useAuth } from '@/app/contexts/AuthContext'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function ChatModerationPage() {
  const params = useParams(); 
  const { projectId } = params;
  const router = useRouter();
  const { user, isAuthenticated, loading, logout } = useAuth();

  const [chats, setChats] = useState({ groupChat: [], floristChat: [] });
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // データ取得
  const fetchChats = useCallback(async () => {
    if (!projectId) return;
    setLoadingData(true);
    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      if (!token) throw new Error('認証トークンがありません。');

      const res = await fetch(`${API_URL}/api/admin/projects/${projectId}/chats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        if(res.status === 401) throw new Error('認証に失敗しました。');
        if(res.status === 403) throw new Error('権限がありません。');
        throw new Error('チャット履歴の取得に失敗しました。');
      }
      
      const data = await res.json();
      setChats({
          groupChat: Array.isArray(data.groupChat) ? data.groupChat : [],
          floristChat: Array.isArray(data.floristChat) ? data.floristChat : []
      });
    } catch (error) {
      console.error(error);
      toast.error(error.message);
      setChats({ groupChat: [], floristChat: [] });
    } finally {
      setLoadingData(false);
    }
  }, [projectId]); 

  // 認証チェック & 初期ロード
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

    fetchChats();
  }, [isAuthenticated, user, router, loading, fetchChats]); 

  // 削除処理
  const handleDelete = async (messageId, type) => {
    if (!window.confirm("このメッセージを完全に削除します。\nこの操作は取り消せません。よろしいですか？")) return;
    
    const url = type === 'group' 
      ? `${API_URL}/api/admin/group-chat/${messageId}`
      : `${API_URL}/api/admin/florist-chat/${messageId}`;
      
    const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');

    const promise = fetch(url, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(async (res) => {
        if (!res.ok) {
           let errorMsg = '削除に失敗しました';
           try {
               const errData = await res.json();
               errorMsg = errData.message || errorMsg;
           } catch(e) { /* ignore */ }
           throw new Error(errorMsg);
        }
    });

    toast.promise(promise, {
        loading: '削除中...',
        success: () => {
            if (type === 'group') {
                setChats(prev => ({...prev, groupChat: prev.groupChat.filter(m => m.id !== messageId)}));
            } else {
                setChats(prev => ({...prev, floristChat: prev.floristChat.filter(m => m.id !== messageId)}));
            }
            return 'メッセージを削除しました。';
        },
        error: (err) => err.message,
    });
  };

  // 検索フィルタリング
  const filteredChats = useMemo(() => {
    const lowerTerm = searchTerm.toLowerCase();
    
    const filterFn = (msg) => {
      if (!searchTerm) return true;
      const content = msg.content || '';
      const sender = msg.user?.handleName || msg.florist?.platformName || 'Unknown';
      return content.toLowerCase().includes(lowerTerm) || sender.toLowerCase().includes(lowerTerm);
    };

    return {
      groupChat: chats.groupChat.filter(filterFn),
      floristChat: chats.floristChat.filter(filterFn)
    };
  }, [chats, searchTerm]);

  // IDコピー
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('IDをコピーしました', { duration: 1000, position: 'bottom-center' });
  };

  if (loading || !isAuthenticated || !user || user.role !== 'ADMIN') {
    return <div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20">
      
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <Link href="/admin/moderation" className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
                  <FiArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FiMessageSquare className="text-sky-500"/> チャットログ監視
                </h1>
                <p className="text-xs text-gray-400">Project ID: {projectId}</p>
              </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchChats} className="p-2 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-full transition-colors" title="更新">
              <FiRefreshCw className={loadingData ? "animate-spin" : ""} />
            </button>
            <button onClick={() => { logout(); router.push('/login'); }} className="text-xs font-bold text-gray-500 hover:text-red-500">
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* コントロールバー */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="メッセージ内容やユーザー名で検索..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
          </div>
          <div className="flex gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span> 参加者</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500"></span> 企画者</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500"></span> 花屋</span>
          </div>
        </div>
       
        {loadingData ? (
          <div className="flex justify-center py-20 text-gray-400">読み込み中...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
            
            {/* --- 1. 参加者グループチャット --- */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-orange-50/30 flex justify-between items-center">
                <h2 className="font-bold text-gray-700 flex items-center gap-2">
                  <span className="p-1.5 bg-orange-100 text-orange-600 rounded-md"><FiUser /></span>
                  参加者グループ
                </h2>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">{filteredChats.groupChat.length}件</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {filteredChats.groupChat.length === 0 ? <EmptyState /> :
                filteredChats.groupChat.map(msg => (
                  <MessageBubble 
                    key={msg.id} 
                    msg={msg} 
                    type="group" 
                    onDelete={() => handleDelete(msg.id, 'group')} 
                    onCopyId={() => copyToClipboard(msg.id)}
                  />
                ))}
              </div>
            </div>

            {/* --- 2. 企画者-花屋チャット --- */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-sky-50/30 flex justify-between items-center">
                <h2 className="font-bold text-gray-700 flex items-center gap-2">
                  <span className="p-1.5 bg-sky-100 text-sky-600 rounded-md"><FiShoppingBag /></span>
                  企画者 ⇔ 花屋
                </h2>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">{filteredChats.floristChat.length}件</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {filteredChats.floristChat.length === 0 ? <EmptyState /> :
                filteredChats.floristChat.map(msg => (
                  <MessageBubble 
                    key={msg.id} 
                    msg={msg} 
                    type="florist" 
                    onDelete={() => handleDelete(msg.id, 'florist')}
                    onCopyId={() => copyToClipboard(msg.id)}
                  />
                ))}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

// サブコンポーネント: メッセージバブル
function MessageBubble({ msg, type, onDelete, onCopyId }) {
  if (!msg || !msg.id) return null;

  // 送信者タイプの判定とスタイル設定
  const isFloristChat = type === 'florist';
  const senderType = msg.senderType || (msg.user ? 'USER' : 'UNKNOWN'); // API構造に合わせて調整

  let bubbleStyle = "bg-white border-gray-200";
  let nameStyle = "text-gray-700";
  let label = "Unknown";
  let roleBadge = null;

  if (!isFloristChat) {
    // Group Chat (Participants)
    bubbleStyle = "bg-white border-orange-200 shadow-sm";
    nameStyle = "text-orange-800";
    label = msg.user?.handleName || '参加者';
  } else {
    // Florist Chat
    if (senderType === 'FLORIST' || msg.florist) {
      bubbleStyle = "bg-pink-50 border-pink-100 shadow-sm";
      nameStyle = "text-pink-700";
      label = msg.florist?.platformName || 'お花屋さん';
      roleBadge = <span className="text-[10px] bg-pink-100 text-pink-600 px-1 rounded ml-2">FLORIST</span>;
    } else {
      bubbleStyle = "bg-sky-50 border-sky-100 shadow-sm";
      nameStyle = "text-sky-700";
      label = msg.user?.handleName || '企画者';
      roleBadge = <span className="text-[10px] bg-sky-100 text-sky-600 px-1 rounded ml-2">PLANNER</span>;
    }
  }

  return (
    <div className={`p-3 rounded-xl border ${bubbleStyle} group relative transition-all hover:shadow-md`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center">
          <span className={`text-xs font-bold ${nameStyle} truncate max-w-[150px]`}>{label}</span>
          {roleBadge}
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] text-gray-400">
             {msg.createdAt ? new Date(msg.createdAt).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' }) : ''}
           </span>
           {/* Admin Controls (Hoverで表示) */}
           <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
             <button onClick={onCopyId} className="p-1 text-gray-400 hover:text-gray-600" title="IDをコピー"><FiCopy size={12}/></button>
             <button onClick={onDelete} className="p-1 text-red-400 hover:text-red-600 bg-red-50 rounded" title="削除"><FiTrash2 size={12}/></button>
           </div>
        </div>
      </div>

      {/* Content */}
      <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed break-words">
        {msg.content || (msg.templateId ? <span className="text-gray-400 italic">テンプレート送信: {msg.templateId}</span> : 'コンテンツなし')}
      </div>
      
      {/* Image (もしあれば) */}
      {msg.imageUrl && (
          <div className="mt-2">
              <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-500 hover:underline">
                  [画像添付]
              </a>
          </div>
      )}
    </div>
  );
}

function EmptyState() {
    return (
        <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
            <div className="bg-gray-100 p-3 rounded-full mb-2">
                <FiMessageSquare size={24} />
            </div>
            <p className="text-sm">メッセージはありません</p>
        </div>
    );
}