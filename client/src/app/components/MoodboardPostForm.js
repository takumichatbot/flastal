'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Loader2, UploadCloud } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function MoodboardPostForm({ projectId, onPostSuccess }) {
  const { authenticatedFetch } = useAuth();
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [comment, setComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return toast.error('画像サイズは5MB以下にしてください');
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ★ 修正ポイント: S3への直接アップロードをやめ、安定した /api/upload を経由する
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const res = await authenticatedFetch(`${API_URL}/api/upload`, {
      method: 'POST',
      body: formData, // FormDataはContent-Type自動設定のためheaders不要
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || '画像のアップロードに失敗しました');
    }

    const data = await res.json();
    return data.imageUrl; // バックエンドから返ってきた画像URL
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile && !comment.trim()) {
      return toast.error('画像かコメントを入力してください');
    }

    setIsUploading(true);
    const toastId = toast.loading('ムードボードに投稿中...');

    try {
      let finalImageUrl = null;

      // 1. 画像があればバックエンド経由でアップロード
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      // 2. ムードボードに投稿データを送信
      const res = await authenticatedFetch(`${API_URL}/api/projects/${projectId}/moodboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: finalImageUrl,
          comment: comment.trim()
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || '投稿に失敗しました');
      }

      toast.success('投稿しました！✨', { id: toastId });
      
      removeImage();
      setComment('');
      if (onPostSuccess) onPostSuccess();

    } catch (error) {
      console.error('Moodboard Post Error:', error);
      toast.error(error.message || 'エラーが発生しました', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md p-6 md:p-8 rounded-[2rem] border border-white shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="relative">
          <div className="absolute top-4 left-4 text-slate-400">
            <MessageSquare size={20} />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="デザインのアイデアや、共有したいイメージを書いてください✨"
            rows="3"
            disabled={isUploading}
            className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-50 transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400 resize-none disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <AnimatePresence>
            {previewUrl ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="relative w-32 h-32 rounded-[1.5rem] overflow-hidden border-4 border-white shadow-md group shrink-0"
              >
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button type="button" onClick={removeImage} disabled={isUploading} className="bg-rose-500 text-white p-2 rounded-full hover:bg-rose-600 transition-transform hover:scale-110 shadow-lg">
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.label 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="w-full sm:w-32 h-32 rounded-[1.5rem] border-2 border-dashed border-pink-200 bg-pink-50/50 flex flex-col items-center justify-center cursor-pointer hover:bg-pink-50 hover:border-pink-300 transition-all group shrink-0"
              >
                <UploadCloud className="text-pink-300 group-hover:text-pink-500 group-hover:-translate-y-1 transition-all duration-300 mb-2" size={28} />
                <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Image</span>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} disabled={isUploading} className="hidden" />
              </motion.label>
            )}
          </AnimatePresence>

          <div className="flex-1 flex justify-end w-full">
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              type="submit" 
              disabled={isUploading || (!imageFile && !comment.trim())}
              className={cn(
                "w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all",
                isUploading || (!imageFile && !comment.trim()) 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-pink-300'
              )}
            >
              {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {isUploading ? '送信中...' : 'ムードボードに投稿'}
            </motion.button>
          </div>
        </div>

      </form>
    </div>
  );
}