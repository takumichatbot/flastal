"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext'; // useAuthをインポート

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login } = useAuth(); // AuthContextからlogin関数を取得
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await login(email, password);
      // 成功した場合、AuthContextが自動でページ遷移させる
    } catch (err) {
      // 失敗した場合、AuthContextからスローされたエラーを受け取る
      setError(err.message || 'ログインに失敗しました。メールアドレスかパスワードを確認してください。');
    }
  };

  return (
    <div className="bg-sky-50 min-h-screen flex items-center justify-center">
      <div className="bg-white max-w-md w-full p-8 border rounded-xl shadow-md">
        <h1 className="text-4xl font-bold text-sky-600 text-center mb-8">ログイン</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="font-semibold text-gray-700">メールアドレス:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border-2 border-gray-200 rounded-lg mt-2 focus:border-sky-500 focus:ring-0 transition"
            />
          </div>
          <div>
            <label className="font-semibold text-gray-700">パスワード:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 border-2 border-gray-200 rounded-lg mt-2 focus:border-sky-500 focus:ring-0 transition"
            />
          </div>
          {error && <p className="text-red-500 text-center">{error}</p>}
          <button type="submit" className="w-full p-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-lg font-semibold mt-4">
            ログインする
          </button>
        </form>
      </div>
    </div>
  );
}