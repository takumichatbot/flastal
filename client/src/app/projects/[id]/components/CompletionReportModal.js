'use client';

import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function CompletionReportModal({ project, user, onClose, onReportSubmitted }) {
  const [imageUrls, setImageUrls] = useState([]);
  const [comment, setComment] = useState('');
  const [surplusUsageDescription, setSurplusUsageDescription] = useState(''); // ★ 使い道用のState
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // ★★★ 収支情報を計算 ★★★
  const totalExpense = project.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const finalBalance = project.collectedAmount - totalExpense;

  // --- 画像アップロード処理 ---
  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const toastId = toast.loading(`画像をアップロード中... (0/${files.length})`);
    const uploadedUrls = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('image', file);
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

  // --- フォーム送信処理 ---
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) return toast.error('ログインが必要です。');
    if (imageUrls.length === 0) {
      return toast.error('少なくとも1枚は写真をアップロードしてください。');
    }
    // ★ 余剰金がある場合に、使い道の入力がない場合は確認
    if (finalBalance > 0 && !surplusUsageDescription.trim()) {
        if (!window.confirm("余剰金の使い道が入力されていませんが、このまま報告しますか？\n（後から編集はできません）")) {
            return;
        }
    }

    const promise = fetch(`${API_URL}/api/projects/${project.id}/complete`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        completionImageUrls: imageUrls,
        completionComment: comment,
        userId: user.id,
        surplusUsageDescription: surplusUsageDescription, // ★ 使い道を送信
      }),
    }).then(async (res) => {
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || '完了報告の投稿に失敗しました。');
        }
        return res.json();
    });

    toast.promise(promise, {
      loading: '完了報告を投稿中...',
      success: () => {
        onReportSubmitted();
        onClose();
        return '企画の完了報告を投稿しました！';
      },
      error: (err) => err.message,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl my-8">
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold mb-4">🎉 企画完了報告</h2>
          <div className="space-y-4">
            {/* --- 写真アップロード --- */}
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

            {/* --- 参加者へのメッセージ --- */}
            <div>
               <label htmlFor="completion-comment" className="block text-sm font-medium text-gray-700">参加者へのメッセージ</label>
               <textarea id="completion-comment" value={comment} onChange={(e) => setComment(e.target.value)} rows="4" className="w-full mt-1 p-2 border rounded-md text-gray-900" placeholder="企画へのご参加ありがとうございました！..."></textarea>
            </div>

            {/* ★★★ ここから収支報告と使い道入力欄を追加 ★★★ */}
            <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">最終収支報告</h3>
                <div className="space-y-1 text-sm bg-slate-50 p-4 rounded-md border">
                    <div className="flex justify-between"><span className="text-gray-600">収入 (支援総額):</span> <span className="font-medium">{project.collectedAmount.toLocaleString()} pt</span></div>
                    <div className="flex justify-between text-red-600"><span className="text-gray-600">支出合計:</span> <span className="font-medium">- {totalExpense.toLocaleString()} pt</span></div>
                    <div className="flex justify-between font-bold border-t pt-1 mt-1"><span className="text-gray-800">最終残高 (余剰金):</span> <span>{finalBalance.toLocaleString()} pt</span></div>
                </div>
            </div>

             {/* 余剰金がある場合のみ使い道入力欄を表示 */}
            {finalBalance > 0 && (
                <div>
                    <label htmlFor="surplus-usage" className="block text-sm font-medium text-gray-700">余剰金の使い道 <span className="text-red-500">*</span></label>
                    <textarea
                        id="surplus-usage"
                        value={surplusUsageDescription}
                        onChange={(e) => setSurplusUsageDescription(e.target.value)}
                        rows="3"
                        required // 必須入力にする
                        className="w-full mt-1 p-2 border rounded-md text-gray-900"
                        placeholder="例：追加の装飾費用として使用しました。／参加者の皆様へ均等に返金します。／運営へ寄付します。など"
                    ></textarea>
                     <p className="text-xs text-gray-500 mt-1">
                        参加者の皆様へ、余剰金の使い道を明確に報告してください。返金の場合はその方法も記載すると親切です。
                     </p>
                </div>
            )}
            {/* ★★★ 追加ここまで ★★★ */}

          </div>
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">キャンセル</button>
            <button type="submit" disabled={isUploading} className="px-4 py-2 font-bold text-white bg-green-500 rounded-md hover:bg-green-600 disabled:bg-gray-400">
                {isUploading ? '画像待機中...' : '完了を報告する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}