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
  const [showResend, setShowResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setShowResend(false);

    try {
      const res = await fetch(`${API_URL}/api/florists/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && (data.message.includes('認証') || data.message.includes('Verification'))) {
            setShowResend(true);
        }
        throw new Error(data.message || 'ログインに失敗しました');
      }

      const success = await login(data.token, data.florist);
      
      if (success) {
        toast.success('おかえりなさい！');
        setTimeout(() => {
          window.location.href = '/florists/dashboard';
        }, 300);
      } else {
        throw new Error('認証情報の処理に失敗しました');
      }

    } catch (error) {
      toast.error(error.message);
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    const toastId = toast.loading('再送信中...');
    try {
      const res = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userType: 'FLORIST' }),
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || '認証メールを再送しました', { id: toastId });
        setShowResend(false);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message, { id: toastId });
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
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-gray-400" />
              </div>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none" placeholder="florist@example.com" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold text-gray-700">パスワード</label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-gray-400" />
              </div>
              <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">{showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}</button>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className={`w-full py-3.5 bg-pink-500 text-white rounded-lg font-bold text-lg shadow-md hover:bg-pink-600 transition-all ${isLoading ? 'opacity-70' : ''}`}>
            {isLoading ? 'ログイン中...' : 'ログインする'}
          </button>
        </form>

        {showResend && (
            <div className="mt-6 p-4 bg-pink-50 border border-pink-200 rounded-xl text-center">
                <p className="text-sm text-pink-800 mb-3 font-medium">認証が完了していないようです</p>
                <button onClick={handleResendEmail} className="inline-flex items-center px-4 py-2 bg-white border border-pink-300 text-pink-700 font-bold rounded-lg hover:bg-pink-100 transition shadow-sm text-sm">
                    <FiMail className="mr-2" /> 認証メールを再送する
                </button>
            </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">パートナー登録はお済みですか？<br/>
            <Link href="/florists/register" className="font-bold text-pink-600 hover:underline mt-1 inline-block">新規登録申請（無料）</Link>
          </p>
        </div>
      </div>
    </div>
  );
}