'use client';

import { useState, useRef, useEffect } from 'react'; // ★ useEffect を追加
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
  // ★★★ ここまで ★★★

  // ... (handleImageUpload は変更なし) ...
  const handleImageUpload = async (event) => { /* ... */ };


  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) return toast.error('ログインが必要です。');
    if (imageUrls.length === 0) {
      return toast.error('少なくとも1枚は写真をアップロードしてください。');
    }
    // ★ 余剰金がある場合に、使い道の入力がない場合は確認 (任意)
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
    }).then(async (res) => { // async追加
        if (!res.ok) {
            const data = await res.json().catch(() => ({})); // JSONパース失敗も考慮
            throw new Error(data.message || '完了報告の投稿に失敗しました。');
        }
        return res.json(); // 成功レスポンスを返す
    });

    toast.promise(promise, {
      loading: '完了報告を投稿中...',
      success: () => {
        onReportSubmitted(); // 親コンポーネントのデータ更新をトリガー
        onClose();
        return '企画の完了報告を投稿しました！';
      },
      error: (err) => err.message,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl my-8"> {/* my-8追加 */}
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold mb-4">🎉 企画完了報告</h2>
          <div className="space-y-4">
            {/* --- 写真アップロード (変更なし) --- */}
            <div>
               {/* ... (画像アップロードのJSX) ... */}
            </div>

            {/* --- 参加者へのメッセージ (変更なし) --- */}
            <div>
               {/* ... (コメント入力のJSX) ... */}
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