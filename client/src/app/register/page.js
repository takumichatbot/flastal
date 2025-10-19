"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast'; // ★ toastをインポート
import { FiEye, FiEyeOff } from 'react-icons/fi'; // ★ アイコンをインポート

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handleName, setHandleName] = useState('');
  const [showPassword, setShowPassword] = useState(false); // ★ パスワード表示状態
  const router = useRouter();
  const { register } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // ★ toastを使って非同期処理を通知 (alertの代わり)
    const promise = register(email, password, handleName);

    toast.promise(promise, {
      loading: '登録しています...',
      success: () => {
        router.push('/login'); // ログインページへ移動
        return '登録が完了しました！ログインしてください。';
      },
      error: (err) => err.message || '登録に失敗しました。', // バックエンドからのエラーを表示
    });
  };

  return (
    <div className="bg-sky-50 min-h-screen flex items-center justify-center">
      <div className="bg-white max-w-md w-full p-8 border rounded-xl shadow-md">
        <h1 className="text-4xl font-bold text-sky-600 text-center mb-8">新規登録</h1>
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label className="font-semibold text-gray-700">ハンドルネーム:</label>
            <input type="text" value={handleName} onChange={(e) => setHandleName(e.target.value)} required className="w-full p-3 border-2 border-gray-200 rounded-lg mt-2 focus:border-sky-500 focus:ring-0 transition" />
          </div>
          <div>
            <label className="font-semibold text-gray-700">メールアドレス:</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 border-2 border-gray-200 rounded-lg mt-2 focus:border-sky-500 focus:ring-0 transition" />
          </div>
          {/* ★★★ パスワード入力欄 (アイコン追加) ★★★ */}
          <div className="relative">
            <label className="font-semibold text-gray-700">パスワード:</label>
            <input 
              type={showPassword ? 'text' : 'password'} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="w-full p-3 border-2 border-gray-200 rounded-lg mt-2 focus:border-sky-500 focus:ring-0 transition" 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-gray-600"
              aria-label="パスワードを表示または非表示にする"
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>
          <button type="submit" className="w-full p-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-lg font-semibold mt-4">
            登録する
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm">
            すでにアカウントをお持ちですか？{' '}
            <Link href="/login">
              <span className="font-semibold text-sky-600 hover:underline">ログイン</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}