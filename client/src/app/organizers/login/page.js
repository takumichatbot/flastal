'use client';

// Next.js 15 ビルドエラー回避
export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext'; 
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiLoader } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function OrganizerLoginContent() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, getValues } = useForm();
  const { login } = useAuth();
  const router = useRouter();
  const [showResend, setShowResend] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
    setShowResend(false);
    try {
      const res = await fetch(`${API_URL}/api/organizers/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 403 && (result.message.includes('認証') || result.message.includes('Verification'))) {
            setShowResend(true);
        }
        throw new Error(result.message || 'ログインに失敗しました。');
      }

      login(result.token);
      toast.success('主催者としてログインしました');
      router.push('/organizers/dashboard');

    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleResendEmail = async () => {
    const email = getValues('email');
    if (!email) return toast.error('メールアドレスを入力してください');

    const toastId = toast.loading('再送信中...');
    try {
      const res = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userType: 'ORGANIZER' }),
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message, { id: toastId });
        setShowResend(false);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message, { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-indigo-100">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-indigo-600 hover:text-indigo-700 transition mb-2">
            <span className="flex items-center text-sm font-medium"><FiArrowLeft className="mr-1"/> トップへ戻る</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">主催者ログイン</h1>
          <p className="text-sm text-gray-500 mt-2">イベント公式アカウント運用者向け</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">メールアドレス</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-gray-400" />
              </div>
              <input 
                type="email" 
                {...register('email', { required: '必須です' })} 
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="organizer@example.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold text-gray-700">パスワード</label>
              <Link href="/forgot-password?userType=ORGANIZER" className="text-xs text-indigo-600 hover:underline">
                忘れた方はこちら
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-gray-400" />
              </div>
              <input 
                type={showPassword ? 'text' : 'password'} 
                {...register('password', { required: '必須です' })} 
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 transition">
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-indigo-600 text-white rounded-lg font-bold text-lg shadow-md hover:bg-indigo-700 transition-all disabled:opacity-70">
            {isSubmitting ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        {showResend && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
                <button type="button" onClick={handleResendEmail} className="text-yellow-700 font-bold text-sm flex items-center justify-center w-full">
                    <FiMail className="mr-2" /> 認証メールを再送する
                </button>
            </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <Link href="/organizers/register" className="font-bold text-indigo-600 hover:text-indigo-700">
              新規主催者登録（無料）
            </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrganizerLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><FiLoader className="animate-spin text-indigo-500" size={40} /></div>}>
      <OrganizerLoginContent />
    </Suspense>
  );
}