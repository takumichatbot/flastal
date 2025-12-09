// client/src/app/components/MoodboardPostForm.js
'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiImage, FiSend } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

/**
 * ムードボード投稿フォーム
 * @param {string} projectId - 投稿対象の企画ID
 * @param {function} onPostSuccess - 投稿成功時に実行するコールバック
 */
export default function MoodboardPostForm({ projectId, onPostSuccess }) {
  const [imageFile, setImageFile] = useState(null);
  const [comment, setComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile || !projectId) {
      toast.error('画像と企画IDが必要です。');
      return;
    }

    setIsUploading(true);
    let imageUrl = '';

    try {
      // 1. 画像をアップロード (既存の /api/upload を使用)
      const uploadData = new FormData();
      uploadData.append('image', imageFile);

      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      
      const uploadRes = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            // 'Content-Type': multipart/form-data は FormDataを使う場合、ブラウザが自動設定します
        },
        body: uploadData,
      });

      if (!uploadRes.ok) throw new Error('画像のアップロードに失敗しました');
      const uploadResult = await uploadRes.json();
      imageUrl = uploadResult.url;

      // 2. ムードボード API に投稿
      const postRes = await fetch(`${API_URL}/api/projects/${projectId}/moodboard`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          imageUrl, 
          comment 
        }),
      });

      if (!postRes.ok) throw new Error('ムードボードへの投稿に失敗しました');
      
      toast.success('ムードボードにアイデアを投稿しました！');
      setImageFile(null);
      setComment('');
      if (onPostSuccess) onPostSuccess();

    } catch (error) {
      console.error(error);
      toast.error(error.message || '投稿中にエラーが発生しました。');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <h3 className="font-bold text-lg text-gray-800 mb-4">💡 アイデアを投稿する</h3>
      
      {/* 画像選択エリア */}
      <div className="mb-4">
        <label className="flex items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            disabled={isUploading}
            className="hidden" 
          />
          <div className="text-center text-gray-500">
            {imageFile ? (
              <span className="font-bold text-sky-600">{imageFile.name}</span>
            ) : (
              <div className='flex items-center gap-2'>
                <FiImage size={20} />
                <span>参考画像を選択してください</span>
              </div>
            )}
          </div>
        </label>
      </div>

      {/* コメント入力エリア */}
      <div className="mb-4">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="この画像のアイデアをコメントしてください（任意）"
          rows="2"
          disabled={isUploading}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
        />
      </div>

      {/* 投稿ボタン */}
      <button
        type="submit"
        disabled={isUploading || !imageFile}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-pink-600 text-white font-bold rounded-full hover:bg-pink-700 disabled:bg-gray-400 transition-colors"
      >
        {isUploading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            投稿中...
          </>
        ) : (
          <><FiSend /> ムードボードに投稿</>
        )}
      </button>
    </form>
  );
}