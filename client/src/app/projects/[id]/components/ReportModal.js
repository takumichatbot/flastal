'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext'; // ★ useAuthをインポート

// ★ API_URLを修正
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ★ user を props で受け取る
export default function ReportModal({ projectId, user, onClose }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  const reportReasons = [
    { key: 'SPAM', text: 'スパムや詐欺、誤解を招く内容' },
    { key: 'INAPPROPRIATE', text: '不適切なコンテンツ（暴力的、差別的など）' },
    { key: 'COPYRIGHT', text: '著作権やその他の権利の侵害' },
    { key: 'OTHER', text: 'その他' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('報告するにはログインが必要です。');
      return;
    }
    if (!reason) {
      toast.error('通報理由を選択してください。');
      return;
    }
    if (reason === 'OTHER' && !details.trim()) {
      toast.error('「その他」を選択した場合は、詳細を記入してください。');
      return;
    }
    
    // ★★★ 修正: token削除, reporterId追加 ★★★
    const promise = fetch(`${API_URL}/api/reports/project`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        projectId: projectId, // ★ parseIntを削除
        reporterId: user.id, // ★ 'reporterId' としてユーザーIDを追加
        reason, 
        details 
      }),
    }).then(async res => {
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || '通報に失敗しました。');
        }
        return res.json();
    });
    
    toast.promise(promise, {
        loading: '送信中...',
        success: (data) => {
            onClose();
            return data.message;
        },
        error: (err) => err.message,
    });
  };

  // --- JSX (変更なし) ---
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold mb-4">この企画の問題を報告</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="font-semibold text-sm">通報理由を選択してください</p>
              {reportReasons.map((r) => (
                <div key={r.key} className="flex items-center">
                  <input type="radio" id={`reason-${r.key}`} name="reason" value={r.key} checked={reason === r.key} onChange={(e) => setReason(e.target.value)} className="h-4 w-4 text-sky-600 border-gray-300 focus:ring-sky-500"/>
                  <label htmlFor={`reason-${r.key}`} className="ml-3 block text-sm text-gray-900">{r.text}</label>
                </div>
              ))}
            </div>
            <div>
              <label htmlFor="details" className="block text-sm font-medium text-gray-700">詳細 (任意)</label>
              <textarea id="details" value={details} onChange={(e) => setDetails(e.target.value)} rows="3" className="w-full mt-1 p-2 border rounded-md text-gray-900" placeholder="問題のある箇所など..."></textarea>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">キャンセル</button>
            <button type="submit" className="px-4 py-2 font-bold text-white bg-red-500 rounded-md hover:bg-red-600">報告する</button>
          </div>
        </form>
      </div>
    </div>
  );
}