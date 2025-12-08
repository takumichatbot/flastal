'use client';

import { useState } from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function ReportModal({ projectId, user, onClose }) {
  const [reason, setReason] = useState('規約違反'); // デフォルト値
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 通報理由の選択肢
  const reasons = [
    '規約違反',
    '詐欺・スパムの疑い',
    '著作権侵害',
    '不適切なコンテンツ',
    'その他'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('ログインが必要です');

    setIsSubmitting(true);
    const token = localStorage.getItem('authToken');

    try {
      const res = await fetch(`${API_URL}/api/reports/project`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          projectId, 
          reporterId: user.id,
          reason,
          details 
        })
      });

      if (res.ok) {
        toast.success('運営に通報しました。ご協力ありがとうございます。');
        onClose();
      } else {
        const data = await res.json();
        // 既に通報済みの場合などのエラーメッセージ表示
        toast.error(data.message || '送信に失敗しました');
      }
    } catch (error) {
      console.error(error);
      toast.error('エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
        
        {/* ヘッダー */}
        <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-red-600 flex items-center">
            <FiAlertTriangle className="mr-2"/> 企画を通報する
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <FiX size={24} />
          </button>
        </div>

        {/* フォーム */}
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            不適切な企画や、トラブルの恐れがある企画を報告してください。<br/>
            報告者の情報は企画者には開示されません。
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">通報する理由</label>
              <select 
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              >
                {reasons.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">詳細（任意）</label>
              <textarea 
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg h-24 focus:ring-2 focus:ring-red-500 outline-none resize-none text-sm"
                placeholder="具体的な内容をご記入ください..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-md disabled:bg-gray-400"
              >
                {isSubmitting ? '送信中...' : '通報する'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}