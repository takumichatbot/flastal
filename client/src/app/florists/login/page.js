// app/florists/login/page.js
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext'; // ★ useAuthをインポート

const API_URL = process.env.NEXT_PUBLIC_API_URL_PYTHON || 'https://flastal-backend.onrender.com';

export default function FloristLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { setAuthInfo } = useAuth(); // ★ AuthContextからsetAuthInfoを取得

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // ★★★ FastAPIのOAuth2PasswordRequestForm形式で送信 ★★★
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch(`${API_URL}/api/florists/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'ログインに失敗しました');
      
      const florist = data.florist;
      
      if (florist.status === 'APPROVED') {
        // ★★★ トークンとユーザー情報をuseAuth経由でグローバルに保存 ★★★
        setAuthInfo({ 
            user: florist, 
            userType: 'FLORIST', 
            token: data.access_token // トークンも保存
        });
        router.push(`/florists/dashboard`); // IDは不要
      } else if (florist.status === 'PENDING') {
        router.push('/florists/pending');
      } else {
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
        <div className="text-sm text-center text-gray-600">
          <Link href="/forgot-password">
            <span className="font-medium text-sky-600 hover:underline">
              パスワードを忘れた方はこちら
            </span>
          </Link>
        </div>
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