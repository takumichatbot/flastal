'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast'; 
import { useRouter } from 'next/navigation'; 
import Link from 'next/link'; // ★ Link をインポート
import { useAuth } from '../../contexts/AuthContext'; // ★ ../ を2つにする

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState([]);
  const [loadingData, setLoadingData] = useState(true); // ★ データ取得用のローディング
  const router = useRouter(); 
  
  // ★ AuthContext から正しい認証情報を取得
  const { user, isAuthenticated, loading, logout } = useAuth();

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

    // ★ 4. 認証OK (ADMIN) だったので、出金データを取得
    const fetchPayouts = async () => {
      setLoadingData(true);
      try {
        
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_URL}/api/admin/payouts`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // ★ 401エラー（認証切れ）の場合の処理を追加
        if (res.status === 401) {
            localStorage.removeItem('authToken'); // 古いトークンを消す
            toast.error('セッションの有効期限が切れました。再度ログインしてください。');
            router.push('/login'); // ログイン画面へ飛ばす
            return;
        }
        
        if (!res.ok) {
          throw new Error('出金申請の読み込みに失敗しました。');
        }
        const data = await res.json();
        setPayouts(Array.isArray(data) ? data : []);
      } catch (err) {
        toast.error(err.message);
        setPayouts([]);
      } finally {
        setLoadingData(false);
      }
    };

    fetchPayouts();

  }, [isAuthenticated, user, router, loading]); // ★ 依存配列を AuthContext に合わせる

  const handleProcessPayout = async (payoutId) => {
    if (!window.confirm("この出金申請を「処理完了」としてマークします。実際の振込手続きは完了していますか？")) {
      return;
    }

      
    const token = localStorage.getItem('authToken');
    const promise = fetch(`${API_URL}/api/admin/payouts/${payoutId}/complete`, {
      method: 'PATCH',
      headers: { 
          'Authorization': `Bearer ${token}` // PATCHでbodyがない場合も認証は必要
      },
    }).then(async (res) => { 
        if (!res.ok) {
           let errorMsg = '処理の更新に失敗しました。';
           try {
               const errData = await res.json();
               errorMsg = errData.message || errorMsg;
           } catch(e) { /* ignore */ }
           throw new Error(errorMsg);
        }
        return res.json(); 
    });

    toast.promise(promise, {
        loading: '更新中...',
        success: () => {
            setPayouts(prevPayouts => prevPayouts.filter(p => p.id !== payoutId));
            return '出金処理を完了に更新しました。';
        },
        error: (err) => err.message,
    });
  };

  // ★ 7. AuthContextの読み込み中、または権限がない場合の表示 (admin/page.js と同じ)
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
      <div className="max-w-6xl mx-auto">
        {/* ★ ログアウトボタンを追加 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">出金申請の管理</h1>
          
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
            <p className="text-gray-500 text-center py-4">読み込み中...</p>
          ) : payouts.length === 0 ? (
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
                    payout && payout.id && payout.florist ? ( 
                      <tr key={payout.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4">{payout.createdAt ? new Date(payout.createdAt).toLocaleString('ja-JP') : '-'}</td>
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
    </div>
  );
}