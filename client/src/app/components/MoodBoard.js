"use client";
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiHeart, FiTrash2, FiImage, FiZoomIn, FiLoader } from 'react-icons/fi';
import ImageModal from './ImageModal'; // 既存のモーダルを再利用

export default function MoodBoard({ projectId, user }) {
  const [items, setItems] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [comment, setComment] = useState('');
  const [selectedImage, setSelectedImage] = useState(null); // モーダル表示用

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

    // ファイルサイズチェック (5MB)
    if (file.size > 5 * 1024 * 1024) {
        toast.error('ファイルサイズは5MB以下にしてください');
        return;
    }

    setIsUploading(true);
    const toastId = toast.loading('ボードに追加中...');

    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      if (!token) throw new Error('ログインが必要です');
      
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
      e.target.value = ''; // inputリセット
      fetchItems();

    } catch (error) {
      toast.error(error.message || 'エラーが発生しました', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  // いいね処理
  const handleLike = async (itemId) => {
    const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
    if (!token) return toast.error('ログインしてください');

    // 楽観的UI更新 (サーバーレスポンスを待たずにUI更新)
    setItems(prevItems => prevItems.map(item => {
        if (item.id === itemId) {
            const isLiked = item.likedBy?.includes(user?.id);
            return {
                ...item,
                likes: isLiked ? item.likes - 1 : item.likes + 1,
                likedBy: isLiked ? item.likedBy.filter(id => id !== user.id) : [...(item.likedBy || []), user.id]
            };
        }
        return item;
    }));

    try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/moodboard/${itemId}/like`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        // 成功したらサイレントに再フェッチして整合性を取る
        fetchItems(); 
    } catch (e) {
        console.error(e);
        fetchItems(); // 失敗したら元に戻す
    }
  };

  // 削除処理
  const handleDelete = async (itemId) => {
    if (!confirm('この画像をボードから削除しますか？')) return;
    const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
    
    try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/moodboard/${itemId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('削除しました');
        fetchItems();
    } catch (e) {
        toast.error('削除に失敗しました');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-indigo-100 shadow-xl overflow-hidden">
      
      {/* モーダル */}
      {selectedImage && (
        <ImageModal src={selectedImage} onClose={() => setSelectedImage(null)} />
      )}

      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
        <h3 className="font-bold text-xl flex items-center gap-2">
           📌 Vision Board <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-normal">イメージ共有</span>
        </h3>
        <p className="text-sm text-indigo-100 mt-2 opacity-90">
            「こんな雰囲気がいい！」「この色味を使いたい」といった参考画像をみんなで共有して、企画の解像度を高めましょう。
        </p>
      </div>

      <div className="p-6 bg-slate-50 min-h-[300px]">
        {/* 投稿フォーム */}
        {user && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-3 items-stretch">
                <label className={`cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 rounded-lg border-2 border-dashed border-slate-300 font-bold text-sm flex items-center justify-center transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {isUploading ? <FiLoader className="animate-spin mr-2"/> : <FiImage className="mr-2 text-lg"/>}
                    {isUploading ? 'アップロード中' : '画像を追加'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={isUploading} />
                </label>
                <div className="flex-grow relative">
                    <input 
                        type="text" 
                        placeholder="メモ: 例『衣装のリボン部分の参考にしたいです』" 
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full h-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all"
                        disabled={isUploading}
                    />
                </div>
            </div>
        )}

        {/* ボード一覧 */}
        {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-300 rounded-2xl bg-white/50">
                <div className="bg-indigo-50 p-4 rounded-full mb-3">
                    <FiImage className="text-3xl text-indigo-300" />
                </div>
                <p className="text-slate-500 font-bold">まだ画像がありません</p>
                <p className="text-xs text-slate-400 mt-1">最初の1枚を投稿して、イメージを膨らませましょう！</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-max">
                {items.map(item => (
                    <div key={item.id} className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:-translate-y-1">
                        
                        {/* 画像エリア */}
                        <div 
                            className="aspect-square relative cursor-zoom-in overflow-hidden bg-slate-200"
                            onClick={() => setSelectedImage(item.imageUrl)}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                                src={item.imageUrl} 
                                alt="moodboard item" 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                            />
                            
                            {/* オーバーレイアクション */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                                <span className="bg-white/20 backdrop-blur text-white p-2 rounded-full">
                                    <FiZoomIn size={20} />
                                </span>
                            </div>
                        </div>
                        
                        {/* キャプション & アクション */}
                        <div className="p-3">
                            {item.comment && (
                                <p className="text-xs font-bold text-slate-700 mb-2 leading-relaxed break-words">
                                    {item.comment}
                                </p>
                            )}
                            
                            <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                                {/* 投稿者 */}
                                <div className="flex items-center gap-1.5 opacity-70">
                                    {item.userIcon ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={item.userIcon} alt="" className="w-5 h-5 rounded-full object-cover border border-slate-200"/>
                                    ) : (
                                        <div className="w-5 h-5 bg-slate-200 rounded-full"/>
                                    )}
                                    <span className="text-[10px] font-bold text-slate-500 truncate max-w-[60px]">
                                        {item.userName || 'Guest'}
                                    </span>
                                </div>
                                
                                {/* いいねボタン */}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleLike(item.id); }}
                                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all active:scale-95 ${
                                        item.likedBy?.includes(user?.id) 
                                        ? 'bg-pink-100 text-pink-600 font-bold shadow-sm' 
                                        : 'bg-slate-100 text-slate-500 hover:bg-pink-50 hover:text-pink-500'
                                    }`}
                                >
                                    <FiHeart className={`${item.likedBy?.includes(user?.id) ? 'fill-pink-500' : ''}`} size={12} />
                                    {item.likes > 0 && item.likes}
                                </button>
                            </div>
                        </div>

                        {/* 削除ボタン (右上に配置) */}
                        {user && item.userId === user.id && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                className="absolute top-2 right-2 bg-white/90 text-slate-400 hover:text-red-500 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10 hover:rotate-90"
                                title="削除する"
                            >
                                <FiTrash2 size={14} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}