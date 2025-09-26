'use client';

import { useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handleName, setHandleName] = useState('');
  const [referralCode, setReferralCode] = useState(''); // ★ 紹介コード用のStateを追加

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, handleName, referralCode }), // ★ referralCodeを送信
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      alert('登録成功！\n' + data.message);
      // ... (フォームリセット) ...
      setEmail(''); setPassword(''); setHandleName(''); setReferralCode('');
    } catch (error) {
      alert('登録エラー\n' + error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          新規ユーザー登録
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="handleName" className="block text-sm font-medium text-gray-700">ハンドルネーム</label>
            <input id="handleName" type="text" required value={handleName} onChange={(e) => setHandleName(e.target.value)} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"/>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"/>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">パスワード</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"/>
          </div>

          {/* ★★★ 紹介コード入力欄を追加 ★★★ */}
          <div>
            <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700">紹介コード（任意）</label>
            <input id="referralCode" type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"/>
          </div>

          <div>
            <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600">
              登録する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}