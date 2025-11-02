'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext'; // ★ ../../ に修正

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function AdminFloristApprovalsPage() {
  const [florists, setFlorists] = useState([]);
  const [loadingData, setLoadingData] = useState(true); // ★ データ取得用ローディング
  const router = useRouter();
  
  // ★ AuthContext から正しい認証情報を取得
  const { user, isAuthenticated, loading, logout } = useAuth();

  const fetchPendingFlorists = async () => {
    setLoadingData(true); // ★ データ取得ローディング
    try {
      // ★ トークンロジックを削除
      const res = await fetch(`${API_URL}/api/admin/florists/pending`);
      if (res.status === 401) throw new Error('管理者権限がありません。');
      if (!res.ok) throw new Error('審査待ちリストの取得に失敗しました。');
      const data = await res.json();
      setFlorists(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message);
      setFlorists([]);
    } finally {
      setLoadingData(false); // ★ データ取得ローディング
    }
  };

  useEffect(() => {
    // ★ 1. AuthContext が読み込み中なら待機
    if (loading) {
      return;
    }
    // ★ 2. 未ログインの場合
    if (!isAuthenticated) {
      toast.error('ログインが必要です。');
      router.push('/login');
      return;
    }
    // ★ 3. ADMINではない場合
    if (!user || user.role !== 'ADMIN') {
      toast.error('管理者権限がありません。');
      router.push('/mypage');
      return;
    }
    
    // ★ 4. 認証OK (ADMIN) だったので、データを取得
    fetchPendingFlorists();
    
  }, [isAuthenticated, user, router, loading]); // ★ 依存配列を AuthContext に合わせる

  const handleUpdateStatus = async (floristId, status) => {
    const actionText = status === 'APPROVED' ? '承認' : '拒否';
    if (!window.confirm(`この申請を「${actionText}」しますか？`)) return;

    // ★ トークンロジックを削除
    
    const promise = fetch(`${API_URL}/api/admin/florists/${floristId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }, // ★ 認証ヘッダーは不要
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
      error: (err) => err.message, // ★ エラー時のリダイレクトはuseEffectに任せる
    });
  };

  // ★ 7. AuthContextの読み込み中、または権限がない場合の表示
  if (loading || !isAuthenticated || !user || user.role !== 'ADMIN') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-gray-700">管理者権限を確認中...</p>
      </div>
    );
  }

  // ★ 8. 認証済みの場合のページ表示
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* ★ ヘッダーとログアウトを追加 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">お花屋さん 登録審査</h1>
          <button onClick={() => {
              logout(); 
              router.push('/login'); 
            }} className="text-sm font-medium text-gray-600 hover:text-red-500 transition-colors">
              ログアウト
          </button>
        </div>

        {/* ★ ナビゲーションリンクを追加 */}
        <nav className="mb-6 flex gap-3 sm:gap-4 flex-wrap">
          <Link 
            href="/admin" 
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors"
          >
            ダッシュボード (収益)
          </Link>
          <Link 
            href="/admin/payouts" 
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors"
          >
            出金管理
          </Link>
          <Link 
            href="/admin/moderation"
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors"
          >
            チャット監視
          </Link>
          <Link 
            href="/admin/florist-approval"
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors"
          >
            お花屋さん審査
          </Link>
          <Link 
            href="/admin/project-approval"
            className="px-4 py-2 text-sm font-semibold text-white bg-sky-500 rounded-lg shadow-sm hover:bg-sky-600 transition-colors"
          >
            プロジェクト審査
          </Link>
        </nav>

        {/* ★ 以下、元のコンテンツ */}
        <div className="bg-white rounded-lg shadow-md p-6">
            {loadingData ? (
              <p className="text-gray-500 text-center">読み込み中...</p>
            ) : florists.length === 0 ? (
              <p className="text-gray-500 text-center">現在、審査待ちの申請はありません。</p>
            ) : (
            <div className="space-y-4">
                {florists.map(florist => (
                florist && florist.id ? (
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