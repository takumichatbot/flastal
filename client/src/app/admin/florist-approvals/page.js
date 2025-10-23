'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation'; // ★ router をインポート

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function AdminFloristApprovalsPage() {
  const [florists, setFlorists] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // ★ router を初期化

  const fetchPendingFlorists = async () => {
    setLoading(true);
    try {
      // ★ 本番では管理者トークンでの認証が必要
      // const token = localStorage.getItem('adminToken');
      // if (!token) throw new Error('管理者としてログインしていません。');
      // const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`${API_URL}/api/admin/florists/pending`/*, { headers }*/);
      if (res.status === 401) throw new Error('管理者権限がありません。'); // 認証エラーの場合
      if (!res.ok) throw new Error('審査待ちリストの取得に失敗しました。');
      const data = await res.json();
      setFlorists(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message);
      if (error.message.includes('ログインしていません') || error.message.includes('管理者権限')) {
        router.push('/admin'); // ログインページへリダイレクト
      }
      setFlorists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ★ ここで管理者ログイン状態を確認するのが望ましい
    // const token = localStorage.getItem('adminToken');
    // if (!token) {
    //   router.push('/admin');
    //   return;
    // }
    fetchPendingFlorists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); // router を依存配列に追加

  const handleUpdateStatus = async (floristId, status) => {
    const actionText = status === 'APPROVED' ? '承認' : '拒否';
    if (!window.confirm(`この申請を「${actionText}」しますか？`)) return;

    // ★ 本番では管理者トークンでの認証が必要
    // const token = localStorage.getItem('adminToken');
    // if (!token) return toast.error('管理者としてログインしていません。');
    // const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    const promise = fetch(`${API_URL}/api/admin/florists/${floristId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' } /* headers */,
      body: JSON.stringify({ status }),
    }).then(async res => {
      if (res.status === 401) throw new Error('管理者権限がありません。');
      if (!res.ok) {
         let errorMsg = `処理に失敗しました`;
         try {
             const errData = await res.json();
             errorMsg = errData.message || errorMsg;
         } catch(e) { /* ignore */ }
         throw new Error(errorMsg);
      }
      return res.json();
    });

    toast.promise(promise, {
      loading: '処理中...',
      success: () => {
        setFlorists(prev => prev.filter(f => f.id !== floristId));
        return `申請を「${actionText}」しました。`;
      },
      error: (err) => {
        if (err.message.includes('管理者権限')) {
            router.push('/admin'); // 権限エラーならリダイレクト
        }
        return err.message;
      },
    });
  };

  if (loading) return <div className="p-8 text-center">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
         <div className="mb-6">
            <Link href="/admin" className="text-sky-600 hover:underline text-sm">
                &larr; 管理者ダッシュボードに戻る
            </Link>
             <h1 className="text-2xl font-bold text-gray-800 mt-2">お花屋さん 登録申請の審査</h1>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
            {florists.length === 0 ? (
            <p className="text-gray-500 text-center">現在、審査待ちの申請はありません。</p>
            ) : (
            <div className="space-y-4">
                {florists.map(florist => (
                florist && florist.id ? ( // データチェック
                    <div key={florist.id} className="border rounded-lg p-4 bg-gray-50">
                        <p className="text-xs text-gray-400">申請日時: {new Date(florist.createdAt).toLocaleString('ja-JP')}</p>
                        <p><strong>活動名 (公開):</strong> {florist.platformName}</p>
                        <p><strong>店舗名 (非公開):</strong> {florist.shopName}</p>
                        <p><strong>担当者名:</strong> {florist.contactName}</p>
                        <p><strong>Email:</strong> {florist.email}</p>
                        <div className="mt-4 flex gap-4">
                        <button onClick={() => handleUpdateStatus(florist.id, 'APPROVED')} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600">承認する</button>
                        <button onClick={() => handleUpdateStatus(florist.id, 'REJECTED')} className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600">拒否する</button>
                        </div>
                    </div>
                 ) : null
                ))}
            </div>
            )}
        </div>
      </div>
    </div>
  );
}