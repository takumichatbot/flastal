'use client';

import { useState } from 'react';
import { FiAlertTriangle, FiX, FiInfo, FiLoader, FiChevronDown } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// トークン取得ヘルパー
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const rawToken = localStorage.getItem('authToken');
  return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

export default function ReportModal({ projectId, user, onClose }) {
  const [reason, setReason] = useState('規約違反');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 通報理由の選択肢
  const REASONS = [
    '規約違反・禁止事項',
    '詐欺・スパムの疑い',
    '著作権・肖像権の侵害',
    '誹謗中傷・不適切な表現',
    '企画が実行されていない',
    'その他'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('ログインが必要です');

    // バリデーション
    if (details.length > 500) {
        return toast.error('詳細は500文字以内で入力してください');
    }

    setIsSubmitting(true);
    const token = getAuthToken();

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
        // 既に通報済みの場合などのエラーメッセージ
        toast.error(data.message || '送信に失敗しました');
      }
    } catch (error) {
      console.error(error);
      toast.error('通信エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden border border-red-100">
        
        {/* ヘッダー */}
        <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
            <FiAlertTriangle className="text-xl"/> 企画を通報する
          </h3>
          <button 
            onClick={onClose} 
            className="text-red-300 hover:text-red-500 bg-white hover:bg-red-100 p-1.5 rounded-full transition-colors shadow-sm"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* フォーム */}
        <div className="p-6">
          <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-500 mb-6 flex items-start gap-2 border border-gray-100">
             <FiInfo className="text-blue-400 shrink-0 mt-0.5 text-sm"/>
             <div>
                <p className="font-bold text-gray-600 mb-1">匿名で報告されます</p>
                あなたのユーザー名や個人情報が、企画者に開示されることはありません。
             </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">通報する理由 <span className="text-red-500">*</span></label>
              <div className="relative">
                  <select 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none appearance-none text-sm text-gray-800 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">詳細（任意）</label>
              <textarea 
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl h-24 focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none resize-none text-sm placeholder-gray-400"
                placeholder="具体的な内容や、問題箇所をご記入ください..."
              />
              <p className="text-right text-xs text-gray-400 mt-1">{details.length}/500</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-5 py-2.5 text-gray-600 font-bold bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors text-sm"
              >
                キャンセル
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:shadow-none flex items-center text-sm"
              >
                {isSubmitting ? <><FiLoader className="animate-spin mr-2"/> 送信中...</> : '通報する'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}