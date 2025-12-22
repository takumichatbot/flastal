'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiHeart, FiZoomIn, FiImage, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ImageModal from './ImageModal'; // ★ 作成済みのモーダルをインポート

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function MoodboardDisplay({ projectId }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null); // モーダル用

  const fetchItems = useCallback(async () => {
    // 初回のみローディング表示（いいね等の再取得時は表示しない）
    if(items.length === 0) setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/moodboard`);
      if (!res.ok) throw new Error('取得失敗');
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error(error);
      // 静かに失敗させる（トーストは出さない）
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // いいね処理（楽観的UI更新）
  const handleLike = async (itemId) => {
    if (!user) return toast.error('いいねするにはログインが必要です');
    
    // 1. 現在の状態を保存（ロールバック用）
    const previousItems = [...items];

    // 2. UIを先に更新（Optimistic Update）
    setItems(prevItems => prevItems.map(item => {
      if (item.id === itemId) {
        const wasLiked = item.likedBy.includes(user.id);
        return {
          ...item,
          likes: wasLiked ? item.likes - 1 : item.likes + 1,
          likedBy: wasLiked 
            ? item.likedBy.filter(id => id !== user.id) 
            : [...item.likedBy, user.id]
        };
      }
      return item;
    }));

    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const res = await fetch(`${API_URL}/api/moodboard/${itemId}/like`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        }
      });

      if (!res.ok) throw new Error('API Error');
      
      // 成功時はサイレントに整合性を取るために再フェッチしても良いが、
      // ここではレスポンスを使わず楽観的更新のままで完了とする

    } catch (error) {
      // 失敗したら元に戻す
      setItems(previousItems);
      toast.error('いいねに失敗しました');
    }
  };

  if (loading) {
    return (
        <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FiImage /> アイデアボード
            </h2>
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-gray-200 rounded-xl animate-pulse h-48 break-inside-avoid"></div>
                ))}
            </div>
        </div>
    );
  }

  return (
    <div className="mt-12">
      {/* モーダル表示 */}
      {selectedImage && (
        <ImageModal src={selectedImage} onClose={() => setSelectedImage(null)} />
      )}

      <div className="flex items-end justify-between mb-6 border-b border-gray-100 pb-4">
        <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiImage className="text-indigo-500" /> アイデアボード
            </h2>
            <p className="text-xs text-gray-500 mt-1">
                参加者が持ち寄ったイメージ画像 ({items.length}件)
            </p>
        </div>
      </div>
      
      {items.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
            <FiImage size={24} />
          </div>
          <p className="font-bold">まだアイデアがありません</p>
          <p className="text-xs mt-1">最初の1枚を投稿して企画を盛り上げましょう！</p>
        </div>
      ) : (
        /* Pinterest風レイアウト (CSS Columnsを使用) */
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {items.map(item => {
            const isLiked = user && item.likedBy?.includes(user.id);
            
            return (
              <div key={item.id} className="break-inside-avoid bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 overflow-hidden group hover:-translate-y-1">
                
                {/* 画像エリア (クリックで拡大) */}
                <div 
                    className="relative cursor-zoom-in bg-slate-100"
                    onClick={() => setSelectedImage(item.imageUrl)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={item.imageUrl} 
                    alt={item.comment || 'Idea'} 
                    className="w-full h-auto object-cover block"
                    loading="lazy"
                  />
                  {/* ホバー時のオーバーレイ */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <FiZoomIn className="text-white text-2xl drop-shadow-md" />
                  </div>
                </div>

                {/* 情報エリア */}
                <div className="p-3">
                  {item.comment && (
                    <p className="text-xs text-slate-700 font-medium mb-3 leading-relaxed break-words">
                      {item.comment}
                    </p>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      {item.userIcon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.userIcon} alt="" className="w-5 h-5 rounded-full object-cover border border-slate-100 shrink-0"/>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 shrink-0"><FiUser size={10}/></div>
                      )}
                      <span className="text-[10px] text-slate-500 truncate max-w-[80px]">{item.userName || 'Guest'}</span>
                    </div>
                    
                    {/* いいねボタン */}
                    <button
                      onClick={(e) => {
                          e.stopPropagation(); // 親要素へのバブリング停止
                          handleLike(item.id);
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all active:scale-90 ${
                          isLiked 
                          ? 'bg-pink-50 text-pink-500 font-bold' 
                          : 'bg-slate-50 text-slate-400 hover:bg-pink-50 hover:text-pink-400'
                      }`}
                    >
                      <FiHeart className={isLiked ? 'fill-pink-500' : ''} />
                      <span>{item.likes > 0 ? item.likes : ''}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}