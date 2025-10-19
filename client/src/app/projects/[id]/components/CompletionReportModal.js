'use client';

import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

// ★ API_URLを修正
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ★ user を props で受け取る
export default function CompletionReportModal({ project, user, onClose, onReportSubmitted }) {
  const [imageUrls, setImageUrls] = useState([]);
  const [comment, setComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (event) => {
    // ... (この関数は変更なし) ...
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const toastId = toast.loading(`画像をアップロード中... (0/${files.length})`);
    const uploadedUrls = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('image', file); // ★ 'file' -> 'image' に変更 (バックエンドの`upload.single('image')`に合わせる)
        try {
            const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: formData });
            if (!res.ok) throw new Error('アップロードに失敗しました');
            const data = await res.json();
            uploadedUrls.push(data.url);
            toast.loading(`画像をアップロード中... (${i + 1}/${files.length})`, { id: toastId });
        } catch (error) {
            toast.error(error.message, { id: toastId });
            setIsUploading(false);
            return;
        }
    }
    setImageUrls(prev => [...prev, ...uploadedUrls]);
    toast.success('アップロードが完了しました！', { id: toastId });
    setIsUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (imageUrls.length === 0) {
      toast.error('少なくとも1枚は写真をアップロードしてください。');
      return;
    }
    if (!user) {
      toast.error('ログインが必要です。');
      return;
    }

    // ★★★ 修正: token削除, userId追加 ★★★
    const promise = fetch(`${API_URL}/api/projects/${project.id}/complete`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        completionImageUrls: imageUrls,
        completionComment: comment,
        userId: user.id, // ★ ユーザーIDを追加
      }),
    }).then(res => {
        if (!res.ok) throw new Error('完了報告の投稿に失敗しました。');
    });
    toast.promise(promise, {
      loading: '投稿中...',
      success: () => {
        onReportSubmitted();
        onClose();
        return '企画の完了報告を投稿しました！';
      },
      error: (err) => err.message,
    });
  };

  // --- JSX (変更なし) ---
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold mb-4">🎉 企画完了報告</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">完成写真のアップロード</label>
              <div className="mt-2 p-4 border-2 border-dashed rounded-lg">
                <div className="flex flex-wrap gap-4">
                  {imageUrls.map((url, index) => (
                    <img key={index} src={url} className="h-24 w-24 object-cover rounded-md" alt={`Uploaded ${index + 1}`} />
                  ))}
                  {isUploading && <div className="h-24 w-24 flex items-center justify-center bg-gray-100 rounded-md">...</div>}
                </div>
                <button type="button" onClick={() => fileInputRef.current.click()} disabled={isUploading} className="mt-4 px-4 py-2 text-sm bg-sky-100 text-sky-700 rounded-md hover:bg-sky-200 disabled:bg-slate-200">
                  {isUploading ? 'アップロード中...' : '画像を選択'}
                </button>
                <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
              </div>
            </div>
            <div>
              <label htmlFor="completion-comment" className="block text-sm font-medium text-gray-700">参加者へのメッセージ</label>
              <textarea id="completion-comment" value={comment} onChange={(e) => setComment(e.target.value)} rows="4" className="w-full mt-1 p-2 border rounded-md text-gray-900" placeholder="企画へのご参加ありがとうございました！..."></textarea>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">キャンセル</button>
            <button type="submit" disabled={isUploading} className="px-4 py-2 font-bold text-white bg-green-500 rounded-md hover:bg-green-600 disabled:bg-gray-400">完了を報告する</button>
          </div>
        </form>
      </div>
    </div>
  );
}