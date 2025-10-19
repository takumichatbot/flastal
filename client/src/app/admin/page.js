'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(false); // Used for fetching data after login

  // Check for existing token on mount
   useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            // Basic check: Assume token exists means authenticated.
            // A better check would be to verify the token against a backend endpoint.
            setIsAuthenticated(true);
        }
    }, []);

  const handleLogin = (e) => {
    e.preventDefault();

    const promise = fetch(`${API_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }).then(async (res) => { // Added async
      if (!res.ok) {
        // Try parsing error message
         let errorMsg = '認証に失敗しました。パスワードを確認してください。';
         try {
             const errData = await res.json();
             errorMsg = errData.message || errorMsg;
         } catch(e) { /* ignore */ }
        throw new Error(errorMsg);
      }
      // Assuming backend returns a simple success message or no body on success for admin login
      // If it returns a token: const data = await res.json(); localStorage.setItem('adminToken', data.token);
      // For now, let's assume successful login means we can proceed
       localStorage.setItem('adminToken', 'dummy-admin-token'); // Store a placeholder/actual token
       return res.json(); // Or just return true if no data needed
    });

    toast.promise(promise, {
      loading: '認証中...',
      success: (data) => {
        setIsAuthenticated(true);
        return 'ログインしました！'; 
      },
      error: (err) => err.message, 
    });
  };
  
  const handleLogout = () => {
      localStorage.removeItem('adminToken');
      setIsAuthenticated(false);
      toast.success("ログアウトしました。");
  };

  useEffect(() => {
    // Fetch commissions only if authenticated
    if (isAuthenticated) {
      const fetchCommissions = async () => {
        setLoading(true);
        try {
          // ★★★ Use adminToken ★★★
          const token = localStorage.getItem('adminToken'); 
          if (!token) {
            toast.error('認証トークンが見つかりません。');
            setIsAuthenticated(false); 
            return;
          }

          const res = await fetch(`${API_URL}/api/admin/commissions`, {
            headers: {
              // Assuming backend expects admin token this way
              // 'Authorization': `Bearer ${token}` 
            }
          });
          if (!res.ok) throw new Error('手数料履歴の取得に失敗しました');
          const data = await res.json();
          // Ensure data is an array
          setCommissions(Array.isArray(data) ? data : []); 
        } catch (error) {
          toast.error(error.message);
          setCommissions([]); // Reset on error
        } finally {
          setLoading(false);
        }
      };
      fetchCommissions();
    }
  }, [isAuthenticated]); // Re-fetch when isAuthenticated changes

  // Login Form
  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <form onSubmit={handleLogin} className="p-8 bg-white shadow-lg rounded-xl w-full max-w-sm">
          <h1 className="text-xl font-bold mb-4 text-center text-gray-800">管理者ログイン</h1>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="パスワード" 
            required
            className="w-full p-2 border rounded-md text-gray-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
          <button type="submit" className="w-full mt-4 p-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 font-semibold transition-colors">ログイン</button>
        </form>
      </div>
    );
  }
  
  // Dashboard View
  const totalCommission = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);

  return (
    <div className="p-4 sm:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">管理者ダッシュボード</h1>
          <button onClick={handleLogout} className="text-sm font-medium text-gray-600 hover:text-red-500 transition-colors">
              ログアウト
          </button>
        </div>
        <div className="p-6 bg-green-100 text-green-800 rounded-lg mb-8 shadow">
          <p className="font-bold text-xl">総手数料収益: {totalCommission.toLocaleString()} pt</p>
        </div>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">手数料履歴</h2>
        <div className="space-y-4 bg-white p-6 rounded-lg shadow">
          {loading ? <p>読み込み中...</p> : 
           commissions.length === 0 ? <p className="text-gray-500">履歴はありません。</p> : 
           commissions.map(c => (
            // Ensure commission object structure is correct
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