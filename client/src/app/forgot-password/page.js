"use client";

import { useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL_PYTHON || 'https://flastal-backend.onrender.com';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'エラーが発生しました。');
      }
      
      setMessage('パスワード再設定用のメールを送信しました。受信箱を確認してください。');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-sky-50 min-h-screen flex items-center justify-center">
      <div className="bg-white max-w-md w-full p-8 border rounded-xl shadow-md">
        <h1 className="text-3xl font-bold text-sky-600 text-center mb-6">パスワードを忘れた場合</h1>
        <p className="text-center text-gray-600 mb-8">登録したメールアドレスを入力してください。パスワード再設定用のリンクを送信します。</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="font-semibold text-gray-700">メールアドレス:</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border-2 border-gray-200 rounded-lg mt-2 focus:border-sky-500 focus:ring-0 transition"
            />
          </div>
          
          {message && <p className="text-green-600 text-center bg-green-50 p-3 rounded-lg">{message}</p>}
          {error && <p className="text-red-500 text-center">{error}</p>}

          <button type="submit" disabled={loading} className="w-full p-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-lg font-semibold mt-4 disabled:bg-gray-400">
            {loading ? '送信中...' : '再設定メールを送信'}
          </button>
        </form>
        <div className="text-center mt-6">
          <p className="text-sm">
            <Link href="/login">
              <span className="font-semibold text-sky-600 hover:underline">ログインページに戻る</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}