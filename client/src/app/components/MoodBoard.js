"use client";
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Heart, Trash2, ImageIcon, ZoomIn, Loader2 } from 'lucide-react';
import ImageModal from './ImageModal'; 

export default function MoodBoard({ projectId, user }) {
  const [items, setItems] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [comment, setComment] = useState('');
  const [selectedImage, setSelectedImage] = useState(null); 

  const fetchItems = async () => {
    try {
      // ★修正: /api/project-details/projects/... に変更
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project-details/projects/${projectId}/moodboard`);
      if (res.ok) setItems(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchItems();
  }, [projectId]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        toast.error('ファイルサイズは5MB以下にしてください');
        return;
    }

    setIsUploading(true);
    const toastId = toast.loading('ボードに追加中...');

    try {
      const token = window.__flastalToken;
      if (!token) throw new Error('ログインが必要です');
      
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!uploadRes.ok) throw new Error('画像のアップロード失敗');
      const { imageUrl } = await uploadRes.json();

      // ★修正: /api/project-details/projects/... に変更
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project-details/projects/${projectId}/moodboard`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ imageUrl: imageUrl, comment: comment })
      });

      if (!res.ok) throw new Error('追加失敗');
      
      toast.success('イメージを追加しました！', { id: toastId });
      setComment('');
      e.target.value = ''; 
      fetchItems();

    } catch (error) {
      toast.error(error.message || 'エラーが発生しました', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleLike = async (itemId) => {
    const token = window.__flastalToken;
    if (!token) return toast.error('ログインしてください');

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
        // ★修正: /api/project-details/moodboard/... に変更
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project-details/moodboard/${itemId}/like`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchItems(); 
    } catch (e) {
        console.error(e);
        fetchItems(); 
    }
  };

  const handleDelete = async (itemId) => {
    if (!confirm('この画像をボードから削除しますか？')) return;
    const token = window.__flastalToken;
    
    try {
        // ★修正: /api/project-details/moodboard/... に変更
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project-details/moodboard/${itemId}`, {
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
    <div className="bg-white rounded-3xl border border-pink-100 shadow-xl overflow-hidden">
      
      {selectedImage && (
        <ImageModal src={selectedImage} onClose={() => setSelectedImage(null)} />
      )}

      <div className="bg-gradient-to-r from-pink-500 to-rose-600 p-6 text-white">
        <h3 className="font-bold text-xl flex items-center gap-2">
           📌 Vision Board <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-normal">イメージ共有</span>
        </h3>
        <p className="text-sm text-pink-100 mt-2 opacity-90">
            「こんな雰囲気がいい！」「この色味を使いたい」といった参考画像をみんなで共有して、企画の解像度を高めましょう。
        </p>
      </div>

      <div className="p-6 bg-slate-50 min-h-[300px]">
        {user && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-3 items-stretch">
                <label className={`cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 rounded-lg border-2 border-dashed border-slate-300 font-bold text-sm flex items-center justify-center transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {isUploading ? <Loader2 className="animate-spin mr-2"/> : <ImageIcon className="mr-2 text-lg"/>}
                    {isUploading ? 'アップロード中' : '画像を追加'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={isUploading} />
                </label>
                <div className="flex-grow relative">
                    <input 
                        type="text" 
                        placeholder="メモ: 例『衣装のリボン部分の参考にしたいです』" 
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full h-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none transition-all"
                        disabled={isUploading}
                    />
                </div>
            </div>
        )}

        {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-300 rounded-2xl bg-white/50">
                <div className="bg-pink-50 p-4 rounded-full mb-3">
                    <ImageIcon className="text-3xl text-pink-300" />
                </div>
                <p className="text-slate-500 font-bold">まだ画像がありません</p>
                <p className="text-xs text-slate-400 mt-1">最初の1枚を投稿して、イメージを膨らませましょう！</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-max">
                {items.map(item => (
                    <div key={item.id} className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:-translate-y-1">
                        
                        <div 
                            className="aspect-square relative cursor-zoom-in overflow-hidden bg-slate-200"
                            onClick={() => setSelectedImage(item.imageUrl)}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={item.imageUrl}
                                alt="moodboard item"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                loading="lazy"
                            />
                            
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                                <span className="bg-white/20 backdrop-blur text-white p-2 rounded-full">
                                    <ZoomIn size={20} />
                                </span>
                            </div>
                        </div>
                        
                        <div className="p-3">
                            {item.comment && (
                                <p className="text-xs font-bold text-slate-700 mb-2 leading-relaxed break-words">
                                    {item.comment}
                                </p>
                            )}
                            
                            <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                                <div className="flex items-center gap-1.5 opacity-70">
                                    {item.userIcon ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={item.userIcon} alt="" className="w-5 h-5 rounded-full object-cover border border-slate-200" loading="lazy" />
                                    ) : (
                                        <div className="w-5 h-5 bg-slate-200 rounded-full"/>
                                    )}
                                    <span className="text-[10px] font-bold text-slate-500 truncate max-w-[60px]">
                                        {item.userName || 'Guest'}
                                    </span>
                                </div>
                                
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleLike(item.id); }}
                                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all active:scale-95 ${
                                        item.likedBy?.includes(user?.id) 
                                        ? 'bg-pink-100 text-pink-600 font-bold shadow-sm' 
                                        : 'bg-slate-100 text-slate-500 hover:bg-pink-50 hover:text-pink-500'
                                    }`}
                                >
                                    <Heart className={`${item.likedBy?.includes(user?.id) ? 'fill-pink-500' : ''}`} size={12} />
                                    {item.likes > 0 && item.likes}
                                </button>
                            </div>
                        </div>

                        {user && item.userId === user.id && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                className="absolute top-2 right-2 bg-white/90 text-slate-400 hover:text-red-500 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10 hover:rotate-90"
                                title="削除する"
                            >
                                <Trash2 size={14} />
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