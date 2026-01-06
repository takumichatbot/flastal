'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff, FiMail, FiLock, FiArrowLeft } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function VenueLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setShowResend(false);
    
    try {
      // 1. ログイン前に古いトークンや情報をクリア
      localStorage.removeItem('flastal-token');
      localStorage.removeItem('flastal-user');
      localStorage.removeItem('flastal-venue');

      const response = await fetch(`${API_URL}/api/venues/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && (data.message.includes('認証') || data.message.includes('Verification'))) {
            setShowResend(true);
        }
        throw new Error(data.message || 'ログインに失敗しました');
      }

      // 2. 【重要】トークンと会場情報を保存
      if (data.token) {
        localStorage.setItem('flastal-token', data.token);
      }
      localStorage.setItem('flastal-venue', JSON.stringify(data.venue));
      
      toast.success('ログインしました！');
      
      // ダッシュボードへ移動
      router.push(`/venues/dashboard/${data.venue.id}`);
      // 移動後に確実にリロードさせたい場合は以下（オプション）
      // window.location.href = `/venues/dashboard/${data.venue.id}`;

    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    const toastId = toast.loading('再送信中...');
    try {
      const res = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email, 
            userType: 'VENUE'
        }),
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-white px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-green-100">
        
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-green-600 hover:text-green-700 transition mb-2">
            <span className="flex items-center text-sm font-medium"><FiArrowLeft className="mr-1"/> トップへ戻る</span>
          </Link>
          <h2 className="text-2xl font-bold text-gray-800">会場ログイン</h2>
          <p className="text-sm text-gray-500 mt-2">スムーズな搬入管理と情報発信を</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">メールアドレス</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiMail className="text-gray-400" /></div>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition" placeholder="venue@example.com" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold text-gray-700">パスワード</label>
              <Link href="/forgot-password?userType=VENUE" className="text-xs text-green-600 hover:underline">忘れた方はこちら</Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiLock className="text-gray-400" /></div>
              <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-green-600 transition">{showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}</button>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className={`w-full py-3.5 bg-green-600 text-white rounded-lg font-bold text-lg shadow-md hover:bg-green-700 transition-all ${isLoading ? 'opacity-70' : ''}`}>
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        {showResend && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
                <p className="text-sm text-yellow-800 mb-3 font-medium">認証が完了していないようです</p>
                <button onClick={handleResendEmail} className="inline-flex items-center px-4 py-2 bg-white border border-yellow-300 text-yellow-700 font-bold rounded-lg hover:bg-yellow-100 transition shadow-sm text-sm">
                    <FiMail className="mr-2" /> 認証メールを再送する
                </button>
            </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            アカウントをお持ちでないですか？<br/>
            <Link href="/venues/register" className="font-bold text-green-600 hover:underline mt-1 inline-block">新規登録（無料）</Link>
          </p>
        </div>
      </div>
    </div>
  );
}