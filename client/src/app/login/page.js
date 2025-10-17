'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // ★ useAuthをインポート
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL_PYTHON || 'https://flastal-backend.onrender.com';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { login } = useAuth(); // ★ AuthContextからlogin関数を取得

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const promise = fetch(`${API_URL}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    }).then(async res => {
      if (!res.ok) {
        throw new Error('メールアドレスまたはパスワードが違います。');
      }
      return res.json();
    });

    toast.promise(promise, {
      loading: 'ログイン中...',
      success: (data) => {
        // ★★★ ここでlogin関数を呼び出し、トークンを保存 ★★★
        login(data.access_token);
        router.push('/'); // トップページ（ダッシュボード）にリダイレクト
        return 'ログインしました！';
      },
      error: (err) => err.message,
    });
  };


  return (
    <div className="bg-sky-50 min-h-screen flex items-center justify-center">
      <div className="bg-white max-w-md w-full p-8 border rounded-xl shadow-md">
        <h1 className="text-4xl font-bold text-sky-600 text-center mb-8">ログイン</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {/* ... (入力欄は変更なし) ... */}
          <div>
            <label className="font-semibold text-gray-700">メールアドレス:</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 border-2 border-gray-200 rounded-lg mt-2 focus:border-sky-500 focus:ring-0 transition" />
          </div>
          <div>
            <label className="font-semibold text-gray-700">パスワード:</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-3 border-2 border-gray-200 rounded-lg mt-2 focus:border-sky-500 focus:ring-0 transition" />
          </div>
          {error && <p className="text-red-500 text-center">{error}</p>}
          <button type="submit" className="w-full p-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-lg font-semibold mt-4">
            ログインする
          </button>
        </form>
        
        {/* ★★★ ここから下を追記 ★★★ */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-sm">
            <Link href="/forgot-password">
              <span className="text-sky-600 hover:underline">パスワードを忘れた方はこちら</span>
            </Link>
          </p>
          <p className="text-sm">
            アカウントをお持ちでないですか？{' '}
            <Link href="/register">
              <span className="font-semibold text-sky-600 hover:underline">新規登録</span>
            </Link>
          </p>
        </div>
        {/* ★★★ 追記ここまで ★★★ */}

      </div>
    </div>
  );
}