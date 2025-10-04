// app/florists/login/page.js
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext'; // ★ useAuthをインポート

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function FloristLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { setAuthInfo } = useAuth(); // ★ AuthContextからsetAuthInfoを取得

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/florists/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }

      const florist = data.florist;
      
      // ★★★ ここからが修正箇所 ★★★
      if (florist.status === 'APPROVED') {
        // 承認済みの場合
        setAuthInfo({ user: florist, userType: 'FLORIST' }); // ログイン状態を保存
        router.push(`/florists/dashboard/${florist.id}`); // ダッシュボードへ
      } else if (florist.status === 'PENDING') {
        // 審査待ちの場合
        router.push('/florists/pending'); // 審査待ちページへ
      } else {
        // REJECTED (拒否) またはその他の場合
        alert('アカウントが承認されていません。運営までお問い合わせください。');
      }

    } catch (error) {
      alert(`ログインエラー: ${error.message}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-pink-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          お花屋さん ログイン
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
            <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-pink-500 rounded-md hover:bg-pink-600">
              ログイン
            </button>
          </div>
        </form>
        <p className="text-sm text-center text-gray-600">
          アカウントをお持ちでないですか？{' '}
          <Link href="/florists/register">
            <span className="font-medium text-sky-600 hover:underline">
              新規登録申請
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
}