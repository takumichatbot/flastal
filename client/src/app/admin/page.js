'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast'; // ★ 1. react-hot-toast をインポート

// ★ 2. APIのURLをPythonバックエンドに統一
const API_URL = process.env.NEXT_PUBLIC_API_URL_PYTHON || 'https://flastal-backend.onrender.com';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();

    // ★ 3. toast.promise を使って、通信の状態を自動で通知する
    const promise = fetch(`${API_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }).then(res => {
      // fetchが成功しても、サーバーがエラーを返した場合 (例: 401 Unauthorized)
      if (!res.ok) {
        throw new Error('認証に失敗しました。パスワードを確認してください。');
      }
      return res.json();
    });

    // toast.promiseがpromiseの3つの状態（loading, success, error）を監視
    toast.promise(promise, {
      loading: '認証中...',
      success: (data) => {
        // 成功した場合の処理
        localStorage.setItem('adminToken', data.access_token);
        setIsAuthenticated(true);
        return 'ログインしました！'; // 成功時に表示するメッセージ
      },
      error: (err) => err.message, // 失敗時に表示するメッセージ
    });
  };

  useEffect(() => {
    if (isAuthenticated) {
      const fetchCommissions = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('adminToken');
          if (!token) {
            // ★ 4. alertをtoast.errorに置き換え
            toast.error('認証トークンが見つかりません。');
            setIsAuthenticated(false); // 認証状態をリセット
            return;
          }

          const res = await fetch(`${API_URL}/api/admin/commissions`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (!res.ok) throw new Error('データ取得に失敗しました');
          const data = await res.json();
          setCommissions(data);
        } catch (error) {
          // ★ 5. alertをtoast.errorに置き換え
          toast.error(error.message);
        } finally {
          setLoading(false);
        }
      };
      fetchCommissions();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <form onSubmit={handleLogin} className="p-8 bg-white shadow-lg rounded-xl w-full max-w-sm">
          <h1 className="text-xl font-bold mb-4 text-center text-gray-800">管理者ログイン</h1>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="パスワード" className="w-full p-2 border rounded-md text-gray-800"/>
          <button type="submit" className="w-full mt-4 p-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 font-semibold">ログイン</button>
        </form>
      </div>
    );
  }
  
  const totalCommission = commissions.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="p-4 sm:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">管理者ダッシュボード</h1>
        <div className="p-6 bg-green-100 text-green-800 rounded-lg mb-8 shadow">
          <p className="font-bold text-xl">総手数料収益: {totalCommission.toLocaleString()} pt</p>
        </div>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">手数料履歴</h2>
        <div className="space-y-4">
          {loading ? <p>読み込み中...</p> : commissions.map(c => (
            <div key={c.id} className="p-4 bg-white shadow rounded-lg flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-800">企画: {c.project.title}</p>
                <p className="text-sm text-gray-500">発生日時: {new Date(c.createdAt).toLocaleString('ja-JP')}</p>
              </div>
              <p className="font-bold text-lg text-green-600">+{c.amount.toLocaleString()} pt</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}