// client/src/app/venues/login/page.js
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // useRouterをインポート

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function VenueLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter(); // routerを初期化

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/venues/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      // ★ アラートの代わりに、ダッシュボードへリダイレクト
      router.push(`/venues/dashboard/${data.venue.id}`);

    } catch (error) {
      alert(`ログインエラー: ${error.message}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-green-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          ライブハウス・会場 ログイン
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"/>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">パスワード</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"/>
          </div>
          <div>
            <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-green-500 rounded-md hover:bg-green-600">
              ログイン
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}