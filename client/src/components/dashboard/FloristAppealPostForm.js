'use client';

import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiCamera, FiSend, FiX, FiImage, FiLoader, FiEdit3, FiMinimize2 } from 'react-icons/fi';
import { useAuth } from '@/app/contexts/AuthContext';
import Image from 'next/image';

export default function FloristAppealPostForm({ onPostSuccess }) {
  const { user, authenticatedFetch } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false); // ★展開状態の管理
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [content, setContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
        toast.error('画像サイズは5MB以下にしてください。');
        return;
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setIsExpanded(true); // 画像選択時も展開する
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // フォームを閉じてリセットする
  const handleCancel = () => {
    setIsExpanded(false);
    handleRemoveImage();
    setContent('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('ログインが必要です。');
    if (user.role !== 'FLORIST') return toast.error('専用機能です。');
    if (!imageFile || !content.trim()) return toast.error('画像とコメントを入力してください。');

    setIsUploading(true);
    const toastId = toast.loading('投稿中...');

    try {
      // 1. 署名付きURL取得
      const presignedRes = await authenticatedFetch('/api/tools/s3-upload-url', {
          method: 'POST',
          body: JSON.stringify({ fileName: imageFile.name, fileType: imageFile.type })
      });
      if (!presignedRes.ok) throw new Error('アップロード許可の取得失敗');
      const { uploadUrl, fileUrl } = await presignedRes.json();

      // 2. S3アップロード
      const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: imageFile,
          headers: { 'Content-Type': imageFile.type }
      });
      if (!uploadRes.ok) throw new Error('画像アップロード失敗');

      // 3. API送信
      const postRes = await authenticatedFetch('/api/florists/posts', { 
        method: 'POST',
        body: JSON.stringify({ imageUrl: fileUrl, content: content, isPublic: true }),
      });

      if (!postRes.ok) throw new Error('投稿処理に失敗しました');
      
      toast.success('制作事例を公開しました！', { id: toastId });
      handleCancel(); // 成功したら閉じる
      if (onPostSuccess) onPostSuccess();

    } catch (error) {
      console.error(error);
      toast.error('エラー: ' + error.message, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  if (!user || user.role !== 'FLORIST') return null;

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-300 ease-in-out overflow-hidden mb-8 ${isExpanded ? 'shadow-xl ring-2 ring-pink-100 border-pink-200' : 'shadow-sm border-slate-100 hover:shadow-md'}`}>
        
        {/* --- 閉まっている時の表示 (シンプル) --- */}
        {!isExpanded && (
            <div 
                onClick={() => setIsExpanded(true)}
                className="p-4 flex items-center gap-4 cursor-text group"
            >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-pink-50 group-hover:text-pink-400 transition-colors">
                    <FiCamera size={20} />
                </div>
                <div className="flex-grow text-slate-400 text-sm font-medium">
                    最新の制作実績を投稿する...
                </div>
                <button className="text-pink-500 font-bold text-xs bg-pink-50 px-3 py-1.5 rounded-full hover:bg-pink-100 transition-colors">
                    投稿する
                </button>
            </div>
        )}

        {/* --- 展開時の表示 (フル機能) --- */}
        {isExpanded && (
            <form onSubmit={handleSubmit} className="p-5 animate-fadeIn">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <span className="bg-pink-100 text-pink-600 p-1.5 rounded-lg"><FiCamera /></span>
                        制作実績の投稿
                    </h3>
                    <button 
                        type="button" 
                        onClick={handleCancel}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                        title="閉じる"
                    >
                        <FiMinimize2 size={20} />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-5">
                    {/* 左側: 画像アップロードエリア (少し小さくしました) */}
                    <div className="w-full md:w-1/3 shrink-0">
                        {previewUrl ? (
                            <div className="relative w-full aspect-square rounded-xl overflow-hidden group shadow-sm border border-slate-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={previewUrl} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover"
                                />
                                <button 
                                    type="button" 
                                    onClick={handleRemoveImage}
                                    disabled={isUploading} 
                                    className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-red-500 transition-colors backdrop-blur-sm"
                                >
                                    <FiX size={14} />
                                </button>
                            </div>
                        ) : (
                            <div 
                                onClick={() => fileInputRef.current.click()}
                                className="w-full aspect-square border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-pink-300 hover:bg-pink-50/30 transition-all group"
                            >
                                <div className="bg-white p-3 rounded-full shadow-sm text-slate-300 group-hover:text-pink-400 group-hover:scale-110 transition-all mb-2">
                                    <FiImage size={24} />
                                </div>
                                <p className="text-xs font-bold text-slate-400 group-hover:text-pink-500">写真を選択</p>
                            </div>
                        )}
                        <input 
                            type="file" 
                            accept="image/*" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            disabled={isUploading}
                            className="hidden" 
                        />
                    </div>

                    {/* 右側: テキスト入力とボタン */}
                    <div className="flex-grow flex flex-col">
                        <div className="relative flex-grow mb-4">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="どんなお花を作りましたか？（例：〇〇様の生誕祭フラスタ、青と白を基調に...）"
                                className="w-full h-full min-h-[120px] p-4 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all resize-none text-sm leading-relaxed"
                                disabled={isUploading}
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-auto">
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isUploading}
                                className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                type="submit"
                                disabled={isUploading || !imageFile || !content}
                                className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isUploading ? <><FiLoader className="animate-spin"/> 送信中...</> : <><FiSend /> 投稿する</>}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        )}
    </div>
  );
}