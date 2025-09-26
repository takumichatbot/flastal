'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function ChatModerationPage() {
  const { projectId } = useParams();
  const [chats, setChats] = useState({ groupChat: [], floristChat: [] });
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/chats`);
      const data = await res.json();
      setChats(data);
    } catch (error) {
      console.error(error);
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
      ? `/api/admin/group-chat/${messageId}`
      : `/api/admin/florist-chat/${messageId}`;
      
    try {
      await fetch(url, { method: 'DELETE' });
      // 画面から即時反映
      if (type === 'group') {
        setChats(prev => ({...prev, groupChat: prev.groupChat.filter(m => m.id !== messageId)}));
      } else {
        setChats(prev => ({...prev, floristChat: prev.floristChat.filter(m => m.id !== messageId)}));
      }
    } catch (error) {
      alert('削除に失敗しました。');
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
                  <p className="text-sm">{msg.content || msg.templateId}</p>
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
                  <p className="text-xs font-bold">{msg.user?.handleName || msg.florist?.shopName}</p>
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