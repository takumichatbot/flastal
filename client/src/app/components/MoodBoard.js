"use client";
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiHeart, FiTrash2, FiImage } from 'react-icons/fi';

export default function MoodBoard({ projectId, user }) {
  const [items, setItems] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [comment, setComment] = useState('');

  // データ取得
  const fetchItems = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/moodboard`);
      if (res.ok) setItems(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchItems();
  }, [projectId]);

  // アップロード処理
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!comment.trim()) {
      // コメント必須ではないが、確認ダイアログなどで入力を促すのもあり
    }

    setIsUploading(true);
    const toastId = toast.loading('ボードに追加中...');

    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      
      // 1. 画像アップロード
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!uploadRes.ok) throw new Error('画像のアップロード失敗');
      const { url } = await uploadRes.json();

      // 2. ムードボードに追加
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/moodboard`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ imageUrl: url, comment: comment })
      });

      if (!res.ok) throw new Error('追加失敗');
      
      toast.success('イメージを追加しました！', { id: toastId });
      setComment('');
      fetchItems();

    } catch (error) {
      toast.error('エラーが発生しました', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  // いいね処理
  const handleLike = async (itemId) => {
    const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/moodboard/${itemId}/like`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) fetchItems();
  };

  // 削除処理
  const handleDelete = async (itemId) => {
    if (!confirm('削除しますか？')) return;
    const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/moodboard/${itemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchItems();
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-lg text-gray-800 flex items-center">
            <span className="text-2xl mr-2">📌</span> イメージ共有ボード (Vision Board)
          </h3>
          <p className="text-xs text-gray-500">
            「こんな感じにしたい！」「この色味がいい！」という画像をみんなで貼り付けましょう。
          </p>
        </div>
      </div>

      {/* 投稿フォーム */}
      <div className="flex gap-2 items-center mb-8 bg-slate-50 p-3 rounded-lg border border-slate-200">
        <label className="cursor-pointer bg-white text-indigo-600 px-4 py-2 rounded-lg border border-indigo-200 hover:bg-indigo-50 font-bold text-sm flex items-center shadow-sm transition-all hover:-translate-y-0.5">
          <FiImage className="mr-2"/> 画像を選択
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={isUploading} />
        </label>
        <input 
          type="text" 
          placeholder="ひとことメモ (例: リボンの参考にしたい)" 
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="flex-grow p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          disabled={isUploading}
        />
      </div>

      {/* ボード一覧 (Pinterest風グリッド) */}
      {items.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
          まだ画像がありません。<br/>最初の1枚を貼ってみませんか？
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(item => (
            <div key={item.id} className="relative group bg-slate-50 rounded-lg overflow-hidden border hover:shadow-md transition-all">
              {/* 画像 */}
              <div className="aspect-square relative cursor-pointer overflow-hidden">
                <img src={item.imageUrl} alt="ref" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              {/* 情報 */}
              <div className="p-3">
                <p className="text-xs font-bold text-gray-700 mb-1 line-clamp-2">{item.comment || "コメントなし"}</p>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-1">
                    {item.userIcon ? <img src={item.userIcon} className="w-4 h-4 rounded-full"/> : <div className="w-4 h-4 bg-gray-300 rounded-full"/>}
                    <span className="text-[10px] text-gray-500 truncate max-w-[60px]">{item.userName}</span>
                  </div>
                  
                  {/* いいねボタン */}
                  <button 
                    onClick={() => handleLike(item.id)}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
                      item.likedBy?.includes(user?.id) ? 'bg-pink-100 text-pink-600' : 'bg-gray-200 text-gray-500 hover:bg-pink-50'
                    }`}
                  >
                    <FiHeart className={item.likedBy?.includes(user?.id) ? 'fill-pink-500' : ''} />
                    {item.likes}
                  </button>
                </div>
              </div>

              {/* 削除ボタン (投稿者のみ) */}
              {user && item.userId === user.id && (
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full text-red-500 opacity-0 group-hover:opacity-100 hover:bg-white hover:text-red-700 transition-all shadow-sm"
                >
                  <FiTrash2 />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}