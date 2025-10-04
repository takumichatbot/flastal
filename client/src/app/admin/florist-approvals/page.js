'use client';

import { useState, useEffect } from 'react';

export default function AdminFloristApprovalsPage() {
  const [florists, setFlorists] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingFlorists = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/florists/pending');
      const data = await res.json();
      setFlorists(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingFlorists();
  }, []);

  const handleUpdateStatus = async (floristId, status) => {
    const actionText = status === 'APPROVED' ? '承認' : '拒否';
    if (!window.confirm(`この申請を「${actionText}」しますか？`)) return;

    try {
      await fetch(`/api/admin/florists/${floristId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      alert(`申請を「${actionText}」しました。`);
      setFlorists(prev => prev.filter(f => f.id !== floristId));
    } catch (error) {
      alert('処理に失敗しました。');
    }
  };
  
  if (loading) return <p className="p-8 text-center">読み込み中...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">花屋さん 登録申請の審査</h1>
        {florists.length === 0 ? (
          <p className="text-gray-500">現在、審査待ちの申請はありません。</p>
        ) : (
          <div className="space-y-4">
            {florists.map(florist => (
              <div key={florist.id} className="border rounded-lg p-4 bg-gray-50">
                <p><strong>申請日時:</strong> {new Date(florist.createdAt).toLocaleString('ja-JP')}</p>
                <p><strong>活動名 (公開):</strong> {florist.platformName}</p>
                <p><strong>店舗名 (非公開):</strong> {florist.shopName}</p>
                <p><strong>担当者名:</strong> {florist.contactName}</p>
                <p><strong>Email:</strong> {florist.email}</p>
                <div className="mt-4 flex gap-4">
                  <button onClick={() => handleUpdateStatus(florist.id, 'APPROVED')} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600">承認する</button>
                  <button onClick={() => handleUpdateStatus(florist.id, 'REJECTED')} className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600">拒否する</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}