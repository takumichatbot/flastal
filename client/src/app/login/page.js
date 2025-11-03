'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // ★ useAuth をインポート
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuth(); // ★ AuthContext から login 関数を取得

  const handleSubmit = async (e) => {
    e.preventDefault();

    const promise = fetch(`${API_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(async res => {
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'メールアドレスまたはパスワードが違います。');
      }
      return res.json();
    });

    toast.promise(promise, {
      loading: 'ログイン中...',
      success: (data) => {
        // ★★★ 修正: AuthContext の login 関数を使う ★★★
        login(data.token); // APIから返された「token」をContextに渡す
        
        router.push('/mypage');
        
        return 'ログインしました！';
      },
      error: (err) => err.message,
    });
  };

  // ... (以降の return (...) の部分は変更なし) ...
  return (
    <div className="bg-sky-50 min-h-screen flex items-center justify-center">
      <div className="bg-white max-w-md w-full p-8 border rounded-xl shadow-md">
        <h1 className="text-4xl font-bold text-sky-600 text-center mb-8">ログイン</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="font-semibold text-gray-700">メールアドレス:</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="w-full p-3 border-2 border-gray-200 rounded-lg mt-2 focus:border-sky-500 focus:ring-0 transition" 
            />
          </div>
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
            ログインする
          </button>
        </form>
        
        <div className="text-center mt-6 space-y-2">
          <p className="text-sm">
            <Link href="/forgot-password?userType=USER">
              <span className="text-sky-600 hover:underline">パスワードを忘れた方はこちら</span>
            </Link>
          </p>
          <p className="text-sm">
            アカウントをお持ちでないですか？{' '}
            <Link href="/register">
              <span className="font-semibold text-sky-600 hover:underline">新規登録</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}