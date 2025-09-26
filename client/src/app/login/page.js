// client/src/app/login/page.js
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext'; // ★ useAuthフックをインポート

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { login } = useAuth(); // ★ login関数を取得

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      // ★ Contextにユーザー情報を保存
      login(data.user, 'USER');
      
      // ★ トップページにリダイレクト
      router.push('/');

    } catch (error) {
      alert(`ログインエラー: ${error.message}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          FLASTAL ログイン
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ... (フォームの中身は変更なし) ... */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"/>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">パスワード</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"/>
          </div>
          <div>
            <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600">
              ログインする
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            アカウントをお持ちでないですか？ 新規登録
          </Link>
        </div>
      </div>
    </div>
  );
}