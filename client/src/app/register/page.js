"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // --- ここからが新しいコード ---
  const [handleName, setHandleName] = useState('');
  // --- 変更ここまで ---
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    const response = await fetch('http://127.0.0.1:8000/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // --- ここからが新しいコード ---
      body: JSON.stringify({ email, password, handleName }),
      // --- 変更ここまで ---
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.detail || '登録に失敗しました。');
    } else {
      alert('登録が完了しました！ログインページに移動します。');
      router.push('/login');
    }
  };

  return (
    <div className="bg-sky-50 min-h-screen flex items-center justify-center">
      <div className="bg-white max-w-md w-full p-8 border rounded-xl shadow-md">
        <h1 className="text-4xl font-bold text-sky-600 text-center mb-8">新規登録</h1>
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          {/* --- ここからが新しいコード --- */}
          <div>
            <label className="font-semibold text-gray-700">ハンドルネーム:</label>
            <input
              type="text"
              value={handleName}
              onChange={(e) => setHandleName(e.target.value)}
              required
              className="w-full p-3 border-2 border-gray-200 rounded-lg mt-2 focus:border-sky-500 focus:ring-0 transition"
            />
          </div>
          {/* --- 変更ここまで --- */}
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
            登録する
          </button>
        </form>
      </div>
    </div>
  );
}