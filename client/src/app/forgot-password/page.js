"use client";

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast'; // ★ toastをインポート

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  // ★ message, error, loading は toast が管理するので不要

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ★ API呼び出しをtoast.promiseでラップ
    const promise = fetch(`${API_URL}/api/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // ★★★ 修正点: userType: 'USER' を追加 ★★★
      body: JSON.stringify({ email, userType: 'USER' }), 
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        // バックエンドからのエラーメッセージを投げる
        throw new Error(data.message || 'エラーが発生しました。');
      }
      return data; // 成功データを次に渡す
    });

    // toastがローディング、成功、エラーを自動で処理
    toast.promise(promise, {
      loading: '送信中...',
      success: (data) => data.message, // バックエンドからの成功メッセージを表示
      error: (err) => err.message, // バックエンドからのエラーメッセージを表示
    });
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
          
          {/* ★ messageとerrorの表示はtoastに任せるので削除 */}

          <button type="submit" className="w-full p-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-lg font-semibold mt-4 disabled:bg-gray-400">
            再設定メールを送信
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