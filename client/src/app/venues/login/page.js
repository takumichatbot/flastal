'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi'; // アイコンをインポート

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function VenueLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ★★★ API呼び出しをNode.jsバックエンドの仕様に修正 ★★★
    const promise = fetch(`${API_URL}/api/venues/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }), // JSONで送信
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'ログインに失敗しました');
      }
      return data;
    });

    toast.promise(promise, {
      loading: 'ログイン中...',
      success: (data) => {
        // ★★★ 'flastal-venue' として会場情報をlocalStorageに保存 ★★★
        localStorage.setItem('flastal-venue', JSON.stringify(data.venue));
        router.push(`/venues/dashboard/${data.venue.id}`);
        return 'ログインしました！';
      },
      error: (err) => err.message,
    });
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-green-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-900">
          ライブハウス・会場様 ログイン
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 transition"/>
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">パスワード</label>
            <input 
              id="password" 
              type={showPassword ? 'text' : 'password'} 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-3 py-2 mt-1 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 transition"
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
          <div>
            <button type="submit" className="w-full px-4 py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
              ログイン
            </button>
          </div>
        </form>
        <div className="text-sm text-center text-gray-600">
          <Link href="/forgot-password?userType=VENUE">
            <span className="font-medium text-sky-600 hover:underline">
              パスワードを忘れた方はこちら
            </span>
          </Link>
        </div>
        
        <p className="text-sm text-center text-gray-600">
          アカウントをお持ちでないですか？{' '}
          <Link href="/venues/register">
            <span className="font-medium text-sky-600 hover:underline">
              新規登録
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
}