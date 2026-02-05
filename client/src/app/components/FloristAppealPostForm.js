'use client';

import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { FiCamera, FiSend, FiX, FiImage, FiLoader, FiEdit3 } from 'react-icons/fi';
import { useAuth } from '@/app/contexts/AuthContext'; // ★追加
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function FloristAppealPostForm({ user, onPostSuccess }) {
  const { authenticatedFetch } = useAuth(); // ★追加: 認証付きfetchを取得
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // 画像選択ハンドラ
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        toast.error('画像サイズは5MB以下にしてください。');
        return;
    }

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('ログインが必要です。');
    if (!imageFile || !content.trim()) return toast.error('画像とコメントの両方を入力してください。');

    setLoading(true);
    const toastId = toast.loading('投稿を作成中...');

    try {
      // 1. 署名付きURL (Presigned URL) を取得
      // ★ authenticatedFetch を使用
      const presignedRes = await authenticatedFetch('/api/tools/s3-upload-url', {
        method: 'POST',
        body: JSON.stringify({ 
            fileName: imageFile.name, 
            fileType: imageFile.type 
        })
      });

      if (!presignedRes.ok) throw new Error('アップロード許可の取得に失敗しました');
      const { uploadUrl, fileUrl } = await presignedRes.json();

      // 2. S3へ直接アップロード (ここは通常のfetchでOK)
      await fetch(uploadUrl, {
        method: 'PUT',
        body: imageFile,
        headers: { 'Content-Type': imageFile.type }
      });

      // 3. APIへ投稿データを送信
      // ★ /api/florists/posts へ authenticatedFetch で送信
      const postRes = await authenticatedFetch('/api/florists/posts', {
        method: 'POST',
        body: JSON.stringify({ 
          imageUrl: fileUrl, 
          content: content,
          isPublic: true,
        }),
      });

      if (!postRes.ok) {
          const errorDetail = await postRes.json();
          throw new Error(errorDetail.message || '投稿に失敗しました');
      }
      
      toast.success('制作事例を公開しました！', { id: toastId });
      
      // リセット
      handleRemoveImage();
      setContent('');
      if (onPostSuccess) onPostSuccess();

    } catch (error) {
      console.error(error);
      toast.error(error.message || 'エラーが発生しました', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'FLORIST') return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-pink-100 overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500 to-rose-400 p-4 text-white flex items-center justify-between">
            <h3 className="font-bold text-lg flex items-center gap-2">
                <FiCamera className="text-xl"/> 制作実績をアピール
            </h3>
            <span className="text-xs bg-white/20 px-2 py-1 rounded text-white/90">Florist Only</span>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
            {/* 画像プレビュー */}
            <div className="mb-5">
                {previewUrl ? (
                    <div className="relative w-full h-64 rounded-xl overflow-hidden group shadow-md border border-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover"/>
                        <button type="button" onClick={handleRemoveImage} className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-red-500 transition-colors backdrop-blur-sm">
                            <FiX />
                        </button>
                    </div>
                ) : (
                    <div onClick={() => fileInputRef.current.click()} className="w-full h-40 border-2 border-dashed border-pink-200 rounded-xl bg-pink-50/50 flex flex-col items-center justify-center cursor-pointer hover:bg-pink-50 hover:border-pink-400 transition-all group">
                        <div className="bg-white p-3 rounded-full shadow-sm text-pink-400 group-hover:scale-110 transition-transform mb-2">
                            <FiImage size={24} />
                        </div>
                        <p className="text-pink-600 font-bold text-sm">クリックして写真を選択</p>
                    </div>
                )}
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            </div>

            {/* コメント入力 */}
            <div className="mb-5 relative">
                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">コメント</label>
                <div className="relative">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="例：お客様のイメージカラーに合わせて制作しました..."
                        rows="3"
                        disabled={loading}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:bg-white focus:border-transparent outline-none transition-all resize-none text-sm"
                    />
                    <FiEdit3 className="absolute bottom-3 right-3 text-gray-400 pointer-events-none"/>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading || !imageFile || !content}
                className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? <><FiLoader className="animate-spin text-xl"/> 公開中...</> : <><FiSend className="text-lg"/> ギャラリーに公開する</>}
            </button>
        </form>
    </div>
  );
}