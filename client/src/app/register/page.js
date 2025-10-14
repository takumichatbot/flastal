"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext'; // ★ useAuthをインポート
import Link from 'next/link'; // ★ Linkをインポート

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handleName, setHandleName] = useState('');
  const [error, setError] = useState(null);
  const router = useRouter();
  const { register } = useAuth(); // ★ useAuthからregister関数を取得

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await register(email, password, handleName);
      alert('登録が完了しました！ログインページに移動します。');
      router.push('/login');
    } catch (err) {
      setError(err.message || '登録に失敗しました。');
    }
  };

  return (
    <div className="bg-sky-50 min-h-screen flex items-center justify-center">
      <div className="bg-white max-w-md w-full p-8 border rounded-xl shadow-md">
        <h1 className="text-4xl font-bold text-sky-600 text-center mb-8">新規登録</h1>
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          {/* ... (入力欄は変更なし) ... */}
          <div>
            <label className="font-semibold text-gray-700">ハンドルネーム:</label>
            <input type="text" value={handleName} onChange={(e) => setHandleName(e.target.value)} required className="w-full p-3 border-2 border-gray-200 rounded-lg mt-2 focus:border-sky-500 focus:ring-0 transition" />
          </div>
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
            登録する
          </button>
        </form>

        {/* ★★★ ここから下を追記 ★★★ */}
        <div className="text-center mt-6">
          <p className="text-sm">
            すでにアカウントをお持ちですか？{' '}
            <Link href="/login">
              <span className="font-semibold text-sky-600 hover:underline">ログイン</span>
            </Link>
          </p>
        </div>
        {/* ★★★ 追記ここまで ★★★ */}

      </div>
    </div>
  );
}