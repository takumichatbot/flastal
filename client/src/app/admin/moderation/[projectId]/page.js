'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

// ★ 1. APIのURLをPythonバックエンドに統一
const API_URL = process.env.NEXT_PUBLIC_API_URL_PYTHON || 'https://flastal-backend.onrender.com';

export default function ChatModerationPage() {
  const params = useParams(); // useParamsを正しく呼び出す
  const { projectId } = params;
  const [chats, setChats] = useState({ groupChat: [], floristChat: [] });
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      // ★ 2. 認証トークンを取得
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('管理者としてログインしていません。');

      // ★ 3. APIリクエストにトークンを付与
      const res = await fetch(`${API_URL}/api/admin/projects/${projectId}/chats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('チャット履歴の取得に失敗しました。');
      
      const data = await res.json();
      setChats(data);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchChats();
  }, [projectId]);

  const handleDelete = async (messageId, type) => {
    if (!window.confirm("このメッセージを完全に削除します。よろしいですか？")) return;
    
    const url = type === 'group' 
      ? `${API_URL}/api/admin/group-chat/${messageId}`
      : `${API_URL}/api/admin/florist-chat/${messageId}`;
      
    try {
      // ★ 4. 削除時も認証トークンが必要
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('管理者としてログインしていません。');

      await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // 画面から即時反映
      if (type === 'group') {
        setChats(prev => ({...prev, groupChat: prev.groupChat.filter(m => m.id !== messageId)}));
      } else {
        setChats(prev => ({...prev, floristChat: prev.floristChat.filter(m => m.id !== messageId)}));
      }
    } catch (error) {
      alert(`削除に失敗しました: ${error.message}`);
    }
  };

  if (loading) return <p className="p-8 text-center">チャット履歴を読み込み中...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">チャット監視</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 参加者チャット */}
          <div>
            <h2 className="text-lg font-semibold mb-2">参加者グループチャット</h2>
            <div className="bg-white rounded-lg shadow-md p-4 h-[70vh] overflow-y-auto space-y-3">
              {chats.groupChat.map(msg => (
                <div key={msg.id} className="p-2 rounded-md bg-orange-50 group">
                  <p className="text-xs font-bold">{msg.user.handleName}</p>
                  <p className="text-sm">{msg.content || `テンプレートID: ${msg.templateId}`}</p>
                  <button onClick={() => handleDelete(msg.id, 'group')} className="text-xs text-red-500 opacity-0 group-hover:opacity-100">削除</button>
                </div>
              ))}
            </div>
          </div>
          {/* 花屋チャット */}
          <div>
            <h2 className="text-lg font-semibold mb-2">企画者-花屋チャット</h2>
            <div className="bg-white rounded-lg shadow-md p-4 h-[70vh] overflow-y-auto space-y-3">
              {chats.floristChat.map(msg => (
                <div key={msg.id} className="p-2 rounded-md bg-sky-50 group">
                  <p className="text-xs font-bold">{msg.sender_type === 'USER' ? msg.user?.handleName : msg.florist?.shopName}</p>
                  <p className="text-sm">{msg.content}</p>
                  <button onClick={() => handleDelete(msg.id, 'florist')} className="text-xs text-red-500 opacity-0 group-hover:opacity-100">削除</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}