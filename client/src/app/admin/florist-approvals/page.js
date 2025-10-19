'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast'; // Import toast
import { useRouter } from 'next/navigation'; // Import useRouter

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function AdminFloristApprovalsPage() {
  const [florists, setFlorists] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Initialize router

  const fetchPendingFlorists = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken'); // Use admin token
      if (!token) throw new Error('管理者としてログインしていません。');

      const res = await fetch(`${API_URL}/api/admin/florists/pending`, {
        headers: {
          // Assuming backend needs auth for this admin route
          // 'Authorization': `Bearer ${token}` 
        }
      });
      if (!res.ok) throw new Error('審査待ちリストの取得に失敗しました。');
      const data = await res.json();
      setFlorists(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error(error.message); // Use toast
      if (error.message.includes('ログインしていません')) {
          router.push('/admin'); // Redirect to admin login if not authenticated
      }
      setFlorists([]); // Clear data on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingFlorists();
  }, []); // Fetch on mount

  const handleUpdateStatus = async (floristId, status) => {
    const actionText = status === 'APPROVED' ? '承認' : '拒否';
    if (!window.confirm(`この申請を「${actionText}」しますか？`)) return;

    const token = localStorage.getItem('adminToken'); // Get admin token
    if (!token) {
        toast.error('管理者としてログインしていません。');
        router.push('/admin');
        return;
    }

    const promise = fetch(`${API_URL}/api/admin/florists/${floristId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        // Assuming backend needs auth
        // 'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ status }),
    }).then(async (res) => { // Added async
        if (!res.ok) {
           let errorMsg = `処理に失敗しました`;
           try {
               const errData = await res.json();
               errorMsg = errData.message || errorMsg;
           } catch(e) { /* ignore */ }
           throw new Error(errorMsg);
        }
        return res.json(); // Return data if needed
    });

    toast.promise(promise, {
        loading: '処理中...',
        success: () => {
            // Remove the processed florist from the list
            setFlorists(prev => prev.filter(f => f.id !== floristId)); 
            return `申請を「${actionText}」しました。`;
        },
        error: (err) => err.message,
    });
  };
  
  if (loading) return <p className="p-8 text-center">読み込み中...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">花屋さん 登録申請の審査</h1>
        {florists.length === 0 ? (
          <p className="text-gray-500 text-center">現在、審査待ちの申請はありません。</p>
        ) : (
          <div className="space-y-4">
            {florists.map(florist => (
              florist && florist.id ? ( // Add check for valid florist object
                <div key={florist.id} className="border rounded-lg p-4 bg-gray-50 shadow-sm">
                  {/* Display createdAt if available */}
                  {florist.createdAt && <p className="text-xs text-gray-400 mb-2">申請日時: {new Date(florist.createdAt).toLocaleString('ja-JP')}</p>}
                  <p><strong>活動名 (公開):</strong> {florist.platformName || '未設定'}</p>
                  <p><strong>店舗名 (非公開):</strong> {florist.shopName || '未設定'}</p>
                  <p><strong>担当者名:</strong> {florist.contactName || '未設定'}</p>
                  <p><strong>Email:</strong> {florist.email || '未設定'}</p>
                  {/* Add more details if needed, e.g., address, phone */}
                  <div className="mt-4 flex gap-4">
                    <button onClick={() => handleUpdateStatus(florist.id, 'APPROVED')} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors">承認する</button>
                    <button onClick={() => handleUpdateStatus(florist.id, 'REJECTED')} className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors">拒否する</button>
                  </div>
                </div>
               ) : null
            ))}
          </div>
        )}
      </div>
    </div>
  );
}