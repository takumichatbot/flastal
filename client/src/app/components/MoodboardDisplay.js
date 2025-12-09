// client/src/app/components/MoodboardDisplay.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiHeart } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function MoodboardDisplay({ projectId }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/moodboard`);
      if (!res.ok) throw new Error('ムードボードの取得に失敗しました');
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error(error);
      toast.error('ムードボードの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleLike = async (itemId, isLiked) => {
    if (!user) return toast.error('いいねするにはログインが必要です');
    
    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const res = await fetch(`${API_URL}/api/moodboard/${itemId}/like`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        }
        // bodyは空でOK。ユーザーIDはJWTから取得される
      });

      if (!res.ok) throw new Error('いいねの処理に失敗しました');
      
      const updatedItem = await res.json();
      
      // UIの更新
      setItems(prevItems => prevItems.map(item => 
        item.id === itemId ? updatedItem : item
      ));

    } catch (error) {
      console.error(error);
      toast.error(error.message || 'いいね処理中にエラーが発生しました。');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">ムードボードを読み込み中...</div>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">アイデア一覧 ({items.length}件)</h2>
      
      {items.length === 0 && (
        <div className="text-center py-16 bg-gray-100 rounded-xl text-gray-500 border border-dashed">
          <p>まだアイデアが投稿されていません。</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map(item => {
          const isLiked = user && item.likedBy.includes(user.id);
          
          return (
            <div key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 group">
              {/* 画像 */}
              <div className="aspect-square bg-gray-200 relative">
                <img 
                  src={item.imageUrl} 
                  alt={item.comment || 'ムードボード画像'} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>

              {/* 詳細 */}
              <div className="p-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center text-xs gap-1">
                    <img src={item.userIcon || '/default-user-icon.png'} className="w-4 h-4 rounded-full"/>
                    <span className="font-bold text-gray-700 truncate">{item.userName}</span>
                  </div>
                  
                  {/* いいねボタン */}
                  <button
                    onClick={() => handleLike(item.id, isLiked)}
                    className="flex items-center gap-1 text-sm transition-colors"
                  >
                    <FiHeart 
                      className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500 animate-pulse' : 'text-gray-400 hover:text-red-500'}`} 
                    />
                    <span className="font-bold text-gray-600 text-sm">{item.likes}</span>
                  </button>
                </div>
                
                {/* コメント */}
                <p className="text-xs text-gray-600 line-clamp-2">
                  {item.comment || 'コメントなし'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}