'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/app/contexts/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function FloristLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    // 物理的なクリーンアップ
    if (typeof document !== 'undefined') {
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
    }

    try {
      const res = await fetch(`${API_URL}/api/florists/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'ログインに失敗しました');
      }

      // 1. セッション情報をAuthContextに同期
      const success = await login(data.token, data.florist);
      
      if (success) {
        toast.success('おかえりなさい！');
        // 2. ブラウザのストレージ書き込みを待ってから遷移
        setTimeout(() => {
          window.location.href = '/florists/dashboard';
        }, 300);
      } else {
        throw new Error('認証情報の処理に失敗しました');
      }

    } catch (error) {
      console.error(error);
      toast.error(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-white px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-pink-100">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-pink-600 hover:text-pink-700 transition mb-2">
            <span className="flex items-center text-sm font-medium"><FiArrowLeft className="mr-1"/> トップへ戻る</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">お花屋さんログイン</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">メールアドレス</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none" />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1"><label className="block text-sm font-semibold text-gray-700">パスワード</label></div>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400">{showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}</button>
            </div>
          </div>
          <button type="submit" disabled={isLoading} className={`w-full py-3.5 bg-pink-500 text-white rounded-lg font-bold text-lg shadow-md hover:bg-pink-600 transition-all ${isLoading ? 'opacity-70' : ''}`}>{isLoading ? 'ログイン中...' : 'ログインする'}</button>
        </form>
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">パートナー登録はお済みですか？？<br/><Link href="/florists/register" className="font-bold text-pink-600 hover:underline mt-1 inline-block">新規登録申請（無料）</Link></p>
        </div>
      </div>
    </div>
  );
}