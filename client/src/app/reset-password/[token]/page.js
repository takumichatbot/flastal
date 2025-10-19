'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { token } = params; // URLからトークンを取得 (例: /reset-password/abcdef123)

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('パスワードが一致しません。');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('パスワードは6文字以上で入力してください。');
      return;
    }

    const promise = fetch(`${API_URL}/api/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // ★★★ トークンと新しいパスワードを送信 ★★★
      body: JSON.stringify({ token, password: newPassword }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'パスワードの更新に失敗しました。');
      }
      return data;
    });

    toast.promise(promise, {
      loading: 'パスワードを更新中...',
      success: (data) => {
        router.push('/login');
        return data.message || 'パスワードが更新されました。ログインしてください。';
      },
      error: (err) => err.message, // 「有効期限切れです」などのメッセージはここで表示される
    });
  };

  return (
    <div className="bg-sky-50 min-h-screen flex items-center justify-center">
      <div className="bg-white max-w-md w-full p-8 border rounded-xl shadow-md">
        <h1 className="text-3xl font-bold text-sky-600 text-center mb-6">新しいパスワードを設定</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* 新しいパスワード入力欄 */}
          <div className="relative">
            <label className="font-semibold text-gray-700">新しいパスワード:</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full p-3 border-2 border-gray-200 rounded-lg mt-2 focus:border-sky-500 focus:ring-0 transition"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-gray-600">
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>
          {/* 確認用パスワード入力欄 */}
          <div className="relative">
            <label className="font-semibold text-gray-700">新しいパスワード（確認用）:</label>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full p-3 border-2 border-gray-200 rounded-lg mt-2 focus:border-sky-500 focus:ring-0 transition"
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-gray-600">
              {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>
          <button type="submit" className="w-full p-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-lg font-semibold mt-4">
            パスワードを更新する
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
