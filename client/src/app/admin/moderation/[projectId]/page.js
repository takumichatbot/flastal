'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext'; // ★ ../../../ に修正

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function ChatModerationPage() {
  const params = useParams(); 
  const { projectId } = params;
  const [chats, setChats] = useState({ groupChat: [], floristChat: [] });
  const [loadingData, setLoadingData] = useState(true); // ★ データ取得用ローディング
  const router = useRouter();

  // ★ AuthContext から正しい認証情報を取得
  const { user, isAuthenticated, loading, logout } = useAuth();

  const fetchChats = async () => {
     if (!projectId) return;
     setLoadingData(true); // ★ データ取得ローディング
    try {
      // ★ トークンロジックを削除
      const res = await fetch(`${API_URL}/api/admin/projects/${projectId}/chats`);
      if (!res.ok) throw new Error('チャット履歴の取得に失敗しました。');
      
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
      setLoadingData(false); // ★ データ取得ローディング
    }
  };

  useEffect(() => {
    // ★ 1. AuthContext が読み込み中なら待機
    if (loading) {
      return;
    }
    // ★ 2. 未ログインの場合
    if (!isAuthenticated) {
      toast.error('ログインが必要です。');
      router.push('/login');
      return;
    }
    // ★ 3. ADMINではない場合
    if (!user || user.role !== 'ADMIN') {
      toast.error('管理者権限がありません。');
      router.push('/mypage');
      return;
    }

    // ★ 4. 認証OK (ADMIN) だったので、データを取得
    fetchChats();

  }, [projectId, isAuthenticated, user, router, loading]); // ★ 依存配列を AuthContext に合わせる

  const handleDelete = async (messageId, type) => {
    if (!window.confirm("このメッセージを完全に削除します。よろしいですか？")) return;
    
    const url = type === 'group' 
      ? `${API_URL}/api/admin/group-chat/${messageId}`
      : `${API_URL}/api/admin/florist-chat/${messageId}`;
      
    // ★ トークンロジックを削除
    
    const promise = fetch(url, {
      method: 'DELETE',
      // ★ ヘッダーも削除
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

  // ★ 7. AuthContextの読み込み中、または権限がない場合の表示
  if (loading || !isAuthenticated || !user || user.role !== 'ADMIN') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-gray-700">管理者権限を確認中...</p>
      </div>
    );
  }

  // ★ 8. 認証済みの場合のページ表示
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* ★ ヘッダーを修正 (ログアウトボタン追加) */}
        <div className="flex justify-between items-center mb-6">
            <div>
              <Link href="/admin/moderation" className="text-sky-600 hover:underline text-sm">
                  &larr; プロジェクト一覧に戻る
              </Link>
              <h1 className="text-2xl font-bold text-gray-800 mt-2">チャット監視</h1>
            </div>
            <button onClick={() => {
              logout(); 
              router.push('/login'); 
            }} className="text-sm font-medium text-gray-600 hover:text-red-500 transition-colors">
              ログアウト
            </button>
        </div>
       
        {/* ★ 以下、元のコンテンツ */}
        {loadingData ? (
          <p className="p-8 text-center">チャット履歴を読み込み中...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Group Chat */}
            <div>
              <h2 className="text-lg font-semibold mb-2 text-gray-700">参加者グループチャット</h2>
              <div className="bg-white rounded-lg shadow-md p-4 h-[70vh] overflow-y-auto space-y-3 border">
                {chats.groupChat.length === 0 ? <p className="text-gray-500 text-center pt-4">メッセージはありません。</p> :
                chats.groupChat.map(msg => (
                  msg && msg.id && msg.user ? (
                    <div key={msg.id} className="p-3 rounded-md bg-orange-50 group border border-orange-100 relative">
                      <p className="text-xs font-bold text-orange-800">{msg.user.handleName || '不明なユーザー'}</p>
                      <p className="text-sm mt-1 text-gray-800">{msg.content || (msg.templateId ? `テンプレート: ${msg.templateId}` : 'メッセージ内容なし')}</p>
                      <p className="text-xs text-gray-400 mt-1 text-right">{msg.createdAt ? new Date(msg.createdAt).toLocaleString('ja-JP') : ''}</p>
                      <button 
                          onClick={() => handleDelete(msg.id, 'group')} 
                          className="absolute top-1 right-1 text-xs text-red-500 opacity-0 group-hover:opacity-100 hover:text-red-700 p-1 bg-white/50 rounded"
                          title="削除"
                      >
                          🗑️
                      </button>
                    </div>
                  ) : null
                ))}
              </div>
            </div>
            {/* Florist Chat */}
            <div>
              <h2 className="text-lg font-semibold mb-2 text-gray-700">企画者-花屋チャット</h2>
              <div className="bg-white rounded-lg shadow-md p-4 h-[70vh] overflow-y-auto space-y-3 border">
                {chats.floristChat.length === 0 ? <p className="text-gray-500 text-center pt-4">メッセージはありません。</p> :
                chats.floristChat.map(msg => (
                  msg && msg.id ? (
                    <div key={msg.id} className="p-3 rounded-md bg-sky-50 group border border-sky-100 relative">
                      <p className="text-xs font-bold text-sky-800">
                        {msg.senderType === 'USER' 
                          ? (msg.user?.handleName || '企画者') 
                          : (msg.florist?.platformName || 'お花屋さん')}
                      </p>
                      <p className="text-sm mt-1 text-gray-800">{msg.content || 'メッセージ内容なし'}</p>
                      <p className="text-xs text-gray-400 mt-1 text-right">{msg.createdAt ? new Date(msg.createdAt).toLocaleString('ja-JP') : ''}</p>
                      <button 
                          onClick={() => handleDelete(msg.id, 'florist')} 
                          className="absolute top-1 right-1 text-xs text-red-500 opacity-0 group-hover:opacity-100 hover:text-red-700 p-1 bg-white/50 rounded"
                          title="削除"
                      >
                          🗑️
                      </button>
                    </div>
                  ) : null
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}