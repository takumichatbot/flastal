'use client';

import { useState, useEffect } from 'react';

// ★ 1. APIのURLをPythonバックエンドに統一
const API_URL = process.env.NEXT_PUBLIC_API_URL_PYTHON || 'https://flastal-backend.onrender.com';

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      // ★ 2. 認証トークンを取得
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('管理者としてログインしていません。');

      // ★ 3. APIリクエストにトークンを付与
      const res = await fetch(`${API_URL}/api/admin/payouts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('出金申請の読み込みに失敗しました。');
      const data = await res.json();
      setPayouts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleProcessPayout = async (payoutId) => {
    if (!window.confirm("この出金申請を「処理完了」としてマークします。実際の振込手続きは完了していますか？")) {
      return;
    }

    try {
      // ★ 4. ステータス更新時も認証トークンが必要
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('管理者としてログインしていません。');
      
      const res = await fetch(`${API_URL}/api/admin/payouts/${payoutId}/complete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('処理の更新に失敗しました。');
      
      alert('出金処理を完了に更新しました。');
      setPayouts(prevPayouts => prevPayouts.filter(p => p.id !== payoutId));

    } catch (err) {
      alert(`エラー: ${err.message}`);
    }
  };

  if (loading) return <div className="p-8 text-center">読み込み中...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">出金申請の管理</h1>
        
        {payouts.length === 0 ? (
          <p className="text-gray-500">現在、処理待ちの出金申請はありません。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">申請日時</th>
                  <th scope="col" className="px-6 py-3">店舗名</th>
                  <th scope="col" className="px-6 py-3">金額 (pt)</th>
                  <th scope="col" className="px-6 py-3">振込先情報</th>
                  <th scope="col" className="px-6 py-3">アクション</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout.id} className="bg-white border-b">
                    <td className="px-6 py-4">{new Date(payout.createdAt).toLocaleString('ja-JP')}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{payout.florist.shopName}</td>
                    <td className="px-6 py-4 font-bold text-lg">{payout.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-pre-wrap">{payout.accountInfo}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleProcessPayout(payout.id)}
                        className="font-medium text-white bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg"
                      >
                        処理完了にする
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}