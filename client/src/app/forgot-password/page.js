'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState('USER');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch('http://localhost:3001/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userType }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '処理に失敗しました。');
      }
      setMessage(data.message); // バックエンドからの成功メッセージを表示
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">パスワードを忘れた方</h2>
          <p className="mt-2 text-sm text-gray-600">登録したメールアドレスを入力してください。</p>
        </div>

        {message ? (
          // メッセージ表示画面
          <div className="p-4 text-center bg-green-100 text-green-800 rounded-lg">
            <p>{message}</p>
            <Link href="/"><span className="mt-4 inline-block font-semibold text-sky-600 hover:underline">トップページに戻る</span></Link>
          </div>
        ) : (
          // フォーム表示画面
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">アカウントの種類</label>
              <select value={userType} onChange={(e) => setUserType(e.target.value)} className="w-full p-2 border rounded-md text-gray-900">
                <option value="USER">ファン</option>
                <option value="FLORIST">お花屋さん</option>
                <option value="VENUE">会場</option>
              </select>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"/>
            </div>
            <div>
              <button type="submit" disabled={isLoading} className="w-full px-4 py-2 font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 disabled:bg-slate-400">
                {isLoading ? '処理中...' : '再設定リンクを送信'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}