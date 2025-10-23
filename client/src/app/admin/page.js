'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// ★ 1. AuthContext から useAuth をインポート
import { useAuth } from '../contexts/AuthContext'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function AdminPage() {
  
  // ★ 2. 'loading' を AuthContext から取得
  const { user, isAuthenticated, logout, loading } = useAuth();
  const router = useRouter();

  const [commissions, setCommissions] = useState([]);
  const [loadingData, setLoadingData] = useState(true); // データ取得用ローディング

  useEffect(() => {
    // ★ 3. AuthContext が読み込み中なら、何もせずに待機
    if (loading) {
      return; // まだ user 情報が確定していないので、ここで処理を中断
    }

    // ★ 4. 読み込み完了後、非認証（未ログイン）の場合
    if (!isAuthenticated) {
      toast.error('ログインが必要です。');
      router.push('/login'); 
      return;
    }

    // ★ 5. ログインはしているが、ADMINではない場合
    if (!user || user.role !== 'ADMIN') { // userがnullの場合もチェック
      toast.error('管理者権限がありません。');
      router.push('/mypage'); // マイページにリダイレクト
      return;
    }

    // ★ 6. 認証OK (ADMIN) だったので、データを取得
    const fetchCommissions = async () => {
      setLoadingData(true);
      try {
        const res = await fetch(`${API_URL}/api/admin/commissions`);
        if (!res.ok) throw new Error('手数料履歴の取得に失敗しました');
        const data = await res.json();
        setCommissions(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error(error.message);
        setCommissions([]);
      } finally {
        setLoadingData(false);
      }
    };

    fetchCommissions();

  }, [isAuthenticated, user, router, loading]); // ★ 依存配列に `loading` を追加

  // ★ 7. AuthContextの読み込み中、または権限がない場合の表示
  if (loading || !isAuthenticated || !user || user.role !== 'ADMIN') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-gray-700">管理者権限を確認中...</p>
      </div>
    );
  }
  
  // ★ 8. ダッシュボードを直接表示
  const totalCommission = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);

  return (
    <div className="p-4 sm:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">管理者ダッシュボード</h1>
          
          <button onClick={() => {
              logout(); 
              router.push('/login'); 
            }} className="text-sm font-medium text-gray-600 hover:text-red-500 transition-colors">
              ログアウト
          </button>
        </div>
        
        <div className="p-6 bg-green-100 text-green-800 rounded-lg mb-8 shadow">
          <p className="font-bold text-xl">総手数料収益: {totalCommission.toLocaleString()} pt</p>
        </div>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">手数料履歴</h2>
        <div className="space-y-4 bg-white p-6 rounded-lg shadow">
          {loadingData ? <p>読み込み中...</p> : 
           commissions.length === 0 ? <p className="text-gray-500">履歴はありません。</p> : 
           commissions.map(c => (
            c && c.id && c.project ? (
              <div key={c.id} className="p-4 border rounded-lg flex justify-between items-center bg-gray-50">
                <div>
                  <p className="font-semibold text-gray-800">企画: {c.project.title || '不明な企画'}</p>
                  <p className="text-sm text-gray-500">発生日時: {c.createdAt ? new Date(c.createdAt).toLocaleString('ja-JP') : '不明'}</p>
                </div>
                <p className="font-bold text-lg text-green-600">+{c.amount?.toLocaleString() || 0} pt</p>
              </div>
            ) : null
          ))}
        </div>
      </div>
    </div>
  );
}