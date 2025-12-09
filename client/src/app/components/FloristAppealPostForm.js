// app/components/FloristAppealPostForm.js
'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiCamera, FiSend, FiX } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

/**
 * お花屋さん専用アピール投稿フォーム
 * @param {function} onPostSuccess - 投稿成功時に実行するコールバック
 */
export default function FloristAppealPostForm({ onPostSuccess }) {
  const { user } = useAuth();
  const [imageFile, setImageFile] = useState(null);
  const [content, setContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile || !content) {
      toast.error('画像と内容の両方が必要です。');
      return;
    }
    if (user.role !== 'FLORIST') {
        toast.error('この機能はお花屋さんアカウント専用です。');
        return;
    }

    setIsUploading(true);
    let imageUrl = '';
    const toastId = toast.loading('投稿を準備中...');

    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      
      // 1. 画像をアップロード (既存の /api/upload を使用)
      const uploadData = new FormData();
      uploadData.append('image', imageFile);
      const uploadRes = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadData,
      });

      if (!uploadRes.ok) throw new Error('画像のアップロードに失敗しました');
      const uploadResult = await uploadRes.json();
      imageUrl = uploadResult.url;

      // 2. ProjectPost API に投稿 (FLORIST_APPEALタイプを使用)
      // 💡 プロジェクトIDの代わりに、お花屋さん自身のIDをダミーとして使用する設計（バックエンドの調整が必要）
      //   - バックエンドでは、投稿者をfloristIdとして認識し、projectIdのチェックを緩める調整が必要です。
      const postRes = await fetch(`${API_URL}/api/projects/${user.id}/posts`, { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          content: content,
          postType: 'FLORIST_APPEAL', // ★専用のタイプ
          imageUrl: imageUrl, // 画像URLを内容に含めるか、ProjectPostモデルに追加が必要
          // ※ 今回のバックエンド案ではimageUrlフィールドがないため、contentに画像URLを含めるか、schema.prismaを修正する必要があります。
        }),
      });

      if (!postRes.ok) throw new Error('アピール投稿に失敗しました');
      
      toast.success('制作アピールを投稿しました！', { id: toastId });
      setImageFile(null);
      setContent('');
      if (onPostSuccess) onPostSuccess();

    } catch (error) {
      console.error(error);
      toast.error(error.message || '投稿中にエラーが発生しました。', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };
  
  const selectedFileName = imageFile ? imageFile.name : null;

  return (
    <form onSubmit={handleSubmit} className="bg-pink-50 p-5 rounded-xl border border-pink-200">
      <h3 className="font-bold text-lg text-pink-700 mb-4 flex items-center gap-2">
        <FiCamera /> 制作アピールを投稿
      </h3>
      
      {/* 1. 画像選択エリア */}
      <div className="mb-4">
        <label className="flex items-center justify-center h-16 border-2 border-dashed border-pink-300 rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            disabled={isUploading}
            className="hidden" 
          />
          <div className="text-center text-pink-600 font-bold">
            {selectedFileName ? (
              <span className="flex items-center gap-2"><FiCheckCircle /> {selectedFileName}</span>
            ) : (
              <span className='flex items-center gap-2'><FiCamera /> 制作写真を選択</span>
            )}
          </div>
        </label>
      </div>

      {/* 2. コメント入力エリア */}
      <div className="mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="この作品のこだわり、裏話、アピールしたい技術などを自由に記述してください。"
          rows="3"
          disabled={isUploading}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
        />
      </div>

      {/* 3. 投稿ボタン */}
      <button
        type="submit"
        disabled={isUploading || !imageFile || !content}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-pink-600 text-white font-bold rounded-full hover:bg-pink-700 disabled:bg-gray-400 transition-colors"
      >
        {isUploading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            投稿中...
          </>
        ) : (
          <><FiSend /> ギャラリーに公開</>
        )}
      </button>
    </form>
  );
}