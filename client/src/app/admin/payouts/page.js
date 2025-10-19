'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast'; // Import toast
import { useRouter } from 'next/navigation'; // Import useRouter

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Initialize router

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken'); // Use admin token
      if (!token) throw new Error('管理者としてログインしていません。');

      const res = await fetch(`${API_URL}/api/admin/payouts`, {
        headers: {
           // Assuming auth needed
          // 'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('出金申請の読み込みに失敗しました。');
      const data = await res.json();
      setPayouts(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message); // Use toast
       if (err.message.includes('ログインしていません')) {
            router.push('/admin'); // Redirect if not authenticated
        }
      setPayouts([]); // Clear data on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [router]); // Add router dependency

  const handleProcessPayout = async (payoutId) => {
    if (!window.confirm("この出金申請を「処理完了」としてマークします。実際の振込手続きは完了していますか？")) {
      return;
    }

    const token = localStorage.getItem('adminToken'); // Use admin token
     if (!token) {
        toast.error('管理者としてログインしていません。');
        router.push('/admin');
        return;
    }
      
    const promise = fetch(`${API_URL}/api/admin/payouts/${payoutId}/complete`, {
      method: 'PATCH',
      headers: {
          // Assuming auth needed
         // 'Authorization': `Bearer ${token}`
      }
    }).then(async (res) => { // Added async
        if (!res.ok) {
           let errorMsg = '処理の更新に失敗しました。';
           try {
               const errData = await res.json();
               errorMsg = errData.message || errorMsg;
           } catch(e) { /* ignore */ }
           throw new Error(errorMsg);
        }
        return res.json(); // Return updated data if needed
    });

    toast.promise(promise, {
        loading: '更新中...',
        success: () => {
            // Remove from list on success
            setPayouts(prevPayouts => prevPayouts.filter(p => p.id !== payoutId));
            return '出金処理を完了に更新しました。';
        },
        error: (err) => err.message,
    });
  };

  if (loading) return <div className="p-8 text-center">読み込み中...</div>;
 
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">出金申請の管理</h1>
        
        {payouts.length === 0 ? (
          <p className="text-gray-500 text-center py-4">現在、処理待ちの出金申請はありません。</p>
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
                  // Ensure payout and florist data exists
                  payout && payout.id && payout.florist ? ( 
                    <tr key={payout.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4">{payout.createdAt ? new Date(payout.createdAt).toLocaleString('ja-JP') : '-'}</td>
                      {/* Use platformName */}
                      <td className="px-6 py-4 font-medium text-gray-900">{payout.florist.platformName || '不明'}</td> 
                      <td className="px-6 py-4 font-bold text-lg text-sky-700">{payout.amount?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 whitespace-pre-wrap text-xs">{payout.accountInfo || '-'}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleProcessPayout(payout.id)}
                          className="font-medium text-white bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition-colors text-xs"
                        >
                          処理完了にする
                        </button>
                      </td>
                    </tr>
                   ) : null
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}