'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = params;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('パスワードが一致しません。');
      return;
    }
    if (password.length < 6) {
      setError('パスワードは6文字以上で設定してください。');
      return;
    }

    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'パスワードの更新に失敗しました。');
      }
      setMessage(data.message); // 成功メッセージを表示

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">新しいパスワードを設定</h2>
        </div>

        {message ? (
          // 成功メッセージ表示画面
          <div className="p-4 text-center bg-green-100 text-green-800 rounded-lg">
            <p>{message}</p>
            <Link href="/login"><span className="mt-4 inline-block font-semibold text-sky-600 hover:underline">ログインページへ進む</span></Link>
          </div>
        ) : (
          // フォーム表示画面
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-sm text-gray-600">新しいパスワードを入力してください。</p>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">新しいパスワード</label>
              <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"/>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">新しいパスワード（確認用）</label>
              <input id="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"/>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>
            )}

            <div>
              <button type="submit" disabled={isLoading} className="w-full px-4 py-2 font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 disabled:bg-slate-400">
                {isLoading ? '更新中...' : 'パスワードを更新'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}