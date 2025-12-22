'use client';

import { useState } from 'react';
import { FiImage, FiSend, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getPresignedUrl, savePostToDb } from '@/app/actions'; // Server Actionsを利用

export default function FloristAppealPostForm({ user, onPostSuccess }) {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  // 画像選択ハンドラ
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // プレビュー表示
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // 送信ハンドラ
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;

    setLoading(true);
    try {
      let imageUrl = null;

      // 1. 画像がある場合はS3へアップロード
      if (imageFile) {
        // 署名付きURL取得
        const presignedRes = await getPresignedUrl(imageFile.name, imageFile.type, imageFile.size);
        if (!presignedRes.success) throw new Error(presignedRes.error);

        // アップロード実行
        await fetch(presignedRes.uploadUrl, {
          method: 'PUT',
          body: imageFile,
          headers: { 'Content-Type': imageFile.type }
        });

        imageUrl = presignedRes.publicUrl;
      }

      // 2. DBへ保存 (Server Action経由)
      // 注: savePostToDbは汎用的な投稿保存関数としてactions.jsに定義されている前提です
      // もしactions.jsが未対応なら、別途APIルートを作成する必要がありますが、
      // ここでは既存の仕組みを利用する形にします。
      const postData = {
        eventName: 'Florist Appeal', // 識別用
        senderName: user.handleName || user.shopName,
        // 本文を保存するフィールドがPostモデルに必要です。
        // なければ eventName などに一旦入れますが、本来は `content` カラム推奨
        content: content 
      };

      const dbRes = await savePostToDb(postData, imageUrl);
      if (!dbRes.success) throw new Error(dbRes.error);

      toast.success('投稿しました！');
      setContent('');
      setImageFile(null);
      setPreviewUrl(null);
      if (onPostSuccess) onPostSuccess();

    } catch (error) {
      console.error(error);
      toast.error('投稿に失敗しました');
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
              <img src={user.iconUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                {user?.shopName?.[0]}
              </div>
            )}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="制作実績や入荷情報などを投稿しましょう..."
            className="flex-grow p-3 bg-gray-50 rounded-lg border-transparent focus:border-pink-500 focus:bg-white focus:ring-0 resize-none text-sm transition-all"
            rows="3"
          />
        </div>

        {previewUrl && (
          <div className="mb-3 ml-12 relative w-fit">
             <img src={previewUrl} alt="Preview" className="h-32 rounded-lg border border-gray-200 object-cover" />
             <button 
               type="button"
               onClick={() => { setImageFile(null); setPreviewUrl(null); }}
               className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 text-xs hover:bg-gray-600"
             >
               ✕
             </button>
          </div>
        )}

        <div className="flex justify-between items-center ml-12">
          <label className="cursor-pointer text-gray-500 hover:text-pink-600 hover:bg-pink-50 p-2 rounded-full transition-colors">
            <FiImage size={20} />
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
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