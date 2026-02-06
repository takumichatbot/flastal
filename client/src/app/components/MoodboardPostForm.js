'use client';

import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiImage, FiLoader, FiSend } from 'react-icons/fi'; // FiZoomIn, FiHeart, FiUser, FiTrash2 を削除
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ★修正: 投稿機能のみに専念させ、リスト表示ロジックを削除
export default function MoodboardPostForm({ projectId, onPostSuccess }) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [comment, setComment] = useState('');
  const fileInputRef = useRef(null);

  // アップロード処理
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
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      if (!token) throw new Error('ログインが必要です');
      
      // 1. 画像アップロード
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!uploadRes.ok) throw new Error('画像のアップロード失敗');
      const { url } = await uploadRes.json();

      // 2. ムードボードに追加
      const res = await fetch(`${API_URL}/api/projects/${projectId}/moodboard`, {
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
      if(fileInputRef.current) fileInputRef.current.value = '';
      
      // 親コンポーネント（ProjectDetailClient）に更新を通知
      if (onPostSuccess) onPostSuccess();

    } catch (error) {
      toast.error(error.message || 'エラーが発生しました', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-3 items-stretch">
        <label className={`cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 rounded-lg border-2 border-dashed border-slate-300 font-bold text-sm flex items-center justify-center transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {isUploading ? <FiLoader className="animate-spin mr-2"/> : <FiImage className="mr-2 text-lg"/>}
            {isUploading ? '送信中...' : '画像を追加'}
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleUpload} disabled={isUploading} />
        </label>
        <div className="flex-grow relative flex gap-2">
            <input 
                type="text" 
                placeholder="メモ: 例『衣装のリボン部分の参考にしたいです』" 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full h-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all"
                disabled={isUploading}
            />
            {/* テキスト入力だけで送信したい場合のためのボタン（画像必須なら無くてもOK） */}
             <button 
                onClick={() => { if(!fileInputRef.current.files[0]) toast.error('画像を選択してください') }}
                disabled={isUploading}
                className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
                <FiSend />
            </button>
        </div>
    </div>
  );
}