'use client';

import { useState, useRef } from 'react';
import { FiImage, FiSend, FiLoader, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
// ★修正: useAuth をインポート
import { useAuth } from '@/app/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function FloristAppealPostForm({ user, onPostSuccess }) {
  // ★追加: authenticatedFetch を取得
  const { authenticatedFetch } = useAuth();
  
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // 画像選択ハンドラ
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // サイズチェック (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('画像サイズは5MB以下にしてください');
    }
    
    // プレビュー表示
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 送信ハンドラ
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;

    setLoading(true);
    const toastId = toast.loading('投稿中...');

    try {
      let imageUrl = null;

      // 1. 画像がある場合はS3へ直接アップロード
      if (imageFile) {
        // 署名付きURL取得
        const presignedRes = await authenticatedFetch('/api/tools/s3-upload-url', {
            method: 'POST',
            body: JSON.stringify({ fileName: imageFile.name, fileType: imageFile.type })
        });
        
        if (!presignedRes.ok) throw new Error('アップロード許可の取得に失敗しました');
        const { uploadUrl, fileUrl } = await presignRes.json();

        // S3へPUT送信
        await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl);
            xhr.setRequestHeader('Content-Type', imageFile.type);
            xhr.onload = () => {
              if (xhr.status === 200) resolve();
              else reject(new Error('S3へのアップロードに失敗しました'));
            };
            xhr.onerror = () => reject(new Error('ネットワークエラー'));
            xhr.send(imageFile);
        });

        imageUrl = fileUrl;
      }

      // 2. DBへ保存 (認証付きリクエスト)
      // 花屋専用のアピール投稿API (/api/florists/posts) を使用するのが適切ですが、
      // 既存に合わせて /api/posts を使う場合は以下になります。
      const postRes = await authenticatedFetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
            eventName: 'Florist Appeal', // 識別用
            senderName: user.handleName || user.shopName,
            content: content,
            imageUrl: imageUrl,
            email: user.email // 必要に応じて
        })
      });

      if (!postRes.ok) {
          const errData = await postRes.json();
          throw new Error(errData.message || '投稿の保存に失敗しました');
      }

      toast.success('投稿しました！', { id: toastId });
      setContent('');
      clearImage();
      if (onPostSuccess) onPostSuccess();

    } catch (error) {
      console.error(error);
      toast.error('投稿に失敗しました: ' + error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
            {user?.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.iconUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                {user?.shopName?.[0] || 'F'}
              </div>
            )}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="制作実績や入荷情報などを投稿しましょう..."
            className="flex-grow p-3 bg-gray-50 rounded-lg border-transparent focus:border-pink-500 focus:bg-white focus:ring-0 resize-none text-sm transition-all outline-none"
            rows="3"
            disabled={loading}
          />
        </div>

        {previewUrl && (
          <div className="mb-3 ml-12 relative w-fit group">
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img src={previewUrl} alt="Preview" className="h-32 rounded-lg border border-gray-200 object-cover" />
             <button 
               type="button"
               onClick={clearImage}
               className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 text-xs hover:bg-gray-600 shadow-md"
             >
               <FiX />
             </button>
          </div>
        )}

        <div className="flex justify-between items-center ml-12">
          <label className="cursor-pointer text-gray-500 hover:text-pink-600 hover:bg-pink-50 p-2 rounded-full transition-colors">
            <FiImage size={20} />
            <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange} 
                ref={fileInputRef}
                disabled={loading}
            />
          </label>
          
          <button
            type="submit"
            disabled={loading || (!content.trim() && !imageFile)}
            className="px-6 py-2 bg-pink-500 text-white rounded-full font-bold text-sm shadow-md hover:bg-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <FiLoader className="animate-spin" /> : <FiSend />}
            投稿する
          </button>
        </div>
      </form>
    </div>
  );
}